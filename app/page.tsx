"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play } from "pixelarticons/react";
import { Badge } from "@/components/ui/8bit/badge";
import { Button } from "@/components/ui/8bit/button";
import { Card } from "@/components/ui/8bit/card";
import { Spinner } from "@/components/ui/8bit/spinner";
import XpBar from "@/components/ui/8bit/xp-bar";
import { ConceptBlocks } from "@/components/game/ConceptBlocks";
import { Loading } from "@/components/game/bits";
import { levelInfo, stateOf } from "@/components/game/rules";
import { GOLD_FRAME, SitePage } from "@/components/site/SitePage";
import { useSession } from "@/components/site/session";
import type { AdventureState } from "@/lib/rules/adventure-state";
import { getGameData } from "@/lib/data";
import type { AdventureWithProgress, Track } from "@/lib/types";
import { cn } from "@/lib/utils";

const TRACK_COLOR: Record<string, string> = { javascript: "text-primary", python: "text-[#5fa8e8]/70" };

function ComingSoonCard({ track }: { track: Track }) {
  return (
    <div className="flex flex-col gap-6 border-2 border-dashed border-ring/40 p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <span className={cn("display text-[32px] sm:text-[44px]", TRACK_COLOR[track.slug] ?? "text-muted-foreground")}>
          {track.title}
        </span>
        <Badge variant="secondary" className="retro text-[9px]">
          Coming soon
        </Badge>
      </div>
      <p className="text-[15px] text-muted-foreground">The same game in {track.title}. We&apos;re still building it.</p>
    </div>
  );
}

function TrackTitle({ track }: { track: Track }) {
  return <span className={cn("display text-[32px] sm:text-[44px]", TRACK_COLOR[track.slug] ?? "text-primary")}>{track.title}</span>;
}

function LoggedOutTrackCard({ track }: { track: Track }) {
  return (
    <div className={GOLD_FRAME}>
      <Card font="normal" className="gap-0 py-0">
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <TrackTitle track={track} />
          <p className="text-[15px] text-muted-foreground">Seven adventures, starting from scratch.</p>
          <Button asChild className="mx-1.5 mt-2 gap-2 text-[11px]">
            <Link href="/signup">
              Start playing
              <Play width={14} height={14} />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

type TrackView = {
  xp: number | null; // null means not enrolled
  current: { adventure: AdventureWithProgress; state: AdventureState } | null;
};

async function loadTrack(track: Track): Promise<TrackView> {
  const data = getGameData();
  const xp = (await data.getTrackProgress(track.id))?.xp ?? null;
  if (xp === null) return { xp: null, current: null };
  const adventures = await data.listAdventures(track.id);
  const adventure =
    adventures.find((a) => a.status === "in_progress") ?? adventures.find((a) => a.status === "available") ?? null;
  if (!adventure) return { xp, current: null };
  // don't create a run from the landing page for adventures that haven't started yet
  if (adventure.status !== "in_progress") return { xp, current: { adventure, state: stateOf(adventure.concepts, []) } };
  const run = await data.getOrStartRun(adventure.id);
  const encounters = await data.listEncounters(run.id);
  return { xp, current: { adventure, state: stateOf(adventure.concepts, encounters) } };
}

function PlayerTrackCard({ track }: { track: Track }) {
  const router = useRouter();
  const [view, setView] = useState<TrackView | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadTrack(track).then((v) => !cancelled && setView(v));
    return () => {
      cancelled = true;
    };
  }, [track]);

  async function enroll() {
    setEnrolling(true);
    try {
      await getGameData().enroll(track.id);
      router.push(`/play/${track.slug}`);
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <div className={GOLD_FRAME}>
      <Card font="normal" className="gap-0 py-0">
        <div className="flex flex-col gap-7 p-6 sm:p-8">
          {!view ? (
            <>
              <TrackTitle track={track} />
              <Spinner variant="diamond" className="size-6 text-primary" />
            </>
          ) : view.xp === null ? (
            <>
              <TrackTitle track={track} />
              <p className="text-[15px] text-muted-foreground">Seven adventures, starting from scratch.</p>
              <Button className="mx-1.5 gap-2 text-[11px]" onClick={enroll} disabled={enrolling}>
                {enrolling ? <Spinner variant="diamond" className="size-4" /> : null}
                Enroll
              </Button>
            </>
          ) : (
            <TrackProgressBody track={track} xp={view.xp} current={view.current} />
          )}
        </div>
      </Card>
    </div>
  );
}

function TrackProgressBody({ track, xp, current }: { track: Track; xp: number; current: TrackView["current"] }) {
  const info = levelInfo(xp);
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <TrackTitle track={track} />
        <Badge className="retro text-[9px]">Level {info.level}</Badge>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <span className="retro text-[10px] text-xp">
            {info.xp} / {info.nextXp} XP
          </span>
        </div>
        <XpBar value={info.percent} className="h-4" />
      </div>
      {current && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-[15px]">
            Adventure {current.adventure.sortOrder}: <span className="text-muted-foreground">{current.adventure.title}</span>
          </span>
          <ConceptBlocks state={current.state} showCount />
        </div>
      )}
      <Button asChild className="mx-1.5 gap-2 text-[11px]">
        <Link href={`/play/${track.slug}`}>
          Play
          <Play width={14} height={14} />
        </Link>
      </Button>
    </>
  );
}

export default function Home() {
  const session = useSession();
  const [tracks, setTracks] = useState<Track[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getGameData()
      .listTracks()
      .then((t) => !cancelled && setTracks(t.filter((x) => x.status !== "disabled")))
      .catch(() => !cancelled && setTracks([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (session.status === "loading" || !tracks) {
    return (
      <SitePage center footer>
        <Loading />
      </SitePage>
    );
  }

  const signedIn = session.status === "signed-in";
  return (
    <SitePage center footer>
      {signedIn ? (
        <p className="retro pb-10 text-[12px] text-muted-foreground">Welcome back, {session.user.username}</p>
      ) : (
        <div className="flex flex-col gap-6 pb-16">
          <h1 className="display text-[40px] sm:text-[64px]">
            Programming as a <span className="text-primary">game.</span>
          </h1>
          <p className="max-w-[640px] text-[17px] leading-relaxed text-muted-foreground">
            Fight enemies with real code. An AI game master teaches one concept at a time and runs the story.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {tracks.map((track) =>
          track.status === "coming_soon" ? (
            <ComingSoonCard key={track.id} track={track} />
          ) : signedIn ? (
            <PlayerTrackCard key={track.id} track={track} />
          ) : (
            <LoggedOutTrackCard key={track.id} track={track} />
          ),
        )}
      </div>
    </SitePage>
  );
}
