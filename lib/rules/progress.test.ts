import { describe, expect, it } from "vitest";
import type { EncounterStatus } from "@/lib/types";
import { conceptStats, trendBetween } from "./progress";

const concepts = [{ slug: "loops", name: "Loops" }, { slug: "arrays", name: "Arrays" }];
const fights = (concept: string, statuses: EncounterStatus[], isBoss = false) => statuses.map((status) => ({ concept, status, isBoss }));
const won = (n: number): EncounterStatus[] => Array(n).fill("defeated");
const lost = (n: number): EncounterStatus[] => Array(n).fill("lost");

describe("trendBetween", () => {
  it("returns up or down only for a clear change in win rate, otherwise flat", () => {
    expect(trendBetween(20, 80)).toBe("up");
    expect(trendBetween(80, 20)).toBe("down");
    expect(trendBetween(50, 52)).toBe("flat");
  });
});

describe("conceptStats", () => {
  it("counts finished fights and wins per concept, leaving out bosses and active fights", () => {
    const stats = conceptStats(concepts, [
      ...fights("loops", ["defeated", "lost", "active", "fled"]),
      ...fights("loops", won(3), true),
    ]);
    expect(stats[0]).toMatchObject({ slug: "loops", fights: 3, won: 1 });
    expect(stats[1]).toMatchObject({ slug: "arrays", fights: 0, won: 0 });
  });

  it("lists a repeated concept once", () => {
    expect(conceptStats([...concepts, concepts[0]], [])).toHaveLength(concepts.length);
  });

  it("has no trend until there are enough fights", () => {
    expect(conceptStats(concepts, fights("loops", won(9)))[0].trend).toBeNull();
  });

  it("compares the latest window of fights with the window before it", () => {
    expect(conceptStats(concepts, fights("loops", [...lost(5), ...won(5)]))[0].trend).toBe("up");
    expect(conceptStats(concepts, fights("loops", [...won(5), ...lost(5)]))[0].trend).toBe("down");
    expect(conceptStats(concepts, fights("loops", [...lost(20), ...won(10)]))[0].trend).toBe("flat");
  });
});
