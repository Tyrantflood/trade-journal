import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import type { NewTrade } from "./trades.ts";

// Minimal stand-ins for the browser APIs the store uses.
const storage = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  },
  window: { addEventListener() {}, removeEventListener() {} },
});

const { addTrade, deleteTrade, getTrades, restoreTrade, subscribe, updateTrade } = await import("./tradeStore.ts");

const KEY = "trade-journal:trades";
const base: NewTrade = {
  date: "2026-10-01",
  pair: "EURUSD",
  direction: "long",
  entry: 100,
  stopLoss: 90,
  takeProfit: 120,
  lotSize: 1,
  result: "open",
};

/** Simulates another tab writing straight to storage. */
function writeFromOtherTab(mutate: (trades: Record<string, unknown>[]) => Record<string, unknown>[]) {
  storage.set(KEY, JSON.stringify(mutate(JSON.parse(storage.get(KEY) ?? "[]"))));
}

beforeEach(() => storage.clear());

test("new trades start at version 1", () => {
  assert.equal(addTrade(base), true);
  const [t] = getTrades();
  assert.equal(t.version, 1);
  assert.equal(t.pair, "EURUSD");
});

test("an edit from the current version saves and bumps the version", () => {
  addTrade(base);
  const [t] = getTrades();
  assert.equal(updateTrade(t.id, { ...base, result: "win" }, 1), "saved");
  const [after] = getTrades();
  assert.equal(after.result, "win");
  assert.equal(after.version, 2);
  assert.equal(after.createdAt, t.createdAt);
});

test("an edit based on a stale version is refused, and the page is told to re-read", () => {
  addTrade(base);
  const [t] = getTrades();
  // Another tab saves an edit first.
  writeFromOtherTab((all) => all.map((x) => ({ ...x, result: "loss", version: 2 })));
  let notified = 0;
  const unsubscribe = subscribe(() => notified++);
  assert.equal(updateTrade(t.id, { ...base, result: "win" }, 1), "conflict");
  unsubscribe();
  assert.equal(notified, 1);
  assert.equal(getTrades()[0].result, "loss", "the other tab's change is kept");
  // Overwriting deliberately, from the version now stored, works.
  assert.equal(updateTrade(t.id, { ...base, result: "win" }, 2), "saved");
  assert.equal(getTrades()[0].version, 3);
});

test("editing a trade deleted elsewhere reports it missing", () => {
  addTrade(base);
  const [t] = getTrades();
  writeFromOtherTab(() => []);
  assert.equal(updateTrade(t.id, base, 1), "missing");
  assert.deepEqual(getTrades(), []);
});

test("delete then restore puts the trade back unchanged", () => {
  addTrade(base);
  addTrade({ ...base, pair: "GBPUSD" });
  const victim = getTrades().find((t) => t.pair === "EURUSD")!;
  assert.equal(deleteTrade(victim.id), true);
  assert.equal(getTrades().length, 1);
  assert.equal(restoreTrade(victim), true);
  assert.deepEqual(getTrades().find((t) => t.id === victim.id), victim);
  assert.equal(restoreTrade(victim), true, "restoring twice is harmless");
  assert.equal(getTrades().length, 2);
});

test("older saved trades without date or version still load", () => {
  storage.set(
    KEY,
    JSON.stringify([
      { id: "old", createdAt: "2026-09-15T12:00:00.000Z", pair: "EURUSD", direction: "long", entry: 100, stopLoss: 90, takeProfit: 120, lotSize: 1, result: "win" },
    ]),
  );
  const [t] = getTrades();
  assert.equal(t.id, "old");
  assert.equal(t.version, 1);
  assert.match(t.date, /^2026-09-1[45]$/);
});
