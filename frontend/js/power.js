/*
 * The site's switch-on experience:
 *  1. an intro (once per visit), either a door that swings open onto an
 *     underwater scene and carries you through it, or the breaker closing
 *     while current races out along the traces and the page lights up;
 *  2. a glowing cursor dot with a trailing ring on desktop;
 *  3. scroll stories for the two projects: dusk falls and a street lamp
 *     switches itself on at the street-light project, and the appliances
 *     come on one by one at the home-automation project.
 * Everything here is decoration on top of a complete page. It stays off for
 * reduced motion and when animations are switched off in Customise.
 */
(function () {
  "use strict";
  var root = document.documentElement,
    win = window,
    doc = document;
  var mq = win.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  function still() {
    return (mq && mq.matches) || root.getAttribute("data-motion") === "off";
  }
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }
  function accent() {
    var v = getComputedStyle(root).getPropertyValue("--accent").trim(),
      m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return [255, 210, 63];
    var n = parseInt(m[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  var powered = false;
  function powerOn(x, y) {
    if (powered) return;
    powered = true;
    win.__vsPowered = true;
    doc.dispatchEvent(new CustomEvent("power:on", { detail: { x: x, y: y } }));
  }

  /* ---------- 1a. door intro ---------- */
  function doorIntro() {
    try {
      sessionStorage.setItem("vs-pwr", "1");
    } catch (e) {}
    root.classList.add("pwr-run");
    var bub = "";
    for (var i = 0; i < 14; i++)
      bub +=
        '<i style="left:' +
        ((i * 37 + 9) % 96) +
        "%;--s:" +
        (5 + ((i * 7) % 9)) +
        "px;animation-delay:" +
        ((i * 0.17) % 1.3).toFixed(2) +
        "s;animation-duration:" +
        (1.8 + ((i * 0.31) % 1.2)).toFixed(2) +
        's"></i>';
    var box = el(
      "div",
      "dint",
      '<div class="di-sea"><div class="di-rays"><i></i><i></i><i></i><i></i><i></i></div>' +
        '<div class="di-whale">' +
        (win.__vsWhale ? win.__vsWhale() : "") +
        "</div>" +
        '<div class="di-bub">' +
        bub +
        "</div></div>" +
        '<div class="di-cam"><div class="di-door">' +
        '<div class="di-panel"><i class="di-m1"></i><i class="di-m2"></i><b class="di-knob"></b></div>' +
        '<div class="di-frame"><span class="di-key"></span></div></div>' +
        '<p class="di-name">Vedant Sharma</p></div>' +
        '<button type="button" class="pwr-skip">Skip intro</button>',
    );
    box.querySelector(".di-sea").setAttribute("aria-hidden", "true");
    box.querySelector(".di-cam").setAttribute("aria-hidden", "true");
    doc.body.appendChild(box);
    root.classList.remove("pwr");
    var dr = box.querySelector(".di-door").getBoundingClientRect(),
      vw = win.innerWidth,
      vh = win.innerHeight,
      rad = dr.width / 2,
      cx = dr.left + dr.width / 2,
      cy = dr.top + dr.height / 2,
      st = box.style;
    st.setProperty("--t", dr.top + 4 + "px");
    st.setProperty("--l", dr.left + 4 + "px");
    st.setProperty("--r", vw - dr.right + 4 + "px");
    st.setProperty("--b", vh - dr.bottom + "px");
    st.setProperty("--rad", rad - 4 + "px");
    box.style.setProperty("--ox", cx + "px");
    box.style.setProperty("--oy", cy + "px");
    void box.offsetWidth;
    box.classList.add("run");
    var timers = [],
      done = false;
    function later(f, ms) {
      timers.push(setTimeout(f, ms));
    }
    function finish(fast) {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      powerOn(cx, cy);
      box.classList.add("out");
      if (fast) box.classList.add("fast");
      setTimeout(
        function () {
          if (box.parentNode) box.parentNode.removeChild(box);
          root.classList.remove("pwr-run");
        },
        fast ? 320 : 460,
      );
      doc.removeEventListener("keydown", skip);
    }
    function skip() {
      finish(true);
    }
    later(function () {
      box.classList.add("go");
    }, 1650);
    later(function () {
      finish(false);
    }, 2450);
    box.addEventListener("click", skip);
    doc.addEventListener("keydown", skip);
    setTimeout(finish, 3600);
  }

  /* ---------- 1b. power-on intro ---------- */
  function intro() {
    if (!root.classList.contains("pwr")) return;
    if (still() || !win.requestAnimationFrame) {
      root.classList.remove("pwr");
      return;
    }
    if (root.getAttribute("data-intro") === "door") return doorIntro();
    try {
      sessionStorage.setItem("vs-pwr", "1");
    } catch (e) {}
    root.classList.add("pwr-run", "pwr-hold");
    var box = el(
      "div",
      "pwr",
      '<canvas class="pwr-cv"></canvas>' +
        '<div class="pwr-sw">' +
        '<svg viewBox="0 0 120 180" aria-hidden="true">' +
        '<rect class="pwr-body" x="6" y="6" width="108" height="168" rx="16"/>' +
        '<rect class="pwr-slot" x="38" y="44" width="44" height="92" rx="10"/>' +
        '<g class="pwr-lever"><rect x="42" y="92" width="36" height="40" rx="8"/><path d="M50 104h20M50 112h20M50 120h20"/></g>' +
        '<circle class="pwr-led" cx="60" cy="26" r="5"/>' +
        '<text x="60" y="158">MAIN</text>' +
        "</svg>" +
        '<p class="pwr-lbl">230 V <span class="pwr-off">OFF</span><span class="pwr-on">ON</span></p>' +
        "</div>" +
        '<button type="button" class="pwr-skip">Skip intro</button>',
    );
    doc.body.appendChild(box);
    root.classList.remove("pwr");
    var cv = box.querySelector("canvas"),
      g = cv.getContext("2d"),
      sw = box.querySelector(".pwr-sw");
    var vw = win.innerWidth,
      vh = win.innerHeight,
      dpr = Math.min(win.devicePixelRatio || 1, 2);
    cv.width = Math.round(vw * dpr);
    cv.height = Math.round(vh * dpr);
    var rgb = accent(),
      col = function (a) {
        return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a.toFixed(3) + ")";
      };
    var spr = el("canvas");
    spr.width = spr.height = 64;
    var sg = spr.getContext("2d"),
      gr = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,250,235,1)");
    gr.addColorStop(0.2, col(0.7));
    gr.addColorStop(0.55, col(0.16));
    gr.addColorStop(1, col(0));
    sg.fillStyle = gr;
    sg.fillRect(0, 0, 64, 64);

    var r = sw.getBoundingClientRect(),
      cx = r.left + r.width / 2,
      cy = r.top + r.height / 2;
    /* traces racing out of the switch to the screen edges */
    var D = [
        [1, 0],
        [0.7071, 0.7071],
        [0, 1],
        [-0.7071, 0.7071],
        [-1, 0],
        [-0.7071, -0.7071],
        [0, -1],
        [0.7071, -0.7071],
      ],
      lines = [],
      n = vw < 760 ? 14 : 22;
    for (var i = 0; i < n; i++) {
      var d = Math.round((i / n) * 8 + Math.random() * 0.6) % 8,
        x = cx + D[d][0] * 46,
        y = cy + D[d][1] * 70,
        pts = [[x, y]],
        L = [0],
        tot = 0,
        k = 0;
      while (x > -40 && x < vw + 40 && y > -40 && y < vh + 40 && k++ < 40) {
        var len = 30 + Math.random() * 110;
        x += D[d][0] * len;
        y += D[d][1] * len;
        tot += len;
        pts.push([x, y]);
        L.push(tot);
        var turn = Math.random() < 0.5 ? 1 : -1;
        if (d % 2) d = (d + turn + 8) % 8;
        else if (Math.random() < 0.6) d = (d + turn + 8) % 8;
      }
      lines.push({ p: pts, l: L, len: tot, v: 1500 + Math.random() * 900, delay: Math.random() * 0.12 });
    }
    function at(ln, s) {
      var j = 1;
      while (j < ln.l.length - 1 && ln.l[j] < s) j++;
      var a = ln.p[j - 1],
        b = ln.p[j],
        u = clamp((s - ln.l[j - 1]) / (ln.l[j] - ln.l[j - 1] || 1), 0, 1);
      return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, j];
    }
    var BANDS = 6,
      T0 = performance.now(),
      FLIP = 0.42,
      LIGHT = 0.95,
      END = 1.85,
      raf = 0,
      skipping = false,
      closed = false;
    function draw(now) {
      var t = (now - T0) / 1000;
      if (t >= END) return finish();
      raf = requestAnimationFrame(draw);
      if (t >= FLIP && !box.classList.contains("on")) {
        box.classList.add("on");
        powerOn(cx, cy);
      }
      if (t >= LIGHT - 0.1) root.classList.remove("pwr-hold");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, vw, vh);
      /* the dark: bands clear from the top as the lights come on */
      var bh = vh / BANDS;
      for (var b = 0; b < BANDS; b++) {
        var st = LIGHT + b * 0.1,
          a = 1 - clamp((t - st) / 0.28, 0, 1);
        if (a > 0) {
          g.fillStyle = "rgba(6,6,9," + a.toFixed(3) + ")";
          g.fillRect(0, b * bh - 0.5, vw, bh + 1);
        }
        if (t > st && t < st + 0.28) {
          var e = (t - st) / 0.28;
          g.fillStyle = col(0.55 * (1 - e));
          g.fillRect(0, b * bh + bh * e, vw, 2);
        }
      }
      if (t < FLIP) return;
      var tt = t - FLIP,
        fade = 1 - clamp((t - 1.45) / 0.4, 0, 1);
      g.globalCompositeOperation = "lighter";
      g.lineCap = g.lineJoin = "round";
      for (var i = 0; i < lines.length; i++) {
        var ln = lines[i],
          s = Math.min(ln.len, Math.max(0, tt - ln.delay) * ln.v);
        if (s <= 0) continue;
        var h = at(ln, s);
        g.beginPath();
        g.moveTo(ln.p[0][0], ln.p[0][1]);
        for (var j = 1; j < h[2]; j++) g.lineTo(ln.p[j][0], ln.p[j][1]);
        g.lineTo(h[0], h[1]);
        g.strokeStyle = col(0.18 * fade);
        g.lineWidth = 6;
        g.stroke();
        g.strokeStyle = col(0.75 * fade);
        g.lineWidth = 1.6;
        g.stroke();
        if (s < ln.len) {
          g.globalAlpha = fade;
          g.drawImage(spr, h[0] - 22, h[1] - 22, 44, 44);
          g.globalAlpha = 1;
        }
      }
      if (tt < 0.35) {
        var fr = 60 + tt * 900;
        g.globalAlpha = 1 - tt / 0.35;
        g.drawImage(spr, cx - fr, cy - fr, fr * 2, fr * 2);
        g.globalAlpha = 1;
      }
    }
    function finish() {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(raf);
      powerOn(cx, cy);
      root.classList.remove("pwr-hold");
      box.classList.add("out");
      setTimeout(function () {
        if (box.parentNode) box.parentNode.removeChild(box);
        root.classList.remove("pwr-run");
      }, 320);
      doc.removeEventListener("keydown", skip);
    }
    function skip() {
      if (skipping) return;
      skipping = true;
      box.classList.add("on");
      finish();
    }
    box.addEventListener("click", skip);
    doc.addEventListener("keydown", skip);
    raf = requestAnimationFrame(draw);
    setTimeout(finish, 4000);
  }

  /* ---------- 2. glowing cursor ---------- */
  function cursor() {
    if (!win.matchMedia || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var dot = el("div", "cur-dot"),
      ring = el("div", "cur-ring"),
      x = -100,
      y = -100,
      rx = -100,
      ry = -100,
      loop = 0,
      on = false;
    dot.setAttribute("aria-hidden", "true");
    ring.setAttribute("aria-hidden", "true");
    doc.body.appendChild(ring);
    doc.body.appendChild(dot);
    function step() {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
      loop = Math.abs(x - rx) + Math.abs(y - ry) > 0.3 ? requestAnimationFrame(step) : 0;
    }
    function sync() {
      var ok = !still();
      root.classList.toggle("has-cur", ok);
      if (!ok) on = false;
    }
    sync();
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["data-motion"] });
    win.addEventListener(
      "pointermove",
      function (e) {
        if (e.pointerType !== "mouse" || !root.classList.contains("has-cur")) return;
        x = e.clientX;
        y = e.clientY;
        if (!on) {
          on = true;
          rx = x;
          ry = y;
          root.classList.add("cur-on");
        }
        dot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
        if (!loop) loop = requestAnimationFrame(step);
      },
      { passive: true },
    );
    doc.addEventListener("pointerover", function (e) {
      var t = e.target;
      var hot = t && t.closest && t.closest("a,button,[role=tab],summary,.door,input[type=range]");
      var txt = t && t.closest && t.closest("input:not([type=range]),textarea,select");
      root.classList.toggle("cur-hot", !!hot);
      root.classList.toggle("cur-txt", !!txt);
    });
    doc.addEventListener("pointerdown", function () {
      root.classList.add("cur-down");
    });
    doc.addEventListener("pointerup", function () {
      root.classList.remove("cur-down");
    });
    doc.documentElement.addEventListener("mouseleave", function () {
      root.classList.remove("cur-on");
      on = false;
    });
  }

  /* ---------- 3a. dusk at the street-light project ---------- */
  var LAMP =
    '<svg class="lamp-svg" viewBox="0 0 160 600" preserveAspectRatio="xMinYMax meet">' +
    '<path class="lp-pole" d="M20 600V70q0-34 34-34h52"/>' +
    '<path class="lp-head" d="M98 28h46l10 20h-66z"/>' +
    '<ellipse class="lp-bulb" cx="121" cy="50" rx="20" ry="5"/>' +
    '<rect class="lp-box" x="8" y="330" width="24" height="44" rx="4"/>' +
    '<circle class="lp-ldr" cx="20" cy="344" r="5"/>' +
    '<path class="lp-wire" d="M20 374V600"/>' +
    "</svg>" +
    '<div class="lamp-cone"></div>';
  function nightScene() {
    var viz = doc.querySelector('[data-viz="street"]'),
      art = viz && viz.closest(".project");
    if (!art) return;
    var night = el("div", "dusk", '<div class="dusk-moon"></div>'),
      lamp = el("div", "slamp", LAMP),
      hud = el(
        "div",
        "lamp-hud",
        '<span class="lh-row"><i class="lh-dot"></i><b class="lh-ldr">LDR: bright</b></span><span class="lh-row lh-sm">Relay <b class="lh-rel">open</b> · Lamp <b class="lh-st">OFF</b></span>',
      );
    night.setAttribute("aria-hidden", "true");
    lamp.setAttribute("aria-hidden", "true");
    hud.setAttribute("aria-hidden", "true");
    lamp.appendChild(hud);
    doc.body.appendChild(night);
    doc.body.appendChild(lamp);
    var ldr = hud.querySelector(".lh-ldr"),
      rel = hud.querySelector(".lh-rel"),
      st = hud.querySelector(".lh-st"),
      range = viz.querySelector(".viz-range"),
      isOn = false,
      dark = false,
      pend = 0,
      lastN = -1;
    function syncCard(v) {
      if (!range) return;
      range.value = v;
      range.dispatchEvent(new Event("input", { bubbles: true }));
    }
    function setLamp(o) {
      if (o === isOn) return;
      isOn = o;
      lamp.classList.toggle("on", o);
      night.classList.toggle("lit", o);
      rel.textContent = o ? "closed" : "open";
      st.textContent = o ? "ON" : "OFF";
      syncCard(o ? 12 : 82);
    }
    function upd() {
      var r = art.getBoundingClientRect(),
        vh = win.innerHeight,
        n = clamp((vh * 0.85 - r.top) / (vh * 0.4), 0, 1) * clamp((r.bottom - vh * 0.2) / (vh * 0.3), 0, 1);
      if (still()) n = 0;
      if (Math.abs(n - lastN) < 0.004) return;
      lastN = n;
      night.style.opacity = n.toFixed(3);
      lamp.style.setProperty("--n", n.toFixed(3));
      lamp.classList.toggle("up", n > 0.02);
      var d = n > 0.72;
      if (d !== dark) {
        dark = d;
        ldr.textContent = d ? "LDR: dark" : "LDR: bright";
        hud.classList.toggle("dark", d);
        clearTimeout(pend);
        pend = setTimeout(
          function () {
            setLamp(d);
          },
          d ? 420 : 120,
        );
      }
    }
    return upd;
  }

  /* ---------- 3b. appliances switching on at the home-automation project ---------- */
  var AP = [
    {
      k: "Light",
      svg: '<svg viewBox="0 0 48 48"><circle class="ha-glow" cx="24" cy="20" r="18"/><path class="ha-l" d="M17 30c-4-3-6-7-6-11a13 13 0 0 1 26 0c0 4-2 8-6 11v4H17z"/><path class="ha-l" d="M18 39h12M20 43h8M21 25l3 4 3-4"/></svg>',
    },
    {
      k: "Fan",
      svg: '<svg viewBox="0 0 48 48"><g class="ha-fan"><path class="ha-f" d="M24 24c-2-8 0-15 6-16 4 2 2 10-6 16zM24 24c8-2 15 0 16 6-2 4-10 2-16-6zM24 24c2 8 0 15-6 16-4-2-2-10 6-16zM24 24c-8 2-15 0-16-6 2-4 10-2 16 6z"/></g><circle class="ha-l" cx="24" cy="24" r="3"/></svg>',
    },
    {
      k: "AC",
      svg: '<svg viewBox="0 0 48 48"><rect class="ha-l" x="5" y="9" width="38" height="16" rx="4"/><path class="ha-l" d="M10 20h28"/><circle class="ha-led" cx="37" cy="14" r="1.6"/><g class="ha-air"><path d="M14 30q2 4 0 8M24 30q2 4 0 8M34 30q2 4 0 8"/></g></svg>',
    },
    {
      k: "TV",
      svg: '<svg viewBox="0 0 48 48"><rect class="ha-scr" x="5" y="8" width="38" height="25" rx="3"/><rect class="ha-l" x="5" y="8" width="38" height="25" rx="3"/><path class="ha-l" d="M18 40h12M24 33v7"/><path class="ha-wave" d="M9 24l5-5 4 4 6-8 5 6 4-3 6 5"/></svg>',
    },
  ];
  function homeScene() {
    var viz = doc.querySelector('[data-viz="home"]'),
      art = viz && viz.closest(".project");
    if (!art) return;
    var html =
      '<div class="ha-head"><span class="ha-ctrl"><i></i>Controller</span><span class="ha-meter">Load <b>0%</b></span></div>' +
      '<div class="ha-bus"><span class="ha-cur"></span></div><div class="ha-row">' +
      AP.map(function (a, i) {
        return (
          '<div class="ha-ap" style="--i:' +
          i +
          '"><span class="ha-drop"></span>' +
          a.svg +
          "<b>" +
          a.k +
          '</b><em class="ha-st">OFF</em></div>'
        );
      }).join("") +
      "</div>";
    var box = el("div", "ha", html);
    box.setAttribute("aria-hidden", "true");
    art.appendChild(box);
    var aps = box.querySelectorAll(".ha-ap"),
      meter = box.querySelector(".ha-meter b"),
      W = [1, 2, 5, 2],
      lit = 0,
      want = 0,
      timer = 0;
    function show() {
      var used = 0;
      for (var i = 0; i < aps.length; i++) {
        var o = i < lit;
        aps[i].classList.toggle("on", o);
        aps[i].querySelector(".ha-st").textContent = o ? "ON" : "OFF";
        if (o) used += W[i];
      }
      box.classList.toggle("live", lit > 0);
      meter.textContent = Math.round((used / 10) * 100) + "%";
    }
    function stepTo() {
      timer = 0;
      if (lit === want) return;
      lit += want > lit ? 1 : -1;
      show();
      if (lit !== want) timer = setTimeout(stepTo, want > lit ? 480 : 140);
    }
    function upd() {
      if (still()) {
        if (lit !== 4) {
          lit = want = 4;
          show();
        }
        return;
      }
      var r = box.getBoundingClientRect(),
        vh = win.innerHeight,
        w = r.top < vh * 0.82 && r.bottom > 0 ? 4 : r.top > vh * 0.95 ? 0 : want;
      if (w !== want) {
        want = w;
        if (!timer) timer = setTimeout(stepTo, want ? 250 : 0);
      }
    }
    return upd;
  }

  /* ---------- wiring ---------- */
  intro();
  function onReady() {
    cursor();
    var ups = [nightScene(), homeScene()].filter(Boolean),
      tick = 0;
    function run() {
      tick = 0;
      for (var i = 0; i < ups.length; i++) ups[i]();
    }
    function onScroll() {
      if (!tick) tick = requestAnimationFrame(run);
    }
    win.addEventListener("scroll", onScroll, { passive: true });
    win.addEventListener("resize", onScroll);
    new MutationObserver(onScroll).observe(root, { attributes: true, attributeFilter: ["data-motion"] });
    run();
  }
  if (root.classList.contains("ready")) onReady();
  else doc.addEventListener("site:ready", onReady);
})();
