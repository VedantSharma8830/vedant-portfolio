/*
 * Simple in-memory rate limiter (per IP, fixed window).
 * Good enough for a single small server; it resets when the server restarts.
 */
function rateLimit({ windowMs, max, message }) {
  const hits = new Map(); // ip -> { count, resetAt }

  // Clean up old entries now and then so the map doesn't grow forever
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(ip);
    }
  }, windowMs);
  cleanup.unref();

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const ip = req.ip || "unknown";
    let entry = hits.get(ip);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(ip, entry);
    }
    entry.count += 1;

    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));

    if (entry.count > max) {
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ ok: false, error: message, retryAfter });
    }
    next();
  };
}

module.exports = rateLimit;
