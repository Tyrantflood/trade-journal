"use client";

import { useLayoutEffect } from "react";
import { applyTheme, getSavedTheme, getSystemTheme, saveTheme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./icons";

export default function ThemeToggle() {
  useLayoutEffect(() => {
    // Re-apply after React's dev-only remount clears <html> attributes; a no-op in production.
    applyTheme(getSavedTheme() ?? getSystemTheme());

    // Until the user picks a theme, follow the system setting.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!getSavedTheme()) applyTheme(getSystemTheme());
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    saveTheme(next);
  }

  // Icon and label follow the data-theme attribute through CSS, so server and client render the same markup.
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
    >
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
      <span className="sr-only dark:hidden">Switch to dark mode</span>
      <span className="sr-only hidden dark:inline">Switch to light mode</span>
    </button>
  );
}
