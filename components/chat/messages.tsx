"use client";

// uses plain layouts instead of 8bitcn's dialogue component, which puts a heavy frame around every message
import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/8bit/spinner";
import { GameMasterSprite } from "@/components/game/Sprite";
import { cn } from "@/lib/utils";

export function GmMessage({ children, thinking }: { children?: ReactNode; thinking?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="grid size-10 shrink-0 place-items-center border-2 border-border bg-card">
        <GameMasterSprite size={32} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
        <span className="flex items-center gap-2">
          <span className="retro text-[9px] text-muted-foreground">Game master</span>
          {thinking && <Spinner variant="diamond" className="size-4 text-primary" aria-label="The game master is thinking" />}
        </span>
        {children}
      </div>
    </div>
  );
}

export function PlayerMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] border-2 border-ring/50 bg-secondary px-4 py-2.5 text-[15px] whitespace-pre-wrap">{children}</div>
    </div>
  );
}

export function EventLine({ children, tone = "ok" }: { children: ReactNode; tone?: "ok" | "muted" }) {
  return (
    <div className="flex justify-center">
      <span
        className={cn(
          "border-2 border-dashed px-3 py-1.5 text-center text-[13px]",
          tone === "ok" ? "border-ok/60 text-ok" : "border-border text-muted-foreground",
        )}
      >
        {children}
      </span>
    </div>
  );
}
