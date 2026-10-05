import { isTrade, type NewTrade, type Trade } from "./trades";

const STORAGE_KEY = "trade-journal:trades";
const EMPTY: Trade[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedTrades: Trade[] = EMPTY;

function parse(raw: string | null): Trade[] {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isTrade) : EMPTY;
  } catch {
    return EMPTY;
  }
}

// Returns the same array instance until storage changes, as useSyncExternalStore requires.
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
  listeners.forEach((listener) => listener());
  return true;
}

export function addTrade(trade: NewTrade): boolean {
  return save([{ ...trade, id: newId(), createdAt: new Date().toISOString() }, ...getTrades()]);
}

/** Replaces a trade's details, keeping its id and the date it was logged. */
export function updateTrade(id: string, trade: NewTrade): boolean {
  return save(getTrades().map((t) => (t.id === id ? { ...trade, id: t.id, createdAt: t.createdAt } : t)));
}

export function deleteTrade(id: string): boolean {
  return save(getTrades().filter((t) => t.id !== id));
}
