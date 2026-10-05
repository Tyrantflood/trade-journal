const stats = [
  { label: "Total trades", value: "0" },
  { label: "Win rate", value: "—" },
  { label: "Net P&L", value: "$0.00" },
  { label: "Avg P&L / trade", value: "—" },
];

export default function StatsBar() {
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
