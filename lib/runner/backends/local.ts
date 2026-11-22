import "server-only";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ExecutionBackend, RawOutput } from "../types";

export const MAX_OUTPUT = 100_000; // keep the end of each stream so the results line survives

export const localBackend: ExecutionBackend = {
  async execute(program, { timeoutMs }) {
    if (process.env.NODE_ENV === "production") throw new Error("The local runner is for development only");
    const dir = await mkdtemp(join(tmpdir(), "ss-run-"));
    try {
      for (const f of program.files) await writeFile(join(dir, f.path), f.content);
      const started = Date.now();
      return await new Promise<RawOutput>((resolve, reject) => {
        // pass only PATH so player code can't read server environment variables
        const env = { PATH: process.env.PATH ?? "" } as unknown as NodeJS.ProcessEnv;
        const child = spawn(program.command, program.args, { cwd: dir, env });
        let stdout = "";
        let stderr = "";
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          child.kill("SIGKILL");
        }, timeoutMs);
        child.stdout.on("data", (d) => {
          stdout = (stdout + d).slice(-MAX_OUTPUT);
        });
        child.stderr.on("data", (d) => {
          stderr = (stderr + d).slice(-MAX_OUTPUT);
        });
        child.on("error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
        child.on("close", (exitCode) => {
          clearTimeout(timer);
          resolve({ stdout, stderr, exitCode: exitCode ?? -1, timedOut, durationMs: Date.now() - started });
        });
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
};
