// TODO(T-23): no-AI mode panel with lessons and stored enemies
import type { Concept, StoredEnemy } from "@/lib/types";
import type { AdventureState } from "@/lib/rules/adventure-state";
import { TicketPlaceholder } from "@/components/ticket-placeholder";

export function NoAiPanel(props: {
  reason: "ai_unavailable" | "ai_limit";
  lessons: Concept[];
  enemies: StoredEnemy[];
  state: AdventureState;
  onOpenLesson: (slug: string) => void;
  onFight: (enemy: StoredEnemy) => void;
  onRetry: () => void;
}) {
  void props;
  return <TicketPlaceholder ticket="T-23" name="NoAiPanel" />;
}
