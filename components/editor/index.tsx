"use client";

// CodeMirror needs the browser, so import from here to keep SSR off
import dynamic from "next/dynamic";

export const CodeEditor = dynamic(() => import("./CodeEditor").then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => <p className="retro p-4 text-xs">Summoning editor…</p>,
});
export type { CodeEditorProps } from "./CodeEditor";
