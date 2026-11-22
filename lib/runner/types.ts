import type { Language, RunResult, TestCase } from "@/lib/types";

export interface Program {
  files: { path: string; content: string }[];
  command: string;
  args: string[];
}
export interface RawOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  durationMs: number;
}
export interface LanguageStrategy {
  language: Language;
  buildProgram(code: string, tests: TestCase[]): Program;
  parseOutput(raw: RawOutput): RunResult;
}
export interface ExecutionBackend {
  execute(program: Program, limits: { timeoutMs: number }): Promise<RawOutput>;
}
