import { test } from "node:test";
import assert from "node:assert/strict";
import { averageRiskReward, currentStreak, equityCurve, riskReward, winRate } from "./stats.ts";
import type { Trade, TradeResult } from "./trades.ts";

let n = 0;
/** Each new trade is one day after the previous one unless a date is given. */
function trade(result: TradeResult, overrides: Partial<Trade> = {}): Trade {
  n++;
  return {
    id: String(n),
    date: `2026-01-${String(n).padStart(2, "0")}`,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString(),
    version: 1,
    pair: "EURUSD",
    direction: "long",
    entry: 100,
    stopLoss: 90,
    takeProfit: 120,
    lotSize: 1,
    result,
    ...overrides,
  };
}

test("empty journal", () => {
  assert.equal(winRate([]), null);
  assert.equal(averageRiskReward([]), null);
  assert.equal(currentStreak([]), null);
  assert.deepEqual(equityCurve([]), []);
});

test("win rate ignores open trades", () => {
  assert.equal(winRate([trade("win"), trade("loss"), trade("win"), trade("open")]), 2 / 3);
  assert.equal(winRate([trade("open")]), null);
});

test("risk reward for long and short", () => {
  assert.equal(riskReward(trade("open")), 2);
  const short = trade("open", { direction: "short", entry: 1.1, stopLoss: 1.105, takeProfit: 1.09 });
  assert.ok(Math.abs(riskReward(short) - 2) < 1e-9);
});

test("average R:R includes open trades", () => {
  assert.equal(averageRiskReward([trade("win"), trade("open", { takeProfit: 110 }), trade("loss", { takeProfit: 130 })]), 2);
});

test("streak counts back from the latest closed trade, skipping open ones", () => {
  const a = trade("loss"), b = trade("win"), c = trade("open"), d = trade("win"), e = trade("open");
  assert.deepEqual(currentStreak([e, d, c, b, a]), { result: "win", count: 2 });
  assert.deepEqual(currentStreak([a, b, c, d, e]), { result: "win", count: 2 }, "input order doesn't matter");
  assert.deepEqual(currentStreak([trade("loss"), e, d, c, b, a]), { result: "loss", count: 1 });
  assert.equal(currentStreak([trade("open")]), null);
});

test("a trade logged late but dated earlier slots into its date, not the end", () => {
  const w1 = trade("win", { date: "2026-03-01" });
  const w2 = trade("win", { date: "2026-03-02" });
  const backfilledLoss = trade("loss", { date: "2026-02-15" }); // logged last
  assert.deepEqual(currentStreak([w1, w2, backfilledLoss]), { result: "win", count: 2 });
  assert.deepEqual(equityCurve([w1, w2, backfilledLoss]).map((p) => p.date), [null, "2026-02-15", "2026-03-01", "2026-03-02"]);
});

test("equity curve accumulates R over closed trades, oldest first", () => {
  const a = trade("win"); // +2R
  const b = trade("open");
  const c = trade("loss"); // -1R
  const d = trade("win", { direction: "short", entry: 100, stopLoss: 104, takeProfit: 94 }); // +1.5R
  const curve = equityCurve([d, c, b, a]);
  assert.deepEqual(curve.map((p) => p.trade), [0, 1, 2, 3]);
  assert.deepEqual(curve.map((p) => p.r), [0, 2, -1, 1.5]);
  assert.deepEqual(curve.map((p) => p.equity), [0, 2, 1, 2.5]);
  assert.deepEqual(curve.map((p) => p.pair), [null, "EURUSD", "EURUSD", "EURUSD"]);
  assert.deepEqual(equityCurve([trade("open")]), []);
});
