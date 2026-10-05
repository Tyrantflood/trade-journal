import { compareTradesOldestFirst, type Trade } from "./trades.ts";

export interface Streak {
  result: "win" | "loss";
  count: number;
}

/** Wins as a fraction (0–1) of closed trades, or null when nothing has closed. */
export function winRate(trades: Trade[]): number | null {
  const wins = trades.filter((t) => t.result === "win").length;
  const losses = trades.filter((t) => t.result === "loss").length;
  const closed = wins + losses;
  return closed > 0 ? wins / closed : null;
}

/** Planned reward-to-risk: distance to take profit divided by distance to stop loss. */
export function riskReward(trade: Trade): number {
  return Math.abs(trade.takeProfit - trade.entry) / Math.abs(trade.entry - trade.stopLoss);
}

/** Mean planned R:R across all trades, or null when there are none. */
export function averageRiskReward(trades: Trade[]): number | null {
  if (trades.length === 0) return null;
  const total = trades.reduce((sum, t) => sum + riskReward(t), 0);
  return total / trades.length;
}

type ClosedTrade = Trade & { result: Streak["result"] };

function closedOldestFirst(trades: Trade[]): ClosedTrade[] {
  return trades
    .filter((t): t is ClosedTrade => t.result !== "open")
    .sort(compareTradesOldestFirst);
}

/** Consecutive wins or losses, counting back from the most recent closed trade. Open trades are skipped. */
export function currentStreak(trades: Trade[]): Streak | null {
  const closed = closedOldestFirst(trades).reverse();
  if (closed.length === 0) return null;

  const result = closed[0].result;
  let count = 0;
  for (const trade of closed) {
    if (trade.result !== result) break;
    count++;
  }
  return { result, count };
}

export interface EquityPoint {
  /** 0 is the starting point; 1..n are closed trades in date order. */
  trade: number;
  pair: string | null;
  date: string | null;
  r: number;
  equity: number;
}

/** R gained on a closed trade, assuming wins hit take profit (+R:R) and losses hit stop loss (-1R). */
export function tradeR(trade: ClosedTrade): number {
  return trade.result === "win" ? riskReward(trade) : -1;
}

/** Cumulative R after each closed trade, starting from 0. Empty when nothing has closed. */
export function equityCurve(trades: Trade[]): EquityPoint[] {
  const closed = closedOldestFirst(trades);
  if (closed.length === 0) return [];

  let equity = 0;
  const points: EquityPoint[] = [{ trade: 0, pair: null, date: null, r: 0, equity: 0 }];
  closed.forEach((trade, i) => {
    const r = tradeR(trade);
    equity += r;
    points.push({ trade: i + 1, pair: trade.pair, date: trade.date, r, equity });
  });
  return points;
}
