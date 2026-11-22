// daily per-player usage limits tracked in ai_usage
import "server-only";
import { admin } from "./admin";

export const DAILY_AI_LIMIT = Number(process.env.DAILY_AI_LIMIT || 100);
export const DAILY_SANDBOX_LIMIT = Number(process.env.DAILY_SANDBOX_LIMIT || 100);
export const LIMITS = { ai: DAILY_AI_LIMIT, sandbox: DAILY_SANDBOX_LIMIT } as const;

// increments today's counter and returns true if still within the daily limit
export async function bumpUsage(userId: string, kind: "ai" | "sandbox"): Promise<boolean> {
  const { data, error } = await admin().rpc("bump_usage", { p_user: userId, p_kind: kind, p_limit: LIMITS[kind] });
  if (error) throw error;
  return data === true;
}
