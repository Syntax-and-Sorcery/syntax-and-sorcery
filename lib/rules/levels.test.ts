import { describe, expect, it } from "vitest";
import { levelForXp, levelProgress } from "./levels";

describe("levels", () => {
  it("starts every player at level one", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(-50)).toBe(1);
  });

  it("never lowers the level as XP grows", () => {
    let last = 1;
    for (let xp = 0; xp <= 5_000; xp += 25) {
      const level = levelForXp(xp);
      expect(level).toBeGreaterThanOrEqual(last);
      last = level;
    }
    expect(last).toBeGreaterThan(1);
  });

  it("makes each level take more XP than the one before", () => {
    const steps = [1, 2, 3, 4, 5].map((level) => {
      let xp = 0;
      while (levelForXp(xp) < level) xp++;
      return levelProgress(xp).xpForNextLevel;
    });
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
  });

  it("keeps xpIntoLevel within xpForNextLevel as whole numbers", () => {
    for (const xp of [0, 99, 100, 101, 400, 2_000]) {
      const p = levelProgress(xp);
      expect(p.xpIntoLevel).toBeGreaterThanOrEqual(0);
      expect(p.xpIntoLevel).toBeLessThan(p.xpForNextLevel);
      expect(Number.isInteger(p.xpForNextLevel)).toBe(true);
    }
  });

  it("levels up exactly when XP reaches the threshold", () => {
    const { xpForNextLevel } = levelProgress(0);
    expect(levelForXp(xpForNextLevel - 1)).toBe(1);
    expect(levelForXp(xpForNextLevel)).toBe(2);
  });
});
