/* Runs in <head> before the page paints, so the saved theme is applied with no flash. */
(function () {
  var d = document.documentElement,
    p = {};
  try {
    if (localStorage.getItem("vs-owner") === "1") p = JSON.parse(localStorage.getItem("vs-prefs") || "{}");
    var t = localStorage.getItem("vs-theme");
    if (t && !p.theme) p.theme = t;
  } catch (e) {}
  var th = p.theme || "dark";
  if (th === "auto")
    th = window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  d.setAttribute("data-theme", th);
  if (p.accent) d.style.setProperty("--accent", p.accent);
  if (p.font) d.setAttribute("data-font", p.font);
  if (p.motion === false) d.setAttribute("data-motion", "off");
  d.classList.add("js");
  // If the main script never finishes, show everything rather than leave sections hidden.
  setTimeout(function () {
    if (!d.classList.contains("ready")) d.classList.remove("js");
  }, 4000);
})();
