// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TestCase } from "@/lib/types";
import { localBackend, MAX_OUTPUT } from "./backends/local";
import { RunnerBusyError } from "./backends/sandbox";
import { runTests } from "./index";
import { javascriptStrategy } from "./javascript";
import type { RawOutput } from "./types";

const sandbox = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock("./backends/sandbox", () => {
  class RunnerBusyError extends Error {}
  return { RunnerBusyError, sandboxBackend: sandbox };
});

afterEach(() => {
  vi.unstubAllEnvs();
  sandbox.execute.mockReset();
});

const sumTests: TestCase[] = [
  { name: "adds two numbers", code: 'test("adds two numbers", () => { expect(sum(2, 3)).toBe(5); });' },
  { name: "adds negatives", code: 'test("adds negatives", () => { expect(sum(-1, -1)).toBe(-2); });' },
];

describe("TC-FR-17 code graded against tests", () => {
  it("passes every test for a correct solution", async () => {
    const result = await runTests("javascript", "function sum(a, b) { return a + b; }", sumTests);
    expect(result.status).toBe("ok");
    expect(result.tests.map((t) => t.name)).toEqual(sumTests.map((t) => t.name));
    expect(result.tests.every((t) => t.passed)).toBe(true);
  });

  it("fails every test for a wrong solution and names the expected value", async () => {
    const result = await runTests("javascript", "function sum(a, b) { return a - b; }", sumTests);
    expect(result.status).toBe("ok");
    expect(result.tests.every((t) => !t.passed)).toBe(true);
    expect(result.tests[0].error).toContain("5");
  });

  it("reports pass or fail for each test separately", async () => {
    const result = await runTests("javascript", "function sum(a, b) { return a + Math.abs(b); }", sumTests);
    expect(result.tests.map((t) => t.passed)).toEqual([true, false]);
  });

  it("reports a syntax error instead of test results", async () => {
    const result = await runTests("javascript", "function sum(a, b) { return a + ; }", sumTests);
    expect(result.status).toBe("syntax_error");
    expect(result.tests).toEqual([]);
    expect(result.message).toMatch(/SyntaxError/);
  });

  it("reports a runtime error when the code throws before the tests run", async () => {
    const result = await runTests("javascript", 'throw new Error("boom");', sumTests);
    expect(result.status).toBe("runtime_error");
    expect(result.tests).toEqual([]);
    expect(result.message).toContain("boom");
  });

  it("fails an async test that rejects", async () => {
    const tests = [{ name: "async", code: 'test("async", async () => { await Promise.reject(new Error("late")); });' }];
    const result = await runTests("javascript", "", tests);
    expect(result.tests).toEqual([{ name: "async", passed: false, error: "late" }]);
  });

  it("keeps the player's console output apart from the results", async () => {
    const result = await runTests("javascript", 'console.log("hello there"); function sum(a, b) { return a + b; }', sumTests);
    expect(result.stdout).toContain("hello there");
    expect(result.stdout).not.toContain("__SS_RESULTS__");
    expect(result.tests.every((t) => t.passed)).toBe(true);
  });

  it("doesn't let player code forge a passing results line", async () => {
    const forged = JSON.stringify(sumTests.map((t) => ({ name: t.name, passed: true })));
    const code = `console.log("__SS_RESULTS__00000000-0000-4000-8000-000000000000" + ${JSON.stringify(forged)}); process.exit(0);`;
    const result = await runTests("javascript", code, sumTests);
    expect(result.status).not.toBe("ok");
    expect(result.tests.some((t) => t.passed)).toBe(false);
  });

  it("keeps the results when the code prints more than the output cap", async () => {
    const code = `console.log("x".repeat(${MAX_OUTPUT * 2})); function sum(a, b) { return a + b; }`;
    const result = await runTests("javascript", code, sumTests);
    expect(result.status).toBe("ok");
    expect(result.tests.every((t) => t.passed)).toBe(true);
    expect(result.stdout.length).toBeLessThanOrEqual(MAX_OUTPUT);
  });

  it("doesn't expose server environment variables to player code", async () => {
    vi.stubEnv("SS_TEST_SECRET", "do-not-leak");
    const result = await runTests("javascript", 'console.log(process.env.SS_TEST_SECRET ?? "hidden");', []);
    expect(result.stdout).toContain("hidden");
    expect(result.stdout).not.toContain("do-not-leak");
  });

  it("checks deep equality, errors and rounding like Jest", async () => {
    const cases: [string, string, boolean][] = [
      ["deep equal", "expect({ a: [1, { b: 2 }], c: undefined }).toEqual({ a: [1, { b: 2 }] })", true],
      ["deep differ", "expect([1, 2]).toEqual([1, 3])", false],
      ["array vs object", "expect([]).toEqual({})", false],
      ["dates", "expect(new Date(0)).toEqual(new Date(0))", true],
      ["negative zero", "expect(-0).toBe(0)", false],
      ["throws", 'expect(() => { throw new Error("x"); }).toThrow()', true],
      ["no throw", "expect(() => 1).toThrow()", false],
      ["not a function", "expect(1).toThrow()", false],
      ["close", "expect(0.1 + 0.2).toBeCloseTo(0.3)", true],
      ["not close", "expect(0.5).toBeCloseTo(0.3)", false],
    ];
    const tests = cases.map(([name, body]) => ({ name, code: `test(${JSON.stringify(name)}, () => { ${body}; });` }));
    const result = await runTests("javascript", "", tests);
    expect(result.tests.map((t) => [t.name, t.passed])).toEqual(cases.map(([name, , passed]) => [name, passed]));
  });

  it("rejects unsupported Python runs", async () => {
    await expect(runTests("python", "print(1)", [])).rejects.toThrow(/Python/);
  });
});

describe("local backend", () => {
  it("stops code that runs past the time limit", async () => {
    const program = javascriptStrategy.buildProgram("while (true) {}", sumTests);
    const raw = await localBackend.execute(program, { timeoutMs: 300 });
    expect(raw.timedOut).toBe(true);
    expect(javascriptStrategy.parseOutput(raw, program).status).toBe("timeout");
  });

  it("refuses to run in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(localBackend.execute(javascriptStrategy.buildProgram("", []), { timeoutMs: 1000 })).rejects.toThrow();
  });

  it("rejects when the command can't start", async () => {
    await expect(
      localBackend.execute({ files: [], command: "ss-no-such-command", args: [] }, { timeoutMs: 1000 }),
    ).rejects.toThrow();
  });
});

describe("sandbox backend errors", () => {
  it("reports busy when the sandbox pool is full", async () => {
    vi.stubEnv("CODE_RUNNER", "sandbox");
    sandbox.execute.mockRejectedValue(new RunnerBusyError("full"));
    const result = await runTests("javascript", "", sumTests);
    expect(result.status).toBe("busy");
    expect(result.tests).toEqual([]);
  });

  it("rethrows other sandbox failures", async () => {
    vi.stubEnv("CODE_RUNNER", "sandbox");
    sandbox.execute.mockRejectedValue(new Error("network"));
    await expect(runTests("javascript", "", sumTests)).rejects.toThrow("network");
  });
});

describe("javascript parseOutput", () => {
  const raw = (over: Partial<RawOutput>): RawOutput => ({ stdout: "", stderr: "", exitCode: 0, timedOut: false, durationMs: 1, ...over });
  const results = (json: string) => `__SS_RESULTS__00000000-0000-4000-8000-000000000000${json}\n`;

  it("reports running out of memory", () => {
    const stderr = "<--- Last few GCs --->\nFATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory";
    const result = javascriptStrategy.parseOutput(raw({ stderr, exitCode: 134 }));
    expect(result.status).toBe("memory");
    expect(result.message).toMatch(/^FATAL ERROR/);
  });

  it("treats unreadable results as an internal error", () => {
    for (const json of ["not json", '{"name":"x"}', '[{"name":1,"passed":true}]', '[{"name":"x","passed":true,"error":3}]']) {
      expect(javascriptStrategy.parseOutput(raw({ stdout: results(json) })).status).toBe("internal_error");
    }
  });

  it("treats a clean exit without results as an internal error", () => {
    expect(javascriptStrategy.parseOutput(raw({})).status).toBe("internal_error");
  });

  it("picks the error line out of Node's stack output", () => {
    const stderr = [
      "file:///tmp/ss-run-1/main.mjs:3",
      "  foo(",
      "  ^",
      "",
      "ReferenceError: foo is not defined",
      "    at file:///tmp/ss-run-1/main.mjs:3:3",
      "",
      "Node.js v24.0.0",
    ].join("\n");
    expect(javascriptStrategy.parseOutput(raw({ stderr, exitCode: 1 })).message).toBe("ReferenceError: foo is not defined");
  });

  it("falls back to the first meaningful line when there's no error name", () => {
    const stderr = ["node:internal/x:1", "source line", "^^^", "    at foo", "(Use `node --trace` to see more)", "something odd"].join("\n");
    expect(javascriptStrategy.parseOutput(raw({ stderr, exitCode: 1 })).message).toBe("something odd");
  });

  it("leaves message undefined when stderr is empty", () => {
    expect(javascriptStrategy.parseOutput(raw({ stdout: results("[]") })).message).toBeUndefined();
  });
});
