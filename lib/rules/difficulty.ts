import { RULES } from "./config";
import type { EncounterStatus, Preferences } from "@/lib/types";

export function targetDifficulty(
  level: number,
  recent: { status: EncounterStatus; basicHints: number }[], // track encounters, newest first
  preference: Preferences["difficulty"],
): number {
  const { levelBands, recentWindow, shift } = RULES.difficulty;
  let target = 1 + levelBands.filter((top) => level > top).length;

  const window = recent.filter((e) => e.status !== "active").slice(0, recentWindow);
  if (window.length > 0) {
    const clean = window.filter((e) => e.status === "defeated" && e.basicHints === 0).length;
    const share = clean / window.length;
    if (share >= 0.8) target += 1;
    else if (share <= 0.4) target -= 1;
  }

  target += shift[preference];
  return Math.min(5, Math.max(1, target));
}
