import type { Trade, TradeResult } from "@/lib/trades";

const columns = ["Date", "Pair", "Direction", "Entry", "Stop loss", "Take profit", "Lot size", "Result"];

const resultStyles: Record<TradeResult, string> = {
  win: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  loss: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  open: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function TradesTable({ trades }: { trades: Trade[] }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="border-b border-zinc-200 px-5 py-4 text-lg font-semibold dark:border-zinc-800">
        Trades
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-zinc-500 dark:text-zinc-400">
            <tr>
              {columns.map((col) => (
                <th key={col} scope="col" className="whitespace-nowrap px-3 py-3 first:pl-5 last:pr-5 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="whitespace-nowrap px-3 py-3 first:pl-5 last:pr-5">{dateFormat.format(new Date(trade.createdAt))}</td>
                <td className="whitespace-nowrap px-3 py-3 first:pl-5 last:pr-5 font-medium">{trade.pair}</td>
                <td className="whitespace-nowrap px-3 py-3 first:pl-5 last:pr-5">{capitalize(trade.direction)}</td>
                <td className="whitespace-nowrap px-3 py-3 first:pl-5 last:pr-5 tabular-nums">{trade.entry}</td>
                <td className="whitespace-nowrap px-3 py-3 first:pl-5 last:pr-5 tabular-nums">{trade.stopLoss}</td>
                <td className="whitespace-nowrap px-3 py-3 first:pl-5 last:pr-5 tabular-nums">{trade.takeProfit}</td>
                <td className="whitespace-nowrap px-3 py-3 first:pl-5 last:pr-5 tabular-nums">{trade.lotSize}</td>
                <td className="whitespace-nowrap px-3 py-3 first:pl-5 last:pr-5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${resultStyles[trade.result]}`}>
                    {capitalize(trade.result)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {trades.length === 0 && (
        <p className="border-t border-zinc-200 px-5 py-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          No trades yet. Add one using the form.
        </p>
      )}
    </section>
  );
}
