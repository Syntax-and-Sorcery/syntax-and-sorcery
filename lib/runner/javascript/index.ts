import { randomUUID } from "node:crypto";
import type { RunResult, TestResult } from "@/lib/types";
import type { LanguageStrategy, Program, RawOutput } from "../types";
import { HARNESS_FILE, JS_HARNESS, RESULTS_MARKER } from "./harness";

export const javascriptStrategy = {
  language: "javascript",
  buildProgram(code, tests) {
    const testCode = tests.map((t) => t.code).join("\n\n");
    // keep player code first so error line numbers match the editor; ES imports hoist and still run first
    const main = `${code}\n\n${testCode}\n\nawait __ssRun();\nimport { test, expect, __ssRun } from "./${HARNESS_FILE}";\n`;
    return {
      files: [
        { path: "main.mjs", content: main },
        { path: HARNESS_FILE, content: JS_HARNESS },
      ],
      command: "node",
      // keep the nonce last; both the harness and parseOutput read it from the final argument
      args: ["--max-old-space-size=128", "main.mjs", randomUUID()],
    };
  },
  // pass the built program to require this run's nonce; omitting it accepts any nonce
  parseOutput(raw: RawOutput, program?: Program): RunResult {
    const { stdout, results } = extractResults(raw.stdout, program?.args.at(-1));
    const base = { stdout, message: firstUsefulLine(raw.stderr), durationMs: raw.durationMs };
    const fail = (status: RunResult["status"]): RunResult => ({ status, tests: [], ...base });

    if (raw.timedOut) return fail("timeout");
    if (raw.stderr.includes("heap out of memory")) return fail("memory");
    if (results === undefined && raw.stderr.includes("SyntaxError")) return fail("syntax_error");
    if (results === undefined && raw.exitCode !== 0) return fail("runtime_error");
    if (results === undefined) return fail("internal_error");
    const tests = parseTests(results);
    if (!tests) return { ...fail("internal_error"), message: "Could not read the test results" };
    return { status: "ok", tests, ...base };
  },
} satisfies LanguageStrategy;

function extractResults(stdout: string, nonce: string | undefined): { stdout: string; results?: string } {
  const marker = new RegExp(`${RESULTS_MARKER}${nonce ?? "[0-9a-f-]{36}"}(.*)\\n?`, "g");
  let results: string | undefined;
  const rest = stdout.replace(marker, (_line, json: string) => {
    results = json;
    return "";
  });
  return { stdout: rest, results };
}

function parseTests(json: string): TestResult[] | undefined {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return undefined;
  }
  if (!Array.isArray(value)) return undefined;
  const tests: TestResult[] = [];
  for (const item of value) {
    if (typeof item?.name !== "string" || typeof item.passed !== "boolean") return undefined;
    if (item.error !== undefined && typeof item.error !== "string") return undefined;
    const test: TestResult = { name: item.name, passed: item.passed };
    if (item.error !== undefined) test.error = item.error;
    tests.push(test);
  }
  return tests;
}

// Node wraps stderr errors with location, source snippet, caret, stack, and version lines
function firstUsefulLine(stderr: string): string | undefined {
  const lines = stderr.split(/\r?\n/).map((l) => l.trim());
  const error = lines.find((l) => /^([A-Za-z]*(Error|Exception)\b|FATAL ERROR\b)/.test(l));
  if (error) return error;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(file:\/\/|node:)\S*:\d+$/.test(line)) {
      i++; // skip the source line after a location
      continue;
    }
    if (!line || /^\^+$/.test(line) || /^at\s/.test(line) || /^Node\.js v\d/.test(line) || line.startsWith("(Use `node")) continue;
    return line;
  }
  return undefined;
}
