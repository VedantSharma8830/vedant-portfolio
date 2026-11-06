/*
 * Main UI script: renders the content from window.CV (js/data.js), scroll reveals,
 * cursor sparkles, project filters + detail dialog, and the owner-only customise panel.
 */
(function () {
  "use strict";

  var CV = window.CV || {};
  var DEF = window.SITE_DEFAULTS || { accent: "#ff2a2a", motion: true, hidden: [] };
  var KEY = "vs-prefs",
    OWN = "vs-owner";
  var EDIT_HASH = "f5518bb0c93704618f580f49faed2256f5f9b37072859f0f3ded4aca7ba5930d";
  var root = document.documentElement;
  var $ = function (s, el) {
    return (el || document).querySelector(s);
  };
  var $$ = function (s, el) {
    return Array.prototype.slice.call((el || document).querySelectorAll(s));
  };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }
  var mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var owner = false;
  try {
    owner = localStorage.getItem(OWN) === "1";
  } catch (e) {}
  var prefs = JSON.parse(JSON.stringify(DEF));
  if (owner) {
    try {
      var sp = JSON.parse(localStorage.getItem(KEY) || "{}");
      Object.keys(sp).forEach(function (k) {
        prefs[k] = sp[k];
      });
    } catch (e) {}
  }
  function motionOn() {
    return prefs.motion !== false && !mq.matches;
  }

  /* ---------- illustrations (drawn in code) ---------- */
  var ART = {
    street:
      '<svg viewBox="0 0 480 300" role="img" aria-label="Diagram: a light sensor switches a street lamp on at dusk">' +
      '<defs><linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff2a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff2a2a" stop-opacity="0"/></linearGradient></defs>' +
      '<line class="a-dim" x1="20" y1="262" x2="460" y2="262"/>' +
      '<g transform="translate(176 6)"><g class="sun"><circle cx="56" cy="52" r="14" class="a-white"/><path class="a-white" d="M56 24v8M56 72v8M28 52h8M76 52h8M36 32l6 6M70 66l6 6M76 32l-6 6M42 66l-6 6"/></g>' +
      '<path class="a-white moon" d="M66 38a18 18 0 1 0 6 28a14 14 0 0 1-6-28z"/></g>' +
      '<polygon class="cone" points="124,86 36,262 212,262"/>' +
      '<path class="a-white" d="M60 262V104Q60 76 88 76H112"/>' +
      '<path class="a-white" d="M104 70h40l-6 14h-28z"/>' +
      '<path class="a-fill lamp-on" d="M110 84h28l-3 5h-22z"/>' +
      '<line class="a-white" x1="42" y1="262" x2="78" y2="262"/>' +
      '<path class="a-line flow" d="M268 150H300M356 150H392M436 150H452"/>' +
      '<rect class="a-white" x="300" y="132" width="56" height="36" rx="4"/><path class="a-line" d="M312 150h6l3-8 6 16 6-16 3 8h6"/>' +
      '<path class="a-white" d="M290 112l12 14M280 118l12 14"/><path class="a-dim" d="M256 150h12"/>' +
      '<text class="a-txt" x="302" y="190">LDR</text>' +
      '<polygon class="a-white" points="392,128 392,172 432,150"/><text class="a-txt" x="392" y="190">Switch</text>' +
      '<circle class="a-line" cx="452" cy="150" r="0"/>' +
      '<circle class="a-white" cx="452" cy="102" r="14"/><path class="a-white" d="M444 94l16 16M460 94l-16 16"/>' +
      '<path class="a-line flow" d="M452 150v-34"/>' +
      '<circle class="a-fill lamp-on" cx="452" cy="102" r="6"/>' +
      '<text class="a-txt" x="412" y="76">Lamp</text>' +
      '<text class="a-txt" x="256" y="244">Dusk → ON · Dawn → OFF</text>' +
      "</svg>",
    home:
      '<svg viewBox="0 0 480 300" role="img" aria-label="Diagram: an AI hub controlling lights, fan and plug inside a home">' +
      '<path class="a-white" d="M44 128L240 36l196 92M72 116v146h336V116"/>' +
      '<path class="a-dim" d="M20 262h440"/>' +
      '<g transform="translate(150 196)"><circle class="a-line ring" r="38"/><rect class="a-white" x="-34" y="-26" width="68" height="52" rx="8"/>' +
      '<path class="a-dim" d="M-22 -26v-10M0 -26v-10M22 -26v-10M-22 26v10M0 26v10M22 26v10M-34 -10h-10M-34 10h-10M34 -10h10M34 10h10"/>' +
      '<text x="0" y="9" text-anchor="middle" style="font:400 28px Anton,Impact,sans-serif;fill:#ff2a2a;stroke:none;letter-spacing:.05em">AI</text></g>' +
      '<path class="a-line flow" d="M184 184C230 170 250 150 296 150"/>' +
      '<path class="a-line flow" d="M188 200L296 206"/>' +
      '<path class="a-line flow" d="M184 214C230 236 262 250 304 250"/>' +
      '<g transform="translate(320 150)"><circle class="a-white" r="15"/><path class="a-white" d="M-6 14h12M-4 19h8"/><path class="a-fill blink" d="M-5 -4a6 6 0 1 1 10 0l-2 6h-6z"/><text class="a-txt" x="30" y="4">Lights</text></g>' +
      '<g transform="translate(322 206)"><circle class="a-white" r="15"/><g class="spin"><path class="a-line" d="M0 0C-4-12 6-14 4-4M0 0C12-4 14 6 4 4M0 0C4 12-6 14-4 4M0 0C-12 4-14-6-4-4"/></g><text class="a-txt" x="30" y="4">Fan</text></g>' +
      '<g transform="translate(322 250)"><rect class="a-white" x="-15" y="-15" width="30" height="30" rx="6"/><path class="a-line" d="M-5 -6v6M5 -6v6M-5 6h10"/><text class="a-txt" x="30" y="4">Plug</text></g>' +
      '<text class="a-txt" x="92" y="148">Monitor + control</text>' +
      "</svg>",
  };
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m0 0l-6-6m6 6l-6 6" /></svg>';

  /* ---------- render content ---------- */
  function setText(id, t) {
    var el = document.getElementById(id);
    if (el) el.textContent = t;
  }
  setText("objective", CV.objective);
  setText("year", new Date().getFullYear());
  if (CV.email) {
    var ml = $("#mailLink");
    if (ml) ml.href = "mailto:" + CV.email;
    setText("mailText", CV.email);
  }
  if (CV.phone) {
    var pl = $("#phoneLink");
    if (pl) pl.href = CV.phoneHref || "tel:" + CV.phone.replace(/\s/g, "");
    setText("phoneText", CV.phone);
  }
  if (CV.location) setText("locText", CV.location);
  $$("[data-cv]").forEach(function (el) {
    if (CV.cvFile) el.href = CV.cvFile;
  });

  $("#summary").innerHTML = (CV.summary || [])
    .map(function (s) {
      return "<li>" + esc(s) + "</li>";
    })
    .join("");

  var tick = (CV.marquee || [])
    .map(function (m) {
      return "<span>" + esc(m) + '</span><span class="r">/</span>';
    })
    .join("");
  $("#ticker").innerHTML = tick + tick;

  $("#stats").innerHTML = (CV.stats || [])
    .map(function (s, i) {
      return (
        '<div style="--d:' +
        i * 0.08 +
        's"><dt>' +
        esc(s.label) +
        '</dt><dd data-count="' +
        esc(s.value) +
        '">' +
        esc(s.value) +
        "</dd></div>"
      );
    })
    .join("");

  $("#skills").innerHTML = (CV.skills || [])
    .map(function (g, i) {
      return (
        '<li class="row"><span class="row-n">' +
        pad2(i + 1) +
        '</span><h4 class="row-t">' +
        esc(g.group) +
        '</h4><p class="row-items">' +
        g.items.map(esc).join(" · ") +
        '</p><svg class="row-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m0 0l-6-6m6 6l-6 6" /></svg></li>'
      );
    })
    .join("");

  $("#interests").innerHTML = (CV.interests || [])
    .map(function (s) {
      return "<li>" + esc(s) + "</li>";
    })
    .join("");

  $("#steps").innerHTML = (CV.professionalSkills || [])
    .map(function (s, i) {
      return (
        '<li class="step"><span class="step-n" aria-hidden="true">' +
        pad2(i + 1) +
        "</span><h3>" +
        esc(s.name) +
        "</h3><p>" +
        esc(s.text) +
        "</p></li>"
      );
    })
    .join("");

  $("#timeline").innerHTML = (CV.education || [])
    .map(function (e) {
      return (
        '<li class="tl"><div class="tl-when">' +
        esc(e.big) +
        "<small>" +
        esc(e.bigLabel) +
        " · " +
        esc(e.stage) +
        "</small></div><div><h3>" +
        esc(e.degree) +
        '</h3><p class="org">' +
        esc(e.school) +
        '</p><span class="sc">' +
        esc(e.score) +
        "</span>" +
        (e.points && e.points.length
          ? "<ul>" +
            e.points
              .map(function (p) {
                return "<li>" + esc(p) + "</li>";
              })
              .join("") +
            "</ul>"
          : "") +
        "</div></li>"
      );
    })
    .join("");

  var ex = (CV.experience || [])[0];
  if (ex)
    $("#training").innerHTML =
      '<span class="tag-s">Hands-on · ' +
      esc(ex.duration) +
      "</span><h3>" +
      esc(ex.role) +
      '</h3><p class="org">' +
      esc(ex.org) +
      "</p><ul>" +
      ex.points
        .map(function (p) {
          return "<li>" + esc(p) + "</li>";
        })
        .join("") +
      "</ul>";

  /* projects */
  var FILTERS = [
    ["all", "All"],
    ["automation", "Automation"],
    ["energy", "Energy saving"],
    ["ai", "AI"],
  ];
  var projects = CV.projects || [];
  $("#cards").innerHTML = projects
    .map(function (p, i) {
      return (
        '<li class="card" data-f="' +
        esc((p.filters || []).join(" ")) +
        '" style="--d:' +
        i * 0.12 +
        's">' +
        '<button type="button" class="card-btn" data-i="' +
        i +
        '" aria-haspopup="dialog" aria-label="Open project: ' +
        esc(p.name) +
        '">' +
        '<div class="art">' +
        (ART[p.demo] || "") +
        "</div>" +
        '<div class="card-body"><div class="card-top"><span class="num">' +
        pad2(i + 1) +
        '</span><ul class="chips">' +
        (p.tags || [])
          .map(function (t) {
            return "<li>" + esc(t) + "</li>";
          })
          .join("") +
        "</ul></div>" +
        "<h3>" +
        esc(p.name) +
        "</h3><p>" +
        esc(p.objective) +
        '</p><div class="card-foot"><span>View project</span><span class="arrow">' +
        ARROW +
        "</span></div></div>" +
        "</button></li>"
      );
    })
    .join("");
  $("#filters").innerHTML = FILTERS.map(function (f, i) {
    return (
      '<button type="button" data-f="' + f[0] + '" aria-pressed="' + (i === 0) + '">' + f[1] + "</button>"
    );
  }).join("");
  $("#filters").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var f = b.getAttribute("data-f");
    $$("#filters button").forEach(function (x) {
      x.setAttribute("aria-pressed", String(x === b));
    });
    $$("#cards .card").forEach(function (c) {
      var show = f === "all" || (c.getAttribute("data-f") || "").split(" ").indexOf(f) > -1;
      c.hidden = !show;
      if (show) c.classList.add("in");
    });
  });

  /* project dialog */
  var modal = $("#modal"),
    lastCard = null;
  function openProject(i) {
    var p = projects[i];
    if (!p || !modal) return;
    $("#modalBody").innerHTML =
      '<button type="button" class="m-x" id="mX" aria-label="Close">×</button>' +
      '<div class="art">' +
      (ART[p.demo] || "") +
      "</div>" +
      '<div class="m-body"><ul class="chips">' +
      (p.tags || [])
        .map(function (t) {
          return "<li>" + esc(t) + "</li>";
        })
        .join("") +
      "</ul>" +
      '<h3 id="mTitle">' +
      esc(p.name) +
      "</h3>" +
      '<div class="m-blk"><h4>Objective</h4><p>' +
      esc(p.objective) +
      "</p></div>" +
      '<div class="m-blk"><h4>How it works</h4><p>' +
      esc(p.concept) +
      "</p></div>" +
      '<div class="m-blk"><h4>Benefit</h4><p>' +
      esc(p.benefit) +
      "</p></div></div>";
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
    $("#mX").addEventListener("click", function () {
      modal.close();
    });
  }
  $("#cards").addEventListener("click", function (e) {
    var b = e.target.closest(".card-btn");
    if (!b) return;
    lastCard = b;
    openProject(+b.getAttribute("data-i"));
  });
  modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.close();
  });
  modal.addEventListener("close", function () {
    if (lastCard) lastCard.focus({ preventScroll: true });
  });

  /* ---------- rotating role word ---------- */
  (function () {
    var el = $("#roleWord"),
      roles = CV.roles || [],
      i = 0;
    if (!el || roles.length < 2) return;
    el.textContent = roles[0];
    setInterval(function () {
      if (!motionOn() || document.hidden) return;
      el.classList.add("out");
      setTimeout(function () {
        i = (i + 1) % roles.length;
        el.textContent = roles[i];
        el.classList.remove("out");
      }, 360);
    }, 2600);
  })();

  /* ---------- reveals, counters, nav, progress ---------- */
  var io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          function (en) {
            en.forEach(function (x) {
              if (!x.isIntersecting) return;
              x.target.classList.add("in");
              if (x.target.id === "stats") countUp();
              io.unobserve(x.target);
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
        )
      : null;
  var targets = $$(".rv, .row, .step, .tl, .card, #stats");
  targets.forEach(function (el, i) {
    if (el.matches(".row,.step,.tl")) el.style.setProperty("--d", (i % 4) * 0.06 + "s");
    if (io) io.observe(el);
    else el.classList.add("in");
  });
  function countUp() {
    if (!motionOn()) return;
    $$("#stats dd").forEach(function (dd) {
      var raw = dd.getAttribute("data-count") || "",
        m = /^([\d.]+)(.*)$/.exec(raw);
      if (!m) return;
      var end = parseFloat(m[1]),
        dec = (m[1].split(".")[1] || "").length,
        t0 = performance.now(),
        dur = 1100;
      (function step(t) {
        var k = Math.min(1, (t - t0) / dur),
          e = 1 - Math.pow(1 - k, 3);
        dd.textContent = (end * e).toFixed(dec) + m[2];
        if (k < 1) requestAnimationFrame(step);
        else dd.textContent = raw;
      })(t0);
    });
  }

  var bar = $("#bar"),
    prog = $("#progress"),
    ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY || 0,
      h = document.documentElement.scrollHeight - innerHeight;
    bar.classList.toggle("scrolled", y > 12);
    prog.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
  }
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  onScroll();
  if (io) {
    var navIO = new IntersectionObserver(
      function (en) {
        en.forEach(function (x) {
          if (!x.isIntersecting) return;
          var id = x.target.id === "process" ? "about" : x.target.id;
          $$(".nav a").forEach(function (a) {
            a.classList.toggle("on", a.getAttribute("data-nav") === id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ["work", "about", "process", "journey", "contact"].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) navIO.observe(s);
    });
  }

  /* ---------- cursor sparkles ---------- */
  (function () {
    var c = $("#sparks");
    if (!c || !c.getContext) return;
    var ctx = c.getContext("2d"),
      W = 0,
      H = 0,
      dpr = 1,
      parts = [],
      raf = 0,
      lx = -999,
      ly = -999;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth;
      H = innerHeight;
      c.width = W * dpr;
      c.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener("resize", size);
    function accent() {
      return getComputedStyle(root).getPropertyValue("--accent").trim() || "#ff2a2a";
    }
    function spawn(x, y, n, burst) {
      if (!motionOn() || parts.length > 90) return;
      var col = accent();
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283,
          sp = burst ? 1.2 + Math.random() * 2.6 : 0.2 + Math.random() * 0.9;
        parts.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - (burst ? 0.6 : 0.25),
          life: 1,
          decay: 0.014 + Math.random() * 0.016,
          s: 3 + Math.random() * 5,
          r: Math.random() * 6.283,
          vr: (Math.random() - 0.5) * 0.2,
          k: (Math.random() * 3) | 0,
          col: Math.random() < 0.7 ? col : "#ffffff",
        });
      }
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function draw(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.col;
      ctx.beginPath();
      var s = p.s * (0.5 + p.life * 0.5);
      if (p.k === 0) {
        ctx.moveTo(0, -s * 1.6);
        ctx.quadraticCurveTo(0, 0, s * 1.6, 0);
        ctx.quadraticCurveTo(0, 0, 0, s * 1.6);
        ctx.quadraticCurveTo(0, 0, -s * 1.6, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s * 1.6);
      } else if (p.k === 1) {
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.9, s * 0.7);
        ctx.lineTo(-s * 0.9, s * 0.7);
      } else {
        ctx.rect(-s / 2, -s / 2, s, s);
      }
      ctx.fill();
      ctx.restore();
    }
    function loop() {
      raf = 0;
      ctx.clearRect(0, 0, W, H);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.015;
        p.vx *= 0.985;
        p.r += p.vr;
        p.life -= p.decay;
        if (p.life <= 0) parts.splice(i, 1);
        else draw(p);
      }
      if (parts.length) raf = requestAnimationFrame(loop);
    }
    window.addEventListener(
      "pointermove",
      function (e) {
        if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
        var dx = e.clientX - lx,
          dy = e.clientY - ly;
        if (dx * dx + dy * dy < 400) return;
        lx = e.clientX;
        ly = e.clientY;
        spawn(lx, ly, 1 + (Math.random() < 0.4 ? 1 : 0), false);
      },
      { passive: true },
    );
    window.addEventListener(
      "pointerdown",
      function (e) {
        if (e.target.closest && e.target.closest("input,textarea,select,dialog")) return;
        spawn(e.clientX, e.clientY, 9, true);
      },
      { passive: true },
    );
    window.addEventListener(
      "touchmove",
      function (e) {
        var t = e.touches[0];
        if (!t) return;
        var dx = t.clientX - lx,
          dy = t.clientY - ly;
        if (dx * dx + dy * dy < 1600) return;
        lx = t.clientX;
        ly = t.clientY;
        spawn(lx, ly, 1, false);
      },
      { passive: true },
    );
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        parts.length = 0;
        ctx.clearRect(0, 0, W, H);
      }
    });
  })();

  /* ---------- card tilt (mouse only) ---------- */
  if (window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".card-btn").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        if (!motionOn()) return;
        var r = b.getBoundingClientRect(),
          x = (e.clientX - r.left) / r.width - 0.5,
          y = (e.clientY - r.top) / r.height - 0.5;
        b.style.transform =
          "perspective(900px) rotateY(" + x * 6 + "deg) rotateX(" + -y * 6 + "deg) translateY(-4px)";
      });
      b.addEventListener("pointerleave", function () {
        b.style.transform = "";
      });
    });
  }

  /* ---------- customise (owner only) ---------- */
  var fab = $("#fab"),
    panel = $("#panel"),
    toastEl = $("#toast");
  var SECS = [
    ["ticker", "Ticker"],
    ["work", "Work"],
    ["about", "About"],
    ["statement", "Red panel"],
    ["process", "How I work"],
    ["journey", "Journey"],
    ["contact", "Contact"],
  ];
  var SW = ["#ff2a2a", "#ff6a1f", "#ffd23f", "#22d3ee", "#7c5cff", "#ff5fa2"];
  function toast(t) {
    toastEl.textContent = t;
    toastEl.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 2200);
  }
  function lum(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return 0;
    var v = parseInt(m[1], 16),
      ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(function (x) {
        x /= 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  function apply() {
    root.style.setProperty("--accent", prefs.accent);
    root.style.setProperty("--on-accent", lum(prefs.accent) > 0.4 ? "#000" : "#fff");
    if (prefs.motion === false) root.setAttribute("data-motion", "off");
    else root.removeAttribute("data-motion");
    root.setAttribute("data-hide", (prefs.hidden || []).join(" "));
    markSeg();
  }
  function save() {
    if (!owner) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch (e) {}
    var n = $("#savedNote");
    n.classList.add("show");
    clearTimeout(save._t);
    save._t = setTimeout(function () {
      n.classList.remove("show");
    }, 1400);
  }
  function markSeg() {
    $$(".seg", panel).forEach(function (s) {
      var k = s.getAttribute("data-pref");
      $$("button", s).forEach(function (b) {
        b.classList.toggle("on", String(prefs[k]) === b.getAttribute("data-v"));
      });
    });
    $$(".sw", panel).forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-c").toLowerCase() === String(prefs.accent).toLowerCase());
    });
    $$("input[data-sec]", panel).forEach(function (c) {
      c.checked = (prefs.hidden || []).indexOf(c.getAttribute("data-sec")) < 0;
    });
  }
  function buildPanel() {
    $("#swatches").innerHTML =
      SW.map(function (c) {
        return (
          '<button type="button" class="sw" data-c="' +
          c +
          '" style="background:' +
          c +
          '" aria-label="Accent ' +
          c +
          '"></button>'
        );
      }).join("") + '<input type="color" id="accentPick" aria-label="Custom accent colour" value="#ff2a2a">';
    $("#secChecks").innerHTML = SECS.map(function (s) {
      return '<label><input type="checkbox" data-sec="' + s[0] + '"> ' + s[1] + "</label>";
    }).join("");
    $$(".seg", panel).forEach(function (s) {
      var k = s.getAttribute("data-pref");
      s.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        var v = b.getAttribute("data-v");
        prefs[k] = v === "true" ? true : v === "false" ? false : v;
        apply();
        save();
      });
    });
    $("#swatches").addEventListener("click", function (e) {
      var b = e.target.closest(".sw");
      if (!b) return;
      prefs.accent = b.getAttribute("data-c");
      apply();
      save();
    });
    $("#accentPick").addEventListener("input", function (e) {
      prefs.accent = e.target.value;
      apply();
      save();
    });
    $("#secChecks").addEventListener("change", function () {
      prefs.hidden = $$("input[data-sec]", panel)
        .filter(function (c) {
          return !c.checked;
        })
        .map(function (c) {
          return c.getAttribute("data-sec");
        });
      apply();
      save();
    });
    $("#resetPrefs").addEventListener("click", function () {
      prefs = JSON.parse(JSON.stringify(DEF));
      try {
        localStorage.removeItem(KEY);
      } catch (e) {}
      apply();
      toast("Back to default");
    });
    $("#lockPrefs").addEventListener("click", function () {
      try {
        localStorage.removeItem(OWN);
      } catch (e) {}
      owner = false;
      closePanel();
      fab.hidden = true;
      toast("Customise locked on this device");
    });
    fab.addEventListener("click", function () {
      panel.classList.contains("open") ? closePanel() : openPanel();
    });
    $("#panelX").addEventListener("click", closePanel);
  }
  function openPanel() {
    panel.hidden = false;
    void panel.offsetWidth;
    panel.classList.add("open");
    fab.setAttribute("aria-expanded", "true");
  }
  function closePanel() {
    panel.classList.remove("open");
    fab.setAttribute("aria-expanded", "false");
    setTimeout(function () {
      if (!panel.classList.contains("open")) panel.hidden = true;
    }, 320);
  }
  function showOwner() {
    if (!fab.dataset.built) {
      buildPanel();
      fab.dataset.built = "1";
    }
    fab.hidden = false;
    markSeg();
  }
  if (owner) {
    apply();
    showOwner();
  }
  (function unlock() {
    var q = new URLSearchParams(location.search),
      code = q.get("edit");
    if (!code || !(window.crypto && crypto.subtle && window.TextEncoder)) return;
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(code)).then(function (buf) {
      var hex = Array.prototype.map
        .call(new Uint8Array(buf), function (b) {
          return ("0" + b.toString(16)).slice(-2);
        })
        .join("");
      if (hex !== EDIT_HASH) return;
      try {
        localStorage.setItem(OWN, "1");
      } catch (e) {}
      q.delete("edit");
      var s = q.toString();
      history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + location.hash);
      owner = true;
      prefs = JSON.parse(JSON.stringify(DEF));
      try {
        var sp2 = JSON.parse(localStorage.getItem(KEY) || "{}");
        Object.keys(sp2).forEach(function (k) {
          prefs[k] = sp2[k];
        });
      } catch (e) {}
      apply();
      showOwner();
      toast("Customise unlocked on this device");
    });
  })();

  root.classList.add("ready");
  document.dispatchEvent(new CustomEvent("site:ready"));
})();
