import type { Trade } from "@/lib/trades";

export default function StatsBar({ trades }: { trades: Trade[] }) {
  const wins = trades.filter((t) => t.result === "win").length;
  const losses = trades.filter((t) => t.result === "loss").length;
  const open = trades.filter((t) => t.result === "open").length;
  const closed = wins + losses;

  const stats = [
    { label: "Total trades", value: String(trades.length) },
    { label: "Win rate", value: closed > 0 ? `${Math.round((wins / closed) * 100)}%` : "—" },
    { label: "Wins / Losses", value: `${wins} / ${losses}` },
    { label: "Open trades", value: String(open) },
  ];

  return (
    <section aria-label="Statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
