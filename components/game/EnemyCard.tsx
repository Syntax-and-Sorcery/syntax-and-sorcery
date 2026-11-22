"use client";

// enemy offer cards, compact chips, and HP labels
// stats always load from the puzzle, never from model text
import { Badge } from "@/components/ui/8bit/badge";
import { Button } from "@/components/ui/8bit/button";
import { Spinner } from "@/components/ui/8bit/spinner";
import type { Enemy, PuzzleKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EnemyAvatar, MaskSprite, enemyColor } from "./Sprite";
import { Skulls, Tip } from "./bits";
import { xpFor } from "./rules";
import { KIND_LABEL, maxHp, usePuzzle } from "./usePuzzle";

export function HpLabel({ hp, max, kind }: { hp: number; max: number; kind: PuzzleKind }) {
  return (
    <Tip label={kind === "code" ? "1 HP = 1 hidden test" : "One right answer wins"} side="bottom">
      <span
        tabIndex={0}
        className="retro cursor-help text-[11px] whitespace-nowrap text-hp underline decoration-dashed decoration-2 underline-offset-[6px]"
      >
        {hp} / {max} HP
      </span>
    </Tip>
  );
}

export function EnemyChip({ enemy, puzzleId }: { enemy: Enemy; puzzleId: string }) {
  const { puzzle } = usePuzzle(puzzleId);
  return (
    <div className="flex w-fit max-w-full items-center gap-3 border-2 border-border bg-card py-1.5 pr-4 pl-2">
      <MaskSprite slug={enemy.sprite} color={enemyColor(enemy.color)} size={32} label={enemy.name} />
      <span className="retro text-[11px] leading-5">{enemy.name}</span>
      {puzzle && <Skulls value={puzzle.difficulty} size={12} />}
    </div>
  );
}

export function EnemyChoiceCard({
  enemy,
  puzzleId,
  isBoss = false,
  disabled,
  onFight,
}: {
  enemy: Enemy;
  puzzleId: string;
  isBoss?: boolean;
  disabled?: boolean;
  onFight: () => void;
}) {
  const { puzzle, error } = usePuzzle(puzzleId);
  const xp = puzzle ? xpFor({ kind: puzzle.kind, difficulty: puzzle.difficulty, isBoss, basicHintsUsed: 0 }) : null;
  return (
    <div className={cn("relative flex flex-col gap-4 border-2 bg-card p-4", isBoss ? "border-primary" : "border-ring/60")}>
      {isBoss && <Badge className="absolute -top-3 right-4 bg-hp text-[9px] text-white">Boss</Badge>}
      <div className="flex gap-3">
        <EnemyAvatar enemy={enemy} size={48} box={64} />
        <div className="flex min-w-0 flex-col gap-2 pt-1">
          <span className="retro text-[11px] leading-5 [overflow-wrap:anywhere]">{enemy.name}</span>
          {puzzle && <Skulls value={puzzle.difficulty} size={13} />}
        </div>
      </div>
      <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px]">
        {puzzle ? (
          <>
            <span className="text-muted-foreground">{KIND_LABEL[puzzle.kind]}</span>
            <span className="ml-auto flex gap-3 whitespace-nowrap">
              <span className="text-hp">{maxHp(puzzle)} HP</span>
              {xp !== null && <span className="text-xp">+{xp} XP</span>}
            </span>
          </>
        ) : error ? null : (
          <Spinner variant="diamond" className="size-4 text-muted-foreground" />
        )}
      </div>
      <Button
        variant={isBoss ? "default" : "outline"}
        size="sm"
        className="mx-1.5 mb-1 text-[10px]"
        disabled={disabled || !puzzle}
        onClick={onFight}
      >
        Fight
      </Button>
    </div>
  );
}
