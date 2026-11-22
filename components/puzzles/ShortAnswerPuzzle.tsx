"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/8bit/textarea";
import { Markdown } from "@/components/chat/Markdown";
import type { PlayerPuzzle } from "@/lib/types";
import type { useFight } from "./fight";
import { FightError, SubmitButton, SubmitFeedback } from "./parts";
import { ScrollPane } from "@/components/game/ScrollPane";

type Short = Extract<PlayerPuzzle, { kind: "short" }>;

export function ShortAnswerPuzzle({ puzzle, fight }: { puzzle: Short; fight: ReturnType<typeof useFight> }) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [judgeDown, setJudgeDown] = useState<"unavailable" | "limit" | null>(null);
  const done = fight.outcome !== null;

  async function submit() {
    setJudgeDown(null);
    setFeedback(null);
    try {
      const result = await fight.submit(answer.trim());
      if (!result.passed) setFeedback(result.feedback);
    } catch (error) {
      setJudgeDown(error instanceof Error && error.message === "ai_limit" ? "limit" : "unavailable");
    }
  }

  return (
    <ScrollPane>
      <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-7">
        <Markdown>{puzzle.question}</Markdown>
        <div className="relative">
          <Textarea
            font="normal"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            maxLength={puzzle.maxLength}
            rows={5}
            disabled={done || fight.busy}
            aria-label="Your answer"
            className="resize-none text-[15px]"
          />
          <span className="absolute right-3 bottom-2 text-xs text-muted-foreground">
            {answer.length} / {puzzle.maxLength}
          </span>
        </div>
        {fight.busy && <SubmitFeedback feedback="loading" />}
        {!fight.busy && feedback && <SubmitFeedback feedback={feedback} />}
        {judgeDown === "unavailable" && <FightError>The judge is unavailable, try again in a moment.</FightError>}
        {judgeDown === "limit" && <FightError>You&apos;ve used today&apos;s game master turns. They reset tomorrow.</FightError>}
        {!done && (
          <div className="flex justify-end pt-2 pr-1.5">
            <SubmitButton running={fight.busy} disabled={answer.trim() === ""} onClick={submit} />
          </div>
        )}
      </div>
    </ScrollPane>
  );
}
