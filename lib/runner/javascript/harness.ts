export const RESULTS_MARKER = "__SS_RESULTS__";
export const HARNESS_FILE = "__ss_harness.mjs";

// ES module imports run before main.mjs does, so the harness captures built-ins before player code can replace them
// it removes the per-run nonce from process.argv so player code can't forge a results line
export const JS_HARNESS = String.raw`
const is = Object.is;
const keys = Object.keys;
const isArray = Array.isArray;
const isNaNValue = Number.isNaN;
const stringify = JSON.stringify;
const abs = Math.abs;
const pow = Math.pow;
const toStr = String;
const ErrorCtor = Error;
const DateCtor = Date;
const uncurry = Function.prototype.bind.bind(Function.prototype.call);
const dateTime = uncurry(Date.prototype.getTime);
const write = process.stdout.write.bind(process.stdout);
const exit = process.exit.bind(process);
const nonce = process.argv.splice(2).pop() ?? "";

const tests = [];

function fmt(v) {
  if (v === undefined) return "undefined";
  if (typeof v === "number") return is(v, -0) ? "-0" : toStr(v);
  if (typeof v === "bigint") return toStr(v) + "n";
  if (typeof v === "function") return "[Function " + (v.name || "anonymous") + "]";
  if (typeof v === "symbol") return toStr(v);
  try {
    const s = stringify(v);
    return s === undefined ? toStr(v) : s;
  } catch {
    return toStr(v);
  }
}

function fail(message) {
  throw new ErrorCtor(message);
}

// Own enumerable keys, skipping undefined values, as Jest's toEqual does.
function definedKeys(o) {
  const all = keys(o);
  const out = [];
  for (let i = 0; i < all.length; i++) if (o[all[i]] !== undefined) out[out.length] = all[i];
  return out;
}

function equal(a, b) {
  if (is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (isArray(a) !== isArray(b)) return false;
  if (a instanceof DateCtor || b instanceof DateCtor) {
    return a instanceof DateCtor && b instanceof DateCtor && is(dateTime(a), dateTime(b));
  }
  if (isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!equal(a[i], b[i])) return false;
    return true;
  }
  const ka = definedKeys(a);
  if (ka.length !== definedKeys(b).length) return false;
  for (let i = 0; i < ka.length; i++) if (!equal(a[ka[i]], b[ka[i]])) return false;
  return true;
}

export function test(name, fn) {
  tests[tests.length] = { name: toStr(name), fn };
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (!is(actual, expected)) fail("Expected " + fmt(expected) + ", got " + fmt(actual));
    },
    toEqual(expected) {
      if (!equal(actual, expected)) fail("Expected " + fmt(expected) + ", got " + fmt(actual));
    },
    toThrow() {
      if (typeof actual !== "function") fail("Expected a function, got " + fmt(actual));
      try {
        actual();
      } catch {
        return;
      }
      fail("Expected an error, got none");
    },
    toBeCloseTo(expected, digits = 2) {
      const close =
        typeof actual === "number" &&
        (actual === expected || (!isNaNValue(actual) && abs(expected - actual) < pow(10, -digits) / 2));
      if (!close) fail("Expected " + fmt(expected) + " (to " + digits + " decimal places), got " + fmt(actual));
    },
  };
}

export async function __ssRun() {
  const results = [];
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    let result;
    try {
      await t.fn();
      result = { name: t.name, passed: true };
    } catch (e) {
      result = { name: t.name, passed: false, error: toStr(e && e.message ? e.message : e) };
    }
    results[results.length] = result;
  }
  // Exit once the line is flushed, so a timer the player left running can't turn a finished run into a timeout.
  write("${RESULTS_MARKER}" + nonce + stringify(results) + "\n", () => exit(0));
}
`;
