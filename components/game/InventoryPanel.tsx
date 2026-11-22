// TODO(T-13): inventory sprite grid with Hint slot and item popovers
import type { InventoryEntry } from "@/lib/types";
import { TicketPlaceholder } from "@/components/ticket-placeholder";

export function InventoryPanel(props: {
  entries: InventoryEntry[];
  inFight: boolean;
  aiDown: boolean;
  onUse: (slug: string) => void;
}) {
  void props;
  return <TicketPlaceholder ticket="T-13" name="InventoryPanel" />;
}
