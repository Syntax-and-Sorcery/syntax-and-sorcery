"use client";

// keeps the editor's code per encounter so a reload doesn't lose it
import { useState } from "react";

const key = (encounterId: string) => `draft:${encounterId}`;

// localStorage throws when the browser blocks storage, and then drafts just aren't kept
function storage() {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function clearDraft(encounterId: string) {
  storage()?.removeItem(key(encounterId));
}

export function useDraft(encounterId: string) {
  // read during the first render so the starter code never flashes
  const [draft] = useState(() => storage()?.getItem(key(encounterId)) ?? null);
  return { draft, save: (code: string) => storage()?.setItem(key(encounterId), code) };
}
