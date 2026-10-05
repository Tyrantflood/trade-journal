import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compareTradesOldestFirst,
  isTrade,
  isValidDateString,
  upgradeStoredTrade,
  validateTrade,
  type Trade,
  type TradeFormValues,
} from "./trades.ts";

const TODAY = "2026-10-05";

const valid: TradeFormValues = {
  date: "2026-10-01",
  pair: " eur/usd ",
  direction: "long",
  entry: "1.1000",
  stopLoss: "1.0950",
  takeProfit: "1.1100",
  lotSize: "0.5",
  result: "open",
};

const check = (overrides: Partial<TradeFormValues>) => validateTrade({ ...valid, ...overrides }, TODAY);

test("valid form becomes a normalized trade", () => {
  const { errors, trade } = check({});
  assert.deepEqual(errors, {});
  assert.deepEqual(trade, {
    date: "2026-10-01",
    pair: "EUR/USD",
    direction: "long",
    entry: 1.1,
    stopLoss: 1.095,
    takeProfit: 1.11,
    lotSize: 0.5,
    result: "open",
  });
});

test("required fields", () => {
  const { errors, trade } = check({ date: "", pair: "", entry: " ", stopLoss: "", takeProfit: "", lotSize: "" });
  assert.equal(trade, undefined);
  for (const field of ["date", "pair", "entry", "stopLoss", "takeProfit", "lotSize"] as const) {
    assert.equal(errors[field], "Required.", field);
  }
});

test("date must be a real day, not in the future", () => {
  assert.equal(check({ date: TODAY }).errors.date, undefined, "today is allowed");
  assert.equal(check({ date: "2026-10-06" }).errors.date, "Date can't be in the future.");
  assert.equal(check({ date: "2026-02-30" }).errors.date, "Enter a valid date.");
  assert.equal(check({ date: "01/10/2026" }).errors.date, "Enter a valid date.");
  assert.equal(validateTrade({ ...valid, date: "2030-01-01" }, "").errors.date, undefined, "future check skipped without today");
});

test("pair format", () => {
  assert.ok(check({ pair: "XAUUSD" }).trade);
  assert.ok(check({ pair: "EU-R USD" }).errors.pair);
  assert.ok(check({ pair: "EUR/" }).errors.pair);
});

test("numbers must be plain positive decimals", () => {
  for (const bad of ["abc", "1.2.3", "0x10", "1,5", "Infinity", "--1"]) {
    assert.equal(check({ lotSize: bad }).errors.lotSize, "Enter a number, e.g. 1.0850.", bad);
  }
  assert.equal(check({ lotSize: "0" }).errors.lotSize, "Must be greater than 0.");
  assert.equal(check({ lotSize: "-1" }).errors.lotSize, "Must be greater than 0.");
  assert.equal(check({ lotSize: ".5" }).trade?.lotSize, 0.5);
  // Very small prices round-trip through String() in exponent form.
  assert.equal(check({ entry: "1e-7", stopLoss: "5e-8", takeProfit: "2e-7" }).trade?.entry, 1e-7);
});

test("stop loss and take profit must sit on the correct side of entry", () => {
  const long = check({ stopLoss: "1.1050", takeProfit: "1.0900" });
  assert.match(long.errors.stopLoss ?? "", /below entry/);
  assert.match(long.errors.takeProfit ?? "", /above entry/);
  assert.ok(check({ stopLoss: "1.1" }).errors.stopLoss, "stop at entry is rejected");
  assert.deepEqual(check({ direction: "short", stopLoss: "1.1050", takeProfit: "1.0900" }).errors, {});
});

test("isValidDateString", () => {
  assert.equal(isValidDateString("2024-02-29"), true);
  assert.equal(isValidDateString("2026-02-29"), false);
  assert.equal(isValidDateString("2026-13-01"), false);
  assert.equal(isValidDateString("2026-1-01"), false);
});

const good = {
  id: "a",
  date: "2026-10-01",
  createdAt: "2026-10-01T09:00:00.000Z",
  version: 1,
  pair: "EURUSD",
  direction: "long",
  entry: 100,
  stopLoss: 90,
  takeProfit: 120,
  lotSize: 1,
  result: "win",
};

test("isTrade rejects records that would break the app", () => {
  assert.equal(isTrade(good), true);
  assert.equal(isTrade({ ...good, createdAt: "yesterday" }), false);
  assert.equal(isTrade({ ...good, date: "2026-02-30" }), false);
  assert.equal(isTrade({ ...good, version: 1.5 }), false);
  assert.equal(isTrade({ ...good, stopLoss: 100 }), false);
  assert.equal(isTrade({ ...good, entry: -5 }), false);
  assert.equal(isTrade({ ...good, lotSize: 0 }), false);
  assert.equal(isTrade({ ...good, id: "" }), false);
  assert.equal(isTrade({ ...good, result: "pending" }), false);
  assert.equal(isTrade(null), false);
});

test("trades saved before date and version existed are upgraded, not dropped", () => {
  const old: Record<string, unknown> = { ...good, createdAt: "2026-09-15T12:00:00.000Z" };
  delete old.date;
  delete old.version;
  const upgraded = upgradeStoredTrade(old);
  assert.equal(isTrade(upgraded), true);
  assert.equal((upgraded as Trade).version, 1);
  assert.match((upgraded as Trade).date, /^2026-09-1[45]$/, "local calendar day of when it was logged");
  // Existing values are kept.
  assert.deepEqual(upgradeStoredTrade(good), good);
});

test("trades sort by trade date, then by when they were logged", () => {
  const t = (id: string, date: string, createdAt: string) => ({ ...good, id, date, createdAt }) as Trade;
  const logged = [
    t("backfilled", "2026-09-01", "2026-10-05T10:00:00.000Z"),
    t("second", "2026-10-02", "2026-10-02T12:00:00.000Z"),
    t("first", "2026-10-02", "2026-10-02T08:00:00.000Z"),
  ];
  assert.deepEqual([...logged].sort(compareTradesOldestFirst).map((x) => x.id), ["backfilled", "first", "second"]);
});
