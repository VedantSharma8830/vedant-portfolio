/*
 * The glowing whale drawn by the door intro and the "About me" panel backdrop.
 * Pure SVG; exposed as window.__vsWhale().
 */
(function () {
  "use strict";
  var uid = 0;

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
})();
