import { describe, expect, it, vi } from "vitest";
import { RULES } from "./config";
import { levelUpLoot, rollLoot } from "./loot";

const SCROLL = "scroll-of-remembering";
const normal = { isBoss: false, difficulty: 1 };
const boss = { isBoss: true, difficulty: 5 };

describe("rollLoot", () => {
  it("drops a scroll when the random roll is below the configured chance", () => {
    expect(rollLoot(normal, () => 0)).toEqual([SCROLL]);
    expect(rollLoot(normal, () => RULES.loot.scrollChance - 0.001)).toEqual([SCROLL]);
  });

  it("drops nothing when the roll meets or exceeds the threshold", () => {
    expect(rollLoot(normal, () => RULES.loot.scrollChance)).toEqual([]);
    expect(rollLoot(normal, () => 0.99)).toEqual([]);
  });

  it("uses the supplied random function exactly once for a normal enemy", () => {
    const random = vi.fn(() => 0.1);
    rollLoot(normal, random);
    expect(random).toHaveBeenCalledTimes(1);
  });

  it("guarantees boss scrolls and never rolls randomness", () => {
    const random = vi.fn(() => 0.99);
    expect(rollLoot(boss, random)).toEqual(Array(RULES.loot.bossScrolls).fill(SCROLL));
    expect(random).not.toHaveBeenCalled();
  });

  it("does not change a normal enemy's drop chance based on difficulty", () => {
    expect(rollLoot({ isBoss: false, difficulty: 5 }, () => 0.1)).toEqual([SCROLL]);
  });
});

describe("levelUpLoot", () => {
  it("does not award scrolls when XP grows without gaining a level", () => {
    expect(levelUpLoot(10, 99)).toEqual([]);
  });

  it("awards level-up scrolls exactly at the first threshold", () => {
    expect(levelUpLoot(99, 100)).toEqual(Array(RULES.loot.levelUpScrolls).fill(SCROLL));
  });

  it("awards scrolls for each level crossed in one XP gain", () => {
    // Level 2 starts at 100 XP, level 3 at 250 XP, and level 4 at 475 XP.
    expect(levelUpLoot(0, 475)).toEqual(Array(3 * RULES.loot.levelUpScrolls).fill(SCROLL));
  });

  it("does not award scrolls for unchanged or decreasing XP", () => {
    expect(levelUpLoot(100, 100)).toEqual([]);
    expect(levelUpLoot(250, 99)).toEqual([]);
  });

  it("treats XP below zero as level one, matching levelForXp", () => {
    expect(levelUpLoot(-10, 100)).toEqual(Array(RULES.loot.levelUpScrolls).fill(SCROLL));
  });
});
