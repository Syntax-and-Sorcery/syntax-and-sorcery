// TODO(T-02): defeat XP formula from RULES.xp
import type { PuzzleKind } from "@/lib/types";

// formula: round(base[kind] * (1 + perDifficulty * (difficulty - 1)) * bossMultiplier - hintPenalty), clamped at 0
export function xpForDefeat(input: {
  kind: PuzzleKind;
  difficulty: number;
  isBoss: boolean;
  basicHintsUsed: number;
}): number {
  void input;
  throw new Error("TODO");
}
