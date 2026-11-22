// fights won per concept and their trend for the progress page (T-26)
import { RULES } from "@/lib/rules/config";
import type { Concept, Encounter, ProgressStats, Trend } from "@/lib/types";

export type ConceptStats = ProgressStats["concepts"][number];

// before and after are win rates in percent
export function trendBetween(before: number, after: number): Trend {
  const { trendPoints } = RULES.progress;
  if (after - before >= trendPoints) return "up";
  if (before - after >= trendPoints) return "down";
  return "flat";
}

// encounters are the player's fights in one track, in the order they ended
// hints don't matter here
// a fight is either won or not
export function conceptStats(
  concepts: Pick<Concept, "slug" | "name">[],
  encounters: Pick<Encounter, "concept" | "status" | "isBoss">[],
): ConceptStats[] {
  const window = RULES.progress.trendWindow;
  const rate = (wins: boolean[]) => (wins.filter(Boolean).length * 100) / wins.length;
  const seen = new Set<string>();

  return concepts.flatMap((c): ConceptStats[] => {
    if (seen.has(c.slug)) return [];
    seen.add(c.slug);
    // boss fights test the whole adventure, so they don't count for any one concept
    const wins = encounters
      .filter((e) => !e.isBoss && e.concept === c.slug && e.status !== "active")
      .map((e) => e.status === "defeated");
    const trend =
      wins.length < window * 2 ? null : trendBetween(rate(wins.slice(-window * 2, -window)), rate(wins.slice(-window)));
    return [{ slug: c.slug, name: c.name, fights: wins.length, won: wins.filter(Boolean).length, trend }];
  });
}
