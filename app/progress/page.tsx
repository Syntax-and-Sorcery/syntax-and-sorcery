"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/8bit/button";
import { loadMapRows, type MapRow } from "@/components/game/AdventureMap";
import { Loading } from "@/components/game/bits";
import { ConceptChart } from "@/components/progress/ConceptChart";
import { TrackSummary } from "@/components/progress/TrackSummary";
import { SitePage } from "@/components/site/SitePage";
import { getGameData } from "@/lib/data";
import type { ProgressStats, Track } from "@/lib/types";

type TrackView = { track: Track; stats: ProgressStats; rows: MapRow[] };

async function load(): Promise<TrackView[]> {
  const data = getGameData();
  const active = (await data.listTracks()).filter((t) => t.status === "active");
  // only tracks the player has enrolled in
  const progress = await Promise.all(active.map((t) => data.getTrackProgress(t.id)));
  const tracks = active.filter((_, i) => progress[i] !== null);
  return Promise.all(
    tracks.map(async (track) => {
      const [stats, adventures] = await Promise.all([data.getProgressStats(track.id), data.listAdventures(track.id)]);
      return { track, stats, rows: await loadMapRows(adventures) };
    }),
  );
}

function NoFights({ trackSlug }: { trackSlug: string }) {
  return (
    <div className="flex flex-col items-start gap-5 border-2 border-dashed border-ring/40 p-6">
      <p className="text-[15px] text-muted-foreground">No fights yet. Face your first enemy and the tally starts here.</p>
      <Button asChild size="sm" className="mx-1.5 px-5 text-[10px]">
        <Link href={`/play/${trackSlug}`}>Open the map</Link>
      </Button>
    </div>
  );
}

export default function ProgressPage() {
  const [views, setViews] = useState<TrackView[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void load().then((v) => !cancelled && setViews(v));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SitePage>
      <h1 className="display pb-10 text-[40px] sm:text-[44px]">Progress</h1>
      {!views ? (
        <Loading />
      ) : views.length === 0 ? (
        <div className="flex flex-col items-start gap-5 border-2 border-dashed border-ring/40 p-6">
          <p className="text-[15px] text-muted-foreground">You haven&apos;t started a track yet.</p>
          <Button asChild size="sm" className="mx-1.5 px-5 text-[10px]">
            <Link href="/">Pick a track</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          {views.map(({ track, stats, rows }) =>
            stats.tracks.map((summary) => (
              <div key={summary.trackId} className="grid grid-cols-1 gap-12 lg:grid-cols-[400px_minmax(0,1fr)]">
                <TrackSummary track={summary} rows={rows} />
                <section className="flex min-w-0 flex-col gap-4">
                  <h2 className="retro text-[12px]">Fights won by concept</h2>
                  {stats.concepts.some((c) => c.fights > 0) ? (
                    <ConceptChart concepts={stats.concepts} />
                  ) : (
                    <NoFights trackSlug={track.slug} />
                  )}
                </section>
              </div>
            )),
          )}
        </div>
      )}
    </SitePage>
  );
}
