import { describe, expect, it } from "vitest";
import type { EncounterStatus } from "@/lib/types";
import { targetDifficulty } from "./difficulty";

const fights = (status: EncounterStatus, count: number, basicHints = 0) => Array.from({ length: count }, () => ({ status, basicHints }));

describe("targetDifficulty", () => {
  it("raises the target as the player levels up", () => {
    expect(targetDifficulty(10, [], "normal")).toBeGreaterThan(targetDifficulty(1, [], "normal"));
  });

  it("goes up after clean wins and down after losses", () => {
    const base = targetDifficulty(5, [], "normal");
    expect(targetDifficulty(5, fights("defeated", 5), "normal")).toBeGreaterThan(base);
    expect(targetDifficulty(5, fights("lost", 5), "normal")).toBeLessThan(base);
  });

  it("doesn't count wins that needed hints as clean", () => {
    expect(targetDifficulty(5, fights("defeated", 5, 1), "normal")).toBeLessThan(targetDifficulty(5, fights("defeated", 5), "normal"));
  });

  it("looks only at the most recent finished fights", () => {
    const recentWins = [...fights("active", 3), ...fights("defeated", 5), ...fights("lost", 10)];
    expect(targetDifficulty(5, recentWins, "normal")).toBe(targetDifficulty(5, fights("defeated", 5), "normal"));
  });

  it("shifts with the player's difficulty preference", () => {
    const [gentle, normal, brutal] = (["gentle", "normal", "brutal"] as const).map((p) => targetDifficulty(5, [], p));
    expect(gentle).toBeLessThan(normal);
    expect(brutal).toBeGreaterThan(normal);
  });

  it("stays between 1 and 5", () => {
    expect(targetDifficulty(1, fights("lost", 5), "gentle")).toBe(1);
    expect(targetDifficulty(99, fights("defeated", 5), "brutal")).toBe(5);
  });
});
