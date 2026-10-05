"use client";

import { useState, useSyncExternalStore } from "react";
import {
  addTrade,
  deleteTrade,
  getServerTrades,
  getTrades,
  subscribe,
  updateTrade,
} from "@/lib/tradeStore";
import type { NewTrade, Trade } from "@/lib/trades";
import EquityCurve from "./EquityCurve";
import StatsBar from "./StatsBar";
import TradeForm from "./TradeForm";
import TradesTable from "./TradesTable";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export default function TradeJournal() {
  const trades = useSyncExternalStore<Trade[] | null>(subscribe, getTrades, getServerTrades);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Falls back to "new trade" if the trade being edited is deleted, e.g. from another tab.
  const editingTrade = trades?.find((t) => t.id === editingId);

  function handleSave(trade: NewTrade): boolean {
    if (!editingTrade) return addTrade(trade);
    const saved = updateTrade(editingTrade.id, trade);
    if (saved) setEditingId(null);
    return saved;
  }

  function handleDelete(trade: Trade) {
    const date = dateFormat.format(new Date(trade.createdAt));
    if (!window.confirm(`Delete the ${trade.pair} trade from ${date}? This can't be undone.`)) return;
    if (!deleteTrade(trade.id)) {
      window.alert("Couldn't delete the trade. Your browser's storage may be full or disabled.");
      return;
    }
    if (trade.id === editingId) setEditingId(null);
  }

  return (
    <>
      <StatsBar trades={trades ?? []} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
        <TradeForm
          key={editingTrade?.id ?? "new"}
          editingTrade={editingTrade}
          onSave={handleSave}
          onCancel={() => setEditingId(null)}
        />
        <div className="space-y-6">
          <TradesTable
            trades={trades}
            editingId={editingTrade?.id ?? null}
            onEdit={(trade) => setEditingId(trade.id)}
            onDelete={handleDelete}
          />
          {trades !== null && trades.length > 0 && <EquityCurve trades={trades} />}
        </div>
      </div>
    </>
  );
}
