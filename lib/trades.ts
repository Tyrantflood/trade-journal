export type Direction = "long" | "short";
export type TradeResult = "win" | "loss" | "open";

export interface Trade {
  id: string;
  /** Day the trade was taken, as YYYY-MM-DD in the trader's local calendar. */
  date: string;
  /** When the trade was logged; breaks ties between trades on the same date. */
  createdAt: string;
  /** Bumped on every edit so a stale edit form (e.g. in another tab) can be detected. */
  version: number;
  pair: string;
  direction: Direction;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  result: TradeResult;
}

export type NewTrade = Omit<Trade, "id" | "createdAt" | "version">;

export interface TradeFormValues {
  date: string;
  pair: string;
  direction: Direction;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  lotSize: string;
  result: TradeResult;
}

export type TradeFormErrors = Partial<Record<keyof TradeFormValues, string>>;

const PAIR_PATTERN = /^[A-Z0-9]{2,10}(\/[A-Z0-9]{2,10})?$/;
// Plain decimals, optionally in exponent form (String() writes very small prices like 1e-7).
// A leading minus is allowed here so negatives get the clearer "greater than 0" message.
const NUMBER_PATTERN = /^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DIRECTIONS: Direction[] = ["long", "short"];
const RESULTS: TradeResult[] = ["win", "loss", "open"];

/** YYYY-MM-DD for the given moment in the local time zone. */
export function toLocalDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** True for a real calendar date in YYYY-MM-DD form (rejects things like 2026-02-30). */
export function isValidDateString(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Oldest first: by trade date, then by when it was logged. */
export function compareTradesOldestFirst(a: Trade, b: Trade): number {
  return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
}

function parsePositive(raw: string): number | string {
  const trimmed = raw.trim();
  if (trimmed === "") return "Required.";
  if (!NUMBER_PATTERN.test(trimmed)) return "Enter a number, e.g. 1.0850.";
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return "Must be greater than 0.";
  return value;
}

/** `today` is the local YYYY-MM-DD used to reject future dates; pass "" to skip that check. */
export function validateTrade(
  values: TradeFormValues,
  today: string,
): {
  errors: TradeFormErrors;
  trade?: NewTrade;
} {
  const errors: TradeFormErrors = {};

  const date = values.date.trim();
  if (date === "") errors.date = "Required.";
  else if (!isValidDateString(date)) errors.date = "Enter a valid date.";
  else if (today !== "" && date > today) errors.date = "Date can't be in the future.";

  const pair = values.pair.trim().toUpperCase();
  if (pair === "") errors.pair = "Required.";
  else if (!PAIR_PATTERN.test(pair)) errors.pair = "Use a format like EURUSD or EUR/USD.";

  if (!DIRECTIONS.includes(values.direction)) errors.direction = "Choose long or short.";
  if (!RESULTS.includes(values.result)) errors.result = "Choose win, loss or open.";

  const entry = parsePositive(values.entry);
  const stopLoss = parsePositive(values.stopLoss);
  const takeProfit = parsePositive(values.takeProfit);
  const lotSize = parsePositive(values.lotSize);

  if (typeof entry === "string") errors.entry = entry;
  if (typeof stopLoss === "string") errors.stopLoss = stopLoss;
  if (typeof takeProfit === "string") errors.takeProfit = takeProfit;
  if (typeof lotSize === "string") errors.lotSize = lotSize;

  if (typeof entry === "number") {
    const isLong = values.direction === "long";
    if (typeof stopLoss === "number" && (isLong ? stopLoss >= entry : stopLoss <= entry)) {
      errors.stopLoss = `For a ${values.direction} trade, stop loss must be ${isLong ? "below" : "above"} entry.`;
    }
    if (typeof takeProfit === "number" && (isLong ? takeProfit <= entry : takeProfit >= entry)) {
      errors.takeProfit = `For a ${values.direction} trade, take profit must be ${isLong ? "above" : "below"} entry.`;
    }
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    trade: {
      date,
      pair,
      direction: values.direction,
      entry: entry as number,
      stopLoss: stopLoss as number,
      takeProfit: takeProfit as number,
      lotSize: lotSize as number,
      result: values.result,
    },
  };
}

/**
 * Fills in fields added after a record was saved, so older trades keep loading:
 * `date` comes from when the trade was logged, and `version` starts at 1.
 */
export function upgradeStoredTrade(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  const t = value as Record<string, unknown>;
  const upgraded = { ...t };
  if (upgraded.date === undefined && typeof t.createdAt === "string") {
    const logged = new Date(t.createdAt);
    if (!Number.isNaN(logged.getTime())) upgraded.date = toLocalDateString(logged);
  }
  if (upgraded.version === undefined) upgraded.version = 1;
  return upgraded;
}

/**
 * Checks a stored record before the app trusts it. Rejects anything that would break rendering
 * (an unparseable date) or the stats (non-positive prices, or a stop loss at entry, which means zero risk).
 */
export function isTrade(value: unknown): value is Trade {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    t.id !== "" &&
    typeof t.date === "string" &&
    isValidDateString(t.date) &&
    typeof t.createdAt === "string" &&
    !Number.isNaN(Date.parse(t.createdAt)) &&
    Number.isInteger(t.version) &&
    typeof t.pair === "string" &&
    t.pair !== "" &&
    DIRECTIONS.includes(t.direction as Direction) &&
    RESULTS.includes(t.result as TradeResult) &&
    [t.entry, t.stopLoss, t.takeProfit, t.lotSize].every(
      (n) => typeof n === "number" && Number.isFinite(n) && n > 0,
    ) &&
    t.stopLoss !== t.entry
  );
}
