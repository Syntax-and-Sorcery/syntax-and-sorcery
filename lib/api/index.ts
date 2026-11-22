import type { GradeResult, RunResult, StoredEnemy } from "@/lib/types";
import { httpGameApi } from "./http";
import { mockGameApi } from "./mock";

export interface GameApi {
  run(puzzleId: string | null, code: string): Promise<RunResult>; // null runs a lesson snippet with no tests
  grade(puzzleId: string, answer: string): Promise<GradeResult>;
  offers(runId: string): Promise<StoredEnemy[]>; // stored enemies for no-AI mode
}

export function getGameApi(): GameApi {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "mock" ? mockGameApi : httpGameApi;
}
