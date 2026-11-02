/*
 * Runs before `npm start` / `npm run dev`.
 * Creates .env from .env.example the first time, so the app works right after cloning.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const envFile = path.join(root, ".env");
const exampleFile = path.join(root, ".env.example");

if (!fs.existsSync(envFile) && fs.existsSync(exampleFile)) {
  fs.copyFileSync(exampleFile, envFile);
  console.log("Created .env from .env.example. Change ADMIN_PASSWORD before deploying.");
}
