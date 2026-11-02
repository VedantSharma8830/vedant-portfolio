/*
 * API tests using Node's built-in test runner:  npm test
 * Starts the app on a random port with a temporary data folder.
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-test-"));
process.env.DATA_DIR = tmpDir;
process.env.ADMIN_PASSWORD = "test-password";
process.env.CONTACT_RATE_LIMIT = "3";

const createApp = require("../app");

let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function postJson(url, body) {
  return fetch(base + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("GET /api/health", async () => {
  const res = await fetch(`${base}/api/health`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).status, "ok");
});

test("GET /api/profile returns the data file", async () => {
  const res = await fetch(`${base}/api/profile`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.name, "Vedant J. Sharma");
  assert.ok(Array.isArray(data.projects) && data.projects.length > 0);
});

test("POST /api/contact rejects invalid input", async () => {
  const res = await postJson("/api/contact", { name: "A", email: "nope", message: "hi" });
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.ok(data.fields.name && data.fields.email && data.fields.message);
});

test("POST /api/contact saves a valid message", async () => {
  const res = await postJson("/api/contact", {
    name: "Test Person",
    email: "test@example.com",
    message: "Hello, this is a test message.",
  });
  assert.strictEqual(res.status, 201);
  const saved = JSON.parse(fs.readFileSync(path.join(tmpDir, "messages.json"), "utf8"));
  assert.strictEqual(saved[0].email, "test@example.com");
});

test("honeypot submissions are not saved", async () => {
  const res = await postJson("/api/contact", {
    name: "Bot",
    email: "bot@example.com",
    message: "Buy cheap things now!!!",
    company: "Spam Inc",
  });
  assert.strictEqual(res.status, 201);
  const saved = JSON.parse(fs.readFileSync(path.join(tmpDir, "messages.json"), "utf8"));
  assert.ok(!saved.some((m) => m.email === "bot@example.com"));
});

test("contact form is rate limited", async () => {
  // limit is 3 per window and 3 requests were already made above
  const res = await postJson("/api/contact", {
    name: "Again",
    email: "a@example.com",
    message: "One more message here",
  });
  assert.strictEqual(res.status, 429);
});

test("visit counter increments", async () => {
  const first = await (await postJson("/api/visit", {})).json();
  const second = await (await postJson("/api/visit", {})).json();
  assert.strictEqual(second.visits, first.visits + 1);
});

test("admin login accepts the right password only", async () => {
  const wrong = await fetch(`${base}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "password=wrong",
    redirect: "manual",
  });
  assert.strictEqual(wrong.status, 401);

  const right = await fetch(`${base}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "password=test-password",
    redirect: "manual",
  });
  assert.strictEqual(right.status, 303);
  const cookie = right.headers.get("set-cookie").split(";")[0];

  const inbox = await fetch(`${base}/admin`, { headers: { Cookie: cookie } });
  const html = await inbox.text();
  assert.ok(html.includes("test@example.com"));
});
