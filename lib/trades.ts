export type Direction = "long" | "short";
export type TradeResult = "win" | "loss" | "open";

export interface Trade {
  id: string;
  createdAt: string;
  pair: string;
  direction: Direction;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  result: TradeResult;
}

export type NewTrade = Omit<Trade, "id" | "createdAt">;

export interface TradeFormValues {
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
const DIRECTIONS: Direction[] = ["long", "short"];
const RESULTS: TradeResult[] = ["win", "loss", "open"];

function parsePositive(raw: string): number | string {
  const trimmed = raw.trim();
  if (trimmed === "") return "Required.";
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return "Must be a number greater than 0.";
  return value;
}

export function validateTrade(values: TradeFormValues): {
  errors: TradeFormErrors;
  trade?: NewTrade;
} {
  const errors: TradeFormErrors = {};

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

export function isTrade(value: unknown): value is Trade {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.createdAt === "string" &&
    typeof t.pair === "string" &&
    DIRECTIONS.includes(t.direction as Direction) &&
    RESULTS.includes(t.result as TradeResult) &&
    [t.entry, t.stopLoss, t.takeProfit, t.lotSize].every(
      (n) => typeof n === "number" && Number.isFinite(n),
    )
  );
}
