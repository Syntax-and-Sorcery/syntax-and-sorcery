"use client";

import Link from "next/link";
import { Lock } from "pixelarticons/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/8bit/accordion";
import { Button } from "@/components/ui/8bit/button";
import { Card } from "@/components/ui/8bit/card";
import { getGameData } from "@/lib/data";
import type { AdventureState } from "@/lib/rules/adventure-state";
import type { AdventureWithProgress } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConceptBlocks } from "./ConceptBlocks";
import { topicOf } from "./bits";
import { completedState, emptyState, stateOf } from "./rules";

export interface MapRow {
  adventure: AdventureWithProgress;
  state: AdventureState;
}

export function loadMapRows(adventures: AdventureWithProgress[]): Promise<MapRow[]> {
  const data = getGameData();
  return Promise.all(
    adventures.map(async (adventure): Promise<MapRow> => {
      if (adventure.status === "completed") return { adventure, state: completedState(adventure.concepts) };
      // only an adventure in progress has a run, and reading progress must not start one
      if (adventure.status !== "in_progress") return { adventure, state: emptyState(adventure.concepts) };
      const run = await data.getOrStartRun(adventure.id);
      return { adventure, state: stateOf(adventure.concepts, await data.listEncounters(run.id)) };
    }),
  );
}

const ACTION: Record<AdventureWithProgress["status"], string | null> = {
  in_progress: "Resume",
  available: "Start",
  completed: "Open",
  locked: null,
};

export function AdventureMap({ trackSlug, rows }: { trackSlug: string; rows: MapRow[] }) {
  const open =
    rows.find((r) => r.adventure.status === "in_progress") ?? rows.find((r) => r.adventure.status === "available");
  return (
    <Card font="normal" className="gap-0 py-0">
      <Accordion type="single" collapsible defaultValue={open?.adventure.id} className="px-4 py-1 sm:px-6">
        {rows.map(({ adventure: a, state }) => {
          const locked = a.status === "locked";
          const current = a.status === "in_progress";
          const action = ACTION[a.status];
          return (
            <AccordionItem key={a.id} value={a.id} disabled={locked} className="last:border-b-0">
              <AccordionTrigger
                font="normal"
                className={cn("items-center py-3.5 hover:no-underline", locked && "**:data-[slot=accordion-trigger-icon]:hidden")}
              >
                <div className="grid flex-1 grid-cols-[20px_1fr_auto_20px] items-center gap-4 pr-2 md:grid-cols-[28px_200px_1fr_auto_24px] md:gap-6">
                  <span className="text-xs text-muted-foreground">{a.sortOrder}</span>
                  <span className={cn("retro text-[12px]", current && "text-primary", locked && "text-muted-foreground")}>
                    {topicOf(a.slug)}
                  </span>
                  <span className="hidden text-sm text-muted-foreground md:inline">{a.title}</span>
                  <ConceptBlocks state={state} />
                  <span className="flex justify-end">
                    {locked && <Lock width={16} height={16} className="text-muted-foreground" aria-label="Locked" />}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent font="normal">
                <div className="flex flex-wrap items-end justify-between gap-6 pb-1 pl-9 md:pl-[52px]">
                  <ul className="flex flex-col gap-2">
                    <li className="text-sm text-muted-foreground md:hidden">{a.title}</li>
                    {state.concepts.map((c) => (
                      <li key={c.slug} className="flex items-center gap-3 text-sm">
                        <span className={cn("size-3 border-2", c.cleared ? "border-primary bg-primary" : "border-ring/50")} />
                        <span className={c.cleared ? "text-foreground" : "text-muted-foreground"}>{c.name}</span>
                      </li>
                    ))}
                  </ul>
                  {action && (
                    <Button asChild size="sm" variant={current || a.status === "available" ? "default" : "outline"} className="mx-1.5 px-5 text-[10px]">
                      <Link href={`/play/${trackSlug}/${a.slug}`}>{action}</Link>
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Card>
  );
}
