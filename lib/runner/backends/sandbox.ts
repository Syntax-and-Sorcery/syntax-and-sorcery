import "server-only";
import { APIError, Sandbox } from "@vercel/sandbox";
import type { ExecutionBackend } from "../types";
import { MAX_OUTPUT } from "./local";

export class RunnerBusyError extends Error {}

export const sandboxBackend: ExecutionBackend = {
  async execute(program, { timeoutMs }) {
    let sandbox: Sandbox;
    try {
      sandbox = await Sandbox.create({
        image: "vercel/sandbox/node:24",
        resources: { vcpus: 1 },
        timeout: 60_000,
        networkPolicy: "deny-all",
        persistent: false, // SDK defaults to true and retains files
      });
    } catch (error) {
      if (error instanceof APIError && error.response.status === 429) throw new RunnerBusyError(error.message);
      throw error;
    }
    try {
      await sandbox.writeFiles(program.files); // relative paths resolve in the default cwd
      const started = Date.now();
      const res = await sandbox.runCommand({ cmd: program.command, args: program.args, timeoutMs });
      const durationMs = res.durationMs ?? Date.now() - started;
      return {
        stdout: (await res.stdout()).slice(-MAX_OUTPUT),
        stderr: (await res.stderr()).slice(-MAX_OUTPUT),
        exitCode: res.exitCode,
        // the SDK doesn't report timeouts, so treat a non-zero exit within 100 ms of the limit as a timeout
        timedOut: res.exitCode !== 0 && durationMs >= timeoutMs - 100,
        durationMs,
      };
    } finally {
      await sandbox.stop();
    }
  },
};
