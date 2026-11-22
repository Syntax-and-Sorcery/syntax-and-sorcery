"use client";

import { useState } from "react";
import { CodeEditor } from "@/components/editor";
import { Play, Undo } from "pixelarticons/react";
import { Button } from "@/components/ui/8bit/button";
import { Spinner } from "@/components/ui/8bit/spinner";
import { getGameApi } from "@/lib/api";
import type { RunResult } from "@/lib/types";

export function RunnableExample({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  async function run() {
    setRunning(true);
    try {
      setResult(await getGameApi().run(null, code));
    } finally {
      setRunning(false);
    }
  }
  function reset() {
    setCode(initialCode);
    setResult(null);
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
      {result && (
        <pre className="border-2 border-border bg-card p-3 text-sm whitespace-pre-wrap">
          {result.stdout}
        </pre>
      )}
    </div>
  );
}
