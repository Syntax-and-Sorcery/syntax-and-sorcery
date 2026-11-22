import { describe, expect, it } from "vitest";
import { xpForDefeat } from "./xp";

describe("xpForDefeat", () => {
  it.each([
    ["mcq", 10],
    ["short", 15],
    ["code", 30],
  ] as const)("awards the base reward for a level-one %s puzzle", (kind, expected) => {
    expect(xpForDefeat({ kind, difficulty: 1, isBoss: false, basicHintsUsed: 0 })).toBe(expected);
  });

  it("increases XP by 50% per difficulty level above one", () => {
    expect(xpForDefeat({ kind: "code", difficulty: 3, isBoss: false, basicHintsUsed: 0 })).toBe(60);
  });

  it("multiplies boss rewards by three", () => {
    expect(xpForDefeat({ kind: "short", difficulty: 2, isBoss: true, basicHintsUsed: 0 })).toBe(68);
  });

  it("deducts 25% of the reward per basic hint", () => {
    expect(xpForDefeat({ kind: "code", difficulty: 2, isBoss: false, basicHintsUsed: 1 })).toBe(34);
    expect(xpForDefeat({ kind: "code", difficulty: 2, isBoss: false, basicHintsUsed: 2 })).toBe(23);
  });

  it("never awards negative XP after many hints", () => {
    expect(xpForDefeat({ kind: "mcq", difficulty: 1, isBoss: false, basicHintsUsed: 5 })).toBe(0);
  });

  it("treats a negative hint count as zero", () => {
    expect(xpForDefeat({ kind: "mcq", difficulty: 1, isBoss: false, basicHintsUsed: -1 })).toBe(10);
  });

  it("rounds the final XP reward to an integer", () => {
    expect(xpForDefeat({ kind: "mcq", difficulty: 2, isBoss: false, basicHintsUsed: 1 })).toBe(11);
  });
});

describe("TC-FR-24 XP with and without hints", () => {
  const kinds = ["mcq", "short", "code"] as const;

  it.each(kinds)("awards less XP for %s puzzles solved with a hint than without", (kind) => {
    for (const isBoss of [false, true]) {
      const clean = xpForDefeat({ kind, difficulty: 3, isBoss, basicHintsUsed: 0 });
      const hinted = xpForDefeat({ kind, difficulty: 3, isBoss, basicHintsUsed: 1 });
      expect(clean).toBeGreaterThan(0);
      expect(hinted).toBeGreaterThan(0);
      expect(hinted).toBeLessThan(clean);
    }
  });

  it("never awards more XP for using more hints", () => {
    const xp = [0, 1, 2, 3, 4, 5].map((basicHintsUsed) => xpForDefeat({ kind: "code", difficulty: 2, isBoss: false, basicHintsUsed }));
    for (let i = 1; i < xp.length; i++) expect(xp[i]).toBeLessThanOrEqual(xp[i - 1]);
  });
});
