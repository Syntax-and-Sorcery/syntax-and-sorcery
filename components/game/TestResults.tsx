// TODO(T-12): test results list for sample and hidden tests
import type { GradeResult, RunResult } from "@/lib/types";
import { TicketPlaceholder } from "@/components/ticket-placeholder";

export function TestResults({ run, submit }: { run: RunResult | null; submit: GradeResult | null }) {
  void run;
  void submit;
  return <TicketPlaceholder ticket="T-12" name="TestResults" />;
}
