"use client";

import XpBar from "@/components/ui/8bit/xp-bar";
import type { MapRow } from "@/components/game/AdventureMap";
import { ConceptBlocks } from "@/components/game/ConceptBlocks";
import { topicOf } from "@/components/game/bits";
import { levelInfo } from "@/components/game/rules";
import type { ProgressStats } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TrackSummary({ track, rows }: { track: ProgressStats["tracks"][number]; rows: MapRow[] }) {
  const info = levelInfo(track.xp);
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="retro text-[12px] text-primary">{track.title}</h2>
          <span className="retro text-[10px]">Level {info.level}</span>
        </div>
        <XpBar value={info.percent} className="h-4" />
        <span className="self-end retro text-[10px] text-xp">
          {info.xp} / {info.nextXp} XP
        </span>
      </div>
      <ul
        className="flex flex-col border-t-2 border-border"
        aria-label={`${track.completedAdventures} of ${track.totalAdventures} adventures completed`}
      >
        {rows.map(({ adventure: a, state }) => (
          <li key={a.id} className="flex items-center justify-between gap-4 border-b-2 border-border py-3">
            <span className={cn("flex gap-3 text-[15px]", a.status === "locked" && "text-muted-foreground")}>
              <span className="w-4 text-muted-foreground">{a.sortOrder}</span>
              {topicOf(a.slug)}
            </span>
            <ConceptBlocks state={state} />
          </li>
        ))}
      </ul>
    </section>
  );
}
