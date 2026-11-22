"use client";

import type { ReactNode } from "react";
import { Skull } from "pixelarticons/react";
import { ResizableHandle } from "@/components/ui/8bit/resizable";
import { Spinner } from "@/components/ui/8bit/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/8bit/tooltip";
import XpBar from "@/components/ui/8bit/xp-bar";
import { cn } from "@/lib/utils";
import type { LevelInfo } from "./rules";

// 8bitcn's TooltipContent renders an inline wrapper div, so isolate each Tooltip in its own span
export function Tip({
  label,
  children,
  side = "top",
}: {
  label: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <span className="inline-flex">
      <Tooltip>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent side={side} sideOffset={10} className="text-[10px]">
          {label}
        </TooltipContent>
      </Tooltip>
    </span>
  );
}

export function Skulls({ value, max = 5, size = 14 }: { value: number; max?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Difficulty ${value} of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Skull key={i} width={size} height={size} className={i < value ? "text-foreground" : "text-foreground/20"} />
      ))}
    </span>
  );
}

// react-resizable-panels v4 sets aria-orientation="horizontal" on handles inside a vertical group
const handle = cn(
  "w-[2px] bg-border dark:bg-border after:w-3 *:first:hidden *:last:bg-panel",
  "aria-[orientation=horizontal]:h-[2px] aria-[orientation=horizontal]:w-full",
  "aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:top-1/2 aria-[orientation=horizontal]:after:h-3",
  "aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2",
  "aria-[orientation=horizontal]:*:last:h-[12px] aria-[orientation=horizontal]:*:last:w-[20px]",
);

// paired with plain shadcn panels because 8bitcn's panel group adds an unwanted outer frame
export function SplitHandle() {
  return <ResizableHandle withHandle className={handle} />;
}

export function LevelBar({ info, className, barClassName }: { info: LevelInfo; className?: string; barClassName?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="retro text-[10px]">Level {info.level}</span>
        <span className="retro text-[10px] text-xp">
          {info.xp} / {info.nextXp} XP
        </span>
      </div>
      <XpBar value={info.percent} className={cn("h-4", barClassName)} />
    </div>
  );
}

export function Loading({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-1 items-center justify-center py-24", className)}>
      <Spinner variant="diamond" className="size-8 text-primary" />
    </div>
  );
}

export function topicOf(slug: string): string {
  return slug
    .split("-")
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
