import { averageRiskReward, currentStreak, winRate } from "@/lib/stats";
import type { Trade } from "@/lib/trades";

export default function StatsBar({ trades }: { trades: Trade[] }) {
  const rate = winRate(trades);
  const avgRR = averageRiskReward(trades);
  const streak = currentStreak(trades);

  const stats = [
    { label: "Total trades", value: String(trades.length) },
    { label: "Win rate", value: rate === null ? "—" : `${Math.round(rate * 100)}%` },
    { label: "Average R:R", value: avgRR === null ? "—" : `1:${avgRR.toFixed(2)}` },
    {
      label: "Current streak",
      value: streak === null ? "—" : `${streak.count} ${streak.result}${streak.count === 1 ? "" : streak.result === "win" ? "s" : "es"}`,
      className:
        streak === null
          ? ""
          : streak.result === "win"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <section aria-label="Statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.className ?? ""}`}>{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
