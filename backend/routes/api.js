/*
 * REST API
 *   GET  /api/health   - server status
 *   GET  /api/profile  - portfolio data (from frontend/js/data.js)
 *   POST /api/contact  - contact form (validated, rate limited, honeypot)
 *   POST /api/visit    - visit counter (+1)
 *   GET  /api/stats    - visit count
 */
const express = require("express");
const crypto = require("crypto");
const config = require("../config");
const stores = require("../lib/stores");
const { loadProfile } = require("../lib/profile");
const { validateContact } = require("../lib/validateContact");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();
const startedAt = Date.now();
const MAX_STORED_MESSAGES = 1000;

const contactLimiter = rateLimit({
  windowMs: config.contactRateLimit.windowMs,
  max: config.contactRateLimit.max,
  message: "Too many messages from you. Please try again in a few minutes.",
});

const visitLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: "Slow down." });

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    time: new Date().toISOString(),
  });
});

router.get("/profile", (req, res, next) => {
  try {
    res.set("Cache-Control", "no-cache");
    res.json(loadProfile());
  } catch (err) {
    next(err);
  }
});

router.post("/contact", contactLimiter, async (req, res, next) => {
  try {
    const body = req.body || {};

    // Honeypot: real visitors never see this field. Pretend it worked so bots move on.
    if (typeof body.company === "string" && body.company.trim() !== "") {
      return res.status(201).json({ ok: true, message: "Thanks! Your message was sent." });
    }

    const { values, errors } = validateContact(body);
    if (Object.keys(errors).length > 0) {
      return res
        .status(400)
        .json({ ok: false, error: "Please check the form and try again.", fields: errors });
    }

    const entry = {
      id: crypto.randomUUID(),
      ...values,
      createdAt: new Date().toISOString(),
      read: false,
      ip: req.ip,
      userAgent: (req.get("User-Agent") || "").slice(0, 200),
    };

    await stores.messages.update((list) => [entry, ...list].slice(0, MAX_STORED_MESSAGES));

    console.log(`New message from ${entry.name} <${entry.email}>`);
    res.status(201).json({ ok: true, message: "Thanks! Your message was sent.", id: entry.id });
  } catch (err) {
    next(err);
  }
});

router.post("/visit", visitLimiter, async (req, res, next) => {
  try {
    const stats = await stores.stats.update((s) => ({
      ...s,
      visits: (s.visits || 0) + 1,
      lastVisit: new Date().toISOString(),
    }));
    res.json({ ok: true, visits: stats.visits });
  } catch (err) {
    next(err);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const stats = await stores.stats.read();
    res.json({ ok: true, visits: stats.visits || 0 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
