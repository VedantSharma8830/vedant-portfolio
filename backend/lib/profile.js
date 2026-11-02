/*
 * Loads the portfolio content from frontend/js/data.js, so the website and
 * GET /api/profile always use the same single data file.
 * The file is re-read when it changes, no restart needed.
 */
const fs = require("fs");
const vm = require("vm");
const config = require("../config");

let cache = null;
let cachedMtime = 0;

function loadProfile() {
  const { mtimeMs } = fs.statSync(config.paths.dataFile);
  if (cache && mtimeMs === cachedMtime) return cache;

  // data.js assigns window.CV and window.SITE_DEFAULTS; run it in a sandbox
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(config.paths.dataFile, "utf8"), sandbox, {
    filename: "data.js",
    timeout: 1000,
  });

  if (!sandbox.window.CV) throw new Error("frontend/js/data.js did not define window.CV");

  // JSON round-trip gives a plain object owned by this context
  cache = JSON.parse(JSON.stringify(sandbox.window.CV));
  cachedMtime = mtimeMs;
  return cache;
}

module.exports = { loadProfile };
