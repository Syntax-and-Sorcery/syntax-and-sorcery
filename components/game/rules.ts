// wraps lib/rules functions with safe fallbacks while ticket stubs still throw "TODO"
// rethrows all other errors
import { adventureState, type AdventureState } from "@/lib/rules/adventure-state";
import { levelProgress } from "@/lib/rules/levels";
import { levelUpLoot, rollLoot } from "@/lib/rules/loot";
import { xpForDefeat } from "@/lib/rules/xp";
import type { Concept, Encounter } from "@/lib/types";

const warned = new Set<string>();

function orFallback<T>(ticket: string, run: () => T, fallback: T): T {
  try {
    return run();
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "TODO") throw error;
    if (!warned.has(ticket)) {
      warned.add(ticket);
      console.warn(`${ticket} isn't done yet; the screen uses a placeholder value.`);
    }
    return fallback;
  }
}

export interface LevelInfo {
  level: number;
  xp: number;
  nextXp: number; // total XP needed for the next level
  percent: number;
}

export function levelInfo(xp: number): LevelInfo {
  const p = levelProgress(xp);
  const percent = Math.round((p.xpIntoLevel / p.xpForNextLevel) * 100);
  return { level: p.level, xp, nextXp: xp - p.xpIntoLevel + p.xpForNextLevel, percent };
}

export function xpFor(input: Parameters<typeof xpForDefeat>[0]): number | null {
  return orFallback<number | null>("T-02 XP", () => xpForDefeat(input), null);
}

export function lootFor(enemy: { isBoss: boolean; difficulty: number }, xpBefore: number, xpAfter: number): string[] {
  return [
    ...orFallback("T-03 loot", () => rollLoot(enemy, Math.random), [] as string[]),
    ...orFallback("T-03 loot", () => levelUpLoot(xpBefore, xpAfter), [] as string[]),
  ];
}

export function stateOf(
  concepts: Concept[],
  encounters: Pick<Encounter, "concept" | "kind" | "status" | "isBoss">[],
): AdventureState {
  return adventureState(concepts, encounters);
}

/** builds a cleared state for completed adventures without loading a run */
export function completedState(concepts: Concept[]): AdventureState {
  return {
    concepts: concepts.map((c) => ({ slug: c.slug, name: c.name, wins: 2, mcqWin: true, cleared: true })),
    cleared: concepts.length,
    total: concepts.length,
    bossUnlocked: true,
    bossDefeated: true,
  };
}

export function emptyState(concepts: Concept[]): AdventureState {
  return {
    concepts: concepts.map((c) => ({ slug: c.slug, name: c.name, wins: 0, mcqWin: false, cleared: false })),
    cleared: 0,
    total: concepts.length,
    bossUnlocked: false,
    bossDefeated: false,
  };
}
