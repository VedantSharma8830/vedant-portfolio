/*
 * Tiny JSON file "database".
 * Writes go through a queue and use a temp file + rename, so two requests at
 * the same time can't corrupt the file.
 */
const fs = require("fs/promises");
const path = require("path");

function createStore(filePath, defaultValue) {
  let queue = Promise.resolve();

  async function read() {
    try {
      const text = await fs.readFile(filePath, "utf8");
      return JSON.parse(text);
    } catch (err) {
      if (err.code === "ENOENT") return structuredClone(defaultValue);
      throw err;
    }
  }

  async function write(data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2));
    await fs.rename(tmp, filePath);
  }

  // Read-modify-write, one at a time. `fn` gets the current data and returns the new data.
  function update(fn) {
    const run = queue.then(async () => {
      const current = await read();
      const next = await fn(current);
      await write(next);
      return next;
    });
    queue = run.catch(() => {}); // keep the queue going after an error
    return run;
  }

  return { read, update, filePath };
}

module.exports = createStore;
