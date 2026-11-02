/*
 * Entry point: loads settings and starts the HTTP server.
 *   npm start   -> node backend/server.js
 *   npm run dev -> nodemon (restarts on file changes)
 */
const config = require("./config");
const createApp = require("./app");

const app = createApp();

app.listen(config.port, () => {
  console.log(`Portfolio running at http://localhost:${config.port}`);
  console.log(`Admin page:          http://localhost:${config.port}/admin`);
  if (!config.adminPassword) {
    console.warn("ADMIN_PASSWORD is not set in .env, so the admin page is disabled.");
  }
});
