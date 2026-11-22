// TODO(T-24): wire up the @uiw/codemirror-theme-* extensions and highlight styles
"use client";

import { createContext, useContext } from "react";
import type { Extension } from "@codemirror/state";
import type { EditorTheme } from "@/lib/types";

export const EDITOR_THEMES: Record<EditorTheme, { label: string; extension: Extension }> = {
  "tokyo-night": { label: "Tokyo Night", extension: [] },
  dracula: { label: "Dracula", extension: [] },
  "github-dark": { label: "GitHub Dark", extension: [] },
  nord: { label: "Nord", extension: [] },
  "github-light": { label: "GitHub Light", extension: [] },
};

// the adventure and settings pages pass in profiles.preferences.editorTheme
export const EditorThemeContext = createContext<EditorTheme>("tokyo-night");
export function useEditorTheme() {
  return EDITOR_THEMES[useContext(EditorThemeContext)];
}
