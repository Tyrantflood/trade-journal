import { isTrade, upgradeStoredTrade, type NewTrade, type Trade } from "./trades.ts";

const STORAGE_KEY = "trade-journal:trades";
const EMPTY: Trade[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedTrades: Trade[] = EMPTY;

// Skips records that fail validation and repeated ids, so edit/delete only ever touch one trade.
// Skipped records are not written back until the next save.
function parse(raw: string | null): Trade[] {
  if (!raw) return EMPTY;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  if (!Array.isArray(data)) return EMPTY;
  const seen = new Set<string>();
  const trades: Trade[] = [];
  for (const item of data) {
    const trade = upgradeStoredTrade(item);
    if (!isTrade(trade) || seen.has(trade.id)) continue;
    seen.add(trade.id);
    trades.push(trade);
  }
  return trades;
}

// Returns the same array instance until storage changes, as useSyncExternalStore requires.
// Reads localStorage every time, so writes always start from what other tabs saved.
export function getTrades(): Trade[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedTrades;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedTrades = parse(raw);
  }
  return cachedTrades;
}

// null tells the page the browser hasn't been read yet, so it can avoid flashing the empty state.
export function getServerTrades(): Trade[] | null {
  return null;
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Keeps other open tabs in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function newId(): string {
  // randomUUID only exists in secure contexts, so fall back when opened over a LAN IP.
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function save(trades: Trade[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  } catch {
    return false;
  }
  notify();
  return true;
}

export function addTrade(trade: NewTrade): boolean {
  return save([{ ...trade, id: newId(), createdAt: new Date().toISOString(), version: 1 }, ...getTrades()]);
}

export type UpdateResult = "saved" | "conflict" | "missing" | "failed";

/**
 * Replaces a trade's details if it is still at `expectedVersion`, keeping its id and log time.
 * Returns "conflict" if it was edited elsewhere since, or "missing" if it was deleted.
 */
export function updateTrade(id: string, trade: NewTrade, expectedVersion: number): UpdateResult {
  const trades = getTrades();
  const current = trades.find((t) => t.id === id);
  if (!current || current.version !== expectedVersion) {
    // The page may not have heard about the other tab's change yet; re-render it from storage.
    notify();
    return current ? "conflict" : "missing";
  }
  const updated: Trade = { ...trade, id, createdAt: current.createdAt, version: current.version + 1 };
  return save(trades.map((t) => (t.id === id ? updated : t))) ? "saved" : "failed";
}

export function deleteTrade(id: string): boolean {
  return save(getTrades().filter((t) => t.id !== id));
}

/** Puts a deleted trade back exactly as it was (used by Undo). A no-op if it already exists. */
export function restoreTrade(trade: Trade): boolean {
  const trades = getTrades();
  if (trades.some((t) => t.id === trade.id)) return true;
  return save([trade, ...trades]);
}
