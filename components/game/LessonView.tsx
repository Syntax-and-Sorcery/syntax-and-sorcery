// TODO(T-20): lesson tab with runnable first JS example
import type { Concept } from "@/lib/types";
import { TicketPlaceholder } from "@/components/ticket-placeholder";

export function LessonView({ concept }: { concept: Concept }) {
  return <TicketPlaceholder ticket="T-20" name={`LessonView (${concept.name})`} />;
}
