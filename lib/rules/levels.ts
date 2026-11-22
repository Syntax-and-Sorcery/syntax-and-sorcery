import { RULES } from "./config";

// steps are rounded so thresholds and the XP bar stay whole numbers
function stepAfter(level: number): number {
  const { firstLevelXp, growth } = RULES.levels;
  return Math.round(firstLevelXp * growth ** (level - 1));
}

export function levelProgress(xp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
  let level = 1;
  let into = Math.max(0, xp);
  while (into >= stepAfter(level)) {
    into -= stepAfter(level);
    level++;
  }
  return { level, xpIntoLevel: into, xpForNextLevel: stepAfter(level) };
}

// level 1 at 0 XP, level 2 at firstLevelXp, and each step after scales by growth
export function levelForXp(xp: number): number {
  return levelProgress(xp).level;
}
