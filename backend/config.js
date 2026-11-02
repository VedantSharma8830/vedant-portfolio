/*
 * App settings, read from environment variables (.env in the project root).
 */
const path = require("path");
const crypto = require("crypto");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const rootDir = path.join(__dirname, "..");

module.exports = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  adminPassword: process.env.ADMIN_PASSWORD || "",
  // Used to sign the admin login cookie. A random one is generated if missing,
  // which just means admin logins reset whenever the server restarts.
  sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),

  // Comma-separated list of sites allowed to call the API from another origin
  // (only needed when the frontend is hosted separately, e.g. GitHub Pages).
  corsOrigins: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean),

  paths: {
    root: rootDir,
    frontend: path.join(rootDir, "frontend"),
    dataFile: path.join(rootDir, "frontend", "js", "data.js"),
    dataDir: process.env.DATA_DIR || path.join(__dirname, "data"),
  },

  contactRateLimit: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: Number(process.env.CONTACT_RATE_LIMIT) || 5,
  },
};
