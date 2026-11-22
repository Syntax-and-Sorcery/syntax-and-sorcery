"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "pixelarticons/react";
import { Button } from "@/components/ui/8bit/button";
import { ChatLog } from "@/components/chat/GameChat";
import type { GameUIMessage } from "@/lib/server/ai/game-tools";
import type { AdventureRun, InventoryEntry } from "@/lib/types";
import { AdventureScreen, type SidebarInfo } from "./AdventureScreen";
import { InventoryPanel } from "./InventoryPanel";
import { topicOf } from "./bits";

export function AdventureComplete({
  title,
  run,
  inventory,
  sidebar,
  next,
}: {
  title: string;
  run: AdventureRun;
  inventory: InventoryEntry[];
  sidebar: Omit<SidebarInfo, "inventory">;
  next: { href: string; slug: string } | null;
}) {
  return (
    <AdventureScreen
      align="top"
      sidebar={{ ...sidebar, inventory: <InventoryPanel entries={inventory} inFight={false} aiDown={false} onUse={() => {}} /> }}
      chat={
        <>
          <div className="flex flex-col gap-3 border-2 border-primary bg-primary/5 px-6 py-5">
            <span className="retro text-[12px] leading-5 text-primary">{title} is complete</span>
            {run.storySummary && <p className="text-[15px] leading-relaxed">{run.storySummary}</p>}
          </div>
          <ChatLog messages={run.messages as GameUIMessage[]} />
        </>
      }
      composer={
        <div className="flex justify-center border-t-2 border-border bg-panel px-4 py-7 sm:px-7">
          {next ? (
            <Button asChild className="gap-3 px-8 text-[11px]">
              <Link href={next.href}>
                Next adventure: {topicOf(next.slug)}
                <ArrowRight width={16} height={16} />
              </Link>
            </Button>
          ) : (
            <Button asChild className="gap-3 px-8 text-[11px]">
              <Link href={sidebar.mapHref}>
                <ArrowLeft width={16} height={16} />
                Map
              </Link>
            </Button>
          )}
        </div>
      }
      tabs={[]}
      activeTab="chat"
      onSelectTab={() => {}}
      onCloseTab={() => {}}
      renderTab={() => null}
    />
  );
}
