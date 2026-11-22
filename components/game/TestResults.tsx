import { Check, Close } from "pixelarticons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/8bit/tabs";
import type { GradeResult, RunResult, TestResult } from "@/lib/types";
import { cn } from "@/lib/utils";

// shows only the newest result, since Run clears the Submit and a Submit is always newer than the Run it keeps
export function TestResults({ run, submit }: { run: RunResult | null; submit: GradeResult | null }) {
  const latest = submit ?? run;
  if (!latest) return null;

  const status = latest.status ?? "ok";
  const stdout = latest.stdout ?? "";
  const marks = submit ? (submit.hiddenTests ?? []) : (run?.tests ?? []).map((t) => t.passed);
  const passed = marks.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      {status !== "ok" && latest.message && <StatusNotice message={latest.message} />}
      {marks.length > 0 ? (
        <Tabs defaultValue="tests" font="normal" className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <TabsList className="retro">
              <TabsTrigger value="tests" className="text-[10px]">
                {submit ? "Hidden tests" : "Sample tests"}
              </TabsTrigger>
              <TabsTrigger value="console" className="text-[10px]">
                Console
              </TabsTrigger>
            </TabsList>
            <span className={cn("retro text-[11px]", passed === marks.length ? "text-ok" : "text-hp")}>
              {passed} / {marks.length} passed
            </span>
          </div>
          <TabsContent value="tests">
            {submit ? <HiddenMarks marks={marks} /> : <SampleRows tests={run?.tests ?? []} />}
          </TabsContent>
          <TabsContent value="console">
            {stdout ? <Printed stdout={stdout} /> : <p className="text-sm text-muted-foreground">Nothing printed.</p>}
          </TabsContent>
        </Tabs>
      ) : (
        stdout && <Printed stdout={stdout} />
      )}
    </div>
  );
}

function SampleRows({ tests }: { tests: TestResult[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {tests.map((t, i) => (
        <li
          key={i}
          className={cn("flex items-start gap-3 border-l-4 px-3 py-2.5 text-sm", t.passed ? "border-ok bg-card" : "border-hp bg-hp/10")}
        >
          {t.passed ? (
            <Check width={16} height={16} className="mt-0.5 shrink-0 text-ok" aria-label="Passed" />
          ) : (
            <Close width={16} height={16} className="mt-0.5 shrink-0 text-hp" aria-label="Failed" />
          )}
          <div className="flex min-w-0 flex-col gap-0.5">
            <span>{t.name}</span>
            {t.error && <span className="break-words text-hp">{t.error}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function HiddenMarks({ marks }: { marks: boolean[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {marks.map((ok, i) => (
        <li
          key={i}
          className={cn("grid size-9 place-items-center border-2", ok ? "border-ok bg-ok/10 text-ok" : "border-hp bg-hp/10 text-hp")}
        >
          {ok ? <Check width={16} height={16} aria-hidden /> : <Close width={16} height={16} aria-hidden />}
          <span className="sr-only">
            Hidden test {i + 1} {ok ? "passed" : "failed"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Printed({ stdout }: { stdout: string }) {
  return (
    <pre className="border-2 border-border bg-card px-3 py-2.5 font-mono text-[13px] break-words whitespace-pre-wrap">{stdout}</pre>
  );
}

// TODO(T-06): add the beginner-friendly title and body for the status above the raw message
function StatusNotice({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 border-l-4 border-hp bg-hp/10 px-3 py-2.5 text-sm">
      <Close width={16} height={16} className="mt-0.5 shrink-0 text-hp" aria-hidden />
      <code className="min-w-0 break-words text-hp">{message}</code>
    </div>
  );
}

