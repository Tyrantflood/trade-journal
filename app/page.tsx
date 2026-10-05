import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import TradeForm from "@/components/TradeForm";
import TradesTable from "@/components/TradesTable";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        <StatsBar />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
          <TradeForm />
          <TradesTable />
        </div>
      </main>
    </div>
  );
}
