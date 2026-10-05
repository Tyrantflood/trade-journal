import type { Trade } from "./trades";

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

/** Consecutive wins or losses, counting back from the most recent closed trade. Open trades are skipped. */
export function currentStreak(trades: Trade[]): Streak | null {
  const closed = trades
    .filter((t): t is Trade & { result: Streak["result"] } => t.result !== "open")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (closed.length === 0) return null;

  const result = closed[0].result;
  let count = 0;
  for (const trade of closed) {
    if (trade.result !== result) break;
    count++;
  }
  return { result, count };
}
