# Trade Journal

A single-page trading journal built with Next.js (App Router), TypeScript, Tailwind CSS and Recharts.

- Log trades with date, pair, direction, entry, stop loss, take profit, lot size and result (win / loss / open)
- Edit trades, and delete them with an 8-second Undo
- If a trade you're editing is changed or deleted in another tab, the form warns you instead of overwriting it
- Stats: total trades, win rate, average planned R:R and current win/loss streak
- Equity curve of cumulative R over closed trades
- Light and dark themes (follows your system until you pick one)

## Where your data lives

Trades are saved in your browser's `localStorage` under the key `trade-journal:trades`. Nothing is sent to a server, so trades don't sync between browsers or devices, and clearing your site data deletes them.

## How the numbers are calculated

The app records planned levels, not exit prices, so results are measured in **R**, where 1R is the amount risked (entry to stop loss):

- **R:R** for a trade is `|take profit − entry| ÷ |entry − stop loss|`. Average R:R includes open trades.
- **Win rate** is wins ÷ (wins + losses). Open trades are excluded.
- **Equity curve**: each win adds its planned R:R (assumes take profit was hit), each loss subtracts 1R (assumes the stop was hit). Trades are plotted by trade date; trades on the same date keep the order they were logged.
- **Current streak** counts back from the most recent closed trade by trade date, skipping open ones.

The logic is in [`lib/stats.ts`](lib/stats.ts) and validation in [`lib/trades.ts`](lib/trades.ts).

## Development

Requires Node.js 22.18 or newer (the unit tests run TypeScript directly with Node's built-in test runner).

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests for validation, stats, formatting and storage
npm run lint
npm run build    # production build
```
