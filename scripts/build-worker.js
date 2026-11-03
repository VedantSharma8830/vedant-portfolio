/*
 * Prepares the serverless backend: converts frontend/js/data.js into
 * cloudflare/profile.json so the Worker can serve GET /api/profile.
 *   npm run build:worker
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const dataFile = path.join(root, "frontend", "js", "data.js");
const outFile = path.join(root, "cloudflare", "profile.json");

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(dataFile, "utf8"), sandbox, { filename: "data.js" });
if (!sandbox.window.CV) throw new Error("frontend/js/data.js did not define window.CV");

fs.writeFileSync(outFile, JSON.stringify(sandbox.window.CV, null, 2) + "\n");
console.log(`Wrote ${path.relative(root, outFile)}`);
