"use client";

import type { ReactNode } from "react";
import { Sword } from "pixelarticons/react";
import { Button } from "@/components/ui/8bit/button";
import { Spinner } from "@/components/ui/8bit/spinner";
import { GameMasterSprite, ItemSprite } from "@/components/game/Sprite";
import { Tip } from "@/components/game/bits";
import { itemName } from "./fight";

export function SubmitButton({ running, disabled, onClick }: { running?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <Tip label="Runs the hidden tests">
      <Button className="gap-2 px-3 text-[10px] sm:px-5 sm:text-[11px]" disabled={running || disabled} onClick={onClick}>
        {running ? <Spinner variant="diamond" className="size-4" /> : <Sword width={16} height={16} />}
        Submit
      </Button>
    </Tip>
  );
}

export function SubmitFeedback({ feedback }: { feedback: string | "loading" }) {
  return (
    <div className="flex gap-3 border-2 border-l-4 border-border border-l-primary bg-card px-3 py-2.5" aria-live="polite">
      <div className="grid size-8 shrink-0 place-items-center border-2 border-border bg-background">
        <GameMasterSprite size={24} />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="retro text-[9px] text-muted-foreground">Game master</span>
        {feedback === "loading" ? (
          <Spinner variant="diamond" className="my-0.5 size-4 text-primary" aria-label="The game master is thinking" />
        ) : (
          <p className="text-sm leading-relaxed">{feedback}</p>
        )}
      </div>
    </div>
  );
}

export function FightError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="border-l-4 border-hp bg-hp/10 px-3 py-2.5 text-sm">
      {children}
    </p>
  );
}

export function Victory({ enemyName, xp, items }: { enemyName: string; xp: number; items: string[] }) {
  return (
    <div className="flex flex-col items-start gap-4" aria-live="polite">
      <span className="border-2 border-dashed border-ok/60 px-3 py-1.5 text-[13px] text-ok">
        {enemyName} is defeated. +{xp} XP
      </span>
      {items.map((slug, i) => (
        <div key={i} className="flex w-fit items-center gap-3 border-2 border-primary/70 bg-primary/10 py-2 pr-4 pl-2.5">
          <ItemSprite slug={slug} size={32} />
          <span className="text-sm">Found a {itemName(slug)}</span>
        </div>
      ))}
    </div>
  );
}
