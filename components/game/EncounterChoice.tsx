"use client";

import { useState } from "react";
import type { EnemyOption } from "@/lib/types";
import { EnemyChoiceCard } from "./EnemyCard";

export function EncounterChoice({
  options,
  bossIds,
  onChoose,
}: {
  prompt?: string; // unused, since the model's text right before it already asks the question
  options: EnemyOption[];
  bossIds?: Set<string>;
  onChoose: (puzzleId: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    // fit as many cards as the chat column allows, which is narrower when a side panel is open
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(205px,100%),1fr))] gap-5 pt-3">
      {options.map((o) => (
        <EnemyChoiceCard
          key={o.puzzleId}
          enemy={o}
          puzzleId={o.puzzleId}
          isBoss={bossIds?.has(o.puzzleId) ?? false}
          disabled={picked !== null}
          onFight={() => {
            setPicked(o.puzzleId);
            onChoose(o.puzzleId);
          }}
        />
      ))}
    </div>
  );
}
