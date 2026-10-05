const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/**
 * Formats a trade date (YYYY-MM-DD) as a local calendar day. `new Date("2026-10-01")` would be
 * read as UTC midnight and show the previous day west of UTC, so the parts are parsed by hand.
 */
export function formatTradeDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "—";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date);
}

/** Whole-number percentage that only shows 0% or 100% when it's exact. */
export function formatPercent(fraction: number): string {
  let percent = Math.round(fraction * 100);
  if (percent === 100 && fraction < 1) percent = 99;
  if (percent === 0 && fraction > 0) percent = 1;
  return `${percent}%`;
}
