import type { Trade, TradeResult } from "@/lib/trades";
import { ChartIcon, PencilIcon, TrashIcon } from "./icons";

const columns = ["Date", "Pair", "Direction", "Entry", "Stop loss", "Take profit", "Lot size", "Result"];

const resultStyles: Record<TradeResult, string> = {
  win: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  loss: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  open: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

const cellClass = "whitespace-nowrap px-2.5 py-3 first:pl-5";
// Pinned to the right so the buttons stay reachable when the table scrolls sideways.
const actionsCellClass = "sticky right-0 whitespace-nowrap py-2 pl-2 pr-4";
const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-5 py-14 text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        <ChartIcon width={22} height={22} />
      </span>
      <p className="text-base font-semibold">No trades yet</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        Log your first trade to start tracking your win rate, R:R, streak and equity curve.
      </p>
      <button
        type="button"
        onClick={() => document.getElementById("pair")?.focus()}
        className="mt-5 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Add your first trade
      </button>
    </div>
  );
}

export default function TradesTable({
  trades,
  editingId,
  onEdit,
  onDelete,
}: {
  /** null while saved trades are still being read from the browser. */
  trades: Trade[] | null;
  editingId: string | null;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="border-b border-zinc-200 px-5 py-4 text-lg font-semibold dark:border-zinc-800">
        Trades
      </h2>
      {trades === null ? (
        <p className="px-5 py-14 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading trades…</p>
      ) : trades.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-500 dark:text-zinc-400">
              <tr>
                {columns.map((col) => (
                  <th key={col} scope="col" className={`${cellClass} font-medium`}>
                    {col}
                  </th>
                ))}
                <th scope="col" className={`${actionsCellClass} bg-white dark:bg-zinc-900`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const date = dateFormat.format(new Date(trade.createdAt));
                const isEditing = trade.id === editingId;
                const rowBg = isEditing ? "bg-zinc-100 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900";
                return (
                  <tr
                    key={trade.id}
                    aria-current={isEditing ? "true" : undefined}
                    className={`border-t border-zinc-200 dark:border-zinc-800 ${rowBg}`}
                  >
                    <td className={cellClass}>{date}</td>
                    <td className={`${cellClass} font-medium`}>{trade.pair}</td>
                    <td className={cellClass}>{capitalize(trade.direction)}</td>
                    <td className={`${cellClass} tabular-nums`}>{trade.entry}</td>
                    <td className={`${cellClass} tabular-nums`}>{trade.stopLoss}</td>
                    <td className={`${cellClass} tabular-nums`}>{trade.takeProfit}</td>
                    <td className={`${cellClass} tabular-nums`}>{trade.lotSize}</td>
                    <td className={cellClass}>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${resultStyles[trade.result]}`}>
                        {capitalize(trade.result)}
                      </span>
                    </td>
                    <td className={`${actionsCellClass} ${rowBg}`}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(trade)}
                          aria-label={`Edit ${trade.pair} trade from ${date}`}
                          title="Edit"
                          className={iconButtonClass}
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(trade)}
                          aria-label={`Delete ${trade.pair} trade from ${date}`}
                          title="Delete"
                          className={`${iconButtonClass} hover:text-red-600 dark:hover:text-red-400`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
