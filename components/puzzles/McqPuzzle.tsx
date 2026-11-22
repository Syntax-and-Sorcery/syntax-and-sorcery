"use client";

import { useState } from "react";
import { Label } from "@/components/ui/8bit/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/8bit/radio-group";
import { Markdown } from "@/components/chat/Markdown";
import type { PlayerPuzzle } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { useFight } from "./fight";
import { FightError, SubmitButton } from "./parts";
import { ScrollPane } from "@/components/game/ScrollPane";

type Mcq = Extract<PlayerPuzzle, { kind: "mcq" }>;

export function McqPuzzle({ puzzle, fight }: { puzzle: Mcq; fight: ReturnType<typeof useFight> }) {
  const [choice, setChoice] = useState<string>("");
  const [failed, setFailed] = useState(false);
  const lost = fight.outcome?.type === "lost" ? fight.outcome : null;
  const done = fight.outcome !== null;

  async function submit() {
    setFailed(false);
    try {
      await fight.submit(choice);
    } catch {
      setFailed(true);
    }
  }

  return (
    <ScrollPane>
      <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-7">
        <Markdown>{puzzle.question}</Markdown>
        <RadioGroup
          value={choice}
          onValueChange={setChoice}
          disabled={done || fight.busy}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          aria-label="Answers"
        >
          {puzzle.options.map((text, i) => {
            const value = String(i);
            const correct = lost && lost.correctIndex === i;
            const wrong = lost && lost.chosen === value;
            return (
              <Label
                key={i}
                htmlFor={`opt-${puzzle.id}-${i}`}
                font="normal"
                className={cn(
                  "flex cursor-pointer items-center gap-4 border-2 px-4 py-3 text-[15px] leading-snug",
                  correct ? "border-ok bg-ok/10" : wrong ? "border-hp bg-hp/10" : choice === value ? "border-primary bg-primary/10" : "border-border",
                )}
              >
                <RadioGroupItem value={value} id={`opt-${puzzle.id}-${i}`} />
                {text}
              </Label>
            );
          })}
        </RadioGroup>
        {lost?.explanation && <p className="border-l-4 border-ok bg-card px-3 py-2.5 text-[15px] leading-relaxed">{lost.explanation}</p>}
        {failed && <FightError>Something went wrong. Try again in a moment.</FightError>}
        {!done && (
          <div className="flex justify-end pt-2 pr-1.5">
            <SubmitButton running={fight.busy} disabled={choice === ""} onClick={submit} />
          </div>
        )}
      </div>
    </ScrollPane>
  );
}
