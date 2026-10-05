import Header from "@/components/Header";
import TradeJournal from "@/components/TradeJournal";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        <TradeJournal />
      </main>
    </div>
  );
}
