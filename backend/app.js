/*
 * Builds the Express app: security headers, API routes, admin page and the
 * static frontend. Kept separate from server.js so tests can start it on any port.
 */
const express = require("express");
const config = require("./config");
const apiRoutes = require("./routes/api");
const adminRoutes = require("./routes/admin");
const securityHeaders = require("./middleware/securityHeaders");
const cors = require("./middleware/cors");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  // Needed for correct client IPs (rate limiting) behind Render/Railway proxies
  app.set("trust proxy", 1);

  app.use(securityHeaders);

  // When the backend serves the site, tell the frontend the API is available.
  app.get("/js/config.js", (req, res) => {
    res.type("application/javascript").set("Cache-Control", "no-cache");
    res.send(`window.APP_CONFIG = { useApi: true, apiBase: "" };\n`);
  });

  app.use("/api", cors, express.json({ limit: "20kb" }), apiRoutes);
  app.use("/admin", express.urlencoded({ extended: false, limit: "10kb" }), adminRoutes);

  app.use(
    express.static(config.paths.frontend, {
      extensions: ["html"],
      maxAge: config.nodeEnv === "production" ? "1h" : 0,
    }),
  );

  // Unknown API routes get JSON, everything else falls back to the homepage
  app.use("/api", (req, res) => res.status(404).json({ ok: false, error: "Not found" }));
  app.use((req, res) => res.status(404).sendFile("index.html", { root: config.paths.frontend }));

  // Malformed JSON and any unexpected error
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ ok: false, error: "Invalid JSON body" });
    }
    if (err.type === "entity.too.large") {
      return res.status(413).json({ ok: false, error: "Request is too large" });
    }
    console.error(err);
    res.status(500).json({ ok: false, error: "Something went wrong on the server" });
  });

  return app;
}

module.exports = createApp;
