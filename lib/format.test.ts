import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPercent, formatTradeDate } from "./format.ts";

test("formatPercent only shows 0% and 100% when exact", () => {
  assert.equal(formatPercent(2 / 3), "67%");
  assert.equal(formatPercent(1), "100%");
  assert.equal(formatPercent(0), "0%");
  assert.equal(formatPercent(199 / 200), "99%");
  assert.equal(formatPercent(1 / 300), "1%");
});

test("formatTradeDate shows the calendar day as written, in any time zone", () => {
  const expected = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(2026, 9, 1));
  assert.equal(formatTradeDate("2026-10-01"), expected);
  assert.equal(formatTradeDate("not a date"), "—");
  assert.equal(formatTradeDate(""), "—");
});
