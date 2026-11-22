import type { AdventureState } from "@/lib/rules/adventure-state";
import { cn } from "@/lib/utils";
import { Tip } from "./bits";

export function ConceptBlocks({ state, showCount = false }: { state: AdventureState; showCount?: boolean }) {
  const count = `${state.cleared}/${state.total} concepts`;
  return (
    <span className="inline-flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5" role="group" aria-label={`${count} cleared`}>
        {state.concepts.map((c) => (
          <Tip key={c.slug} label={c.cleared ? `${c.name}: cleared` : c.name}>
            <span className={cn("block size-3 border-2", c.cleared ? "border-primary bg-primary" : "border-ring/50")} />
          </Tip>
        ))}
      </span>
      {showCount && <span className="text-xs text-muted-foreground">{count}</span>}
    </span>
  );
}
