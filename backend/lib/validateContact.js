/*
 * Validation for contact form submissions.
 * Returns { values, errors } where errors is an object of field -> message.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 120 },
  message: { min: 10, max: 2000 },
};

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateContact(body = {}) {
  const values = {
    name: clean(body.name).replace(/\s+/g, " "),
    email: clean(body.email).toLowerCase(),
    message: clean(body.message),
  };
  const errors = {};

  if (values.name.length < LIMITS.name.min) errors.name = "Please enter your name.";
  else if (values.name.length > LIMITS.name.max)
    errors.name = `Name must be under ${LIMITS.name.max} characters.`;

  if (!EMAIL_RE.test(values.email) || values.email.length > LIMITS.email.max) {
    errors.email = "Please enter a valid email address.";
  }

  if (values.message.length < LIMITS.message.min) {
    errors.message = `Message should be at least ${LIMITS.message.min} characters.`;
  } else if (values.message.length > LIMITS.message.max) {
    errors.message = `Message must be under ${LIMITS.message.max} characters.`;
  }

  return { values, errors };
}

module.exports = { validateContact, LIMITS };
