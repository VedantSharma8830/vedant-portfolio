/*
 * Profile card: tap the hero photo and a gold-framed card flies out of it,
 * spins in over a starry sky, floats, flips to its emblem side and back.
 * Tap the card to flip it, drag to tilt it. Esc, the X or the sky closes it.
 * Reduced motion: it simply fades in, and flips without the spin.
 */
(function () {
  "use strict";
  var btn = document.getElementById("photoBtn"),
    box = document.getElementById("cardx");
  if (!btn || !box) return;
  var sky = document.getElementById("cardSky"),
    fly = document.getElementById("pcFly"),
    card = document.getElementById("pcard"),
    inner = document.getElementById("pcardIn"),
    close = document.getElementById("cardClose"),
    root = document.documentElement;
  var kb = false;
  document.addEventListener(
    "keydown",
    function () {
      kb = true;
    },
    true,
  );
  document.addEventListener(
    "pointerdown",
    function () {
      kb = false;
    },
    true,
  );
  var timers = [],
    flipped = false,
    open = false,
    raf = 0,
    stars = [],
    ctx = sky.getContext("2d");

  function motionOn() {
    return (
      root.getAttribute("data-motion") !== "off" &&
      !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)
    );
  }
  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  function setFlip(v) {
    flipped = v;
    inner.style.transform = "rotateY(" + (v ? 180 : 0) + "deg)";
    card.setAttribute("aria-pressed", v ? "true" : "false");
    card.classList.toggle("is-back", v);
  }

  /* ---- starry sky ---- */
  var W = 0,
    H = 0,
    dpr = 1;
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = sky.clientWidth;
    H = sky.clientHeight;
    sky.width = Math.round(W * dpr);
    sky.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.min(190, Math.round((W * H) / 5200));
    stars = [];
    for (var i = 0; i < n; i++) {
      var gold = Math.random() < 0.28;
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: gold ? 0.8 + Math.random() * 1.8 : 0.4 + Math.random() * 1.1,
        p: Math.random() * 6.28,
        s: 0.6 + Math.random() * 1.6,
        v: gold ? 0.08 + Math.random() * 0.25 : 0.02 + Math.random() * 0.06,
        g: gold,
      });
    }
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      if (t) {
        s.y -= s.v;
        if (s.y < -4) {
          s.y = H + 4;
          s.x = Math.random() * W;
        }
      }
      var a = 0.35 + 0.65 * Math.abs(Math.sin(s.p + (t || 0) * 0.0012 * s.s));
      ctx.globalAlpha = a;
      ctx.fillStyle = s.g ? "#f5cf6b" : "#dfe6ff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.283);
      ctx.fill();
      if (s.g && s.r > 1.7) {
        ctx.globalAlpha = a * 0.18;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3.2, 0, 6.283);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  function loop(t) {
    draw(t);
    raf = requestAnimationFrame(loop);
  }

  /* ---- tilt ---- */
  var drag = null;
  function tilt(x, y) {
    var r = card.getBoundingClientRect();
    var dx = (x - (r.left + r.width / 2)) / r.width,
      dy = (y - (r.top + r.height / 2)) / r.height;
    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));
    card.style.setProperty("--ry", (dx * 16).toFixed(2) + "deg");
    card.style.setProperty("--rx", (-dy * 12).toFixed(2) + "deg");
    card.style.setProperty("--sx", (50 + dx * 40).toFixed(1) + "%");
  }
  function untilt() {
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--sx", "50%");
  }
  box.addEventListener("pointermove", function (e) {
    if (!open || !motionOn()) return;
    if (e.pointerType === "mouse" || drag) tilt(e.clientX, e.clientY);
  });
  card.addEventListener("pointerdown", function (e) {
    drag = { x: e.clientX, y: e.clientY, moved: false };
  });
  box.addEventListener("pointerup", function () {
    if (drag && drag.moved) untilt();
    setTimeout(function () {
      drag = null;
    }, 0);
  });
  box.addEventListener("pointerleave", untilt);
  card.addEventListener(
    "pointermove",
    function (e) {
      if (drag && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 8) drag.moved = true;
    },
    { passive: true },
  );

  /* ---- open / close ---- */
  function fromPhoto() {
    var p = btn.getBoundingClientRect(),
      c = fly.getBoundingClientRect();
    if (!c.width) return null;
    var s = Math.max(0.18, Math.min(0.7, (p.width * 0.55) / c.width));
    return {
      x: p.left + p.width / 2 - (c.left + c.width / 2),
      y: p.top + p.height * 0.38 - (c.top + c.height / 2),
      s: s,
    };
  }
  function show() {
    if (open) return;
    open = true;
    clearTimers();
    box.hidden = false;
    document.body.classList.add("locked");
    btn.setAttribute("aria-expanded", "true");
    size();
    var anim = motionOn();
    inner.style.transition = "none";
    setFlip(false);
    untilt();
    void box.offsetWidth;
    box.classList.add("show");
    if (anim) {
      raf = requestAnimationFrame(loop);
      var f = fromPhoto();
      box.classList.add("flying");
      if (f && fly.animate) {
        fly.animate(
          [
            { transform: "translate(" + f.x + "px," + f.y + "px) scale(" + f.s + ")", opacity: 0.2 },
            { opacity: 1, offset: 0.25 },
            { transform: "none", opacity: 1 },
          ],
          { duration: 1150, easing: "cubic-bezier(.2,.85,.25,1)" },
        );
        inner.animate([{ transform: "rotateY(-540deg)" }, { transform: "rotateY(0deg)" }], {
          duration: 1250,
          easing: "cubic-bezier(.25,.8,.25,1)",
        });
      }
      later(function () {
        box.classList.remove("flying");
        inner.style.transition = "";
        box.classList.add("landed");
      }, 1260);
      later(function () {
        setFlip(true);
      }, 2500);
      later(function () {
        setFlip(false);
      }, 4700);
    } else {
      draw(0);
      inner.style.transition = "";
      box.classList.add("landed");
    }
    later(
      function () {
        card.focus({ preventScroll: true });
      },
      anim ? 400 : 0,
    );
  }
  function hide() {
    if (!open) return;
    open = false;
    clearTimers();
    var anim = motionOn();
    box.classList.remove("show", "landed");
    var done = function () {
      box.hidden = true;
      cancelAnimationFrame(raf);
      document.body.classList.remove("locked");
      btn.setAttribute("aria-expanded", "false");
      if (kb) btn.focus({ preventScroll: true });
      else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    };
    if (anim && fly.animate) {
      var f = fromPhoto();
      if (f)
        fly.animate(
          [
            { transform: "none", opacity: 1 },
            { transform: "translate(" + f.x + "px," + f.y + "px) scale(" + f.s + ")", opacity: 0 },
          ],
          { duration: 520, easing: "cubic-bezier(.55,0,.75,.2)", fill: "forwards" },
        ).onfinish = function (e) {
          done();
          try {
            e.target.cancel();
          } catch (x) {}
        };
      else setTimeout(done, 400);
    } else done();
  }
  btn.addEventListener("click", show);
  close.addEventListener("click", hide);
  box.addEventListener("click", function (e) {
    if (e.target === box || e.target === sky || e.target.classList.contains("cardx-stage")) hide();
  });
  function toggle() {
    if (drag && drag.moved) return;
    clearTimers();
    inner.style.transition = "";
    setFlip(!flipped);
  }
  card.addEventListener("click", toggle);
  card.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (!open) return;
    if (e.key === "Escape") hide();
    if (e.key === "Tab") {
      e.preventDefault();
      (document.activeElement === close ? card : close).focus();
    }
  });
  window.addEventListener("resize", function () {
    if (open) {
      size();
      if (!motionOn()) draw(0);
    }
  });
})();
