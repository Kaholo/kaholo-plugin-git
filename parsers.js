const { isWin, untildify } = require("./helpers");

function parseArray(value) {
  if (!value) { return []; }
  if (Array.isArray(value)) { return value; }
  if (typeof (value) === "string") { return value.split("\n").map((line) => line.trim()).filter((line) => line); }
  throw "Unsupprted array format";
}

module.exports = {
  boolean: (value) => {
    if (value === undefined || value === null || value === "") { return undefined; }
    return !!(value && value !== "false");
  },
  text: (value) => {
    if (value) { return value.split("\n"); }
    return undefined;
  },
  number: (value) => {
    if (!value) { return undefined; }
    const parsed = parseInt(value);
    if (parsed === NaN) {
      throw `Value ${value} is not a valid number`;
    }
    return parsed;
  },
  autocomplete: (value) => {
    if (!value) { return undefined; }
    if (typeof (value) === "object") { return value.id || value; }
    return value;
  },
  autocompleteOrArray: (value) => {
    if (!value) { return []; }
    if (Array.isArray(value)) { return value; }
    if (typeof (value) === "object") { return [value.id || value]; }
    return [value];
  },
  object: (value) => {
    if (!value) { return undefined; }
    if (typeof (value) !== "object") { throw `Value ${value} is not an object`; }
    return value;
  },
  string: (value) => {
    if (!value) { return undefined; }
    if (typeof (value) === "string") { return value.trim(); }
    throw `Value ${value} is not a valid string`;
  },
  path: (value) => {
    if (!value) { return undefined; }
    let path = module.exports.string(value);
    if (isWin) { path = path.replace(/\//g, "\\"); } else { path = path.replace(/\\/g, "/"); }
    return untildify(path);
  },
  array: parseArray,
};
