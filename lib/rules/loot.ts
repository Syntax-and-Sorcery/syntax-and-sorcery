if (random() < RULES.loot.scrollChance) {
    return [SCROLL];
  }

  return [];
}

// Give scrolls when a player levels up
export function levelUpLoot(
  xpBefore: number,
  xpAfter: number
): string[] {
  const oldLevel = levelForXp(xpBefore);
  const newLevel = levelForXp(xpAfter);

  const levelsGained = Math.max(0, newLevel - oldLevel);

  return Array(
    levelsGained * RULES.loot.levelUpScrolls
  ).fill(SCROLL);
}
