import "server-only";
import type { Language, RunResult, TestCase } from "@/lib/types";
import type { ExecutionBackend, LanguageStrategy, Program, RawOutput } from "./types";
import { javascriptStrategy } from "./javascript";
import { pythonStrategy } from "./python";
import { localBackend } from "./backends/local";
import { RunnerBusyError, sandboxBackend } from "./backends/sandbox";

export const RUN_TIMEOUT_MS = 5_000;

// pass the built program to parseOutput so strategies can verify the per-run nonce
type Strategy = LanguageStrategy & { parseOutput(raw: RawOutput, program: Program): RunResult };

const strategies: Record<Language, Strategy> = { javascript: javascriptStrategy, python: pythonStrategy };

function backend(): ExecutionBackend {
  return process.env.CODE_RUNNER === "sandbox" ? sandboxBackend : localBackend;
}

export async function runTests(language: Language, code: string, tests: TestCase[]): Promise<RunResult> {
  const strategy = strategies[language];
  const program = strategy.buildProgram(code, tests);
  let raw;
  try {
    raw = await backend().execute(program, { timeoutMs: RUN_TIMEOUT_MS });
  } catch (error) {
    if (error instanceof RunnerBusyError) return { status: "busy", tests: [], stdout: "", durationMs: 0 };
    throw error;
  }
  return strategy.parseOutput(raw, program);
}
