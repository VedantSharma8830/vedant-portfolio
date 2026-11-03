/*
 * Serverless version of the backend for Cloudflare Workers.
 *
 * Same API as the Express server (backend/), so the frontend works unchanged:
 *   GET  /api/health   GET /api/profile   POST /api/contact
 *   POST /api/visit    GET /api/stats     /admin (password-protected inbox)
 *
 * Storage: a Cloudflare D1 (SQLite) database bound as DB, with the tables in
 * cloudflare/schema.sql (created automatically on the first request).
 * Static files are served from frontend/ via ASSETS.
 *
 * Deploy:  npx wrangler d1 create portfolio-db   (paste the id into wrangler.toml)
 *          npm run deploy:worker
 * Secrets: npx wrangler secret put ADMIN_PASSWORD
 */
import profile from "./profile.json";
import { validateContact } from "../backend/lib/validateContact.js";
import { loginPage, disabledPage, inboxPage } from "../backend/views/admin.js";

const MAX_MESSAGES = 200;
const SESSION_HOURS = 8;
const COOKIE = "admin_session";
let startedAt = 0; // set on the first request (Workers freeze the clock at startup)

// Optional build-time SHA-256 of the admin password (see scripts/build-worker.js).
// When empty, the ADMIN_PASSWORD secret is used instead.
// eslint-disable-next-line no-undef
const BUILD_PASSWORD_HASH = typeof __ADMIN_PASSWORD_SHA256__ !== "undefined" ? __ADMIN_PASSWORD_SHA256__ : "";

// Optional build-time list of other sites allowed to call the API (e.g. the GitHub Pages copy).
// The CORS_ORIGIN variable in wrangler.toml does the same thing.
// eslint-disable-next-line no-undef
const BUILD_CORS_ORIGIN = typeof __CORS_ORIGIN__ !== "undefined" ? __CORS_ORIGIN__ : "";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
};

/* ---------- small helpers ---------- */

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      ...headers,
    },
  });
}

function redirect(location, headers = {}) {
  return new Response(null, { status: 303, headers: { Location: location, ...headers } });
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Compare two strings without leaking timing (both are hashed to the same length first)
async function safeEqual(a, b) {
  const [ha, hb] = await Promise.all([sha256Hex(String(a)), sha256Hex(String(b))]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

function parseCookies(header) {
  const out = {};
  (header || "").split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

/* ---------- database ---------- */

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    country TEXT,
    user_agent TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL)`,
];

let schemaReady = null;
function ensureSchema(env) {
  if (!schemaReady) {
    schemaReady = env.DB.batch(SCHEMA.map((sql) => env.DB.prepare(sql))).catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

async function getSetting(env, key) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
  return row ? row.value : null;
}

async function setSetting(env, key, value) {
  await env.DB.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  )
    .bind(key, String(value))
    .run();
}

async function incrementVisits(env) {
  const row = await env.DB.prepare(
    `INSERT INTO settings (key, value) VALUES ('visits', '1')
     ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + 1
     RETURNING value`,
  ).first();
  return Number(row.value);
}

/* ---------- CORS (only needed when the frontend is hosted on another domain) ---------- */

function corsHeaders(env, request) {
  const origin = (request.headers.get("Origin") || "").replace(/\/$/, "");
  const allowed = (env.CORS_ORIGIN || BUILD_CORS_ORIGIN)
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/* ---------- rate limit (fixed window, stored in the database) ---------- */

async function rateLimited(env, name, ip, max, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / windowSec);
  const key = `${name}:${ip}:${bucket}`;
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET count = count + 1
     RETURNING count`,
  )
    .bind(key, (bucket + 1) * windowSec)
    .first();
  // Clean up old windows now and then
  if (Math.random() < 0.05)
    await env.DB.prepare("DELETE FROM rate_limits WHERE expires_at < ?").bind(now).run();
  return row.count > max;
}

/* ---------- admin session (HMAC-signed cookie) ---------- */

async function sessionSecret(env) {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  let secret = await getSetting(env, "session_secret");
  if (!secret) {
    secret = crypto.randomUUID() + crypto.randomUUID();
    await setSetting(env, "session_secret", secret);
  }
  return secret;
}

async function sign(env, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(await sessionSecret(env)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function adminEnabled(env) {
  return Boolean(env.ADMIN_PASSWORD || BUILD_PASSWORD_HASH);
}

async function checkPassword(env, password) {
  if (env.ADMIN_PASSWORD) return safeEqual(password || "", env.ADMIN_PASSWORD);
  if (BUILD_PASSWORD_HASH) return safeEqual(await sha256Hex(password || ""), BUILD_PASSWORD_HASH);
  return false;
}

async function isLoggedIn(env, request) {
  const token = parseCookies(request.headers.get("Cookie"))[COOKIE];
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return safeEqual(signature, await sign(env, expires));
}

async function sessionCookie(env) {
  const expires = String(Date.now() + SESSION_HOURS * 3600 * 1000);
  const value = `${expires}.${await sign(env, expires)}`;
  return `${COOKIE}=${value}; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

const CLEAR_COOKIE = `${COOKIE}=; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

/* ---------- messages ---------- */

async function readMessages(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, name, email, message, created_at AS createdAt, read, country, user_agent AS userAgent
     FROM messages ORDER BY created_at DESC LIMIT ?`,
  )
    .bind(MAX_MESSAGES)
    .all();
  return results.map((m) => ({ ...m, read: Boolean(m.read) }));
}

async function readForm(request) {
  const type = request.headers.get("Content-Type") || "";
  if (!type.includes("application/x-www-form-urlencoded")) return {};
  return Object.fromEntries(new URLSearchParams(await request.text()));
}

/* ---------- routes ---------- */

async function handleApi(request, env, path) {
  const method = request.method;

  if (path === "/api/health" && method === "GET") {
    return json({
      status: "ok",
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      time: new Date().toISOString(),
    });
  }

  if (path === "/api/profile" && method === "GET") {
    return json(profile, 200, { "Cache-Control": "no-cache" });
  }

  if (path === "/api/contact" && method === "POST") {
    if (await rateLimited(env, "contact", clientIp(request), Number(env.CONTACT_RATE_LIMIT) || 5, 600)) {
      return json(
        { ok: false, error: "Too many messages from you. Please try again in a few minutes." },
        429,
        {
          "Retry-After": "600",
        },
      );
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON body" }, 400);
    }
    body = body && typeof body === "object" ? body : {};

    // Honeypot: real visitors never fill this hidden field
    if (typeof body.company === "string" && body.company.trim() !== "") {
      return json({ ok: true, message: "Thanks! Your message was sent." }, 201);
    }

    const { values, errors } = validateContact(body);
    if (Object.keys(errors).length > 0) {
      return json({ ok: false, error: "Please check the form and try again.", fields: errors }, 400);
    }

    const entry = {
      id: crypto.randomUUID(),
      ...values,
      createdAt: new Date().toISOString(),
      read: false,
      country: request.cf && request.cf.country ? request.cf.country : "",
      userAgent: (request.headers.get("User-Agent") || "").slice(0, 200),
    };
    await env.DB.prepare(
      `INSERT INTO messages (id, name, email, message, created_at, read, country, user_agent)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    )
      .bind(entry.id, entry.name, entry.email, entry.message, entry.createdAt, entry.country, entry.userAgent)
      .run();
    return json({ ok: true, message: "Thanks! Your message was sent.", id: entry.id }, 201);
  }

  if (path === "/api/visit" && method === "POST") {
    if (await rateLimited(env, "visit", clientIp(request), 30, 60)) {
      return json({ ok: false, error: "Slow down." }, 429);
    }
    return json({ ok: true, visits: await incrementVisits(env) });
  }

  if (path === "/api/stats" && method === "GET") {
    return json({ ok: true, visits: Number(await getSetting(env, "visits")) || 0 });
  }

  return json({ ok: false, error: "Not found" }, 404);
}

async function handleAdmin(request, env, path) {
  const method = request.method;
  if (!adminEnabled(env)) return html(disabledPage(), 503);

  if ((path === "/admin" || path === "/admin/") && method === "GET") {
    if (!(await isLoggedIn(env, request))) return html(loginPage());
    const [messages, visits] = await Promise.all([readMessages(env), getSetting(env, "visits")]);
    return html(inboxPage({ messages, visits: Number(visits) || 0 }));
  }

  if (path === "/admin/login" && method === "POST") {
    if (await rateLimited(env, "login", clientIp(request), 10, 900)) {
      return html(loginPage({ error: "Too many login attempts. Try again in 15 minutes." }), 429);
    }
    const form = await readForm(request);
    if (!(await checkPassword(env, form.password))) {
      return html(loginPage({ error: "Wrong password." }), 401);
    }
    return redirect("/admin", { "Set-Cookie": await sessionCookie(env) });
  }

  if (path === "/admin/logout" && method === "POST") {
    return redirect("/admin", { "Set-Cookie": CLEAR_COOKIE });
  }

  const m = path.match(/^\/admin\/messages\/([\w-]+)\/(read|delete)$/);
  if (m && method === "POST") {
    if (!(await isLoggedIn(env, request))) return redirect("/admin");
    const [, id, action] = m;
    const sql =
      action === "delete"
        ? "DELETE FROM messages WHERE id = ?"
        : "UPDATE messages SET read = CASE read WHEN 1 THEN 0 ELSE 1 END WHERE id = ?";
    await env.DB.prepare(sql).bind(id).run();
    return redirect("/admin");
  }

  return html(loginPage(), 404);
}

// Long cache for fonts/images, short cache for HTML/CSS/JS so updates show up quickly
function cacheControlFor(path) {
  if (/\.(woff2|webp|png|jpg|jpeg|svg|ico|avif)$/i.test(path)) return "public, max-age=2592000, immutable";
  if (/\.(css|js)$/i.test(path)) return "public, max-age=3600, must-revalidate";
  return "public, max-age=0, must-revalidate";
}

async function serveAsset(request, env, path) {
  const res = await env.ASSETS.fetch(request);
  const out = new Response(res.body, res);
  if (res.ok) out.headers.set("Cache-Control", cacheControlFor(path));
  return out;
}

export default {
  async fetch(request, env) {
    if (!startedAt) startedAt = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    let res;
    try {
      if (path === "/js/config.js") {
        // Tells the frontend that the API is available on this origin
        res = new Response(`window.APP_CONFIG = { useApi: true, apiBase: "" };\n`, {
          headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-cache" },
        });
      } else if (path.startsWith("/api/")) {
        await ensureSchema(env);
        const cors = corsHeaders(env, request);
        res =
          request.method === "OPTIONS"
            ? new Response(null, { status: 204, headers: cors })
            : await handleApi(request, env, path);
        res = new Response(res.body, res);
        for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      } else if (path === "/admin" || path.startsWith("/admin/")) {
        await ensureSchema(env);
        res = await handleAdmin(request, env, path);
      } else {
        res = await serveAsset(request, env, path);
      }
    } catch (err) {
      console.error(err);
      res = path.startsWith("/api/")
        ? json({ ok: false, error: "Something went wrong on the server" }, 500)
        : new Response("Something went wrong", { status: 500 });
    }
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
    return out;
  },
};
