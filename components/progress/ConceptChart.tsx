"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp } from "pixelarticons/react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer } from "@/components/ui/8bit/chart";
import { Tip } from "@/components/game/bits";
import { ScrollPane } from "@/components/game/ScrollPane";
import type { ProgressStats, Trend } from "@/lib/types";

const WEAK_BELOW = 60;

const TREND_TIP: Record<Trend, string> = {
  up: "Won more of your last 5 fights than the 5 before",
  down: "Won fewer of your last 5 fights than the 5 before",
  flat: "Won as many of your last 5 fights as the 5 before",
};

const TREND_ICON: Record<Trend, ReactNode> = {
  up: <ArrowUp width={14} height={14} className="text-ok" aria-label="Trending up" />,
  down: <ArrowDown width={14} height={14} className="text-hp" aria-label="Trending down" />,
  flat: <ArrowRight width={14} height={14} className="text-muted-foreground" aria-label="Holding steady" />,
};

type LabelProps = { x?: number | string; y?: number | string; width?: number | string; value?: unknown };

// sits just right of the bar's percentage label
function TrendLabel({ x = 0, y = 0, width = 0, value }: LabelProps) {
  if (!value) return null;
  const trend = value as Trend;
  const cx = Number(x) + Number(width) / 2;
  return (
    <foreignObject x={cx + 17} y={Number(y) - 19} width={16} height={16}>
      <Tip label={TREND_TIP[trend]}>{TREND_ICON[trend]}</Tip>
    </foreignObject>
  );
}

// long names wrap onto more lines so they don't run into their neighbors
function wrap(label: string, max = 10): string[] {
  const lines: string[] = [];
  for (const word of label.split(" ")) {
    const last = lines.at(-1);
    if (last !== undefined && last.length + word.length < max) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

function ConceptTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">
      {wrap(payload?.value ?? "").map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 10 : 14}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

const config = { rate: { label: "Fights won", color: "var(--primary)" } } satisfies ChartConfig;

export function ConceptChart({ concepts }: { concepts: ProgressStats["concepts"] }) {
  const rows = concepts
    .filter((c) => c.fights > 0)
    .map((c) => ({ name: c.name, rate: Math.round((c.won / c.fights) * 100), trend: c.trend }));
  return (
    // scrolls sideways on phones instead of squashing the labels together
    <ScrollPane horizontal>
      <ChartContainer config={config} className="h-[460px] w-full" style={{ minWidth: rows.length * 68 }}>
        <BarChart data={rows} margin={{ top: 24, right: 8, left: -12, bottom: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} interval={0} height={58} tick={<ConceptTick />} />
          <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} fontSize={11} />
          {/* a 0% bar still gets a sliver, so its label has somewhere to sit */}
          <Bar dataKey="rate" radius={0} maxBarSize={44} minPointSize={3} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.name} fill={r.rate < WEAK_BELOW ? "var(--hp)" : "var(--primary)"} />
            ))}
            <LabelList dataKey="rate" position="top" formatter={(v) => `${v}%`} fontSize={11} fill="var(--foreground)" />
            <LabelList dataKey="trend" content={<TrendLabel />} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </ScrollPane>
  );
}
