import type { PuzzleKind } from "@/lib/types";
import { RULES } from "./config";

export function xpForDefeat(input: {
  kind: PuzzleKind;
  difficulty: number;
  isBoss: boolean;
  basicHintsUsed: number;
}): number {
  const { base, perDifficulty, bossMultiplier, basicHintPenalty } = RULES.xp;

  const baseXP = base[input.kind];
  const difficultyBonus = 1 + perDifficulty * (input.difficulty - 1);
  const bossBonus = input.isBoss ? bossMultiplier : 1;

  const totalXP = baseXP * difficultyBonus * bossBonus;
  const hintPenalty = totalXP * basicHintPenalty * input.basicHintsUsed;

  return Math.max(0, Math.round(totalXP - hintPenalty));
}
