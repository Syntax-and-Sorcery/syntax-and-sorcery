"use client";

import { useState } from "react";
import { CodeEditor } from "@/components/editor";
import { Play, Undo } from "pixelarticons/react";
import { Button } from "@/components/ui/8bit/button";
import { Spinner } from "@/components/ui/8bit/spinner";
import { getGameApi } from "@/lib/api";
import type { RunResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RunnableExample({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [failed, setFailed] = useState(false);

  async function run() {
    setRunning(true);
    try {
      setResult(await getGameApi().run(null, code));
    } catch {
      setFailed(true);
    } finally {
      setRunning(false);
    }
  }
  function reset() {
    setCode(initialCode);
    setResult(null);
  }

  function outputOf(result: RunResult): { text: string; isError: boolean } {
    switch (result.status) {
      case "ok":
        return { text: result.stdout || "Nothing was printed.", isError: false };
      case "syntax_error":
      case "runtime_error":
        return {
          text: result.message ?? "There's a mistake in the code.",
          isError: true,
        };
      case "timeout":
        return { text: "The code ran for too long and was stopped.", isError: true };
      case "memory":
        return {
          text: "The code used too much memory and was stopped.",
          isError: true,
        };
      case "limit":
        return { text: "You've used all your runs for today.", isError: true };
      case "busy":
      case "internal_error":
        return { text: "The sandbox is busy. Try again in a moment.", isError: true };
    }
  }
  return (
    <div className="flex flex-col gap-3">
      <CodeEditor
        value={code}
        onChange={setCode}
        language="javascript"
        height="200px"
        aria-label="Lesson example"
        className="border-2 border-border px-2"
      />
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="mr-auto -ml-2 gap-1.5 text-[9px] text-muted-foreground"
          aria-label="Reset code"
          disabled={running || (code === initialCode && !result)}
          onClick={reset}
        >
          <Undo width={14} height={14} />
          Reset
        </Button>
        <Button
          variant="outline"
          className="gap-2 px-3 text-[10px] sm:px-5 sm:text-[11px]"
          disabled={running}
          onClick={run}
        >
          {running ? (
            <Spinner variant="diamond" className="size-4" />
          ) : (
            <Play width={16} height={16} />
          )}
          Run
        </Button>
      </div>
      {failed && (
        <p className="text-sm text-destructive">
          Something went wrong. Try again in a moment.
        </p>
      )}
      {result && (
        <pre
          className={cn(
            "border-2 bg-card p-3 text-sm whitespace-pre-wrap",
            outputOf(result).isError
              ? "border-destructive text-destructive"
              : "border-border",
          )}
        >
          {outputOf(result).text}
        </pre>
      )}
    </div>
  );
}
