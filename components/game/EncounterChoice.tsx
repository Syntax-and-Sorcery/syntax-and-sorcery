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
    <div className="grid grid-cols-1 gap-5 pt-3 sm:grid-cols-2 xl:grid-cols-3">
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
