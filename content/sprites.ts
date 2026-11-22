// Kenney 1-Bit Pack sprite catalog, 49 x 22 tiles at 16px each
// col and row count from 0 at the top left
import type { Item } from "@/lib/types";

export interface SpriteTile {
  col: number;
  row: number;
  words: string; // what the game master matches against, e.g. "octopus, sea monster"
}

// drawn from the monochrome sheet as a CSS mask tinted with the enemy color
// the chicken at (26, 7) is the game master's avatar, so it's left out on purpose
export const ENEMY_SPRITES = {
  kraken: { col: 25, row: 8, words: "octopus, kraken, sea monster, tentacles" },
  serpent: { col: 28, row: 8, words: "snake, serpent, sea serpent, leviathan" },
  crocodile: { col: 29, row: 8, words: "crocodile, alligator, dragon, jaws" },
  crab: { col: 25, row: 5, words: "crab, giant crab, claws, pincers" },
  bat: { col: 26, row: 8, words: "bat, vampire bat, flying pest" },
  bear: { col: 30, row: 8, words: "bear, grizzly, wild beast" },
  hound: { col: 31, row: 7, words: "dog, hound, wolf, jackal" },
  spider: { col: 28, row: 5, words: "spider, giant spider, tarantula" },
  bee: { col: 26, row: 5, words: "bee, wasp, hornet, stinger" },
  beetle: { col: 30, row: 5, words: "beetle, scarab, bug, insect" },
  monster: { col: 28, row: 6, words: "monster, blob, beast, fangs" },
  slime: { col: 27, row: 8, words: "slime, blob, ooze, jelly" },
  cyclops: { col: 24, row: 9, words: "cyclops, one-eyed giant" },
  golem: { col: 30, row: 6, words: "golem, stone giant, construct" },
  ogre: { col: 24, row: 3, words: "ogre, troll, barbarian, brute" },
  goblin: { col: 29, row: 2, words: "goblin, orc, gremlin, hobgoblin" },
  imp: { col: 27, row: 2, words: "imp, devil, demon, trident" },
  flame: { col: 15, row: 10, words: "flame, fire spirit, fire elemental" },
  ufo: { col: 14, row: 19, words: "ufo, flying saucer, alien" },
  skeleton: { col: 29, row: 6, words: "skeleton, skeleton warrior, zombie, undead" },
  skull: { col: 34, row: 12, words: "skull, floating skull, death's head" },
  ghost: { col: 27, row: 6, words: "ghost, spirit, phantom, ghoul" },
  wraith: { col: 26, row: 6, words: "wraith, specter, banshee, shade" },
  wizard: { col: 24, row: 5, words: "wizard, mage, sorcerer, pointy hat" },
  witch: { col: 26, row: 9, words: "witch, gnome, pointy hat" },
  druid: { col: 24, row: 1, words: "druid, hermit, old sage, priest" },
  cultist: { col: 24, row: 2, words: "cultist, hooded monk, robed figure" },
  knight: { col: 28, row: 0, words: "knight, guard, armored soldier" },
  warrior: { col: 27, row: 0, words: "warrior, soldier, swordsman, mercenary" },
  viking: { col: 31, row: 0, words: "viking, raider, horned helmet, berserker" },
  pirate: { col: 31, row: 2, words: "pirate, buccaneer, captain, hook" },
  bandit: { col: 27, row: 4, words: "bandit, outlaw, cowboy, thief" },
  king: { col: 28, row: 3, words: "king, crown, ruler, tyrant" },
  queen: { col: 29, row: 3, words: "queen, crown, empress" },
  robot: { col: 31, row: 6, words: "robot, automaton, mech" },
  diver: { col: 27, row: 3, words: "deep-sea diver, diving helmet, astronaut" },
} as const satisfies Record<string, SpriteTile>;

// drawn from the colored sheet
export const ITEM_SPRITES = {
  scroll: { col: 33, row: 15, words: "scroll, parchment, message" },
  map: { col: 32, row: 15, words: "treasure map, map, chart" },
  book: { col: 45, row: 5, words: "book, tome, spellbook" },
  "potion-blue": { col: 32, row: 13, words: "blue potion, mana, flask" },
  "potion-green": { col: 33, row: 19, words: "green potion, poison, bottle" },
  "potion-white": { col: 33, row: 13, words: "white potion, elixir, flask" },
  "key-gold": { col: 32, row: 11, words: "gold key, key, unlock" },
  "key-blue": { col: 33, row: 11, words: "blue key, silver key, key" },
  "key-red": { col: 34, row: 11, words: "red key, key, unlock" },
  chest: { col: 8, row: 6, words: "chest, treasure chest, loot" },
  coin: { col: 41, row: 3, words: "coin, gold coin, doubloon" },
  coins: { col: 41, row: 4, words: "coins, gold, treasure pile" },
  "gem-red": { col: 34, row: 10, words: "ruby, red gem, crystal" },
  "gem-blue": { col: 33, row: 10, words: "sapphire, blue gem, crystal" },
  crown: { col: 43, row: 2, words: "crown, gold crown, royalty" },
  candle: { col: 4, row: 15, words: "candle, lit candle, light" },
  lantern: { col: 44, row: 4, words: "lantern, lamp, light" },
  sword: { col: 32, row: 7, words: "sword, blade, cutlass" },
  dagger: { col: 32, row: 6, words: "dagger, knife, blade" },
  axe: { col: 40, row: 7, words: "axe, hatchet, hand axe" },
  bow: { col: 37, row: 6, words: "bow, longbow, archery" },
  "shield-round": { col: 37, row: 2, words: "round shield, wooden shield, buckler" },
  "shield-kite": { col: 39, row: 4, words: "kite shield, heater shield, crest" },
  apple: { col: 33, row: 18, words: "apple, fruit, food" },
  cheese: { col: 34, row: 16, words: "cheese, wedge, food" },
} as const satisfies Record<string, SpriteTile>;

// what the inventory can hold, keyed by item_slug
export const ITEMS: Record<string, Item> = {
  "scroll-of-remembering": {
    slug: "scroll-of-remembering",
    name: "Scroll of Remembering",
    description: "Ask the game master one question about this fight. It doesn't cost XP.",
  },
};

export type EnemySprite = keyof typeof ENEMY_SPRITES;
export const SPRITE_SLUGS = Object.keys(ENEMY_SPRITES) as [EnemySprite, ...EnemySprite[]];

export const FALLBACK_ENEMY: EnemySprite = "monster";
// used in no-AI mode and when a color fails the 3:1 contrast check on the dark background
export const DEFAULT_ENEMY_COLOR = "#9E9E9E";

// no-AI mode's fixed sprites, which /api/offers also uses as enemy names
// typed as catalog slugs so a missing one fails the build instead of drawing the fallback monster
export const STORED_ENEMY_SPRITES = [
  "slime",
  "bat",
  "spider",
  "ghost",
  "goblin",
  "skeleton",
  "crab",
  "beetle",
] as const satisfies readonly EnemySprite[];
export const BOSS_ENEMY_SPRITE = "serpent" satisfies EnemySprite;
