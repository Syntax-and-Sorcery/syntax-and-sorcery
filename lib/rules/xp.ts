// XP awarded for defeating an enemy, based on puzzle type and difficulty.
import { RULES } from "./config";
import type { PuzzleKind } from "@/lib/types";

// Each basic hint reduces the reward by 25%; rewards never fall below zero.
export function xpForDefeat(input: {
  kind: PuzzleKind;
  difficulty: number;
  isBoss: boolean;
  basicHintsUsed: number;
}): number {
  const { base, perDifficulty, bossMultiplier, basicHintPenalty } = RULES.xp;
  const difficultyReward = base[input.kind] * (1 + perDifficulty * (input.difficulty - 1));
  const battleReward = difficultyReward * (input.isBoss ? bossMultiplier : 1);
  const hintMultiplier = Math.max(0, 1 - Math.max(0, input.basicHintsUsed) * basicHintPenalty);

  return Math.max(0, Math.round(battleReward * hintMultiplier));
}
