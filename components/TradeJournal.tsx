"use client";

import { useSyncExternalStore } from "react";
import { addTrade, getServerTrades, getTrades, subscribe } from "@/lib/tradeStore";
import StatsBar from "./StatsBar";
import TradeForm from "./TradeForm";
import TradesTable from "./TradesTable";

export default function TradeJournal() {
  const trades = useSyncExternalStore(subscribe, getTrades, getServerTrades);

  return (
    <>
      <StatsBar trades={trades} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
        <TradeForm onSave={addTrade} />
        <TradesTable trades={trades} />
      </div>
    </>
  );
}
