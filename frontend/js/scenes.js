/*
 * "Step Inside": four doors that swing open onto small animated worlds
 * (a whale in the deep, a rocket lifting off, waves with jumping fish and a
 * lion in the jungle). Pure SVG + CSS animation; each scene only animates
 * while its door is open and on screen.
 */
(function () {
  "use strict";
  var doc = document,
    uid = 0;

  function whale(u) {
    return (
      '<g class="w-glow"><ellipse cx="105" cy="46" rx="98" ry="40" fill="url(#wg' +
      u +
      ')"/></g>' +
      '<g class="w-tail"><path fill="url(#wb' +
      u +
      ')" d="M34 46C26 42 16 30 4 26c4 7 8 13 9 20-1 7-5 13-9 20 12-4 22-16 30-20z"/></g>' +
      '<path fill="url(#wb' +
      u +
      ')" d="M30 47C44 30 86 18 132 22c26 2 48 12 58 24-6 10-24 17-50 19-44 4-86 0-110-18z"/>' +
      '<path fill="none" stroke="#c9f3ff" stroke-opacity=".5" stroke-width="1.2" d="M120 56c18 1 40-1 58-7M118 60c20 1 40-2 56-8M116 52c22 0 44-3 62-9"/>' +
      '<g class="w-fin"><path fill="#2b7cc0" d="M112 58c-6 12-18 22-34 26 10-10 16-18 18-26z"/></g>' +
      '<circle cx="170" cy="40" r="2.4" fill="#04121f"/><circle cx="170.8" cy="39.3" r=".7" fill="#fff"/>' +
      '<g fill="#e6fbff" fill-opacity=".7"><circle cx="150" cy="30" r="1.3"/><circle cx="138" cy="27" r="1"/><circle cx="96" cy="26" r="1.1"/></g>'
    );
  }
  function whaleDefs(u) {
    return (
      '<radialGradient id="wg' +
      u +
      '"><stop offset="0" stop-color="#8ff0ff" stop-opacity=".75"/><stop offset="1" stop-color="#7fe7ff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="wb' +
      u +
      '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9df1ff"/><stop offset=".5" stop-color="#3fa6e6"/><stop offset="1" stop-color="#e2fbff"/></linearGradient>'
    );
  }
  function bubbles(n, w, h, cls) {
    var s = "";
    for (var i = 0; i < n; i++) {
      var x = ((i * 37 + 11) % w) + 4,
        r = 1.2 + ((i * 7) % 5) * 0.6;
      s +=
        '<circle class="' +
        cls +
        '" cx="' +
        x +
        '" cy="' +
        (h + 8) +
        '" r="' +
        r.toFixed(1) +
        '" style="animation-delay:-' +
        ((i * 0.83) % 5).toFixed(2) +
        "s;animation-duration:" +
        (3.6 + ((i * 1.3) % 2.6)).toFixed(2) +
        's"/>';
    }
    return s;
  }
  function stars(n) {
    var s = "";
    for (var i = 0; i < n; i++) {
      var x = (i * 53 + 17) % 200,
        y = (i * 89 + 29) % 300,
        r = 0.6 + ((i * 3) % 4) * 0.35;
      s +=
        '<circle class="sc-tw" cx="' +
        x +
        '" cy="' +
        y +
        '" r="' +
        r.toFixed(2) +
        '" style="animation-delay:-' +
        ((i * 0.37) % 3).toFixed(2) +
        's"/>';
    }
    return s;
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

  /* the site styles every svg path/circle as a line icon; move these
     shapes' own colours into inline styles so they keep them */
  function fix(svg) {
    return svg.replace(/<(path|circle)\b([^>]*?)(\/?)>/g, function (m, tag, attrs, close) {
      var st = "";
      attrs = attrs.replace(/\s(fill|stroke|stroke-width|stroke-linecap)="([^"]*)"/g, function (a, k, v) {
        st += k + ":" + v + ";";
        return "";
      });
      if (st) {
        if (/\sstyle="/.test(attrs)) attrs = attrs.replace(/\sstyle="/, ' style="' + st);
        else attrs += ' style="' + st + '"';
      }
      return "<" + tag + attrs + close + ">";
    });
  }

  var SCENES = {
    whale: function (u) {
      return (
        "<defs>" +
        whaleDefs(u) +
        '<linearGradient id="sea' +
        u +
        '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b5c8c"/><stop offset=".5" stop-color="#062f55"/><stop offset="1" stop-color="#020e1f"/></linearGradient>' +
        '<linearGradient id="ray' +
        u +
        '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff3ff" stop-opacity=".45"/><stop offset="1" stop-color="#bff3ff" stop-opacity="0"/></linearGradient></defs>' +
        '<rect width="200" height="320" fill="url(#sea' +
        u +
        ')"/>' +
        '<g class="sc-rays" fill="url(#ray' +
        u +
        ')"><path d="M40 0h22l-40 260H2z"/><path d="M100 0h16l-6 280H80z"/><path d="M150 0h24l40 240h-30z"/></g>' +
        '<g class="sc-swim"><g transform="translate(10 120) scale(.9)">' +
        whale(u) +
        "</g></g>" +
        '<g class="sc-fish2" fill="#ffd23f"><path d="M150 250l10-5v10zM160 250a8 5 0 1 0 16 0a8 5 0 1 0-16 0"/><path d="M128 266l8-4v8zM136 266a6 4 0 1 0 12 0a6 4 0 1 0-12 0" opacity=".8"/></g>' +
        '<path d="M0 300q30-14 60-2t70-4 70 6v20H0z" fill="#03182c"/>' +
        '<g fill="none" stroke="#bff3ff" stroke-opacity=".7">' +
        bubbles(9, 190, 320, "sc-bub") +
        "</g>"
      );
    },
    space: function (u) {
      return (
        '<defs><linearGradient id="sp' +
        u +
        '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05061a"/><stop offset=".6" stop-color="#1a1146"/><stop offset="1" stop-color="#3a1d5c"/></linearGradient>' +
        '<radialGradient id="pl' +
        u +
        '" cx="35%" cy="35%"><stop offset="0" stop-color="#ffe7a3"/><stop offset=".6" stop-color="#e0902e"/><stop offset="1" stop-color="#7a3b12"/></radialGradient>' +
        '<linearGradient id="fl' +
        u +
        '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8"/><stop offset=".4" stop-color="#ffb52e"/><stop offset="1" stop-color="#ff4d1f" stop-opacity="0"/></linearGradient></defs>' +
        '<rect width="200" height="320" fill="url(#sp' +
        u +
        ')"/>' +
        '<g fill="#fff">' +
        stars(26) +
        "</g>" +
        '<path class="sc-shoot" d="M30 40l46 18" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>' +
        '<g transform="translate(150 70)"><circle r="20" fill="url(#pl' +
        u +
        ')"/><ellipse rx="34" ry="7" fill="none" stroke="#ffd98a" stroke-opacity=".75" stroke-width="2" transform="rotate(-18)"/></g>' +
        '<g class="sc-rocket"><g transform="translate(92 200)">' +
        '<path class="sc-flame" d="M-7 34q7 34 7 40 0-6 7-40z" fill="url(#fl' +
        u +
        ')"/>' +
        '<path d="M-12 18l-10 16h10zM12 18l10 16H12z" fill="#e0482e"/>' +
        '<path d="M0-40c13 12 15 40 12 58h-24c-3-18-1-46 12-58z" fill="#eef1f8"/>' +
        '<path d="M0-40c6 6 9 12 10 18h-20c1-6 4-12 10-18z" fill="#e0482e"/>' +
        '<circle cy="-4" r="6" fill="#1d3a6e" stroke="#ffd23f" stroke-width="2"/><path d="M-12 18h24v6h-24z" fill="#c4c9d6"/>' +
        "</g></g>" +
        '<path d="M0 300q50-18 100-6t100 0v26H0z" fill="#120a2a"/>'
      );
    },
    waves: function (u) {
      return (
        '<defs><linearGradient id="sk' +
        u +
        '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a4a"/><stop offset=".45" stop-color="#e2683a"/><stop offset=".62" stop-color="#ffc85a"/></linearGradient></defs>' +
        '<rect width="200" height="320" fill="url(#sk' +
        u +
        ')"/>' +
        '<circle class="sc-sun" cx="100" cy="168" r="34" fill="#fff0b3"/>' +
        '<path class="sc-gull" d="M40 70q6-6 12 0q6-6 12 0" fill="none" stroke="#2a1a3a" stroke-width="2" stroke-linecap="round"/>' +
        '<path class="sc-gull sc-gull2" d="M130 96q5-5 10 0q5-5 10 0" fill="none" stroke="#2a1a3a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<g class="sc-jump"><path d="M0 0c8-6 20-6 26 0-6 6-18 6-26 0zM24 0l9-6v12z" fill="#ffd23f"/><circle cx="6" cy="-1" r="1.3" fill="#2a1a3a"/></g>' +
        '<g class="sc-wv sc-wv1"><path d="M-100 200q25-12 50 0t50 0 50 0 50 0 50 0 50 0 50 0v130h-350z" fill="#1d6fa3"/></g>' +
        '<g class="sc-wv sc-wv2"><path d="M-100 228q25-12 50 0t50 0 50 0 50 0 50 0 50 0 50 0v100h-350z" fill="#15527e"/></g>' +
        '<g class="sc-wv sc-wv3"><path d="M-100 258q25-14 50 0t50 0 50 0 50 0 50 0 50 0 50 0v70h-350z" fill="#0c3558"/></g>' +
        '<g fill="#fff" fill-opacity=".55" class="sc-wv sc-wv2"><path d="M-80 226q12-5 22 0M20 226q12-5 22 0M120 226q12-5 22 0" stroke="#fff" stroke-opacity=".5" fill="none"/></g>'
      );
    },
    jungle: function (u) {
      return (
        '<defs><linearGradient id="jg' +
        u +
        '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f3b2a"/><stop offset=".6" stop-color="#1f6b3d"/><stop offset="1" stop-color="#0b2a1b"/></linearGradient>' +
        '<radialGradient id="ff' +
        u +
        '"><stop offset="0" stop-color="#fff7a8"/><stop offset="1" stop-color="#fff7a8" stop-opacity="0"/></radialGradient></defs>' +
        '<rect width="200" height="320" fill="url(#jg' +
        u +
        ')"/>' +
        '<circle cx="150" cy="58" r="22" fill="#ffe9a0" opacity=".9"/>' +
        '<g class="sc-vine"><path d="M30 0q-8 50 6 90" stroke="#2f8f4e" stroke-width="3" fill="none"/><ellipse cx="34" cy="60" rx="9" ry="4" fill="#3fae5e" transform="rotate(30 34 60)"/><ellipse cx="28" cy="84" rx="9" ry="4" fill="#3fae5e" transform="rotate(-30 28 84)"/></g>' +
        '<g class="sc-vine sc-vine2"><path d="M172 0q8 40-4 74" stroke="#2f8f4e" stroke-width="3" fill="none"/><ellipse cx="168" cy="50" rx="9" ry="4" fill="#3fae5e" transform="rotate(-30 168 50)"/></g>' +
        '<g class="sc-lion">' +
        '<path class="sc-ltail" d="M136 262q30-6 26-34" stroke="#c97a26" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="112" cy="262" rx="40" ry="26" fill="#d9952f"/>' +
        '<path d="' +
        mane() +
        '" fill="#9a4f17"/>' +
        '<circle cx="78" cy="168" r="9" fill="#d9952f"/><circle cx="122" cy="168" r="9" fill="#d9952f"/>' +
        '<circle cx="100" cy="198" r="27" fill="#eab04a"/>' +
        '<g class="sc-eyes"><ellipse cx="90" cy="192" rx="3.4" ry="4" fill="#1b1206"/><ellipse cx="110" cy="192" rx="3.4" ry="4" fill="#1b1206"/></g>' +
        '<ellipse cx="100" cy="210" rx="12" ry="8" fill="#f6d79a"/><path d="M95 204h10l-5 6z" fill="#3a1f0c"/><path d="M100 210q-4 6-8 3M100 210q4 6 8 3" stroke="#3a1f0c" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        "</g>" +
        '<g class="sc-bush"><ellipse cx="20" cy="300" rx="50" ry="34" fill="#185a32"/><ellipse cx="180" cy="300" rx="54" ry="36" fill="#185a32"/><ellipse cx="100" cy="318" rx="70" ry="22" fill="#134a29"/></g>' +
        '<g class="sc-ffl"><circle cx="40" cy="190" r="6" fill="url(#ff' +
        u +
        ')"/><circle cx="168" cy="160" r="5" fill="url(#ff' +
        u +
        ')"/><circle cx="150" cy="240" r="6" fill="url(#ff' +
        u +
        ')"/></g>'
      );
    },
  };
  function scene(name) {
    var u = "s" + ++uid;
    return (
      '<svg class="scn scn-' +
      name +
      '" viewBox="0 0 200 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' +
      fix(SCENES[name](u)) +
      "</svg>"
    );
  }
  window.__vsScene = scene;
  window.__vsWhale = function () {
    var u = "w" + ++uid;
    return (
      '<svg class="whale" viewBox="0 0 200 90" aria-hidden="true"><defs>' +
      whaleDefs(u) +
      "</defs>" +
      fix(whale(u)) +
      "</svg>"
    );
  };

  /* ---------- Step Inside ---------- */
  function stepInside() {
    var row = doc.getElementById("sdoors");
    if (!row) return;
    var doors = Array.prototype.slice.call(row.querySelectorAll(".sdoor")),
      hover = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
    doors.forEach(function (d) {
      d.querySelector(".sd-in").innerHTML = scene(d.getAttribute("data-scene"));
      function set(o) {
        d.classList.toggle("open", o);
        d.setAttribute("aria-pressed", o ? "true" : "false");
      }
      d.addEventListener("click", function () {
        var o = !d.classList.contains("open") || d.classList.contains("hov");
        d.classList.remove("hov");
        d.dataset.pin = o ? "1" : "";
        set(o);
      });
      if (hover) {
        d.addEventListener("mouseenter", function () {
          if (d.classList.contains("open")) return;
          d.classList.add("hov");
          set(true);
        });
        d.addEventListener("mouseleave", function () {
          if (!d.classList.contains("hov")) return;
          d.classList.remove("hov");
          if (!d.dataset.pin) set(false);
        });
      }
    });
    row.classList.add("ready");
    if ("IntersectionObserver" in window)
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          row.classList.toggle("vis", e.isIntersecting);
        });
      }).observe(row);
    else row.classList.add("vis");
  }

  stepInside();
})();
