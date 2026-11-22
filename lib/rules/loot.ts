// TODO(T-03): loot drop calculations from RULES.loot

// normal enemies drop "scroll-of-remembering" with scrollChance; bosses drop bossScrolls
// use the passed random()
export function rollLoot(enemy: { isBoss: boolean; difficulty: number }, random: () => number): string[] {
  void enemy;
  void random;
  throw new Error("TODO");
}

// drops levelUpScrolls per level gained between xpBefore and xpAfter
export function levelUpLoot(xpBefore: number, xpAfter: number): string[] {
  void xpBefore;
  void xpAfter;
  throw new Error("TODO");
}
