/*
 * Contact form.
 * With the backend running it posts to /api/contact and shows the result.
 * As a static site (no backend) it opens the visitor's email app instead,
 * with the subject and message already filled in.
 */
(function () {
  "use strict";

  var form = document.getElementById("contactForm");
  if (!form) return;

  var CV = window.CV || {};
  var submitBtn = document.getElementById("cfSubmit");
  var submitLabel = document.getElementById("cfSubmitLabel");
  var statusEl = document.getElementById("cfStatus");
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!window.Api.enabled) submitLabel.textContent = "Send via email";

  function setStatus(type, text) {
    statusEl.className = "cform-status" + (type ? " is-" + type : "");
    statusEl.textContent = text || "";
  }

  function showFieldErrors(errors) {
    Array.prototype.forEach.call(form.querySelectorAll("[data-err]"), function (el) {
      var key = el.getAttribute("data-err");
      var msg = (errors && errors[key]) || "";
      el.textContent = msg;
      var input = form.elements[key];
      if (input) {
        input.classList.toggle("is-invalid", !!msg);
        input.setAttribute("aria-invalid", msg ? "true" : "false");
      }
    });
  }

  // Same rules as the backend, so most mistakes are caught before sending.
  function validate(values) {
    var errors = {};
    if (values.name.length < 2) errors.name = "Please enter your name.";
    if (!EMAIL_RE.test(values.email)) errors.email = "Please enter a valid email address.";
    if (values.message.length < 10) errors.message = "Message should be at least 10 characters.";
    return errors;
  }

  function readForm() {
    return {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim(),
      company: form.elements.company.value, // honeypot
    };
  }

  function openMailApp(values) {
    var subject = "Portfolio enquiry from " + values.name;
    var body = values.message + "\n\n" + values.name + "\n" + values.email;
    window.location.href =
      "mailto:" + CV.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.classList.toggle("is-busy", busy);
    submitLabel.textContent = busy ? "Sending..." : window.Api.enabled ? "Send message" : "Send via email";
  }

  // Clear a field's error as soon as the user edits it
  form.addEventListener("input", function (e) {
    var errEl = form.querySelector('[data-err="' + e.target.name + '"]');
    if (errEl && errEl.textContent) {
      errEl.textContent = "";
      e.target.classList.remove("is-invalid");
      e.target.setAttribute("aria-invalid", "false");
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var values = readForm();
    var errors = validate(values);
    showFieldErrors(errors);
    if (Object.keys(errors).length) {
      setStatus("error", "Please fix the highlighted fields.");
      var first = form.querySelector(".is-invalid");
      if (first) first.focus();
      return;
    }

    // Static hosting: hand the message to the email app
    if (!window.Api.enabled) {
      openMailApp(values);
      setStatus("info", "Your email app should open with the message ready to send.");
      return;
    }

    setBusy(true);
    setStatus("", "");
    window.Api.contact(values).then(function (res) {
      setBusy(false);
      if (res && res.ok) {
        form.reset();
        setStatus(
          "success",
          "Thanks " + values.name.split(" ")[0] + "! Your message was sent. I'll reply soon.",
        );
        return;
      }
      if (res && res.data && res.data.fields) showFieldErrors(res.data.fields);
      if (res && res.status === 429) {
        setStatus("error", res.data.error || "Too many messages. Please try again in a few minutes.");
      } else if (res && res.data && res.data.error) {
        setStatus("error", res.data.error);
      } else {
        // Server unreachable: offer the email app instead
        setStatus("error", "Couldn't reach the server. Opening your email app instead...");
        setTimeout(function () {
          openMailApp(values);
        }, 900);
      }
    });
  });
})();
