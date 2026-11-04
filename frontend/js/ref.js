/*
 * Small touches for the hero: local time in the nav, the lamp cord (pull to switch
 * the lights), and the nav turning dark once the light hero scrolls away.
 */
(function () {
  "use strict";
  var t = document.getElementById("clockT");
  function tick() {
    if (!t) return;
    try {
      t.textContent =
        new Date()
          .toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          })
          .replace(/\s?([ap])\.?m\.?/i, function (m, a) {
            return " " + a.toLowerCase() + "m";
          }) + " IST";
    } catch (e) {
      t.textContent = "IST";
    }
  }
  tick();
  setInterval(tick, 20000);

  var lamp = document.getElementById("themeSwitch");
  if (lamp) {
    lamp.addEventListener("click", function () {
      lamp.classList.remove("pulled");
      void lamp.offsetWidth;
      lamp.classList.add("pulled");
    });
    lamp.addEventListener("animationend", function () {
      lamp.classList.remove("pulled");
    });
  }

  var nav = document.getElementById("nav"),
    hero = document.getElementById("top");
  if (nav && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(
      function (es) {
        es.forEach(function (en) {
          nav.classList.toggle("on-dark", !en.isIntersecting);
        });
      },
      { rootMargin: "-64px 0px 0px 0px", threshold: 0 },
    ).observe(hero);
  }
})();
