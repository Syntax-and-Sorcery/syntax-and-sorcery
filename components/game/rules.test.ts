import { afterEach, describe, expect, it, vi } from "vitest";
import { adventureState } from "@/lib/rules/adventure-state";
import { levelForXp, levelProgress } from "@/lib/rules/levels";
import { xpForDefeat } from "@/lib/rules/xp";
import type { Concept } from "@/lib/types";
import { completedState, emptyState, levelInfo, lootFor, stateOf, xpFor } from "./rules";

vi.mock("@/lib/rules/xp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rules/xp")>();
  return { xpForDefeat: vi.fn(actual.xpForDefeat) };
});

afterEach(() => vi.restoreAllMocks());

const concepts: Concept[] = [{ slug: "loops", name: "Loops", description: "", lesson: "" }];
const input = { kind: "code" as const, difficulty: 2, isBoss: false, basicHintsUsed: 0 };

describe("levelInfo", () => {
  it("returns the level, a 0 to 100 progress percent, and the next-level XP total", () => {
    for (const xp of [0, 50, 100, 260, 1_000]) {
      const info = levelInfo(xp);
      expect(info.level).toBe(levelForXp(xp));
      expect(info.percent).toBeGreaterThanOrEqual(0);
      expect(info.percent).toBeLessThan(100);
      expect(info.nextXp).toBeGreaterThan(xp);
      expect(levelForXp(info.nextXp)).toBe(info.level + 1);
    }
    expect(levelInfo(levelProgress(0).xpForNextLevel / 2).percent).toBe(50);
  });
});

describe("xpFor", () => {
  it("matches xpForDefeat", () => {
    expect(xpFor(input)).toBe(xpForDefeat(input));
  });

  it("returns null and warns once when xpForDefeat throws a TODO stub error", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(xpForDefeat).mockImplementation(() => {
      throw new Error("TODO");
    });
    expect(xpFor(input)).toBeNull();
    expect(xpFor(input)).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("rethrows non-TODO errors", () => {
    vi.mocked(xpForDefeat).mockImplementationOnce(() => {
      throw new Error("broken");
    });
    expect(() => xpFor(input)).toThrow("broken");
  });
});

describe("lootFor", () => {
  it("awards boss loot and adds level-up loot when XP crosses a level", () => {
    const boss = lootFor({ isBoss: true, difficulty: 5 }, 0, 0);
    expect(boss.length).toBeGreaterThan(0);
    expect(lootFor({ isBoss: true, difficulty: 5 }, 0, 500).length).toBeGreaterThan(boss.length);
  });
});

describe("adventure state helpers", () => {
  it("matches adventureState for emptyState and stateOf, and marks everything done in completedState", () => {
    expect(emptyState(concepts)).toEqual(adventureState(concepts, []));
    expect(stateOf(concepts, [])).toEqual(adventureState(concepts, []));
    const done = completedState(concepts);
    expect(done.concepts.every((c) => c.cleared)).toBe(true);
    expect(done).toMatchObject({ cleared: concepts.length, bossUnlocked: true, bossDefeated: true });
  });
});
