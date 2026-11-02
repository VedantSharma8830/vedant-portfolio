/*
 * Frontend settings.
 *
 * useApi  - false when the site is hosted as plain static files (GitHub Pages,
 *           Live Server, opening index.html directly). The contact form then
 *           falls back to the visitor's email app.
 *           When the Node backend serves the site it replaces this file with
 *           useApi: true automatically, so nothing needs changing locally.
 * apiBase - leave empty when the backend serves the frontend (same origin).
 *           If the frontend is on GitHub Pages and the backend is deployed
 *           somewhere else, set this to the backend URL and useApi to true,
 *           e.g. "https://my-portfolio-api.onrender.com".
 */
window.APP_CONFIG = {
  useApi: false,
  apiBase: "",
};
