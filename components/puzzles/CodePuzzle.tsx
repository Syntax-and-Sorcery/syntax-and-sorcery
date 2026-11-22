"use client";

import { useState } from "react";
import { Play, Undo } from "pixelarticons/react";
import { Button } from "@/components/ui/8bit/button";
import { ScrollArea } from "@/components/ui/8bit/scroll-area";
import { Spinner } from "@/components/ui/8bit/spinner";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { CodeEditor } from "@/components/editor";
import { useDraft } from "@/components/editor/useDraft";
import { useShell } from "@/components/game/AdventureScreen";
import { TestResults } from "@/components/game/TestResults";
import { SplitHandle, Tip } from "@/components/game/bits";
import { getGameApi } from "@/lib/api";
import type { GradeResult, PlayerPuzzle, RunResult } from "@/lib/types";
import { lastResultsOf, type FightState, type useFight } from "./fight";
import { FightError, SubmitButton, SubmitFeedback } from "./parts";
import { ScrollPane } from "@/components/game/ScrollPane";

type Code = Extract<PlayerPuzzle, { kind: "code" }>;

export function CodePuzzle({
  puzzle,
  encounterId,
  fight,
  onFightState,
}: {
  puzzle: Code;
  encounterId: string;
  fight: ReturnType<typeof useFight>;
  onFightState: (state: FightState) => void;
}) {
  const { maximised, desktop } = useShell();
  const draft = useDraft(encounterId);
  const [code, setCode] = useState(() => draft.draft ?? puzzle.starterCode);
  const [running, setRunning] = useState<"run" | "submit" | null>(null);
  const [run, setRun] = useState<RunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<GradeResult | null>(null);
  const [failed, setFailed] = useState(false);
  const done = fight.outcome !== null;
  const busy = running !== null || fight.busy;

  function change(next: string) {
    setCode(next);
    draft.save(next);
    onFightState({ code: next, lastResults: submitResult ? lastResultsOf("submit", submitResult) : run ? lastResultsOf("run", run) : null });
  }

  async function doRun() {
    setRunning("run");
    setFailed(false);
    try {
      const result = await getGameApi().run(puzzle.id, code);
      setRun(result);
      setSubmitResult(null);
      onFightState({ code, lastResults: lastResultsOf("run", result) });
    } catch {
      setFailed(true);
    } finally {
      setRunning(null);
    }
  }

  async function doSubmit() {
    setRunning("submit");
    setFailed(false);
    try {
      const result = await fight.submit(code);
      setSubmitResult(result);
      onFightState({ code, lastResults: lastResultsOf("submit", result) });
    } catch {
      setFailed(true);
    } finally {
      setRunning(null);
    }
  }

  const feedback = running === "submit" ? "loading" : submitResult && !submitResult.passed && submitResult.feedback ? submitResult.feedback : null;

  const actions = (
    <div className="flex items-center justify-end gap-3 px-4 py-4 sm:gap-6 sm:px-7 sm:py-5">
      <Button
        variant="ghost"
        size="sm"
        className="mr-auto -ml-2 gap-1.5 text-[9px] text-muted-foreground"
        disabled={busy || done}
        aria-label="Reset code"
        // through change() so the saved draft and the code hints see are reset too
        onClick={() => change(puzzle.starterCode)}
      >
        <Undo width={14} height={14} />
        <span className="hidden sm:inline">Reset code</span>
      </Button>
      <Tip label="Runs the sample tests">
        <Button variant="outline" className="gap-2 px-3 text-[10px] sm:px-5 sm:text-[11px]" disabled={busy || done} onClick={doRun}>
          {running === "run" ? <Spinner variant="diamond" className="size-4" /> : <Play width={16} height={16} />}
          Run
        </Button>
      </Tip>
      <SubmitButton running={running === "submit"} disabled={busy || done} onClick={doSubmit} />
    </div>
  );

  const results = (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-6 sm:px-7">
      {feedback && <SubmitFeedback feedback={feedback} />}
      {failed && <FightError>Something went wrong. Try again in a moment.</FightError>}
      <TestResults run={run} submit={submitResult} />
    </div>
  );

  const editor = (
    <CodeEditor
      value={code}
      onChange={change}
      language={puzzle.language}
      readOnly={done}
      height="100%"
      aria-label="Your code"
      className="h-full overflow-hidden px-2"
    />
  );

  return (
    <>
      <div className="border-b-2 border-border px-4 py-4 text-[15px] sm:px-7">{puzzle.title}</div>
      {desktop ? (
        <ResizablePanelGroup orientation={maximised ? "horizontal" : "vertical"} className="min-h-0 flex-1">
          <ResizablePanel minSize={maximised ? 420 : 120}>{editor}</ResizablePanel>
          <SplitHandle />
          <ResizablePanel defaultSize={maximised ? 560 : 320} minSize={maximised ? 420 : 150}>
            <div className="flex h-full flex-col">
              <div className="border-b-2 border-border">{actions}</div>
              <ScrollArea className="min-h-0 flex-1">{results}</ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <ScrollPane>
          <div className="h-[320px] shrink-0">{editor}</div>
          <div className="border-y-2 border-border">{actions}</div>
          {results}
        </ScrollPane>
      )}
    </>
  );
}
