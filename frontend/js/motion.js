/*
 * Scroll motion: headings rise word by word, numbers count up, the hero
 * drifts with the scroll, the project diagrams draw themselves and the
 * journey rail fills as you read. Everything here is an enhancement: the
 * page is complete without it, and it stays off for reduced motion.
 */
(function () {
  "use strict";
  var root = document.documentElement;

  function off() {
    return (
      (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) ||
      root.getAttribute("data-motion") === "off"
    );
  }
  function $$(s, el) {
    return Array.prototype.slice.call((el || document).querySelectorAll(s));
  }
  function once(els, fn, opts) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) {
          io.unobserve(en.target);
          fn(en.target);
        }
      });
    }, opts);
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  /* headings: wrap each word so it can rise out of a mask */
  function split(el) {
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 1) return walk(c);
        if (c.nodeType !== 3 || !c.nodeValue.trim()) return;
        var frag = document.createDocumentFragment();
        c.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
          var w = document.createElement("span"),
            i = document.createElement("span");
          w.className = "wd";
          i.textContent = part;
          i.style.setProperty("--i", n++);
          w.appendChild(i);
          frag.appendChild(w);
        });
        c.parentNode.replaceChild(frag, c);
      });
    })(el);
    el.classList.add("split");
  }

  /* numbers: count from zero to the real value, keeping its format */
  function counter(el) {
    var txt = el.textContent,
      m = /^(\d+(?:\.\d+)?)(.*)$/.exec(txt.trim());
    if (!m) return null;
    var end = parseFloat(m[1]),
      dec = (m[1].split(".")[1] || "").length,
      rest = m[2];
    el.textContent = (0).toFixed(dec) + rest;
    return function () {
      var t0 = 0;
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / 1400),
          e = 1 - Math.pow(1 - p, 4);
        el.textContent = p < 1 ? (end * e).toFixed(dec) + rest : txt;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
  }

  /* diagrams: stroke every wire and block from nothing */
  function prepDraw(svg) {
    var k = 0;
    $$(
      ".w path, .w rect, .w circle, path.w, circle.w, .blade, .blk rect, .blk2, .core rect, .ap rect",
      svg,
    ).forEach(function (s) {
      var len = 0;
      try {
        len = s.getTotalLength();
      } catch (e) {}
      if (!(len > 0)) return;
      s.classList.add("dw");
      s.style.setProperty("--len", Math.ceil(len) + 1);
      s.style.setProperty("--i", k++);
    });
    svg.classList.add("drw");
  }

  function init() {
    if (init.done) return;
    init.done = true;
    if (off() || !("IntersectionObserver" in window) || !window.requestAnimationFrame) return;
    root.classList.add("mo");

    $$(".h2, .cta-title").forEach(split);

    var counts = [];
    $$(".stats dt, .tl-num > span").forEach(function (el) {
      var go = counter(el);
      if (go) {
        el.classList.add("num");
        counts.push(el);
        el._go = go;
      }
    });
    once(
      counts,
      function (el) {
        setTimeout(el._go, el.closest(".tl") ? 150 : 350);
      },
      { threshold: 0.6 },
    );

    var svgs = $$(".sch");
    svgs.forEach(prepDraw);
    once(
      svgs,
      function (svg) {
        svg.classList.add("drawn");
        setTimeout(function () {
          svg.classList.remove("drw", "drawn");
        }, 3600);
      },
      { threshold: 0.3 },
    );

    /* scroll-linked bits, only while they are on screen */
    var hero = document.querySelector(".hero"),
      art = document.querySelector(".hero-art"),
      copy = document.querySelector(".hero-copy"),
      orbs = $$(".orb"),
      tl = document.getElementById("timeline"),
      vis = { hero: true, tl: false },
      ticking = false,
      cleared = false;
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        vis[en.target === hero ? "hero" : "tl"] = en.isIntersecting;
      });
      frame();
    });
    if (hero) vo.observe(hero);
    if (tl) vo.observe(tl);

    function frame() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    function update() {
      ticking = false;
      if (off()) {
        if (!cleared) {
          cleared = true;
          [art, copy].concat(orbs).forEach(function (el) {
            if (el) el.style.transform = el.style.opacity = "";
          });
          if (tl) tl.style.removeProperty("--tp");
        }
        return;
      }
      cleared = false;
      var y = window.scrollY || 0,
        vh = window.innerHeight;
      if (vis.hero && hero) {
        var h = hero.offsetHeight || vh,
          p = Math.min(1, y / h);
        if (art)
          art.style.transform =
            "translate3d(0," + (y * 0.16).toFixed(1) + "px,0) scale(" + (1 - p * 0.08).toFixed(3) + ")";
        if (copy) {
          copy.style.transform = "translate3d(0," + (y * 0.08).toFixed(1) + "px,0)";
          copy.style.opacity = (1 - p * 0.85).toFixed(3);
        }
        orbs.forEach(function (o, i) {
          o.style.transform = "translate3d(0," + (y * (i ? 0.32 : -0.18)).toFixed(1) + "px,0)";
        });
      }
      if (vis.tl && tl) {
        var r = tl.getBoundingClientRect(),
          q = (vh * 0.6 - r.top) / r.height;
        tl.style.setProperty("--tp", Math.max(0, Math.min(1, q)).toFixed(3));
      }
    }
    window.addEventListener("scroll", frame, { passive: true });
    window.addEventListener("resize", frame);
    frame();
  }

  if (root.classList.contains("ready")) init();
  else document.addEventListener("site:ready", init);
})();
