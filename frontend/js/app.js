/*
 * Main UI script: hero, theme toggle, the doors, project demos, timeline,
 * contact buttons and the owner-only customise panel.
 * Content comes from the profile object (loaded from /api/profile when the
 * backend is running, otherwise from js/data.js).
 */
(function () {
  "use strict";

  function start(CV) {
    var DEF = window.SITE_DEFAULTS;
    var KEY = "vs-prefs",
      OWN = "vs-owner",
      THEME = "vs-theme";
    var EDIT_HASH = "f5518bb0c93704618f580f49faed2256f5f9b37072859f0f3ded4aca7ba5930d";
    var root = document.documentElement;
    var $ = function (s, el) {
      return (el || document).querySelector(s);
    };
    var $$ = function (s, el) {
      return Array.prototype.slice.call((el || document).querySelectorAll(s));
    };
    var owner = false;
    try {
      owner = localStorage.getItem(OWN) === "1";
    } catch (e) {}
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var finePointer = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
    function motionOn() {
      return !reduce && root.getAttribute("data-motion") !== "off";
    }
    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function toast(msg) {
      var t = $("#toast");
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(toast._t);
      toast._t = setTimeout(function () {
        t.classList.remove("show");
      }, 2200);
    }

    var ICON = {
      arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m0 0l-6-6m6 6l-6 6"/></svg>',
      bulb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
      fan: '<svg viewBox="0 0 24 24" aria-hidden="true"><g class="fan-g"><circle cx="12" cy="12" r="1.6"/><path d="M12 10.4c0-4 1-6.4 3.4-6.4 2 0 2.4 2.6.4 4.4-1.3 1.2-2.6 1.6-3.8 2zM13.4 12.8c3.5 2 5 4.1 3.8 6.2-1 1.7-3.4.8-4-1.9-.4-1.7-.2-3 .2-4.3zM10.6 12.8c-3.5 2-6 2.3-7.2.2-1-1.7 1-3.4 3.6-2.6 1.7.5 2.7 1.4 3.6 2.4z"/></g></svg>',
      ac: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v7H3zM6 10h12M8 16v4M12 16v5M16 16v4"/></svg>',
      tv: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v11H3zM8 21h8M9 3l3 3 3-3"/></svg>',
    };

    /* ---------- static bits ---------- */
    $("#tagline").textContent = CV.tagline;
    $("#locChip").textContent = CV.location;
    $("#year").textContent = new Date().getFullYear();
    $("#stats").innerHTML = CV.stats
      .map(function (s) {
        return "<div><dt>" + esc(s.value) + "</dt><dd>" + esc(s.label) + "</dd></div>";
      })
      .join("");
    var mq = CV.marquee
      .concat(CV.marquee)
      .map(function (m) {
        return "<span>" + esc(m) + "</span>";
      })
      .join("");
    $("#marquee").innerHTML = mq;
    if (!CV.photo) {
      var art = $("#portrait");
      var d = document.createElement("div");
      d.className = "portrait initials";
      d.textContent = CV.initials;
      art.replaceWith(d);
    }

    /* ---------- rotating role pill ---------- */
    (function () {
      var pill = $("#rolePill"),
        txt = $("#roleTxt"),
        wrap = pill.parentNode,
        roles = CV.roles || [CV.title],
        i = 0;
      var meas = document.createElement("span");
      meas.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:0";
      pill.appendChild(meas);
      function widthOf(s) {
        meas.textContent = s;
        return meas.getBoundingClientRect().width;
      }
      function fit() {
        pill.style.setProperty("--pill-fs", "1em");
        var cs = getComputedStyle(pill),
          pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
        var avail = wrap.parentNode.getBoundingClientRect().width - 14;
        var longest = 0;
        roles.forEach(function (r) {
          longest = Math.max(longest, widthOf(r));
        });
        var k = Math.min(1, (avail - pad) / longest);
        pill.style.setProperty("--pill-fs", k.toFixed(3) + "em");
        setW(roles[i]);
      }
      function setW(s) {
        var cs = getComputedStyle(pill);
        pill.style.width =
          Math.ceil(widthOf(s) + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)) + "px";
      }
      function next() {
        if (document.hidden) return;
        i = (i + 1) % roles.length;
        if (!motionOn()) {
          txt.textContent = roles[i];
          setW(roles[i]);
          return;
        }
        txt.classList.add("out");
        setTimeout(function () {
          txt.classList.remove("out");
          txt.classList.add("pre");
          txt.textContent = roles[i];
          setW(roles[i]);
          void txt.offsetWidth;
          txt.classList.remove("pre");
        }, 320);
      }
      txt.textContent = roles[0];
      var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      ready.then(fit);
      fit();
      var rt;
      window.addEventListener("resize", function () {
        clearTimeout(rt);
        rt = setTimeout(fit, 120);
      });
      if (roles.length > 1) setInterval(next, 2600);
    })();

    /* ---------- nav ---------- */
    var nav = $("#nav"),
      prog = $("#progress");
    function onScroll() {
      var y = window.scrollY || 0,
        h = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle("scrolled", y > 10);
      prog.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    var menuBtn = $("#menuBtn"),
      sheet = $("#sheet");
    function setMenu(open) {
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      sheet.hidden = !open;
      nav.classList.toggle("scrolled", open || window.scrollY > 10);
    }
    menuBtn.addEventListener("click", function () {
      setMenu(sheet.hidden);
    });
    $$("a", sheet).forEach(function (a) {
      a.addEventListener("click", function () {
        setMenu(false);
      });
    });
    document.addEventListener("click", function (e) {
      if (!sheet.hidden && !nav.contains(e.target)) setMenu(false);
    });
    if ("IntersectionObserver" in window) {
      var links = $$(".links a");
      var so = new IntersectionObserver(
        function (es) {
          es.forEach(function (en) {
            if (!en.isIntersecting) return;
            var k = en.target.id;
            links.forEach(function (a) {
              a.classList.toggle("active", a.getAttribute("data-k") === k);
            });
          });
        },
        { rootMargin: "-45% 0px -50% 0px" },
      );
      ["top", "doors", "projects", "journey", "contact"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) so.observe(el);
      });
    }

    /* ---------- theme ---------- */
    var themeBtn = $("#themeSwitch"),
      metaTheme = document.querySelector('meta[name="theme-color"]');
    function syncThemeUI() {
      var light = root.getAttribute("data-theme") === "light";
      themeBtn.setAttribute("aria-pressed", light ? "true" : "false");
      themeBtn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
      if (metaTheme) metaTheme.setAttribute("content", light ? "#f3efe6" : "#0c0c10");
    }
    themeBtn.addEventListener("click", function () {
      var nt = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", nt);
      syncThemeUI();
      if (owner) {
        prefs.theme = nt;
        save();
        markSeg();
      } else {
        try {
          localStorage.setItem(THEME, nt);
        } catch (e) {}
      }
    });

    /* ---------- reveal ---------- */
    var io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            function (es) {
              es.forEach(function (en) {
                if (en.isIntersecting) {
                  en.target.classList.add("in");
                  io.unobserve(en.target);
                }
              });
            },
            { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
          )
        : null;
    function watch(el) {
      if (io) io.observe(el);
      else el.classList.add("in");
    }

    /* ---------- doors ---------- */
    var ROOMS = [
      {
        id: "about",
        name: "About me",
        color: "var(--door-1)",
        peek: "Objective, summary and what I'm into",
        build: function () {
          return (
            '<p class="room-kicker">Door 01</p><h2 class="room-title" id="roomTitle">About me</h2>' +
            '<p class="room-lead">' +
            esc(CV.objective) +
            "</p>" +
            '<ul class="rlist">' +
            CV.summary
              .map(function (s) {
                return "<li>" + esc(s) + "</li>";
              })
              .join("") +
            "</ul>" +
            '<div><h3 class="room-sub">Interests</h3><div class="tags">' +
            CV.interests
              .map(function (s) {
                return '<span class="tag">' + esc(s) + "</span>";
              })
              .join("") +
            "</div>" +
            '<h3 class="room-sub">Also</h3><div class="room-grid">' +
            Object.keys(CV.additional)
              .map(function (k) {
                return '<div class="rcard"><h3>' + esc(k) + "</h3><p>" + esc(CV.additional[k]) + "</p></div>";
              })
              .join("") +
            '<div class="rcard"><h3>Based in</h3><p>' +
            esc(CV.location) +
            "</p></div></div></div>"
          );
        },
      },
      {
        id: "skills",
        name: "Skills",
        color: "var(--door-2)",
        peek: "Core subjects, practical work, software",
        build: function () {
          return (
            '<p class="room-kicker">Door 02</p><h2 class="room-title" id="roomTitle">Skills</h2>' +
            '<p class="room-lead">The fundamentals I study, the work I have done with my hands, and the tools I use.</p>' +
            '<div class="room-grid">' +
            CV.skills
              .map(function (g) {
                return (
                  '<div class="rcard"><h3>' +
                  esc(g.group) +
                  '</h3><div class="tags">' +
                  g.items
                    .map(function (s) {
                      return '<span class="tag">' + esc(s) + "</span>";
                    })
                    .join("") +
                  "</div></div>"
                );
              })
              .join("") +
            "</div>"
          );
        },
      },
      {
        id: "training",
        name: "Training",
        color: "var(--door-3)",
        peek: "4 weeks of transformer repair",
        build: function () {
          return CV.experience
            .map(function (x) {
              return (
                '<p class="room-kicker">Door 03</p><h2 class="room-title" id="roomTitle">' +
                esc(x.role) +
                "</h2>" +
                '<p class="room-lead">' +
                esc(x.org) +
                " · <strong>" +
                esc(x.duration) +
                "</strong></p>" +
                '<ul class="rlist">' +
                x.points
                  .map(function (p) {
                    return "<li>" + esc(p) + "</li>";
                  })
                  .join("") +
                "</ul>"
              );
            })
            .join("");
        },
      },
      {
        id: "strengths",
        name: "Strengths",
        color: "var(--door-4)",
        peek: "How I work with people",
        build: function () {
          return (
            '<p class="room-kicker">Door 04</p><h2 class="room-title" id="roomTitle">Strengths</h2>' +
            '<p class="room-lead">What I bring to a team, beyond the textbook.</p>' +
            '<div class="room-grid">' +
            CV.professionalSkills
              .map(function (p) {
                return '<div class="rcard"><h3>' + esc(p.name) + "</h3><p>" + esc(p.text) + "</p></div>";
              })
              .join("") +
            "</div>"
          );
        },
      },
    ];
    $("#doorsRow").innerHTML = ROOMS.map(function (r, n) {
      return (
        '<button type="button" class="door reveal" data-room="' +
        n +
        '" style="--c:' +
        r.color +
        ";transition-delay:" +
        n * 0.08 +
        's" aria-haspopup="dialog">' +
        '<span class="door-frame"><span class="door-inside"></span><span class="door-panel"><span class="inset a"></span><span class="inset b"></span><span class="knob"></span></span><span class="door-step"></span></span>' +
        '<span class="door-meta"><span class="door-num">0' +
        (n + 1) +
        '</span><span class="door-name">' +
        esc(r.name) +
        ICON.arrow +
        '</span><span class="door-peek">' +
        esc(r.peek) +
        "</span></span></button>"
      );
    }).join("");

    var room = $("#room"),
      roomBody = $("#roomBody"),
      roomIn = $(".room-in", room),
      roomClose = $("#roomClose");
    var opener = null,
      busy = false;
    function clipFrom(door) {
      var f = $(".door-inside", door).getBoundingClientRect(),
        w = f.width,
        h = f.height;
      room.style.setProperty("--t", Math.max(0, f.top) + "px");
      room.style.setProperty("--l", Math.max(0, f.left) + "px");
      room.style.setProperty("--r", Math.max(0, innerWidth - f.right) + "px");
      room.style.setProperty("--b", Math.max(0, innerHeight - f.bottom) + "px");
      room.style.setProperty(
        "--rad",
        w / 2 + "px " + w / 2 + "px 4px 4px / " + h * 0.29 + "px " + h * 0.29 + "px 4px 4px",
      );
    }
    function fill(n) {
      var r = ROOMS[n];
      room.style.setProperty("--rc", r.color);
      var others = ROOMS.map(function (o, k) {
        return k === n ? "" : '<button type="button" data-go="' + k + '">' + esc(o.name) + " →</button>";
      }).join("");
      roomBody.innerHTML = r.build() + '<div class="room-next">' + others + "</div>";
      roomIn.scrollTop = 0;
    }
    function openRoom(n, door) {
      if (busy) return;
      busy = true;
      opener = door;
      var anim = motionOn();
      door.classList.add("opening");
      setTimeout(
        function () {
          fill(n);
          clipFrom(door);
          room.hidden = false;
          room.classList.remove("open", "ready");
          document.body.classList.add("locked");
          void room.offsetWidth;
          room.classList.add("open");
          var done = function () {
            room.classList.add("ready");
            roomClose.focus({ preventScroll: true });
            busy = false;
          };
          if (anim) setTimeout(done, 700);
          else done();
          try {
            history.pushState({ room: n }, "", "#" + ROOMS[n].id);
          } catch (e) {}
        },
        anim ? 380 : 0,
      );
    }
    function closeRoom(fromPop) {
      if (room.hidden || busy) return;
      busy = true;
      var anim = motionOn();
      room.classList.remove("ready");
      if (opener) clipFrom(opener);
      room.classList.remove("open");
      setTimeout(
        function () {
          room.hidden = true;
          document.body.classList.remove("locked");
          if (opener) {
            opener.classList.remove("opening");
            opener.focus({ preventScroll: true });
          }
          busy = false;
        },
        anim ? 760 : 0,
      );
      if (!fromPop) {
        try {
          if (history.state && history.state.room !== undefined) history.back();
        } catch (e) {}
      }
    }
    $$(".door").forEach(function (d) {
      d.addEventListener("click", function () {
        openRoom(+d.getAttribute("data-room"), d);
      });
    });
    roomClose.addEventListener("click", function () {
      closeRoom(false);
    });
    roomBody.addEventListener("click", function (e) {
      var b = e.target.closest("[data-go]");
      if (!b) return;
      var n = +b.getAttribute("data-go");
      room.classList.remove("ready");
      setTimeout(
        function () {
          if (opener) opener.classList.remove("opening");
          opener = $('.door[data-room="' + n + '"]');
          opener.classList.add("opening");
          fill(n);
          room.classList.add("ready");
          try {
            history.replaceState({ room: n }, "", "#" + ROOMS[n].id);
          } catch (e) {}
        },
        motionOn() ? 280 : 0,
      );
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (!room.hidden) closeRoom(false);
        else if (panel.classList.contains("open")) closePanel();
      }
      if (e.key === "Tab" && !room.hidden) {
        var f = $$("button, a[href]", room),
          first = f[0],
          last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    window.addEventListener("popstate", function () {
      if (!room.hidden) closeRoom(true);
    });
    (function deepLink() {
      var h = location.hash.replace("#", ""),
        n = -1;
      ROOMS.forEach(function (r, k) {
        if (r.id === h) n = k;
      });
      if (n < 0) return;
      try {
        history.replaceState(null, "", location.pathname + location.search + "#doors");
      } catch (e) {}
      var door = $('.door[data-room="' + n + '"]');
      setTimeout(function () {
        door.scrollIntoView({ block: "center" });
        setTimeout(function () {
          openRoom(n, door);
        }, 350);
      }, 200);
    })();

    /* ---------- projects ---------- */
    function streetDemo() {
      return (
        '<div class="screen st" data-demo="street">' +
        '<div class="st-sky"></div><div class="st-stars"></div><div class="st-sun"></div><div class="st-moon"></div>' +
        '<div class="st-head-ui">Street light<small>LDR controller</small></div>' +
        '<div class="st-road"></div>' +
        '<div class="st-lamp"><div class="st-cone"></div><div class="st-pole"></div><div class="st-arm"></div><div class="st-head"></div><div class="st-bulb"></div></div>' +
        '<div class="st-ui"><div class="st-row"><span>Light</span><span class="st-status" aria-live="polite">OFF</span></div>' +
        '<label class="st-row" for="ldr"><span>Daylight (LDR)</span><span class="st-val">80%</span></label>' +
        '<input id="ldr" type="range" min="0" max="100" value="80" aria-label="Daylight level sensed by the LDR">' +
        '<span class="st-hint">Drag down to make it dusk</span></div></div>'
      );
    }
    var HM = [
      { k: "Lights", w: 1, i: "bulb" },
      { k: "Fan", w: 2, i: "fan" },
      { k: "AC", w: 5, i: "ac" },
      { k: "TV", w: 2, i: "tv" },
    ];
    function homeDemo() {
      return (
        '<div class="screen"><div class="hm" data-demo="home">' +
        '<div class="hm-head"><div><small>My home</small><b>Living room</b></div><button type="button" class="hm-auto" aria-pressed="false">Smart mode</button></div>' +
        '<div class="hm-grid">' +
        HM.map(function (a, n) {
          return (
            '<button type="button" class="hm-tile on" data-n="' +
            n +
            '" aria-pressed="true">' +
            ICON[a.i] +
            "<span>" +
            a.k +
            " <em>On</em></span></button>"
          );
        }).join("") +
        "</div>" +
        '<div class="hm-meter"><div class="lbl"><span>Power in use</span><span class="hm-pct">100%</span></div><div class="hm-bar"><i></i></div><p class="hm-note" aria-live="polite">Everything is on. Try Smart mode.</p></div>' +
        "</div></div>"
      );
    }
    $("#projectList").innerHTML = CV.projects
      .map(function (p, n) {
        return (
          '<article class="project' +
          (n % 2 ? " flip" : "") +
          '">' +
          '<div class="p-copy reveal"><span class="p-num">0' +
          (n + 1) +
          " / 0" +
          CV.projects.length +
          '</span><h3 class="p-name">' +
          esc(p.name) +
          "</h3>" +
          '<div class="p-tags">' +
          p.tags
            .map(function (t) {
              return "<span>" + esc(t) + "</span>";
            })
            .join("") +
          "</div>" +
          '<dl class="p-rows"><div><dt>Objective</dt><dd>' +
          esc(p.objective) +
          "</dd></div><div><dt>How it works</dt><dd>" +
          esc(p.concept) +
          "</dd></div><div><dt>Result</dt><dd>" +
          esc(p.benefit) +
          "</dd></div></dl></div>" +
          '<div class="p-stage reveal"><div class="phone"><span class="demo-tag">Try it</span>' +
          (p.demo === "home" ? homeDemo() : streetDemo()) +
          "</div></div></article>"
        );
      })
      .join("");

    $$('[data-demo="street"]').forEach(function (st) {
      var r = $("input", st),
        val = $(".st-val", st),
        stat = $(".st-status", st),
        touched = false,
        dir = -1,
        timer = null;
      function upd() {
        var v = +r.value,
          on = v < 35;
        val.textContent = v + "%";
        st.classList.toggle("on", on);
        st.classList.toggle("night", v < 45);
        stat.textContent = on ? "ON" : "OFF";
      }
      r.addEventListener("input", function () {
        touched = true;
        stop();
        upd();
      });
      function tick() {
        var v = +r.value + dir * 2;
        if (v <= 6) dir = 1;
        if (v >= 90) dir = -1;
        r.value = v;
        upd();
      }
      function start() {
        if (!touched && !timer && motionOn()) timer = setInterval(tick, 70);
      }
      function stop() {
        clearInterval(timer);
        timer = null;
      }
      if ("IntersectionObserver" in window)
        new IntersectionObserver(
          function (es) {
            es.forEach(function (e) {
              e.isIntersecting ? start() : stop();
            });
          },
          { threshold: 0.4 },
        ).observe(st);
      upd();
    });
    $$('[data-demo="home"]').forEach(function (hm) {
      var state = HM.map(function () {
          return true;
        }),
        tiles = $$(".hm-tile", hm),
        bar = $(".hm-bar i", hm),
        pct = $(".hm-pct", hm),
        note = $(".hm-note", hm),
        auto = $(".hm-auto", hm);
      var total = HM.reduce(function (s, a) {
        return s + a.w;
      }, 0);
      function render(msg) {
        var used = 0;
        tiles.forEach(function (t, n) {
          t.classList.toggle("on", state[n]);
          t.setAttribute("aria-pressed", state[n] ? "true" : "false");
          $("em", t).textContent = state[n] ? "On" : "Off";
          var g = $(".fan-g", t);
          if (g) g.classList.toggle("fan-spin", state[n] && motionOn());
          if (state[n]) used += HM[n].w;
        });
        var p = Math.round((used / total) * 100);
        bar.style.width = Math.max(3, p) + "%";
        pct.textContent = p + "%";
        if (msg) note.textContent = msg;
      }
      tiles.forEach(function (t, n) {
        t.addEventListener("click", function () {
          state[n] = !state[n];
          auto.classList.remove("on");
          auto.setAttribute("aria-pressed", "false");
          render(HM[n].k + (state[n] ? " switched on" : " switched off"));
        });
      });
      auto.addEventListener("click", function () {
        var on = !auto.classList.contains("on");
        auto.classList.toggle("on", on);
        auto.setAttribute("aria-pressed", on ? "true" : "false");
        if (on) {
          state = [true, true, false, false];
          render("Idle AC and TV switched off automatically");
        } else {
          state = HM.map(function () {
            return true;
          });
          render("Smart mode off. Everything back on.");
        }
      });
      render();
    });

    /* ---------- timeline ---------- */
    $("#timeline").innerHTML = CV.education
      .map(function (e) {
        return (
          '<li class="tl"><div class="tl-big"><div class="tl-sticky"><span class="tl-stage">' +
          esc(e.stage) +
          '</span><span class="tl-num" aria-hidden="true"><span>' +
          esc(e.big) +
          '</span></span><span class="tl-numlbl">' +
          esc(e.bigLabel) +
          "</span></div></div>" +
          '<div class="tl-card reveal"><span class="tl-score">' +
          esc(e.score) +
          "</span><h3>" +
          esc(e.degree) +
          '</h3><p class="tl-school">' +
          esc(e.school) +
          "</p>" +
          (e.points.length
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

    /* ---------- contact ---------- */
    var tp = $(".toggle-pill"),
      cta = $("#ctaBtn"),
      lbl = $("#ctaLabel"),
      copyBtn = $("#copyBtn"),
      mode = "email";
    cta.href = "mailto:" + CV.email;
    lbl.textContent = CV.email;
    $("#footMail").href = "mailto:" + CV.email;
    $("#footMail").textContent = CV.email;
    $("#footTel").href = CV.phoneHref;
    $("#footTel").textContent = CV.phone;
    $$(".tp-opt", tp).forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.getAttribute("data-mode");
        $$(".tp-opt", tp).forEach(function (o) {
          var on = o === b;
          o.classList.toggle("is-on", on);
          o.setAttribute("aria-pressed", on ? "true" : "false");
        });
        tp.classList.toggle("call", mode === "call");
        cta.href = mode === "call" ? CV.phoneHref : "mailto:" + CV.email;
        lbl.textContent = mode === "call" ? CV.phone : CV.email;
        copyBtn.textContent = mode === "call" ? "Copy number" : "Copy email";
      });
    });
    copyBtn.addEventListener("click", function () {
      var v = mode === "call" ? CV.phone : CV.email;
      var ok = function () {
        toast((mode === "call" ? "Number" : "Email") + " copied");
      };
      if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(v).then(ok, function () {
          toast(v);
        });
      else toast(v);
    });

    /* ---------- micro-interactions ---------- */
    if (finePointer) {
      $$(".magnetic").forEach(function (b) {
        b.addEventListener("pointermove", function (e) {
          if (!motionOn()) return;
          var r = b.getBoundingClientRect();
          b.style.transform =
            "translate(" +
            (e.clientX - r.left - r.width / 2) * 0.18 +
            "px," +
            (e.clientY - r.top - r.height / 2) * 0.25 +
            "px)";
        });
        b.addEventListener("pointerleave", function () {
          b.style.transform = "";
        });
      });
      var hero = $(".hero"),
        por = $("#portrait"),
        disc = $(".art-disc");
      hero.addEventListener("pointermove", function (e) {
        if (!motionOn() || !por) return;
        var x = e.clientX / innerWidth - 0.5,
          y = e.clientY / innerHeight - 0.5;
        por.style.transform = "translate(" + x * 14 + "px," + y * 10 + "px)";
        disc.style.transform = "translate(" + x * -22 + "px," + y * -16 + "px)";
      });
    }

    /* ---------- customise (owner only) ---------- */
    var fab = $("#fab"),
      panel = $("#panel"),
      prefs;
    var SECS = [
      ["marquee", "Ticker"],
      ["doors", "Doors"],
      ["projects", "Projects"],
      ["journey", "Journey"],
      ["contact", "Contact"],
    ];
    var SW = ["#ffd23f", "#22d3ee", "#7c5cff", "#3ddc84", "#ff6b4a", "#ff5fa2"];
    function load() {
      var p = JSON.parse(JSON.stringify(DEF));
      if (owner) {
        try {
          var s = JSON.parse(localStorage.getItem(KEY) || "{}");
          Object.keys(s).forEach(function (k) {
            p[k] = s[k];
          });
        } catch (e) {}
      }
      return p;
    }
    function apply() {
      var th = prefs.theme;
      if (th === "auto")
        th = window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      root.setAttribute("data-theme", th);
      root.style.setProperty("--accent", prefs.accent);
      root.setAttribute("data-font", prefs.font);
      if (prefs.motion === false) root.setAttribute("data-motion", "off");
      else root.removeAttribute("data-motion");
      root.setAttribute("data-hide", (prefs.hidden || []).join(" "));
      syncThemeUI();
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
      if (!prefs) return;
      $$(".seg", panel).forEach(function (s) {
        var k = s.getAttribute("data-pref");
        $$("button", s).forEach(function (b) {
          b.classList.toggle("on", String(prefs[k]) === b.getAttribute("data-v"));
        });
      });
      $$(".sw", panel).forEach(function (b) {
        b.classList.toggle(
          "on",
          b.getAttribute("data-c").toLowerCase() === String(prefs.accent).toLowerCase(),
        );
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
        }).join("") + '<input type="color" id="accentPick" aria-label="Custom accent colour">';
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
      }, 350);
    }
    function showOwner() {
      if (!fab.dataset.built) {
        buildPanel();
        fab.dataset.built = "1";
      }
      fab.hidden = false;
      markSeg();
    }
    prefs = load();
    if (owner) {
      apply();
      showOwner();
    } else {
      syncThemeUI();
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
        prefs = load();
        apply();
        showOwner();
        toast("Customise unlocked on this device");
      });
    })();

    /* ---------- go ---------- */
    $$("[data-cv]").forEach(function (el) {
      if (CV.cvFile) el.href = CV.cvFile;
    });
    $$(".reveal").forEach(watch);
    $$(".tl").forEach(watch);
  }

  // Use live data from the backend if it is available, otherwise the bundled data file.
  window.Api.profile().then(function (profile) {
    start(profile && profile.name ? profile : window.CV);
  });
})();
