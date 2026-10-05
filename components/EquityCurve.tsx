"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { equityCurve, type EquityPoint } from "@/lib/stats";
import type { Trade } from "@/lib/trades";

const axisTick = { fill: "var(--chart-axis)", fontSize: 12 };

function formatR(value: number) {
  const rounded = Math.abs(value) < 0.005 ? 0 : value;
  return `${rounded > 0 ? "+" : rounded < 0 ? "−" : ""}${Math.abs(rounded).toFixed(2)}R`;
}

function EquityTooltip({ point }: { point: EquityPoint }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
      {point.trade === 0 ? (
        <p className="font-medium">Start</p>
      ) : (
        <>
          <p className="font-medium">
            Trade {point.trade} · {point.pair}
          </p>
          <p className="text-zinc-500 dark:text-zinc-400">This trade: {formatR(point.r)}</p>
        </>
      )}
      <p className="mt-0.5 tabular-nums">Equity: {formatR(point.equity)}</p>
    </div>
  );
}

export default function EquityCurve({ trades }: { trades: Trade[] }) {
  const points = equityCurve(trades);
  // The curve has a starting point at 0, so it holds one more point than there are closed trades.
  const closedCount = Math.max(points.length - 1, 0);
  const current = points.at(-1)?.equity ?? 0;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold">Equity curve</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Cumulative R over closed trades. Wins count as their planned R:R, losses as −1R.
          </p>
        </div>
        {closedCount > 0 && (
          <p className="shrink-0 text-2xl font-semibold tabular-nums">{formatR(current)}</p>
        )}
      </div>
      {closedCount === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Mark a trade as a win or loss to see your equity curve.
        </p>
      ) : (
        <div
          role="img"
          aria-label={`Equity curve across ${closedCount} closed trade${closedCount === 1 ? "" : "s"}, currently at ${formatR(current)}.`}
          className="px-2 py-4"
        >
          <ResponsiveContainer width="100%" height={260} initialDimension={{ width: 600, height: 260 }}>
            <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis
                dataKey="trade"
                type="number"
                domain={[0, "dataMax"]}
                allowDecimals={false}
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: "var(--chart-grid)" }}
              />
              <YAxis
                width={52}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `${value}R`}
              />
              <ReferenceLine y={0} stroke="var(--chart-zero)" />
              <Tooltip
                cursor={{ stroke: "var(--chart-zero)", strokeWidth: 1 }}
                isAnimationActive={false}
                content={({ active, payload }) =>
                  active && payload?.[0] ? <EquityTooltip point={payload[0].payload as EquityPoint} /> : null
                }
              />
              <Line
                type="linear"
                dataKey="equity"
                stroke="var(--chart-line)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                dot={false}
                activeDot={{ r: 5, fill: "var(--chart-line)", stroke: "var(--chart-surface)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
