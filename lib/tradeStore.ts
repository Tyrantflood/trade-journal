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

export function getServerTrades(): Trade[] {
  return EMPTY;
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

export function addTrade(trade: NewTrade): boolean {
  const next: Trade[] = [
    { ...trade, id: newId(), createdAt: new Date().toISOString() },
    ...getTrades(),
  ];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  listeners.forEach((listener) => listener());
  return true;
}
