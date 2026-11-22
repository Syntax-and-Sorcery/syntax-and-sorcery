"use client";

import { useCallback, useEffect, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { GameChat } from "@/components/chat/GameChat";
import { EditorThemeContext } from "@/components/editor/themes";
import { AdventureComplete } from "@/components/game/AdventureComplete";
import { Loading } from "@/components/game/bits";
import { completedState, levelInfo } from "@/components/game/rules";
import { IS_MOCK } from "@/components/site/session";
import { getGameData } from "@/lib/data";
import type { GameUIMessage } from "@/lib/server/ai/game-tools";
import {
  DEFAULT_PREFERENCES,
  type AdventureRun,
  type AdventureWithProgress,
  type Encounter,
  type InventoryEntry,
  type Preferences,
  type Track,
} from "@/lib/types";

type Loaded = {
  track: Track;
  adventure: AdventureWithProgress;
  next: AdventureWithProgress | null;
  run: AdventureRun;
  encounters: Encounter[];
  inventory: InventoryEntry[];
  xp: number;
  preferences: Preferences;
};
type View = Loaded | "missing" | "locked";

async function load(trackSlug: string, adventureSlug: string): Promise<View> {
  const data = getGameData();
  const track = (await data.listTracks()).find((t) => t.slug === trackSlug && t.status === "active");
  if (!track) return "missing";
  const adventures = await data.listAdventures(track.id);
  const index = adventures.findIndex((a) => a.slug === adventureSlug);
  if (index < 0) return "missing";
  const adventure = adventures[index];
  if (adventure.status === "locked") return "locked";
  const run = await data.getOrStartRun(adventure.id);
  const [encounters, inventory, xp, preferences] = await Promise.all([
    data.listEncounters(run.id),
    data.getInventory(),
    data.getTrackProgress(track.id).then((p) => p?.xp ?? 0),
    data.getPreferences().catch(() => DEFAULT_PREFERENCES),
  ]);
  return { track, adventure, next: adventures[index + 1] ?? null, run, encounters, inventory, xp, preferences };
}

export default function AdventurePage() {
  const { track, adventure } = useParams<{ track: string; adventure: string }>();
  const router = useRouter();
  const [view, setView] = useState<View | null>(null);
  const [xp, setXp] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void load(track, adventure).then((v) => !cancelled && setView(v));
    return () => {
      cancelled = true;
    };
  }, [track, adventure]);

  // the server saves the last turn's messages after the stream ends, so keep the ones the browser already has
  const complete = useCallback(
    (messages: GameUIMessage[]) => {
      void load(track, adventure)
        .then((v) => setView(typeof v === "string" ? v : { ...v, run: { ...v.run, messages } }))
        .catch(() => {}); // the completion screen shows on the next reload instead
    },
    [track, adventure],
  );

  useEffect(() => {
    if (view === "locked") router.replace(`/play/${track}`);
  }, [view, router, track]);

  const reloadXp = useCallback(() => {
    if (!view || typeof view === "string") return;
    void getGameData()
      .getTrackProgress(view.track.id)
      .then((p) => setXp(p?.xp ?? 0))
      .catch(() => {});
  }, [view]);

  if (view === "missing") notFound();
  if (!view || view === "locked") {
    return (
      <div className="flex h-dvh bg-background">
        <Loading />
      </div>
    );
  }

  const sidebar = {
    mapHref: `/play/${view.track.slug}`,
    adventureNumber: view.adventure.sortOrder,
    title: view.adventure.title,
    level: levelInfo(xp ?? view.xp),
  };

  return (
    <EditorThemeContext.Provider value={view.preferences.editorTheme}>
      {/* a boss win completes the run before the game master writes the story, so wait for it, except in mock mode with no AI */}
      {view.run.status === "completed" && (view.run.storySummary || IS_MOCK) ? (
        <AdventureComplete
          title={view.adventure.title}
          run={view.run}
          inventory={view.inventory}
          sidebar={{ ...sidebar, state: completedState(view.adventure.concepts) }}
          next={view.next ? { href: `/play/${view.track.slug}/${view.next.slug}`, slug: view.next.slug } : null}
        />
      ) : (
        <GameChat
          runId={view.run.id}
          trackId={view.track.id}
          concepts={view.adventure.concepts}
          initialMessages={view.run.messages as GameUIMessage[]}
          initialInventory={view.inventory}
          initialEncounters={view.encounters}
          sidebar={sidebar}
          onProgress={reloadXp}
          onComplete={complete}
        />
      )}
    </EditorThemeContext.Provider>
  );
}
