"use client";

// loads the encounter for the Fight tab
// if it already ended because an earlier encounter_end failed, show the result and report the outcome again
import { useEffect, useRef, useState } from "react";
import { Loading } from "@/components/game/bits";
import { usePuzzle } from "@/components/game/usePuzzle";
import { getGameData } from "@/lib/data";
import type { Encounter, PlayerPuzzle } from "@/lib/types";
import { CodePuzzle } from "./CodePuzzle";
import { FightHeader } from "./FightHeader";
import { McqPuzzle } from "./McqPuzzle";
import { ShortAnswerPuzzle } from "./ShortAnswerPuzzle";
import { useFight, type FightProps, type FightState } from "./fight";
import { FightError, Victory } from "./parts";

export type { FightState } from "./fight";

export interface PuzzleViewProps extends FightProps {
  puzzleId: string;
  /** the chat still counts this fight as running because there's no encounter_end message for it yet */
  live: boolean;
  onFightState: (state: FightState) => void;
}

export function PuzzleView(props: PuzzleViewProps) {
  const { puzzle, error } = usePuzzle(props.puzzleId);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getGameData()
      .getEncounter(props.encounterId)
      .then(
        (e) => !cancelled && setEncounter(e),
        () => !cancelled && setLoadFailed(true),
      );
    return () => {
      cancelled = true;
    };
  }, [props.encounterId]);

  if (error || loadFailed) {
    return (
      <div className="p-7">
        <FightError>This fight couldn&apos;t be loaded. Reload the page to try again.</FightError>
      </div>
    );
  }
  if (!puzzle || !encounter) return <Loading />;
  return <Fight {...props} puzzle={puzzle} encounter={encounter} />;
}

function endedSummary(encounter: Encounter): string {
  const name = encounter.enemy.name;
  if (encounter.status === "defeated") return `Defeated ${name}. +${encounter.xpAwarded} XP`;
  if (encounter.status === "lost") return `Lost to ${name}: wrong answer`;
  return `Fled from ${name}`;
}

function Fight({ puzzle, encounter, live, onFightState, ...props }: PuzzleViewProps & { puzzle: PlayerPuzzle; encounter: Encounter }) {
  const fight = useFight(puzzle, props);
  const endedBefore = encounter.status !== "active";

  // re-report a fight that already ended in the database but never sent encounter_end
  const reported = useRef(false);
  useEffect(() => {
    if (endedBefore && live && !reported.current) {
      reported.current = true;
      props.onEnd(endedSummary(encounter));
    }
  }, [endedBefore, live, encounter, props]);

  // non-code puzzles have no editor code to attach to hints
  useEffect(() => {
    if (puzzle.kind !== "code") onFightState({ code: null, lastResults: null });
  }, [puzzle.kind, onFightState]);

  const won = fight.outcome?.type === "won" ? fight.outcome : null;
  return (
    <>
      <FightHeader
        enemy={props.enemy}
        difficulty={puzzle.difficulty}
        kind={puzzle.kind}
        hp={endedBefore && encounter.status === "defeated" ? 0 : fight.hp}
        maxHp={fight.max}
        disabled={endedBefore || fight.outcome !== null || fight.busy}
        onReport={fight.report}
        onFlee={() => void fight.flee()}
      />
      {endedBefore ? (
        <div className="px-4 py-6 sm:px-7">
          {encounter.status === "defeated" ? (
            <Victory enemyName={props.enemy.name} xp={encounter.xpAwarded} items={[]} />
          ) : (
            <span className="border-2 border-dashed border-border px-3 py-1.5 text-[13px] text-muted-foreground">
              {endedSummary(encounter)}
            </span>
          )}
        </div>
      ) : (
        <>
          {won && (
            <div className="border-b-2 border-border px-4 py-5 sm:px-7">
              <Victory enemyName={props.enemy.name} xp={won.xp} items={won.items} />
            </div>
          )}
          {puzzle.kind === "mcq" && <McqPuzzle puzzle={puzzle} fight={fight} />}
          {puzzle.kind === "short" && <ShortAnswerPuzzle puzzle={puzzle} fight={fight} />}
          {puzzle.kind === "code" && (
            <CodePuzzle puzzle={puzzle} encounterId={props.encounterId} fight={fight} onFightState={onFightState} />
          )}
        </>
      )}
    </>
  );
}
