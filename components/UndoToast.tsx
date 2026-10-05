"use client";

import { useEffect } from "react";

const DISMISS_AFTER_MS = 8000;

/**
 * Bottom-of-screen message with an Undo button. The live region is always rendered so screen readers
 * announce the message when it appears. `messageKey` restarts the timer for each new message.
 */
export default function UndoToast({
  message,
  messageKey,
  onUndo,
  onDismiss,
}: {
  message: string | null;
  messageKey: string | null;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (messageKey === null) return;
    const timer = window.setTimeout(onDismiss, DISMISS_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [messageKey, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center"
    >
      {message && (
        <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-lg bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
          <p className="flex-1">{message}</p>
          <button
            type="button"
            onClick={onUndo}
            className="rounded-md px-2 py-1 font-semibold underline-offset-2 hover:underline"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="rounded-md px-2 py-1 text-zinc-400 hover:text-white dark:text-zinc-500 dark:hover:text-zinc-900"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
