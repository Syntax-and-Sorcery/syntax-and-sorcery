"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { AdventureMap, loadMapRows, type MapRow } from "@/components/game/AdventureMap";
import { LevelBar, Loading } from "@/components/game/bits";
import { levelInfo } from "@/components/game/rules";
import { SitePage } from "@/components/site/SitePage";
import { getGameData } from "@/lib/data";
import type { Track } from "@/lib/types";

type View = { track: Track; xp: number; rows: MapRow[] } | "missing";

async function load(slug: string): Promise<View> {
  const data = getGameData();
  const track = (await data.listTracks()).find((t) => t.slug === slug && t.status === "active");
  if (!track) return "missing";
  // players who arrive by a direct link get enrolled
  const xp = ((await data.getTrackProgress(track.id)) ?? (await data.enroll(track.id))).xp;
  const rows = await loadMapRows(await data.listAdventures(track.id));
  return { track, xp, rows };
}

export default function MapPage() {
  const { track: slug } = useParams<{ track: string }>();
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    let cancelled = false;
    void load(slug).then((v) => !cancelled && setView(v));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (view === "missing") notFound();
  return (
    <SitePage>
      {!view ? (
        <Loading />
      ) : (
        <>
          <div className="flex flex-col gap-6 pb-10 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="display text-[40px] text-primary sm:text-[56px]">{view.track.title}</h1>
            <LevelBar info={levelInfo(view.xp)} className="w-full pb-2 sm:w-[340px]" />
          </div>
          <AdventureMap trackSlug={view.track.slug} rows={view.rows} />
        </>
      )}
    </SitePage>
  );
}
