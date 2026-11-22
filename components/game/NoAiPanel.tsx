"use client";

// no-AI mode: lessons and stored enemies, so the adventure goes on without the game master
import { BookOpen, Check, Moon, Reload, WarningDiamond } from "pixelarticons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/8bit/alert";
import { Button } from "@/components/ui/8bit/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/8bit/item";
import { xpForDefeat } from "@/lib/rules/xp";
import type { AdventureState } from "@/lib/rules/adventure-state";
import type { Concept, StoredEnemy } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MaskSprite, enemyColor } from "./Sprite";
import { Skulls } from "./bits";
import { KIND_LABEL } from "./usePuzzle";

type Group = { name: string; cleared: boolean; enemies: StoredEnemy[] };

export function NoAiPanel({
  reason,
  lessons,
  enemies,
  state,
  onOpenLesson,
  onFight,
  onRetry,
}: {
  reason: "ai_unavailable" | "ai_limit";
  lessons: Concept[];
  enemies: StoredEnemy[];
  state: AdventureState;
  onOpenLesson: (slug: string) => void;
  onFight: (enemy: StoredEnemy) => void;
  onRetry: () => void;
}) {
  const limit = reason === "ai_limit";
  const cleared = new Set(state.concepts.filter((c) => c.cleared).map((c) => c.slug));
  const Icon = limit ? Moon : WarningDiamond;

  // boss first, then concepts still to clear, cleared ones last
  const groups: Group[] = [
    { name: "Boss", cleared: false, enemies: enemies.filter((e) => e.isBoss) },
    ...[...state.concepts]
      .sort((a, b) => Number(a.cleared) - Number(b.cleared))
      .map((c) => ({ name: c.name, cleared: c.cleared, enemies: enemies.filter((e) => !e.isBoss && e.concept === c.slug) })),
  ].filter((g) => g.enemies.length > 0);

  return (
    <div className="@container flex flex-col gap-7">
      <Alert font="normal" className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
        <Icon width={24} height={24} className="shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
          <AlertTitle className="retro line-clamp-none text-[11px] leading-5">
            {limit ? "The game master is resting" : "The game master isn't responding"}
          </AlertTitle>
          <AlertDescription className="text-[15px] text-foreground">
            {limit && "You've used today's game master turns. They reset tomorrow. "}
            You can still read lessons and fight ready-made enemies.
          </AlertDescription>
        </div>
        {!limit && (
          <Button variant="outline" size="sm" className="mx-1.5 gap-2 px-3 text-[10px]" onClick={onRetry}>
            <Reload width={14} height={14} />
            Try again
          </Button>
        )}
      </Alert>

      <div className="grid gap-8 @2xl:grid-cols-[230px_1fr] @2xl:gap-10">
        <section className="flex flex-col gap-3">
          <h2 className="retro text-[10px] text-muted-foreground">Lessons</h2>
          <ItemGroup>
            {lessons.map((c) => (
              <Item key={c.slug} asChild size="sm" className="rounded-none border-b border-border px-0 py-3 text-left hover:text-primary">
                <button type="button" onClick={() => onOpenLesson(c.slug)}>
                  <ItemMedia>
                    <BookOpen width={16} height={16} className="text-primary" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-[10px] leading-4">{c.name}</ItemTitle>
                  </ItemContent>
                  {cleared.has(c.slug) && <Check width={14} height={14} className="text-ok" aria-label="Cleared" />}
                </button>
              </Item>
            ))}
          </ItemGroup>
        </section>

        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="retro text-[10px] text-muted-foreground">Ready-made enemies</h2>
          {groups.length === 0 && <p className="text-sm text-muted-foreground">No ready-made enemies here yet.</p>}
          {groups.map((group, i) => (
            <div key={group.name}>
              <h3 className={cn("py-1 text-sm", i === 0 && !group.cleared && "text-primary", group.cleared && "text-muted-foreground")}>
                {group.name}
                {group.cleared && <span className="ml-2 text-xs text-ok">Cleared</span>}
              </h3>
              <ItemGroup>
                {group.enemies.map((enemy) => (
                  <EnemyRow key={enemy.puzzleId} enemy={enemy} onFight={() => onFight(enemy)} />
                ))}
              </ItemGroup>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function EnemyRow({ enemy, onFight }: { enemy: StoredEnemy; onFight: () => void }) {
  const xp = xpForDefeat({ kind: enemy.kind, difficulty: enemy.difficulty, isBoss: enemy.isBoss, basicHintsUsed: 0 });
  return (
    <Item size="sm" font="normal" className="flex-nowrap rounded-none border-b border-border px-0 py-2.5">
      <ItemMedia>
        <MaskSprite slug={enemy.sprite} color={enemyColor(enemy.color)} size={32} label={enemy.name} />
      </ItemMedia>
      <ItemContent className="min-w-0 gap-1">
        <ItemTitle className="retro text-[10px]">{enemy.name}</ItemTitle>
        <ItemDescription className="flex items-center gap-3 text-[13px]">
          {KIND_LABEL[enemy.kind]}
          <Skulls value={enemy.difficulty} size={12} />
        </ItemDescription>
      </ItemContent>
      <ItemActions className="gap-3 text-[13px] whitespace-nowrap">
        <span className="flex flex-col items-end">
          <span className="text-hp">{enemy.hiddenTestCount} HP</span>
          <span className="text-xp">+{xp} XP</span>
        </span>
        <Button variant={enemy.isBoss ? "default" : "outline"} size="sm" className="mx-1.5 px-3 text-[9px]" onClick={onFight}>
          Fight
        </Button>
      </ItemActions>
    </Item>
  );
}
