import { describe, expect, it } from "vitest";
import type { Concept, EncounterStatus, PuzzleKind } from "@/lib/types";
import { adventureState } from "./adventure-state";

const concepts: Concept[] = [
  { slug: "loops", name: "Loops", description: "", lesson: "" },
  { slug: "arrays", name: "Arrays", description: "", lesson: "" },
];
const fight = (concept: string, kind: PuzzleKind, status: EncounterStatus = "defeated", isBoss = false) => ({ concept, kind, status, isBoss });
const clearBoth = [fight("loops", "mcq"), fight("loops", "code"), fight("arrays", "mcq"), fight("arrays", "short")];

describe("TC-FR-27 adventure progress is rebuilt from saved fights", () => {
  it("starts with nothing cleared and the boss locked", () => {
    const state = adventureState(concepts, []);
    expect(state).toMatchObject({ cleared: 0, total: concepts.length, bossUnlocked: false, bossDefeated: false });
    expect(state.concepts.map((c) => c.slug)).toEqual(["loops", "arrays"]);
  });

  it("clears a concept after enough wins including an MCQ win", () => {
    const [loops] = adventureState(concepts, [fight("loops", "mcq"), fight("loops", "code")]).concepts;
    expect(loops).toMatchObject({ wins: 2, mcqWin: true, cleared: true });
  });

  it("doesn't clear a concept without an MCQ win", () => {
    const [loops] = adventureState(concepts, [fight("loops", "code"), fight("loops", "code"), fight("loops", "short")]).concepts;
    expect(loops.cleared).toBe(false);
  });

  it("counts only won fights", () => {
    const [loops] = adventureState(concepts, [fight("loops", "mcq", "lost"), fight("loops", "code", "fled"), fight("loops", "code", "active")]).concepts;
    expect(loops.wins).toBe(0);
  });

  it("unlocks the boss only when every concept is cleared", () => {
    expect(adventureState(concepts, clearBoth.slice(0, 3)).bossUnlocked).toBe(false);
    expect(adventureState(concepts, clearBoth).bossUnlocked).toBe(true);
  });

  it("doesn't count boss wins toward a concept and marks the boss defeated", () => {
    const state = adventureState(concepts, [...clearBoth, fight("loops", "code", "defeated", true)]);
    expect(state.concepts[0].wins).toBe(2);
    expect(state.bossDefeated).toBe(true);
  });
});
