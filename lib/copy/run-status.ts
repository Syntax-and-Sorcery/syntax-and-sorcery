// TODO(T-06): plain-language error messages for each RunStatus
import type { RunStatus } from "@/lib/types";

export function runStatusMessage(status: RunStatus): { title: string; body: string } {
  void status;
  throw new Error("TODO");
}
