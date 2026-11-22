"use client";

// sprites from Kenney's 1-Bit Pack; tile coordinates live in content/sprites.ts
import type { CSSProperties } from "react";
import { DEFAULT_ENEMY_COLOR, ENEMY_SPRITES, FALLBACK_ENEMY, ITEM_SPRITES, type SpriteTile } from "@/content/sprites";
import type { Enemy } from "@/lib/types";
import { cn } from "@/lib/utils";

const enemyTiles = ENEMY_SPRITES as Record<string, SpriteTile>;
const itemTiles = ITEM_SPRITES as Record<string, SpriteTile>;

// kept out of ENEMY_SPRITES so the model can't pick the game master's avatar as an enemy
const GAME_MASTER_TILE: SpriteTile = { col: 26, row: 7, words: "game master" };
export const GAME_MASTER_COLOR = "#7ED07A";

const ITEM_ALIASES: Record<string, string> = { "scroll-of-remembering": "scroll", hint: "candle" };

function tileStyle(tile: SpriteTile, size: number, color?: string): CSSProperties {
  return { "--s": `${size}px`, "--c": tile.col, "--r": tile.row, color } as CSSProperties;
}

// use the default color if the hex is invalid or its contrast against #12131a is under 3:1
const BACKGROUND = [0x12, 0x13, 0x1a];
function luminance([r, g, b]: number[]) {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
export function enemyColor(color: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return DEFAULT_ENEMY_COLOR;
  const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  const [hi, lo] = [luminance(rgb), luminance(BACKGROUND)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05) < 3 ? DEFAULT_ENEMY_COLOR : color;
}

export function MaskSprite({
  slug,
  color,
  size = 48,
  className,
  label,
}: {
  slug: string;
  color?: string;
  size?: number;
  className?: string;
  label?: string;
}) {
  const tile = enemyTiles[slug] ?? enemyTiles[FALLBACK_ENEMY];
  return (
    <span role="img" aria-label={label ?? slug} className={cn("sprite sprite-mask", className)} style={tileStyle(tile, size, color)} />
  );
}

export function GameMasterSprite({ size = 32 }: { size?: number }) {
  return (
    <span
      role="img"
      aria-label="Game master"
      className="sprite sprite-mask"
      style={tileStyle(GAME_MASTER_TILE, size, GAME_MASTER_COLOR)}
    />
  );
}

// an item with no tile gets an empty spacer of the same size
export function ItemSprite({ slug, size = 40, className }: { slug: string; size?: number; className?: string }) {
  const tile = itemTiles[slug] ?? itemTiles[ITEM_ALIASES[slug] ?? ""];
  if (!tile) return <span aria-hidden className={cn("inline-block shrink-0", className)} style={{ width: size, height: size }} />;
  return <span role="img" aria-label={slug} className={cn("sprite sprite-color", className)} style={tileStyle(tile, size)} />;
}

export function EnemyAvatar({ enemy, size = 64, box = 84 }: { enemy: Enemy; size?: number; box?: number }) {
  const color = enemyColor(enemy.color);
  return (
    <div
      className="grid shrink-0 place-items-center border-2 bg-card"
      style={{ width: box, height: box, borderColor: `color-mix(in srgb, ${color} 70%, transparent)` }}
    >
      <MaskSprite slug={enemy.sprite} color={color} size={size} label={enemy.name} />
    </div>
  );
}
