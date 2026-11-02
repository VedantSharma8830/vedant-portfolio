/*
 * Password-protected admin page for reading contact form messages.
 *   GET  /admin                          - login form, or the inbox when logged in
 *   POST /admin/login                    - check ADMIN_PASSWORD
 *   POST /admin/logout
 *   POST /admin/messages/:id/read        - toggle read / unread
 *   POST /admin/messages/:id/delete
 */
const express = require("express");
const config = require("../config");
const stores = require("../lib/stores");
const rateLimit = require("../middleware/rateLimit");
const {
  checkPassword,
  isLoggedIn,
  startSession,
  endSession,
  requireAdmin,
} = require("../middleware/adminAuth");
const views = require("../views/admin");

const router = express.Router();

// Slow down password guessing
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Try again in 15 minutes.",
});

router.use((req, res, next) => {
  res.set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
  next();
});

router.get("/", async (req, res, next) => {
  try {
    if (!config.adminPassword) return res.status(503).send(views.disabledPage());
    if (!isLoggedIn(req)) return res.send(views.loginPage());

    const [messages, stats] = await Promise.all([stores.messages.read(), stores.stats.read()]);
    res.send(views.inboxPage({ messages, visits: stats.visits || 0 }));
  } catch (err) {
    next(err);
  }
});

router.post("/login", loginLimiter, (req, res) => {
  if (!config.adminPassword) return res.status(503).send(views.disabledPage());
  if (!checkPassword(req.body.password)) {
    return res.status(401).send(views.loginPage({ error: "Wrong password." }));
  }
  startSession(req, res);
  res.redirect(303, "/admin");
});

router.post("/logout", (req, res) => {
  endSession(req, res);
  res.redirect(303, "/admin");
});

router.post("/messages/:id/read", requireAdmin, async (req, res, next) => {
  try {
    await stores.messages.update((list) =>
      list.map((m) => (m.id === req.params.id ? { ...m, read: !m.read } : m)),
    );
    res.redirect(303, "/admin");
  } catch (err) {
    next(err);
  }
});

router.post("/messages/:id/delete", requireAdmin, async (req, res, next) => {
  try {
    await stores.messages.update((list) => list.filter((m) => m.id !== req.params.id));
    res.redirect(303, "/admin");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
