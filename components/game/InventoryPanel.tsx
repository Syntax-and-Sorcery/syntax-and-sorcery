"use client";

// the Hint slot is always first and never runs out, so all help lives in one grid
import { useState } from "react";
import { Infinity as InfinityIcon } from "pixelarticons/react";
import { Button } from "@/components/ui/8bit/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/8bit/popover";
import { RULES } from "@/lib/rules/config";
import type { InventoryEntry, Item } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useShell } from "./AdventureScreen";
import { ItemSprite } from "./Sprite";

const HINT: Item = {
  slug: "hint",
  name: "Hint",
  plus: ["A short nudge toward the answer"],
  minus: `Costs ${Math.round(RULES.xp.basicHintPenalty * 100)}% of this fight's XP`,
};

export function InventoryPanel({
  entries,
  inFight,
  aiDown,
  active,
  onUse,
}: {
  entries: InventoryEntry[];
  inFight: boolean;
  aiDown: boolean;
  active?: string; // slug of the item in use, so its slot stays lit
  onUse: (slug: string) => void;
}) {
  const { desktop } = useShell();
  const [open, setOpen] = useState<string | null>(null);
  const slots = [
    { item: HINT, badge: <InfinityIcon width={10} height={10} /> },
    ...entries.map((e) => ({ item: e.item, badge: e.quantity })),
  ];
  // the sidebar pads to a 3x3 grid, the mobile footer shows only what's held
  const empty = desktop ? 9 - slots.length : 0;

  return (
    <div className={desktop ? "grid grid-cols-3 gap-3" : "flex gap-2"}>
      {slots.map(({ item, badge }) => (
        <Popover key={item.slug} open={open === item.slug} onOpenChange={(o) => setOpen(o ? item.slug : null)}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={item.name}
              className={cn(
                "relative grid aspect-square place-items-center border-2 bg-card",
                desktop ? "w-full" : "w-12",
                open === item.slug || active === item.slug ? "border-primary outline-2 outline-offset-2 outline-primary" : "border-ring/60",
                aiDown && "border-border opacity-35 grayscale",
              )}
            >
              <ItemSprite slug={item.slug} size={desktop ? 40 : 32} />
              <span className="absolute right-0.5 bottom-0.5 flex h-3.5 min-w-3.5 items-center justify-center bg-foreground px-0.5 text-[10px] font-bold text-background">
                {badge}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent font="normal" side={desktop ? "bottom" : "top"} align="start" sideOffset={14} className="w-[236px] gap-3 p-4">
            <div className="flex items-center gap-2.5">
              <ItemSprite slug={item.slug} size={32} />
              <span className="retro text-[12px] leading-5 text-primary">{item.name}</span>
            </div>
            <ul className="flex flex-col gap-1.5 text-sm leading-snug font-bold">
              {item.plus.map((line) => (
                <li key={line} className="flex gap-2">
                  <span>+</span>
                  <span>{line}</span>
                </li>
              ))}
              <li className="flex gap-2 text-hp">
                <span>−</span>
                <span>{item.minus}</span>
              </li>
            </ul>
            <div className="flex justify-end pt-1 pr-1.5 pb-1">
              <Button
                size="sm"
                className="px-4 text-[11px]"
                disabled={!inFight || aiDown}
                onClick={() => {
                  setOpen(null);
                  onUse(item.slug);
                }}
              >
                Use
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <div key={i} className="aspect-square border-2 border-dashed border-border" />
      ))}
    </div>
  );
}
