/*
 * The two JSON files the app keeps in backend/data/.
 */
const path = require("path");
const config = require("../config");
const createStore = require("./jsonStore");

module.exports = {
  messages: createStore(path.join(config.paths.dataDir, "messages.json"), []),
  stats: createStore(path.join(config.paths.dataDir, "stats.json"), { visits: 0, lastVisit: null }),
};
