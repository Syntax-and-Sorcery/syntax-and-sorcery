import { RULES } from "./config";
import { levelForXp } from "./levels";

const SCROLL = "scroll-of-remembering";

// Normal enemies have a configurable chance to drop a scroll.
// Bosses award a fixed number of scrolls without a random roll.
export function rollLoot(enemy: { isBoss: boolean; difficulty: number }, random: () => number): string[] {
  if (enemy.isBoss) return Array(RULES.loot.bossScrolls).fill(SCROLL);
  return random() < RULES.loot.scrollChance ? [SCROLL] : [];
}

// Award one configured bundle of scrolls for every level gained.
// Losing XP or staying on the same level cannot award scrolls.
export function levelUpLoot(xpBefore: number, xpAfter: number): string[] {
  const levelsGained = Math.max(0, levelForXp(xpAfter) - levelForXp(xpBefore));
  return Array(levelsGained * RULES.loot.levelUpScrolls).fill(SCROLL);
}
