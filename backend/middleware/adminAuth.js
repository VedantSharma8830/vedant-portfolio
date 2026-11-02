/*
 * Admin login using a signed cookie (no database or extra packages needed).
 * The cookie holds an expiry time plus an HMAC signature made with SESSION_SECRET.
 */
const crypto = require("crypto");
const config = require("../config");

const COOKIE_NAME = "admin_session";
const SESSION_HOURS = 8;

function sign(value) {
  return crypto.createHmac("sha256", config.sessionSecret).update(value).digest("hex");
}

// Constant-time comparison so the check doesn't leak timing information
function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function checkPassword(password) {
  return Boolean(config.adminPassword) && safeEqual(password || "", config.adminPassword);
}

function parseCookies(header = "") {
  const out = {};
  header.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function isLoggedIn(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return safeEqual(signature, sign(expires));
}

function cookieOptions(req) {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: req.secure,
    path: "/admin",
  };
}

function startSession(req, res) {
  const expires = String(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  res.cookie(COOKIE_NAME, `${expires}.${sign(expires)}`, {
    ...cookieOptions(req),
    maxAge: SESSION_HOURS * 60 * 60 * 1000,
  });
}

function endSession(req, res) {
  res.clearCookie(COOKIE_NAME, cookieOptions(req));
}

// Route guard for pages that need a login
function requireAdmin(req, res, next) {
  if (isLoggedIn(req)) return next();
  res.redirect(303, "/admin");
}

module.exports = { checkPassword, isLoggedIn, startSession, endSession, requireAdmin };
