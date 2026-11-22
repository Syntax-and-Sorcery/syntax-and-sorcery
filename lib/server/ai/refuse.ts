export type Refusal = { ok: false; reason: string };

// returned by tools when a game rule blocks the call so the model can recover
export function refuse(reason: string): Refusal {
  return { ok: false, reason };
}
