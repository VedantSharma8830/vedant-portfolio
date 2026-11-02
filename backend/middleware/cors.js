/*
 * Minimal CORS support for the API, so a frontend hosted elsewhere
 * (listed in CORS_ORIGIN) can still use it.
 */
const config = require("../config");

module.exports = function cors(req, res, next) {
  const origin = req.get("Origin");
  if (origin && config.corsOrigins.includes(origin.replace(/\/$/, ""))) {
    res.set({
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    });
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
};
