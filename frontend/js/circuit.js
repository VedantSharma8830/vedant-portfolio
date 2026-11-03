/*
 * Living circuit board behind the page: faint gold traces with solder pads
 * and a few IC footprints, current pulses running along them, sparks, a
 * three-phase waveform across the hero and a soft glow under the cursor.
 * One fixed canvas pair, no libraries. Static and faint for reduced motion.
 */
(function () {
  "use strict";
  var root = document.documentElement,
    win = window;
  if (!win.requestAnimationFrame || !document.createElement("canvas").getContext) return;

  var mqReduce = win.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  function still() {
    return (mqReduce && mqReduce.matches) || root.getAttribute("data-motion") === "off";
  }

  var wrap, base, fx, bctx, ctx, lens, lctx;
  var W = 0,
    VH = 0,
    dpr = 1,
    bdpr = 1,
    mobile = false;
  var cell = 26,
    cols = 0,
    rows = 0,
    tileH = 0;
  var traces = [],
    pads = [],
    chips = [],
    pulses = [],
    sparks = [];
  var col = { r: 255, g: 210, b: 63 },
    light = false;
  var off = 0,
    lastY = 0,
    boost = 0,
    raf = 0,
    last = 0,
    t = 0,
    running = false;
  var mouse = { x: -999, y: -999, tx: -999, ty: -999, on: false };
  var hero = null,
    heroBottom = 0;
  var TAIL = [];

  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function irnd(a, b) {
    return Math.floor(rnd(a, b + 1));
  }
  function rgba(a) {
    return "rgba(" + col.r + "," + col.g + "," + col.b + "," + a.toFixed(3) + ")";
  }

  /* ---------- colour: follows the accent and the theme ---------- */
  function readColour() {
    light = root.getAttribute("data-theme") === "light";
    var v = getComputedStyle(root).getPropertyValue("--accent").trim(),
      m,
      c = { r: 255, g: 210, b: 63 };
    if ((m = /^#([0-9a-f]{6})$/i.exec(v))) {
      var n = parseInt(m[1], 16);
      c = { r: n >> 16, g: (n >> 8) & 255, b: n & 255 };
    } else if ((m = /^#([0-9a-f]{3})$/i.exec(v))) {
      c = {
        r: parseInt(m[1][0] + m[1][0], 16),
        g: parseInt(m[1][1] + m[1][1], 16),
        b: parseInt(m[1][2] + m[1][2], 16),
      };
    } else if ((m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(v))) {
      c = { r: +m[1], g: +m[2], b: +m[3] };
    }
    if (light) {
      c = { r: Math.round(c.r * 0.62), g: Math.round(c.g * 0.5), b: Math.round(c.b * 0.3) };
    }
    col = c;
    TAIL = [];
    for (var i = 0; i < 10; i++) TAIL.push(rgba((light ? 0.5 : 0.75) * Math.pow((i + 1) / 10, 1.6)));
    glowSprite = makeGlow();
  }

  var glowSprite = null;
  function makeGlow() {
    var s = 64,
      c = document.createElement("canvas");
    c.width = c.height = s;
    var g = c.getContext("2d"),
      gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    var hot = light ? rgba(0.55) : "rgba(255,248,220,0.95)";
    gr.addColorStop(0, hot);
    gr.addColorStop(0.18, rgba(light ? 0.4 : 0.6));
    gr.addColorStop(0.5, rgba(light ? 0.1 : 0.16));
    gr.addColorStop(1, rgba(0));
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    return c;
  }

  /* ---------- layout of the board ---------- */
  var occ;
  var DX = [1, 1, 0, -1, -1, -1, 0, 1],
    DY = [0, 1, 1, 1, 0, -1, -1, -1];
  function free(x, y) {
    return x >= 0 && y >= 1 && x < cols && y < rows - 1 && !occ[y * cols + x];
  }
  function mark(x, y) {
    occ[y * cols + x] = 1;
  }
  function px(x) {
    return x * cell + cell / 2;
  }

  function route(x, y, d, minRun, maxLen) {
    var pts = [[x, y]],
      run = 0,
      len = 0,
      goal = irnd(Math.max(4, minRun + 2), maxLen);
    mark(x, y);
    while (len < goal) {
      var nd = d;
      if (run >= minRun && Math.random() < 0.2) {
        var turn = Math.random() < 0.5 ? 2 : -2;
        var diag = (d + turn / 2 + 8) % 8;
        var nx = x + DX[diag],
          ny = y + DY[diag];
        if (free(nx, ny)) {
          x = nx;
          y = ny;
          mark(x, y);
          pts.push([x, y]);
          d = (d + turn + 8) % 8;
          run = 0;
          len++;
          continue;
        }
      }
      nx = x + DX[nd];
      ny = y + DY[nd];
      if (!free(nx, ny)) break;
      x = nx;
      y = ny;
      mark(x, y);
      run++;
      len++;
      var p = pts[pts.length - 1];
      if (pts.length > 1) {
        var q = pts[pts.length - 2];
        if (Math.sign(p[0] - q[0]) === DX[nd] && Math.sign(p[1] - q[1]) === DY[nd]) {
          p[0] = x;
          p[1] = y;
          continue;
        }
      }
      pts.push([x, y]);
    }
    if (pts.length < 2) return null;
    var P = pts.map(function (p) {
        return [px(p[0]), px(p[1])];
      }),
      L = [0],
      minX = 1e9,
      maxX = -1e9,
      minY = 1e9,
      maxY = -1e9;
    for (var i = 0; i < P.length; i++) {
      if (i) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
      minX = Math.min(minX, P[i][0]);
      maxX = Math.max(maxX, P[i][0]);
      minY = Math.min(minY, P[i][1]);
      maxY = Math.max(maxY, P[i][1]);
    }
    if (L[L.length - 1] < cell * 3) return null;
    var tr = { p: P, l: L, len: L[L.length - 1], box: [minX, minY, maxX, maxY] };
    tr.a = { x: P[0][0], y: P[0][1], f: 0, pin: false };
    tr.b = { x: P[P.length - 1][0], y: P[P.length - 1][1], f: 0, pin: false };
    return tr;
  }

  function build() {
    var vw = win.innerWidth;
    mobile = vw < 760;
    cell = mobile ? 30 : 28;
    W = vw;
    VH = Math.max(win.innerHeight, (win.screen && screen.height) || 0, 480);
    if (VH > win.innerHeight * 1.4) VH = Math.round(win.innerHeight * 1.25);
    cols = Math.ceil(W / cell) + 1;
    rows = Math.ceil((VH + cell * 2) / cell);
    tileH = rows * cell;
    occ = new Uint8Array(cols * rows);
    traces = [];
    chips = [];
    pads = [];

    /* IC footprints near the edges, traces fan out of their pins */
    var nChips = mobile ? 2 : 4;
    for (var c = 0; c < nChips; c++) {
      var cw = irnd(3, 5),
        ch = irnd(2, 4),
        side = c % 2,
        cx = side ? irnd(cols - cw - (mobile ? 3 : 8), cols - cw - 2) : irnd(2, mobile ? 3 : 7),
        cy = Math.round(((c + 0.5) / nChips) * (rows - ch - 4)) + irnd(1, 3);
      var ok = true;
      for (var yy = cy - 1; yy <= cy + ch; yy++)
        for (var xx = cx - 1; xx <= cx + cw; xx++) if (!free(xx, yy)) ok = false;
      if (!ok) continue;
      for (yy = cy - 1; yy <= cy + ch; yy++) for (xx = cx - 1; xx <= cx + cw; xx++) mark(xx, yy);
      chips.push({ x: cx * cell, y: cy * cell, w: cw * cell, h: ch * cell });
      var pins = [];
      for (xx = cx; xx < cx + cw; xx++) {
        pins.push([xx, cy - 1, 6]);
        pins.push([xx, cy + ch, 2]);
      }
      for (yy = cy; yy < cy + ch; yy++) {
        pins.push([cx - 1, yy, 4]);
        pins.push([cx + cw, yy, 0]);
      }
      pins.forEach(function (p) {
        occ[p[1] * cols + p[0]] = 0;
        if (Math.random() < 0.72) {
          var tr = route(p[0], p[1], p[2], 2, mobile ? 14 : 22);
          if (tr) {
            tr.a.pin = true;
            traces.push(tr);
          } else mark(p[0], p[1]);
        } else mark(p[0], p[1]);
      });
    }
    /* free traces across the board */
    var want = mobile ? 34 : 70,
      tries = 0;
    while (traces.length < want && tries++ < want * 12) {
      var x = irnd(0, cols - 1),
        y = irnd(1, rows - 2);
      if (!free(x, y)) continue;
      var d = Math.random() < 0.6 ? (Math.random() < 0.5 ? 0 : 4) : Math.random() < 0.5 ? 2 : 6;
      var tr = route(x, y, d, 2, mobile ? 16 : 26);
      if (tr) traces.push(tr);
    }
    traces.forEach(function (tr) {
      if (!tr.a.pin) pads.push(tr.a);
      pads.push(tr.b);
    });
    drawBase();
    seed();
  }

  /* how strongly a point shows: softer behind the reading column */
  function mask(x) {
    if (mobile) return 0.8;
    var u = Math.abs(x - W / 2) / (W / 2);
    u = Math.min(1, Math.max(0, (u - 0.25) / 0.55));
    return 0.42 + 0.58 * u * u * (3 - 2 * u);
  }

  function pathOf(g, tr) {
    g.beginPath();
    g.moveTo(tr.p[0][0], tr.p[0][1]);
    for (var i = 1; i < tr.p.length; i++) g.lineTo(tr.p[i][0], tr.p[i][1]);
  }

  function drawBoard(g, k) {
    g.lineCap = "round";
    g.lineJoin = "round";
    g.lineWidth = 1.15;
    g.strokeStyle = rgba(k);
    traces.forEach(function (tr) {
      pathOf(g, tr);
      g.stroke();
    });
    pads.forEach(function (p) {
      g.beginPath();
      g.arc(p.x, p.y, 3.1, 0, 6.2832);
      g.stroke();
    });
    g.fillStyle = rgba(k * 0.9);
    traces.forEach(function (tr) {
      if (tr.a.pin) {
        g.fillRect(tr.a.x - 2.5, tr.a.y - 2.5, 5, 5);
      }
    });
    chips.forEach(function (c) {
      var r = 5;
      g.beginPath();
      g.moveTo(c.x + r, c.y);
      g.arcTo(c.x + c.w, c.y, c.x + c.w, c.y + c.h, r);
      g.arcTo(c.x + c.w, c.y + c.h, c.x, c.y + c.h, r);
      g.arcTo(c.x, c.y + c.h, c.x, c.y, r);
      g.arcTo(c.x, c.y, c.x + c.w, c.y, r);
      g.closePath();
      g.fillStyle = rgba(k * 0.25);
      g.fill();
      g.stroke();
      g.beginPath();
      g.arc(c.x + 8, c.y + 8, 2, 0, 6.2832);
      g.fillStyle = rgba(k);
      g.fill();
    });
  }

  function drawBase() {
    bdpr = Math.min(win.devicePixelRatio || 1, mobile ? 2 : 1.5);
    base.width = Math.round(W * bdpr);
    base.height = Math.round(tileH * 2 * bdpr);
    base.style.width = W + "px";
    base.style.height = tileH * 2 + "px";
    bctx.setTransform(bdpr, 0, 0, bdpr, 0, 0);
    bctx.clearRect(0, 0, W, tileH * 2);
    var k = light ? 0.2 : 0.13;
    drawBoard(bctx, k);
    bctx.translate(0, tileH);
    drawBoard(bctx, k);
    bctx.setTransform(bdpr, 0, 0, bdpr, 0, 0);
    /* fade the board behind the reading column */
    bctx.globalCompositeOperation = "destination-in";
    var gr = bctx.createLinearGradient(0, 0, W, 0);
    for (var i = 0; i <= 10; i++)
      gr.addColorStop(i / 10, "rgba(0,0,0," + mask((i / 10) * W).toFixed(3) + ")");
    bctx.fillStyle = gr;
    bctx.fillRect(0, 0, W, tileH * 2);
    bctx.globalCompositeOperation = "source-over";
  }

  /* ---------- moving parts ---------- */
  function newPulse(p, delay) {
    var tr = traces[irnd(0, traces.length - 1)];
    p.tr = tr;
    p.dir = tr.a.pin ? 1 : Math.random() < 0.5 ? 1 : -1;
    p.s = 0;
    p.v = rnd(70, 140);
    p.tail = rnd(50, 110);
    p.wait = delay == null ? rnd(0.2, 2.6) : delay;
    return p;
  }
  function seed() {
    pulses = [];
    sparks = [];
    if (!traces.length) return;
    var n = mobile ? 7 : 16;
    for (var i = 0; i < n; i++) pulses.push(newPulse({}, rnd(0, 3)));
    var m = mobile ? 5 : 12;
    for (i = 0; i < m; i++)
      sparks.push({ x: rnd(0, W), y: rnd(0, VH), v: rnd(6, 16), a: rnd(0, 6.28), r: rnd(0.6, 1.4) });
  }

  function at(tr, s, out) {
    var L = tr.l,
      i = 1;
    if (s <= 0) {
      out[0] = tr.p[0][0];
      out[1] = tr.p[0][1];
      return;
    }
    while (i < L.length - 1 && L[i] < s) i++;
    var a = tr.p[i - 1],
      b = tr.p[i],
      u = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
    if (u > 1) u = 1;
    out[0] = a[0] + (b[0] - a[0]) * u;
    out[1] = a[1] + (b[1] - a[1]) * u;
  }

  var P0 = [0, 0],
    P1 = [0, 0];
  function drawPulse(p, dy) {
    var tr = p.tr,
      head = p.dir > 0 ? p.s : tr.len - p.s,
      seg = p.tail / 10;
    if (tr.box[3] + dy < -40 || tr.box[1] + dy > VH + 40) return;
    at(tr, head, P1);
    var m = mask(P1[0]);
    ctx.globalAlpha = m;
    ctx.lineWidth = 1.7;
    for (var i = 9; i >= 0; i--) {
      var s0 = head - p.dir * seg * (10 - i),
        s1 = head - p.dir * seg * (9 - i);
      if ((s0 < 0 && s1 <= 0) || (s0 > tr.len && s1 >= tr.len)) continue;
      at(tr, Math.max(0, Math.min(tr.len, s0)), P0);
      at(tr, Math.max(0, Math.min(tr.len, s1)), P1);
      ctx.strokeStyle = TAIL[i];
      ctx.beginPath();
      ctx.moveTo(P0[0], P0[1] + dy);
      ctx.lineTo(P1[0], P1[1] + dy);
      ctx.stroke();
    }
    at(tr, Math.max(0, Math.min(tr.len, head)), P1);
    ctx.globalAlpha = m * (light ? 0.45 : 0.85);
    ctx.drawImage(glowSprite, P1[0] - 12, P1[1] + dy - 12, 24, 24);
    ctx.globalAlpha = 1;
  }

  function drawFlash(pd, dy) {
    var y = pd.y + dy;
    if (y < -30 || y > VH + 30) return;
    var a = pd.f * mask(pd.x),
      s = 22 + 30 * pd.f;
    ctx.globalAlpha = a * (light ? 0.3 : 0.9);
    ctx.drawImage(glowSprite, pd.x - s / 2, y - s / 2, s, s);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = rgba(0.55 * a);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(pd.x, y, 3.1, 0, 6.2832);
    ctx.stroke();
  }

  /* three-phase waveform drifting across the hero */
  function drawWave() {
    var y0 = heroBottom - (mobile ? 46 : 70) - (win.scrollY || 0);
    if (y0 < -60 || y0 > VH + 60) return;
    var fade = Math.max(0, 1 - (win.scrollY || 0) / (VH * 0.9));
    if (fade <= 0) return;
    var amp = mobile ? 14 : 22,
      lam = mobile ? 260 : 480,
      step = mobile ? 8 : 10;
    ctx.lineWidth = 1.1;
    for (var ph = 0; ph < 3; ph++) {
      ctx.strokeStyle = rgba((light ? 0.22 : 0.2) * fade * (ph ? 0.6 : 1));
      ctx.beginPath();
      for (var x = 0; x <= W + step; x += step) {
        var y = y0 + amp * Math.sin((x / lam) * 6.2832 - t * 1.1 + ph * 2.0944);
        if (x) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  }

  function drawLens(dy) {
    if (!mouse.on || mobile) return;
    var R = 170,
      S = R * 2,
      mx = mouse.x,
      my = mouse.y;
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lctx.globalCompositeOperation = "source-over";
    lctx.clearRect(0, 0, S, S);
    lctx.lineWidth = 1.3;
    lctx.lineCap = lctx.lineJoin = "round";
    lctx.strokeStyle = rgba(light ? 0.45 : 0.42);
    for (var k = 0; k < 2; k++) {
      var oy = dy[k];
      for (var i = 0; i < traces.length; i++) {
        var b = traces[i].box;
        if (b[2] < mx - R || b[0] > mx + R || b[3] + oy < my - R || b[1] + oy > my + R) continue;
        lctx.save();
        lctx.translate(R - mx, R - my + oy);
        pathOf(lctx, traces[i]);
        lctx.restore();
        lctx.stroke();
      }
    }
    lctx.globalCompositeOperation = "destination-in";
    var g = lctx.createRadialGradient(R, R, 0, R, R, R);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    lctx.fillStyle = g;
    lctx.fillRect(0, 0, S, S);
    ctx.drawImage(lens, mx - R, my - R, S, S);
    ctx.globalAlpha = light ? 0.12 : 0.1;
    ctx.drawImage(glowSprite, mx - R, my - R, S, S);
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    var minDt = mobile ? 31 : 22;
    if (last && now - last < minDt) return;
    var dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    t += dt;

    var y = win.scrollY || 0,
      vy = Math.abs(y - lastY) / dt;
    lastY = y;
    boost += (Math.min(5, vy / 260) - boost) * Math.min(1, dt * (vy > 1 ? 6 : 2.2));
    var o = Math.round(((y * 0.3) % tileH) * 2) / 2;
    if (o !== off) {
      off = o;
      base.style.transform = "translate3d(0," + -off + "px,0)";
    }

    var sp = 1 + boost;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, VH);
    ctx.globalCompositeOperation = light ? "source-over" : "lighter";
    ctx.lineCap = "round";

    var dys = [-off, tileH - off];
    for (var i = 0; i < pads.length; i++) {
      var pd = pads[i];
      if (pd.f > 0) {
        pd.f = Math.max(0, pd.f - dt * 1.4);
        drawFlash(pd, dys[0]);
        drawFlash(pd, dys[1]);
      }
    }
    for (i = 0; i < pulses.length; i++) {
      var p = pulses[i];
      if (p.wait > 0) {
        p.wait -= dt * sp;
        continue;
      }
      p.s += p.v * sp * dt;
      if (p.s - p.tail > p.tr.len) {
        (p.dir > 0 ? p.tr.b : p.tr.a).f = 1;
        newPulse(p);
        continue;
      }
      drawPulse(p, dys[0]);
      drawPulse(p, dys[1]);
    }
    for (i = 0; i < sparks.length; i++) {
      var s = sparks[i];
      s.y -= s.v * dt * (1 + boost * 0.6);
      s.a += dt * 0.8;
      if (s.y < -10) {
        s.y = VH + 10;
        s.x = rnd(0, W);
      }
      var sx = s.x + Math.sin(s.a) * 12,
        tw = 0.35 + 0.35 * Math.sin(s.a * 2.3);
      ctx.globalAlpha = tw * mask(sx) * (light ? 0.3 : 0.7);
      ctx.drawImage(glowSprite, sx - 6 * s.r, s.y - 6 * s.r, 12 * s.r, 12 * s.r);
    }
    ctx.globalAlpha = 1;
    drawWave();
    if (mouse.on) {
      mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 9);
      mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 9);
      drawLens(dys);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function sizeFx() {
    dpr = Math.min(win.devicePixelRatio || 1, 2);
    fx.width = Math.round(W * dpr);
    fx.height = Math.round(VH * dpr);
    fx.style.width = W + "px";
    fx.style.height = VH + "px";
    lens.width = lens.height = Math.round(340 * dpr);
  }

  function start() {
    if (running) return;
    if (still() || document.hidden) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, fx.width, fx.height);
      base.style.transform = "";
      off = 0;
      return;
    }
    running = true;
    last = 0;
    lastY = win.scrollY || 0;
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }
  function restart() {
    stop();
    start();
  }

  function measureHero() {
    hero = hero || document.querySelector(".hero");
    heroBottom = hero ? hero.getBoundingClientRect().bottom + (win.scrollY || 0) : VH;
  }

  var lastW = 0,
    lastH = 0,
    rt = 0;
  function onResize() {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var w = win.innerWidth,
        h = win.innerHeight;
      measureHero();
      if (w === lastW && Math.abs(h - lastH) < lastH * 0.25 && h <= VH) return;
      lastW = w;
      lastH = h;
      build();
      sizeFx();
      if (!running) start();
    }, 180);
  }

  function init() {
    wrap = document.createElement("div");
    wrap.className = "circuit";
    wrap.setAttribute("aria-hidden", "true");
    base = document.createElement("canvas");
    fx = document.createElement("canvas");
    base.className = "cb-base";
    fx.className = "cb-fx";
    wrap.appendChild(base);
    wrap.appendChild(fx);
    lens = document.createElement("canvas");
    bctx = base.getContext("2d");
    ctx = fx.getContext("2d");
    lctx = lens.getContext("2d");
    if (!bctx || !ctx || !lctx) return;
    readColour();
    lastW = win.innerWidth;
    lastH = win.innerHeight;
    build();
    sizeFx();
    measureHero();
    document.body.insertBefore(wrap, document.body.firstChild);
    requestAnimationFrame(function () {
      wrap.classList.add("on");
    });
    start();

    win.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : start();
    });
    if (mqReduce) {
      var onMq = function () {
        restart();
      };
      mqReduce.addEventListener ? mqReduce.addEventListener("change", onMq) : mqReduce.addListener(onMq);
    }
    win.addEventListener(
      "pointermove",
      function (e) {
        if (e.pointerType !== "mouse") return;
        if (!mouse.on) {
          mouse.x = e.clientX;
          mouse.y = e.clientY;
        }
        mouse.on = true;
        mouse.tx = e.clientX;
        mouse.ty = e.clientY;
      },
      { passive: true },
    );
    document.addEventListener("mouseleave", function () {
      mouse.on = false;
    });
    new MutationObserver(function () {
      var wasLight = light,
        was = col.r + "," + col.g + "," + col.b;
      readColour();
      if (wasLight !== light || was !== col.r + "," + col.g + "," + col.b) drawBase();
      restart();
    }).observe(root, { attributes: true, attributeFilter: ["data-theme", "style", "data-motion"] });
    setTimeout(measureHero, 1500);
  }

  function later() {
    if (win.requestIdleCallback) requestIdleCallback(init, { timeout: 1200 });
    else setTimeout(init, 300);
  }
  if (document.readyState === "complete") later();
  else win.addEventListener("load", later);
})();
