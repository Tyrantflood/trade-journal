import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight">Trade Journal</h1>
        <ThemeToggle />
      </div>
    </header>
  );
}
