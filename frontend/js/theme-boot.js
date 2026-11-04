/* Runs in <head> before the page paints, so the saved theme is applied with no flash. */

/*
 * Site switches. Change these to turn things on or off for every visitor.
 *   INTRO       "door"  - a door swings open onto an underwater scene, then the site lights up
 *               "power" - the main switch flips on and current lights up the page
 *               "off"   - no intro
 * The owner can override it on their own device from the Customise panel.
 */
var INTRO = "off";

(function () {
  var d = document.documentElement,
    p = {};
  try {
    // New design (light hero, lamp cord): start everyone once on the lights-on look.
    if (localStorage.getItem("vs-rv") !== "2") {
      localStorage.removeItem("vs-theme");
      var sp = JSON.parse(localStorage.getItem("vs-prefs") || "null");
      if (sp && sp.theme) {
        delete sp.theme;
        localStorage.setItem("vs-prefs", JSON.stringify(sp));
      }
      localStorage.setItem("vs-rv", "2");
    }
    if (localStorage.getItem("vs-owner") === "1") p = JSON.parse(localStorage.getItem("vs-prefs") || "{}");
    var t = localStorage.getItem("vs-theme");
    if (t && !p.theme) p.theme = t;
  } catch (e) {}
  var th = p.theme || "light";
  if (th === "auto")
    th = window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  d.setAttribute("data-theme", th);
  if (p.accent) d.style.setProperty("--accent", p.accent);
  if (p.font) d.setAttribute("data-font", p.font);
  if (p.motion === false) d.setAttribute("data-motion", "off");
  var hide = p.hidden || [];
  if (hide.length) d.setAttribute("data-hide", hide.join(" "));
  d.classList.add("js");
  // Intro once per visit (skipped for reduced motion). ?intro=door|power replays one.
  var intro = (p.introPick && p.intro) || INTRO,
    force = /[?&]intro=(door|power)/.exec(location.search);
  if (force) intro = force[1];
  window.SITE_SWITCHES = { intro: INTRO };
  try {
    if (
      intro !== "off" &&
      p.motion !== false &&
      (force || !sessionStorage.getItem("vs-pwr")) &&
      !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      d.classList.add("pwr");
      d.setAttribute("data-intro", intro === "power" ? "power" : "door");
    }
  } catch (e) {}
  // If the main script never finishes, show everything rather than leave sections hidden.
  setTimeout(function () {
    if (!d.classList.contains("ready")) d.classList.remove("js");
  }, 4000);
})();
