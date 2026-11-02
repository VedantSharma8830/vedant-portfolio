/*
 * Tiny wrapper around the backend REST API.
 * Every call resolves (never throws), so the page keeps working when the
 * backend is not running.
 */
(function () {
  "use strict";

  var config = window.APP_CONFIG || {};
  var base = (config.apiBase || "").replace(/\/$/, "");
  var enabled = !!config.useApi && /^https?:$/.test(location.protocol);

  // fetch() with a timeout. Resolves to { ok, status, data } or null on network failure.
  function request(path, options, timeoutMs) {
    if (!enabled) return Promise.resolve(null);
    options = options || {};
    var controller = "AbortController" in window ? new AbortController() : null;
    var timer = controller
      ? setTimeout(function () {
          controller.abort();
        }, timeoutMs || 6000)
      : null;
    if (controller) options.signal = controller.signal;

    return fetch(base + path, options)
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            return { ok: res.ok, status: res.status, data: data };
          });
      })
      .catch(function () {
        return null;
      })
      .then(function (result) {
        if (timer) clearTimeout(timer);
        return result;
      });
  }

  function postJson(path, body, timeoutMs) {
    return request(
      path,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      },
      timeoutMs,
    );
  }

  window.Api = {
    enabled: enabled,

    // Portfolio data, or null if the API isn't reachable.
    profile: function () {
      return request("/api/profile", {}, 2500).then(function (r) {
        return r && r.ok ? r.data : null;
      });
    },

    // Contact form. Resolves to { ok, status, data } or null when offline.
    contact: function (payload) {
      return postJson("/api/contact", payload, 10000);
    },

    // Visit counter, counted once per browser session.
    countVisit: function () {
      try {
        if (sessionStorage.getItem("vs-visit")) return Promise.resolve(null);
        sessionStorage.setItem("vs-visit", "1");
      } catch (e) {}
      return postJson("/api/visit", {}, 4000);
    },
  };

  window.Api.countVisit();
})();
