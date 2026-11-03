/*
 * The four About panels: a living backdrop behind each one (the deep sea,
 * space, waves at sunset, the jungle) and small animated icons for the
 * cards and lists. Pure SVG + CSS; it all stops when the panel closes
 * because the panel is display:none then.
 */
(function () {
  "use strict";

  /* the site draws every svg path/circle as a line icon; keep scene colours inline */
  function fix(svg) {
    return svg.replace(/<(path|circle)\b([^>]*?)(\/?)>/g, function (m, tag, attrs, close) {
      var st = "";
      attrs = attrs.replace(
        /\s(fill|stroke|stroke-width|stroke-linecap|stroke-opacity|fill-opacity)="([^"]*)"/g,
        function (a, k, v) {
          st += k + ":" + v + ";";
          return "";
        },
      );
      if (st) attrs += ' style="' + st + '"';
      return "<" + tag + attrs + close + ">";
    });
  }
  function rep(n, f) {
    var s = "";
    for (var i = 0; i < n; i++) s += f(i);
    return s;
  }
  function svg(cls, vb, body, par) {
    return (
      '<svg class="' +
      cls +
      '" viewBox="' +
      vb +
      '"' +
      (par ? ' preserveAspectRatio="' + par + '"' : "") +
      ' aria-hidden="true" focusable="false">' +
      fix(body) +
      "</svg>"
    );
  }
  // bubbles / fireflies: spans with their own position, size and timing
  function dots(cls, n, seed) {
    return rep(n, function (i) {
      var k = i * 37 + seed;
      return (
        '<i class="' +
        cls +
        '" style="left:' +
        ((k * 7) % 96) +
        "%;--s:" +
        (6 + ((k * 5) % 12)) +
        "px;--y:" +
        (8 + ((k * 11) % 70)) +
        "%;animation-delay:-" +
        ((k * 0.61) % 9).toFixed(2) +
        "s;animation-duration:" +
        (7 + ((k * 0.9) % 6)).toFixed(2) +
        's"></i>'
      );
    });
  }
  function wave(y, amp, fill) {
    // two identical periods side by side so a -50% slide loops seamlessly
    var d = "M0 " + y;
    for (var i = 0; i < 8; i++) d += " q25 " + -amp + " 50 0 t50 0";
    return '<path d="' + d + ' V120 H0z" fill="' + fill + '"/>';
  }
  function mane() {
    var p = "",
      n = 22;
    for (var i = 0; i <= n * 2; i++) {
      var a = (i / (n * 2)) * Math.PI * 2,
        r = i % 2 ? 31 : 40;
      p +=
        (i ? "L" : "M") +
        (100 + Math.cos(a) * r).toFixed(1) +
        " " +
        (196 + Math.sin(a) * r * 0.95).toFixed(1);
    }
    return p + "Z";
  }
  function weed(x, h, c) {
    return (
      '<path d="M' +
      x +
      " 120 q-8 -" +
      h / 2 +
      " 0 -" +
      h +
      '" stroke="' +
      c +
      '" stroke-width="4" fill="none" stroke-linecap="round" vector-effect="non-scaling-stroke"/>'
    );
  }
  function vine(flip) {
    return svg(
      "rs-vine" + (flip ? " rs-vine-r" : ""),
      "0 0 60 220",
      '<path d="M30 0q-14 60 4 120t-6 96" stroke="#14532d" stroke-width="3.5" fill="none"/>' +
        rep(7, function (i) {
          var y = 22 + i * 28,
            x = 30 + (i % 2 ? -10 : 10) + (i > 3 ? -4 : 0);
          return (
            '<ellipse cx="' +
            x +
            '" cy="' +
            y +
            '" rx="11" ry="4.5" fill="#1f7a3e" transform="rotate(' +
            (i % 2 ? 30 : -30) +
            " " +
            x +
            " " +
            y +
            ')"/>'
          );
        }),
    );
  }

  var SCENES = {
    about: function () {
      return (
        '<div class="rs-tint"></div>' +
        rep(4, function (i) {
          return (
            '<i class="rs-ray" style="left:' + (8 + i * 24) + "%;animation-delay:-" + i * 2.3 + 's"></i>'
          );
        }) +
        '<div class="rs-whale rs-whale-far">' +
        (window.__vsWhale ? window.__vsWhale() : "") +
        "</div>" +
        '<div class="rs-whale">' +
        (window.__vsWhale ? window.__vsWhale() : "") +
        "</div>" +
        dots("rs-bub", 12, 3) +
        svg(
          "rs-floor",
          "0 0 400 120",
          '<path d="M0 84q60-22 120-6t130-10 150 8V120H0z" fill="#06173f" fill-opacity=".55"/>' +
            '<g class="rs-weed">' +
            weed(28, 70, "#1aa68a") +
            weed(40, 50, "#138a73") +
            "</g>" +
            '<g class="rs-weed rs-weed2">' +
            weed(352, 80, "#1aa68a") +
            weed(366, 56, "#138a73") +
            weed(378, 66, "#1aa68a") +
            "</g>",
          "none",
        )
      );
    },
    skills: function () {
      return (
        svg(
          "rs-stars",
          "0 0 400 400",
          rep(3, function (g) {
            return (
              '<g class="rs-tw rs-tw' +
              g +
              '">' +
              rep(16, function (i) {
                var k = i * 3 + g;
                return (
                  '<circle cx="' +
                  ((k * 71 + 13) % 400) +
                  '" cy="' +
                  ((k * 113 + 41) % 400) +
                  '" r="' +
                  (0.4 + ((k * 7) % 5) * 0.16).toFixed(2) +
                  '" fill="#fff"/>'
                );
              }) +
              "</g>"
            );
          }),
          "xMidYMid slice",
        ) +
        '<i class="rs-shoot"></i><i class="rs-shoot rs-shoot2"></i>' +
        '<div class="rs-planet">' +
        svg(
          "",
          "0 0 200 200",
          '<defs><radialGradient id="rsPl" cx=".35" cy=".3"><stop offset="0" stop-color="#ffe29a"/><stop offset=".6" stop-color="#e0902f"/><stop offset="1" stop-color="#7a3a12"/></radialGradient></defs>' +
            '<circle cx="100" cy="100" r="78" stroke="#ffd98a" stroke-opacity=".35" stroke-width="1" fill="none" class="rs-orbit"/>' +
            '<g class="rs-sat"><circle cx="100" cy="22" r="4" fill="#cfe6ff"/></g>' +
            '<circle cx="100" cy="100" r="40" fill="url(#rsPl)"/>' +
            '<path d="M64 92q36 8 72-2M62 108q38 8 76-2" stroke="#7a3a12" stroke-opacity=".35" stroke-width="5" fill="none"/>' +
            '<path d="M38 116c20-14 104-46 124-32" stroke="#ffd98a" stroke-opacity=".8" stroke-width="5" fill="none" stroke-linecap="round"/>',
        ) +
        "</div>" +
        '<div class="rs-rocket">' +
        svg(
          "",
          "-30 -50 60 130",
          '<path class="rs-flame" d="M-8 26q8 40 8 48 0-8 8-48z" fill="#ffb52e"/>' +
            '<path d="M-12 10l-11 18h11zM12 10l11 18H12z" fill="#e0482e"/>' +
            '<path d="M0-46c14 13 16 42 12 60h-24c-4-18-2-47 12-60z" fill="#eef1f8"/>' +
            '<path d="M0-46c6 6 9 12 10 18h-20c1-6 4-12 10-18z" fill="#e0482e"/>' +
            '<circle cy="-8" r="6" fill="#1d3a6e" stroke="#ffd23f" stroke-width="2"/>',
        ) +
        "</div>" +
        svg(
          "rs-moon",
          "0 0 400 80",
          '<path d="M0 60q100-34 200-20t200-6V80H0z" fill="#0b1226" fill-opacity=".6"/>',
          "none",
        )
      );
    },
    training: function () {
      return (
        '<div class="rs-glow"></div>' +
        '<i class="rs-sun"></i>' +
        rep(3, function (i) {
          return (
            '<div class="rs-gull" style="--t:' +
            (14 + i * 9) +
            "%;animation-delay:-" +
            i * 6 +
            "s;animation-duration:" +
            (18 + i * 5) +
            's">' +
            svg(
              "",
              "0 0 40 16",
              '<path d="M2 12q9-12 18 0q9-12 18 0" stroke="#2a1a3a" stroke-opacity=".7" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
            ) +
            "</div>"
          );
        }) +
        rep(2, function (i) {
          return (
            '<div class="rs-fish" style="left:' +
            (22 + i * 46) +
            "%;animation-delay:-" +
            i * 2.6 +
            's">' +
            svg(
              "",
              "0 0 40 16",
              '<path d="M2 8c10-8 24-8 30 0-6 8-20 8-30 0zM30 8l9-7v14z" fill="#ffd23f"/>',
            ) +
            "</div>"
          );
        }) +
        '<div class="rs-sea">' +
        rep(3, function (i) {
          var c = ["#2a8fc4", "#1b6b9c", "#0e4670"][i];
          return (
            '<div class="rs-wv rs-wv' +
            i +
            '">' +
            svg("", "0 0 800 120", wave(30 + i * 16, 12 - i * 2, c), "none") +
            "</div>"
          );
        }) +
        "</div>"
      );
    },
    strengths: function () {
      return (
        '<div class="rs-shade"></div>' +
        vine(false) +
        vine(true) +
        '<i class="rs-vine-s"></i>' +
        dots("rs-ff", 12, 5) +
        '<div class="rs-lion">' +
        svg(
          "",
          "46 140 130 158",
          '<path class="rs-ltail" d="M138 270q34-6 28-38" stroke="#c97a26" stroke-width="6" fill="none" stroke-linecap="round"/>' +
            '<ellipse cx="114" cy="268" rx="42" ry="27" fill="#d9952f"/>' +
            '<g class="rs-head"><path d="' +
            mane() +
            '" fill="#9a4f17"/>' +
            '<circle cx="78" cy="168" r="9" fill="#d9952f"/><circle cx="122" cy="168" r="9" fill="#d9952f"/>' +
            '<circle cx="100" cy="198" r="27" fill="#eab04a"/>' +
            '<g class="rs-eyes"><circle cx="90" cy="192" r="3.6" fill="#1b1206"/><circle cx="110" cy="192" r="3.6" fill="#1b1206"/></g>' +
            '<path d="M95 204h10l-5 6z" fill="#3a1f0c"/><path d="M100 210q-4 6-8 3M100 210q4 6 8 3" stroke="#3a1f0c" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>',
        ) +
        "</div>" +
        svg(
          "rs-bush",
          "0 0 400 120",
          '<path d="M0 120V70q20-34 50-20 18-30 52-12 26-22 50 4 30-18 50 10 28-24 58-2 26-26 56 0 34-20 50 8 20-10 34 6V120z" fill="#123d22" fill-opacity=".7"/>',
          "none",
        )
      );
    },
  };

  function scene(id) {
    var f = SCENES[id];
    return f ? '<div class="rs rs-' + id + '" aria-hidden="true">' + f() + "</div>" : "";
  }

  /* ---------- small animated icons ---------- */
  var I = {
    bulb: '<circle class="i-glow" cx="12" cy="10" r="5" fill="#fff" fill-opacity=".25" stroke="none"/><path d="M9 18h6M10 21h4M12 4a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 4z"/><g class="i-rays"><path d="M12 1v1M3.5 4.5l.8.8M20.5 4.5l-.8.8M1 11h1.2M21.8 11H23"/></g>',
    people:
      '<g class="i-p1"><circle cx="8" cy="8" r="3"/><path d="M2.5 20c0-3.5 2.5-6 5.5-6s5.5 2.5 5.5 6"/></g><g class="i-p2"><circle cx="16.5" cy="9" r="2.6"/><path d="M14.5 14.4c.6-.3 1.3-.4 2-.4 2.8 0 5 2.4 5 5.6"/></g><g class="i-talk"><path d="M17 2.5h.01M19.5 2.5h.01M22 2.5h.01"/></g>',
    clock:
      '<circle cx="12" cy="12" r="9.5"/><g class="i-hand"><path d="M12 12V5.5"/></g><g class="i-hand2"><path d="M12 12l3.5 2"/></g><path d="M12 2.5v1.5M21.5 12H20M12 21.5V20M2.5 12H4"/>',
    cycle:
      '<g class="i-spin"><path d="M20 11a8 8 0 0 0-14.3-4.3L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.3L20 15"/><path d="M20 20v-5h-5"/></g>',
    bolt: '<path class="i-zap" d="M13 2L4.5 13.5h6.5L10 22l9-12h-6.5z"/><g class="i-spark"><path d="M20 3l1.5-1.5M21 7h1.5M2.5 19L1 20.5"/></g>',
    wrench:
      '<g class="i-swing"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/></g>',
    gear: '<g class="i-turn"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/><circle cx="12" cy="12" r="6.6"/></g>',
    screen:
      '<path d="M3 4.5h18v12H3zM9 20.5h6M12 16.5v4"/><path class="i-code" d="M6 8.5h6M6 11.5h8"/><path class="i-cur" d="M16 10v3.5"/>',
    chat: '<g class="i-b1"><path d="M3 5.5h11v7H8l-3 3v-3H3z"/></g><g class="i-b2"><path d="M10 14.5v2h6l3 3v-3h2v-7h-4"/></g>',
    flag: '<path d="M5 22V3"/><g class="i-wave"><path d="M5 4c3-1.5 5 1.5 8 0s5 1 6 0v8c-1 1-3-1.5-6 0s-5-1.5-8 0"/></g>',
    pin: '<g class="i-hop"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></g><path class="i-shadow" d="M9 22.5h6"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/><g class="i-tassel"><path d="M21 9.5v6"/><circle cx="21" cy="16.5" r=".9"/></g>',
    coil: '<path d="M2 12h3"/><path class="i-flow" d="M5 12c0-4 3-4 3 0s3 4 3 0 3-4 3 0 3 4 3 0"/><path d="M17 12h5"/>',
    scan: '<g class="i-look"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20"/></g>',
    shield:
      '<g class="i-beat"><path d="M12 2.5l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></g>',
    leaf: '<g class="i-sway"><path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z"/><path d="M5 19c3-5 7-8 11-10"/></g>',
  };
  var PICK = [
    [/problem/i, "bulb"],
    [/team|communicat/i, "people"],
    [/\btime\b/i, "clock"],
    [/adapt/i, "cycle"],
    [/software|ms word|matlab/i, "screen"],
    [/language|fluent/i, "chat"],
    [/nationality/i, "flag"],
    [/based|location/i, "pin"],
    [/diploma|degree/i, "cap"],
    [/winding|construction/i, "coil"],
    [/fault|inspect|test/i, "scan"],
    [/safety/i, "shield"],
    [/preventive|reliab/i, "gear"],
    [/core|fundamental|foundation|subject/i, "bolt"],
    [/practical|repair|maintenance|training/i, "wrench"],
    [/project|efficien|energy/i, "leaf"],
  ];
  function icon(text) {
    for (var i = 0; i < PICK.length; i++)
      if (PICK[i][0].test(text))
        return (
          '<span class="ricon ri-' +
          PICK[i][1] +
          '" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">' +
          fix(I[PICK[i][1]]) +
          "</svg></span>"
        );
    return "";
  }

  /* icons + an entrance order for everything in a freshly filled panel */
  function decorate(body) {
    var q = function (s) {
      return Array.prototype.slice.call(body.querySelectorAll(s));
    };
    q(".rcard").forEach(function (c) {
      var h = c.querySelector("h3");
      if (h) c.insertAdjacentHTML("afterbegin", icon(h.textContent));
    });
    q(".rlist li").forEach(function (li) {
      var ic = icon(li.textContent);
      if (ic) {
        li.insertAdjacentHTML("afterbegin", ic);
        li.classList.add("has-ico");
      }
    });
    var t = 0;
    function mark(el, kind, d) {
      el.classList.add("rv", "rv-" + kind);
      el.style.setProperty("--d", Math.round(d) + "ms");
    }
    q(
      ".room-kicker, .room-title, .room-lead, .rlist li, .room-sub, .tags, .rcard, .room-next button",
    ).forEach(function (el) {
      var c = el.classList;
      if (c.contains("room-kicker")) mark(el, "fade", (t = 0));
      else if (c.contains("room-title")) mark(el, "title", (t = 90));
      else if (c.contains("room-lead")) mark(el, "up", (t = 260));
      else if (el.tagName === "LI") mark(el, "left", (t += t < 400 ? 160 : 90));
      else if (c.contains("room-sub")) mark(el, "up", (t += 120));
      else if (c.contains("rcard")) mark(el, "card", (t += t < 400 ? 180 : 120));
      else if (c.contains("room-next")) return;
      else if (el.tagName === "BUTTON") mark(el, "right", (t += t < 400 ? 200 : 80));
      else if (c.contains("tags")) {
        var base = t + 60;
        Array.prototype.forEach.call(el.querySelectorAll(".tag"), function (g, k) {
          mark(g, "pop", base + k * 45);
        });
        if (!el.closest(".rcard")) t = base + el.children.length * 45;
      }
      if (c.contains("rcard")) {
        var ic = el.querySelector(".ricon");
        if (ic) ic.style.setProperty("--d", t + 200 + "ms");
      }
    });
    q(".rlist li .ricon").forEach(function (ic) {
      ic.style.setProperty("--d", parseInt(ic.parentNode.style.getPropertyValue("--d"), 10) + 150 + "ms");
    });
  }

  /* hover / tap glow that follows the finger */
  function glow(room) {
    function at(e) {
      var c = e.target.closest && e.target.closest(".rcard");
      if (!c) return null;
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px");
      c.style.setProperty("--my", e.clientY - r.top + "px");
      return c;
    }
    room.addEventListener("pointermove", at, { passive: true });
    room.addEventListener(
      "pointerdown",
      function (e) {
        var c = at(e);
        if (!c) return;
        c.classList.add("tap");
        clearTimeout(c._t);
        c._t = setTimeout(function () {
          c.classList.remove("tap");
        }, 900);
      },
      { passive: true },
    );
  }

  window.__vsRoom = { scene: scene, decorate: decorate, glow: glow };
})();
