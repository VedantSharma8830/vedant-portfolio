/*
 * Hero centrepiece: a toroidal transformer winding wrapped around the
 * portrait, drawn in 3D on two canvases - the far half behind the photo,
 * the near half in front of it. Current runs round the coil, field rings
 * orbit it and arcs jump to the photo's rim. It tilts toward the mouse or
 * the phone's tilt and opens up as the page scrolls. Plain canvas maths.
 */
(function () {
  "use strict";
  var root = document.documentElement,
    win = window,
    art = document.querySelector(".hero-art");
  if (!art || !win.requestAnimationFrame || !document.createElement("canvas").getContext) return;
  var mq = win.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  function still() {
    return (mq && mq.matches) || root.getAttribute("data-motion") === "off";
  }

  var EXT = 2.5; /* canvas half-size in portrait radii */
  var back,
    front,
    bg,
    fg,
    S = 0,
    dpr = 1,
    mobile = false,
    U = 1,
    C = 0;
  var col = [255, 210, 63],
    light = false,
    glow = null;
  var turns = 40,
    per = 14,
    NS = 0,
    coilP = null,
    proj = null;
  var pulses = [],
    arcs = [],
    nextArc = 1.2;
  var orbits = [
    { r: 2.02, ax: 1.25, ay: 0.3, n: 3, sp: 0.5, ph: 0 },
    { r: 1.9, ax: -1.1, ay: 1.4, n: 2, sp: -0.62, ph: 2 },
  ];
  var spin = 0,
    rx = 0.46,
    rz = 0.18,
    tx = 0,
    ty = 0,
    cx = 0,
    cy = 0;
  var hero = null,
    heroH = 1,
    lastY = 0,
    vel = 0,
    t = 0;
  var raf = 0,
    last = 0,
    running = false,
    visible = true,
    started = false;

  function rgba(a, w) {
    var r = col[0],
      g = col[1],
      b = col[2];
    if (w) {
      r += (255 - r) * w;
      g += (255 - g) * w;
      b += (255 - b) * w;
    }
    return (
      "rgba(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")"
    );
  }
  function readColour() {
    light = root.getAttribute("data-theme") === "light";
    var v = getComputedStyle(root).getPropertyValue("--accent").trim(),
      m;
    col = [255, 210, 63];
    if ((m = /^#([0-9a-f]{6})$/i.exec(v))) {
      var n = parseInt(m[1], 16);
      col = [n >> 16, (n >> 8) & 255, n & 255];
    } else if ((m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(v))) col = [+m[1], +m[2], +m[3]];
    if (light) col = [col[0] * 0.62, col[1] * 0.48, col[2] * 0.25];
    var s = 64,
      c = document.createElement("canvas");
    c.width = c.height = s;
    var g = c.getContext("2d"),
      gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, light ? rgba(0.8) : "rgba(255,250,235,1)");
    gr.addColorStop(0.2, rgba(0.65));
    gr.addColorStop(0.55, rgba(0.15));
    gr.addColorStop(1, rgba(0));
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    glow = c;
  }

  function build() {
    mobile = win.innerWidth < 760;
    turns = mobile ? 46 : 66;
    per = mobile ? 8 : 10;
    NS = turns * per;
    coilP = new Float32Array((NS + 1) * 3);
    proj = new Float32Array((NS + 1) * 3);
    for (var i = 0; i <= NS; i++) coilP[i * 3] = i / NS;
    pulses = [];
    for (i = 0; i < (mobile ? 3 : 4); i++) pulses.push({ u: i / (mobile ? 3 : 4), v: 0.11 + i * 0.012 });
  }

  function size() {
    var w = art.offsetWidth;
    if (!w) return;
    S = Math.round(w * EXT);
    dpr = Math.min(win.devicePixelRatio || 1, mobile ? 1.6 : 2);
    [back, front].forEach(function (c) {
      c.width = Math.round(S * dpr);
      c.height = Math.round(S * dpr);
    });
    U = w / 2;
    C = S / 2;
    hero = hero || document.querySelector(".hero");
    heroH = hero ? hero.offsetHeight : win.innerHeight;
  }

  /* rotate (spin about Y, tilt about X, then Z) and project with perspective */
  var sy = 0,
    cyy = 1,
    sx = 0,
    cxx = 1,
    sz = 0,
    czz = 1,
    R = 1.72,
    rm = 0.1;
  var o3 = [0, 0, 0];
  function p3(x, y, z, out) {
    var x1 = x * cyy + z * sy,
      z1 = -x * sy + z * cyy;
    var y2 = y * cxx - z1 * sx,
      z2 = y * sx + z1 * cxx;
    var x3 = x1 * czz - y2 * sz,
      y3 = x1 * sz + y2 * czz;
    var k = 5.2 / (5.2 - z2);
    out[0] = C + x3 * k * U;
    out[1] = C - y3 * k * U;
    out[2] = z2;
  }

  var Q = [],
    QB = 7;
  for (var qi = 0; qi < QB * 2; qi++) Q.push([]);

  function frame(dt) {
    var y = win.scrollY || 0,
      p = Math.max(0, Math.min(1, y / (heroH || 1)));
    vel += (Math.min(4, Math.abs(y - lastY) / Math.max(dt, 0.001) / 400) - vel) * Math.min(1, dt * 5);
    lastY = y;
    spin += dt * (0.32 + p * 1.6 + vel * 0.9);
    t += dt;
    cx += (tx - cx) * Math.min(1, dt * 3.5);
    cy += (ty - cy) * Math.min(1, dt * 3.5);
    rx = 0.46 + cy * 0.3 + p * 0.5;
    rz = 0.2 - cx * 0.32;
    sy = Math.sin(spin);
    cyy = Math.cos(spin);
    sx = Math.sin(rx);
    cxx = Math.cos(rx);
    sz = Math.sin(rz);
    czz = Math.cos(rz);
    R = 1.72 + p * 0.3 + 0.015 * Math.sin(t * 1.7);
    rm = 0.1 + p * 0.04;

    bg.setTransform(dpr, 0, 0, dpr, 0, 0);
    fg.setTransform(dpr, 0, 0, dpr, 0, 0);
    bg.clearRect(0, 0, S, S);
    fg.clearRect(0, 0, S, S);
    var mode = light ? "source-over" : "lighter";
    bg.globalCompositeOperation = fg.globalCompositeOperation = mode;
    bg.lineCap = fg.lineCap = "round";
    bg.lineJoin = fg.lineJoin = "round";

    /* core: guide rings of the toroid */
    var i, j, a, ctx;
    for (j = 0; j < 3; j++) {
      var rr = j === 0 ? R - rm : j === 1 ? R + rm : R,
        yy = j === 2 ? rm * 1.02 : 0;
      for (i = 0; i <= 64; i++) {
        a = (i / 64) * 6.2832;
        p3(rr * Math.cos(a), yy, rr * Math.sin(a), o3);
        proj[i * 3] = o3[0];
        proj[i * 3 + 1] = o3[1];
        proj[i * 3 + 2] = o3[2];
      }
      for (i = 0; i < 64; i++) {
        var zm = (proj[i * 3 + 2] + proj[i * 3 + 5]) / 2;
        ctx = zm < 0 ? bg : fg;
        ctx.strokeStyle = rgba(zm < 0 ? 0.12 : 0.26);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(proj[i * 3], proj[i * 3 + 1]);
        ctx.lineTo(proj[i * 3 + 3], proj[i * 3 + 4]);
        ctx.stroke();
      }
    }

    /* the winding: a helix wound round the toroid */
    for (i = 0; i < pulses.length; i++) pulses[i].u = (pulses[i].u + dt * pulses[i].v * (1 + vel * 0.6)) % 1;
    for (i = 0; i <= NS; i++) {
      var u = i / NS,
        th = u * 6.2832,
        ph = u * turns * 6.2832,
        r = R + rm * Math.cos(ph);
      p3(r * Math.cos(th), rm * Math.sin(ph), r * Math.sin(th), o3);
      proj[i * 3] = o3[0];
      proj[i * 3 + 1] = o3[1];
      proj[i * 3 + 2] = o3[2];
    }
    for (i = 0; i < Q.length; i++) Q[i].length = 0;
    for (i = 0; i < NS; i++) {
      var z = (proj[i * 3 + 2] + proj[i * 3 + 5]) / 2,
        uu = (i + 0.5) / NS,
        hot = 0;
      for (j = 0; j < pulses.length; j++) {
        var d = uu - pulses[j].u;
        if (d > 0.5) d -= 1;
        if (d < -0.5) d += 1;
        if (d < 0 && d > -0.06) hot = Math.max(hot, 1 + d / 0.06);
        else if (d >= 0 && d < 0.008) hot = 1;
      }
      var depth = Math.max(0, Math.min(1, (z + 1.6) / 3.2));
      var lev = Math.min(QB - 1, Math.floor((0.12 + depth * 0.38 + hot * 0.6) * QB));
      Q[(z < 0 ? 0 : QB) + lev].push(i);
    }
    for (var q = 0; q < Q.length; q++) {
      var L = Q[q];
      if (!L.length) continue;
      ctx = q < QB ? bg : fg;
      var lv = ((q % QB) + 0.5) / QB;
      ctx.beginPath();
      for (j = 0; j < L.length; j++) {
        i = L[j];
        ctx.moveTo(proj[i * 3], proj[i * 3 + 1]);
        ctx.lineTo(proj[i * 3 + 3], proj[i * 3 + 4]);
      }
      if (lv > 0.5 && !light) {
        ctx.lineWidth = mobile ? 4 : 5;
        ctx.strokeStyle = rgba((lv - 0.45) * 0.5);
        ctx.stroke();
      }
      ctx.lineWidth = lv > 0.6 ? 1.8 : 1.2;
      ctx.strokeStyle = rgba(0.15 + lv * 0.85, lv > 0.7 ? (lv - 0.7) * 2 : 0);
      ctx.stroke();
    }
    /* pulse heads */
    for (j = 0; j < pulses.length; j++) {
      i = Math.floor(pulses[j].u * NS);
      ctx = proj[i * 3 + 2] < 0 ? bg : fg;
      var gs = (proj[i * 3 + 2] < 0 ? 22 : 34) * (U / 110);
      ctx.drawImage(glow, proj[i * 3] - gs / 2, proj[i * 3 + 1] - gs / 2, gs, gs);
    }

    /* field rings with charges running round them */
    for (j = 0; j < orbits.length; j++) {
      var ob = orbits[j],
        orr = ob.r + p * 0.3,
        cA = Math.cos(ob.ax),
        sA = Math.sin(ob.ax),
        cB = Math.cos(ob.ay + t * 0.15),
        sB = Math.sin(ob.ay + t * 0.15);
      var prevx = 0,
        prevy = 0,
        prevz = 0;
      for (i = 0; i <= 72; i++) {
        a = (i / 72) * 6.2832;
        var ox = orr * Math.cos(a),
          oy = 0,
          oz = orr * Math.sin(a);
        var y1 = oy * cA - oz * sA,
          z1 = oy * sA + oz * cA;
        var x2 = ox * cB + z1 * sB,
          z2 = -ox * sB + z1 * cB;
        p3(x2, y1, z2, o3);
        if (i) {
          var zz = (o3[2] + prevz) / 2;
          ctx = zz < 0 ? bg : fg;
          if (i % 3 !== 0) {
            ctx.strokeStyle = rgba(zz < 0 ? 0.1 : 0.16);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(prevx, prevy);
            ctx.lineTo(o3[0], o3[1]);
            ctx.stroke();
          }
        }
        prevx = o3[0];
        prevy = o3[1];
        prevz = o3[2];
      }
      for (var e = 0; e < ob.n; e++) {
        for (var tr = 0; tr < 6; tr++) {
          a = t * ob.sp + (e / ob.n) * 6.2832 + ob.ph - tr * 0.05 * Math.sign(ob.sp);
          ox = orr * Math.cos(a);
          oz = orr * Math.sin(a);
          y1 = -oz * sA;
          z1 = oz * cA;
          x2 = ox * cB + z1 * sB;
          z2 = -ox * sB + z1 * cB;
          p3(x2, y1, z2, o3);
          ctx = o3[2] < 0 ? bg : fg;
          var es = (tr ? 9 - tr : 16) * (U / 110) * (o3[2] < 0 ? 0.7 : 1);
          ctx.globalAlpha = tr ? 0.5 - tr * 0.07 : 1;
          ctx.drawImage(glow, o3[0] - es / 2, o3[1] - es / 2, es, es);
        }
        ctx.globalAlpha = 1;
      }
    }

    /* arcs from the winding to the portrait's rim */
    nextArc -= dt * (1 + vel);
    if (nextArc <= 0) {
      var k = Math.floor(Math.random() * NS),
        tries = 0;
      while (proj[k * 3 + 2] < 0.05 && tries++ < 30) k = Math.floor(Math.random() * NS);
      arcs.push({ i: k, life: 0.22 + Math.random() * 0.25, t: 0 });
      nextArc = 0.5 + Math.random() * (mobile ? 1.6 : 1.1);
    }
    for (j = arcs.length - 1; j >= 0; j--) {
      var ar = arcs[j];
      ar.t += dt;
      if (ar.t > ar.life) {
        arcs.splice(j, 1);
        continue;
      }
      var ax0 = proj[ar.i * 3],
        ay0 = proj[ar.i * 3 + 1],
        ang = Math.atan2(ay0 - C, ax0 - C);
      var bx = C + Math.cos(ang) * U * 1.02,
        by = C + Math.sin(ang) * U * 1.02;
      bolt(fg, ax0, ay0, bx, by, (Math.random() < 0.3 ? 0.4 : 1) * (1 - ar.t / ar.life));
      var fs = 26 * (U / 110);
      fg.globalAlpha = 1 - ar.t / ar.life;
      fg.drawImage(glow, bx - fs / 2, by - fs / 2, fs, fs);
      fg.globalAlpha = 1;
    }
    bg.globalCompositeOperation = fg.globalCompositeOperation = "source-over";
  }

  function bolt(g, x0, y0, x1, y1, a) {
    var pts = [
        [x0, y0],
        [x1, y1],
      ],
      disp = Math.hypot(x1 - x0, y1 - y0) * 0.4,
      i;
    for (var lv = 0; lv < 3; lv++) {
      var nx = [];
      for (i = 0; i < pts.length - 1; i++) {
        var p = pts[i],
          q = pts[i + 1],
          dx = q[1] - p[1],
          dy = p[0] - q[0],
          l = Math.hypot(dx, dy) || 1,
          o = (Math.random() - 0.5) * disp;
        nx.push(p, [(p[0] + q[0]) / 2 + (dx / l) * o, (p[1] + q[1]) / 2 + (dy / l) * o]);
      }
      nx.push(pts[pts.length - 1]);
      pts = nx;
      disp *= 0.55;
    }
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.lineWidth = 4;
    g.strokeStyle = rgba(0.22 * a);
    g.stroke();
    g.lineWidth = 1.2;
    g.strokeStyle = rgba(0.95 * a, 0.6);
    g.stroke();
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (last && now - last < (mobile ? 31 : 15)) return;
    var dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    frame(dt);
  }
  function run() {
    if (running || !started) return;
    if (still()) {
      frame(0);
      return;
    }
    if (!visible || document.hidden) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function init() {
    if (started) return;
    started = true;
    back = document.createElement("canvas");
    front = document.createElement("canvas");
    back.className = "h3d h3d-back";
    front.className = "h3d h3d-front";
    back.setAttribute("aria-hidden", "true");
    front.setAttribute("aria-hidden", "true");
    bg = back.getContext("2d");
    fg = front.getContext("2d");
    if (!bg || !fg) return;
    readColour();
    build();
    art.insertBefore(back, art.firstChild);
    art.appendChild(front);
    size();
    lastY = win.scrollY || 0;
    art.classList.add("has-3d");
    requestAnimationFrame(function () {
      back.classList.add("on");
      front.classList.add("on");
    });
    run();

    if ("IntersectionObserver" in win)
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        visible ? run() : stop();
      }).observe(art);
    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : run();
    });
    var rt = 0,
      lw = win.innerWidth;
    win.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (win.innerWidth !== lw) {
          lw = win.innerWidth;
          build();
        }
        size();
        if (!running) run();
      }, 200);
    });
    win.addEventListener(
      "pointermove",
      function (e) {
        tx = Math.max(-1, Math.min(1, (e.clientX / win.innerWidth) * 2 - 1));
        ty = Math.max(-1, Math.min(1, (e.clientY / win.innerHeight) * 2 - 1));
      },
      { passive: true },
    );
    win.addEventListener(
      "deviceorientation",
      function (e) {
        if (e.gamma == null) return;
        tx = Math.max(-1, Math.min(1, e.gamma / 30));
        ty = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 30));
      },
      { passive: true },
    );
    new MutationObserver(function () {
      readColour();
      stop();
      run();
    }).observe(root, { attributes: true, attributeFilter: ["data-theme", "style", "data-motion"] });
    if (mq) {
      var onMq = function () {
        stop();
        run();
      };
      mq.addEventListener ? mq.addEventListener("change", onMq) : mq.addListener(onMq);
    }
  }

  /* starts after first paint: when the power-on intro closes the breaker, or once the page is idle */
  document.addEventListener("power:on", function () {
    setTimeout(init, 250);
  });
  if (win.__vsPowered) setTimeout(init, 250);
  function later() {
    if (root.classList.contains("pwr-run") && !win.__vsPowered) return;
    if (win.requestIdleCallback) requestIdleCallback(init, { timeout: 1500 });
    else setTimeout(init, 400);
  }
  if (document.readyState === "complete") later();
  else win.addEventListener("load", later);
})();
