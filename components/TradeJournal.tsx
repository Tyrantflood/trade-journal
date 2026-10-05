"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { formatTradeDate } from "@/lib/format";
import {
  addTrade,
  deleteTrade,
  getServerTrades,
  getTrades,
  restoreTrade,
  subscribe,
  updateTrade,
  type UpdateResult,
} from "@/lib/tradeStore";
import type { NewTrade, Trade } from "@/lib/trades";
import EquityCurve from "./EquityCurve";
import StatsBar from "./StatsBar";
import TradeForm, { type SaveTarget } from "./TradeForm";
import TradesTable from "./TradesTable";
import UndoToast from "./UndoToast";

export default function TradeJournal() {
  const trades = useSyncExternalStore<Trade[] | null>(subscribe, getTrades, getServerTrades);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<{ trade: Trade; failedUndo?: boolean } | null>(null);

  // Stays undefined if the trade being edited is deleted in another tab; the form then offers
  // to save the changes as a new trade instead of silently discarding them.
  const editingTrade = trades?.find((t) => t.id === editingId);

  function handleSave(trade: NewTrade, target: SaveTarget | null): UpdateResult {
    const result = target ? updateTrade(target.id, trade, target.expectedVersion) : addTrade(trade) ? "saved" : "failed";
    if (result === "saved") setEditingId(null);
    return result;
  }

  function handleDelete(trade: Trade) {
    if (!deleteTrade(trade.id)) {
      window.alert("Couldn't delete the trade. Your browser's storage may be full or disabled.");
      return;
    }
    if (trade.id === editingId) setEditingId(null);
    setDeleted({ trade });
  }

  function handleUndo() {
    if (!deleted) return;
    if (restoreTrade(deleted.trade)) setDeleted(null);
    else setDeleted({ ...deleted, failedUndo: true });
  }

  const dismissToast = useCallback(() => setDeleted(null), []);

  return (
    <>
      <StatsBar trades={trades} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
        <TradeForm
          key={editingId ?? "new"}
          editing={editingId ? { current: editingTrade } : undefined}
          onSave={handleSave}
          onCancel={() => setEditingId(null)}
        />
        <div className="space-y-6">
          <TradesTable
            trades={trades}
            editingId={editingId}
            onEdit={(trade) => setEditingId(trade.id)}
            onDelete={handleDelete}
          />
          {trades !== null && trades.length > 0 && <EquityCurve trades={trades} />}
        </div>
      </div>
      <UndoToast
        message={
          deleted &&
          (deleted.failedUndo
            ? "Couldn't restore the trade. Your browser's storage may be full or disabled."
            : `Deleted ${deleted.trade.pair} trade from ${formatTradeDate(deleted.trade.date)}.`)
        }
        messageKey={deleted ? `${deleted.trade.id}:${deleted.failedUndo ? "failed" : "deleted"}` : null}
        onUndo={handleUndo}
        onDismiss={dismissToast}
      />
    </>
  );
}
