// placeholder tuning constants for game rules
export const RULES = {
  xp: { base: { mcq: 10, short: 15, code: 30 }, perDifficulty: 0.5, bossMultiplier: 3, basicHintPenalty: 0.25 },
  levels: { firstLevelXp: 100, growth: 1.5 },
  loot: { scrollChance: 0.2, bossScrolls: 1, levelUpScrolls: 1 },
  difficulty: { levelBands: [3, 6, 9, 12], recentWindow: 5, shift: { gentle: -1, normal: 0, brutal: 1 } },
  adventure: { winsToClear: 2, mcqWinRequired: true },
  progress: { trendWindow: 5, trendPoints: 10 },
} as const;
