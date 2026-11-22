// maps 429 run_limit responses to status "limit" so the UI renders them via runStatusMessage (T-06)
// other non-OK responses throw ApiError with the JSON error code, like "judge_unavailable" or "ai_limit"
import type { GradeResult, RunResult, StoredEnemy } from "@/lib/types";
import type { GameApi } from "./index";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

async function call<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(
    url,
    body === undefined ? undefined : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (res.ok) return (await res.json()) as T;
  const error = ((await res.json().catch(() => null)) as { error?: string } | null)?.error;
  throw new ApiError(res.status, error ?? res.statusText);
}

const isRunLimit = (e: unknown) => e instanceof ApiError && e.code === "run_limit";

export const httpGameApi: GameApi = {
  async run(puzzleId, code) {
    try {
      return await call<RunResult>("/api/run", { puzzleId, code });
    } catch (e) {
      if (isRunLimit(e)) return { status: "limit", tests: [], stdout: "", durationMs: 0 };
      throw e;
    }
  },
  async grade(puzzleId, answer) {
    try {
      return await call<GradeResult>("/api/grade", { puzzleId, answer });
    } catch (e) {
      if (isRunLimit(e)) return { passed: false, feedback: "", status: "limit" };
      throw e;
    }
  },
  offers: (runId) => call<StoredEnemy[]>(`/api/offers?runId=${encodeURIComponent(runId)}`),
};
