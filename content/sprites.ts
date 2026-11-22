// TODO(T-25): Kenney 1-Bit Pack sprite catalog, 49 x 22 tiles at 16px each

export interface SpriteTile {
  col: number;
  row: number;
  words: string; // what the game master matches against, e.g. "octopus, sea monster"
}

// drawn from the monochrome sheet as a CSS mask tinted with the enemy color
// TODO(T-25)
export const ENEMY_SPRITES = {
  monster: { col: 28, row: 6, words: "monster, blob, beast, fangs" },
} as const satisfies Record<string, SpriteTile>;

// drawn from the colored sheet
// TODO(T-25)
export const ITEM_SPRITES = {} as const satisfies Record<string, SpriteTile>;

export type EnemySprite = keyof typeof ENEMY_SPRITES;
export const SPRITE_SLUGS = Object.keys(ENEMY_SPRITES) as [EnemySprite, ...EnemySprite[]];

export const FALLBACK_ENEMY: EnemySprite = "monster";
// used in no-AI mode and when a color fails the 3:1 contrast check on the dark background
export const DEFAULT_ENEMY_COLOR = "#9E9E9E";

// no-AI mode's fixed sprites, which /api/offers also uses as enemy names (T-22)
// keep these slugs in the catalog, or the cards draw the fallback monster under a name like "Crab"
export const STORED_ENEMY_SPRITES = ["slime", "bat", "spider", "ghost", "goblin", "skeleton", "crab", "beetle"] as const;
export const BOSS_ENEMY_SPRITE = "serpent";
