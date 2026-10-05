const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-800";
const labelClass = "mb-1 block text-sm font-medium";

export default function TradeForm() {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold">New trade</h2>
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="date" className={labelClass}>Date</label>
            <input id="date" name="date" type="date" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="symbol" className={labelClass}>Symbol</label>
            <input id="symbol" name="symbol" type="text" placeholder="AAPL" required className={`${inputClass} uppercase`} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="side" className={labelClass}>Side</label>
            <select id="side" name="side" className={inputClass}>
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </div>
          <div>
            <label htmlFor="quantity" className={labelClass}>Quantity</label>
            <input id="quantity" name="quantity" type="number" min="0" step="any" required className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="entry" className={labelClass}>Entry price</label>
            <input id="entry" name="entry" type="number" min="0" step="any" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="exit" className={labelClass}>Exit price</label>
            <input id="exit" name="exit" type="number" min="0" step="any" required className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="notes" className={labelClass}>Notes</label>
          <textarea id="notes" name="notes" rows={3} className={inputClass} />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Add trade
        </button>
      </form>
    </section>
  );
}
