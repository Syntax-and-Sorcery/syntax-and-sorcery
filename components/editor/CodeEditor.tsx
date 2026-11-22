"use client";

// import editable instances from "@/components/editor" so SSR stays off
// client-only read-only blocks can import this file directly
import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import type { EditorTheme, Language } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EDITOR_THEMES, useEditorTheme } from "./themes";

// placeholder lint rule until puzzles define forbidden syntax
const exampleLinter = linter((view) => {
  const found: Diagnostic[] = [];
  const text = view.state.doc.toString();
  const i = text.indexOf("eval(");
  if (i >= 0) found.push({ from: i, to: i + 4, severity: "error", message: "eval is forbidden magic" });
  return found;
});

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: Language;
  readOnly?: boolean;
  height?: string;
  lineNumbers?: boolean;
  /** overrides the player's saved theme, used by the settings preview */
  theme?: EditorTheme;
  className?: string;
  "aria-label"?: string;
}

type ThemeEntry = (typeof EDITOR_THEMES)[EditorTheme];
/** returns the theme's background color once T-24 populates the theme registry */
export function themeBackground(theme: ThemeEntry): string | undefined {
  return "background" in theme && typeof theme.background === "string" ? theme.background : undefined;
}
// fall back to CodeMirror's built-in dark theme while T-24 theme extensions are empty
function themeExtension(theme: ThemeEntry) {
  return Array.isArray(theme.extension) && theme.extension.length === 0 ? "dark" : theme.extension;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly,
  height,
  lineNumbers = true,
  theme,
  className,
  "aria-label": ariaLabel,
}: CodeEditorProps) {
  const playerTheme = useEditorTheme();
  const t = theme ? EDITOR_THEMES[theme] : playerTheme;
  const extensions = useMemo(
    () => [language === "python" ? python() : javascript(), ...(readOnly ? [] : [exampleLinter, lintGutter()])],
    [language, readOnly],
  );
  return (
    <div className={cn("py-2", className)} style={{ background: themeBackground(t) }}>
      <CodeMirror
        value={value}
        onChange={onChange ? (v) => onChange(v) : undefined}
        theme={themeExtension(t)}
        extensions={extensions}
        editable={!readOnly}
        readOnly={readOnly}
        height={height}
        aria-label={ariaLabel}
        basicSetup={{
          lineNumbers,
          foldGutter: false,
          highlightActiveLine: !readOnly,
          highlightActiveLineGutter: !readOnly,
        }}
        className={cn(
          "text-[14px] [&_.cm-editor]:outline-none! [&_.cm-scroller]:font-mono [&_.cm-scroller]:leading-[1.7]",
          height === "100%" && "h-full",
        )}
      />
    </div>
  );
}
