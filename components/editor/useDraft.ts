// TODO(T-30): persist editor code in localStorage under draft:<encounterId> with try/catch
"use client";

export function useDraft(encounterId: string): {
  draft: string | null;
  save: (code: string) => void;
  clear: () => void;
} {
  void encounterId;
  return { draft: null, save: () => {}, clear: () => {} };
}
