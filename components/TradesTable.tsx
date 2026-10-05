const columns = ["Date", "Symbol", "Side", "Qty", "Entry", "Exit", "P&L"];

export default function TradesTable() {
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
                <th key={col} scope="col" className="whitespace-nowrap px-5 py-3 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
      <p className="border-t border-zinc-200 px-5 py-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        No trades yet. Add one using the form.
      </p>
    </section>
  );
}
