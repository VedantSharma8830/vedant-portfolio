// ESLint flat config:  npm run lint
const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { ignores: ["node_modules/", "backend/data/"] },
  js.configs.recommended,
  {
    rules: {
      // allow `catch (e) {}` for things like localStorage being blocked
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { caughtErrors: "none" }],
    },
  },
  {
    files: ["backend/**/*.js", "scripts/**/*.js", "eslint.config.js"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
  },
  {
    files: ["frontend/**/*.js"],
    languageOptions: { sourceType: "script", globals: globals.browser },
  },
];
