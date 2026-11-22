// single source for concept clears and the boss lock (T-21)
import { RULES } from "@/lib/rules/config";
import type { Concept, Encounter } from "@/lib/types";

export interface ConceptProgress { slug: string; name: string; wins: number; mcqWin: boolean; cleared: boolean }
export interface AdventureState {
  concepts: ConceptProgress[]; // in the adventure's order
  cleared: number;
  total: number;
  bossUnlocked: boolean;
  bossDefeated: boolean;
}

export function adventureState(
  concepts: Concept[],
  encounters: Pick<Encounter, "concept" | "kind" | "status" | "isBoss">[],
): AdventureState {
  const { winsToClear, mcqWinRequired } = RULES.adventure;
  const wins = encounters.filter((e) => e.status === "defeated");

  const progress = concepts.map((c): ConceptProgress => {
    const own = wins.filter((e) => !e.isBoss && e.concept === c.slug);
    const mcqWin = own.some((e) => e.kind === "mcq");
    const cleared = own.length >= winsToClear && (mcqWin || !mcqWinRequired);
    return { slug: c.slug, name: c.name, wins: own.length, mcqWin, cleared };
  });

  const cleared = progress.filter((c) => c.cleared).length;
  return {
    concepts: progress,
    cleared,
    total: concepts.length,
    bossUnlocked: cleared === concepts.length,
    bossDefeated: wins.some((e) => e.isBoss),
  };
}
