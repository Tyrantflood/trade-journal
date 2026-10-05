"use client";

import { useState, useSyncExternalStore, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import type { UpdateResult } from "@/lib/tradeStore";
import {
  toLocalDateString,
  validateTrade,
  type NewTrade,
  type Trade,
  type TradeFormErrors,
  type TradeFormValues,
} from "@/lib/trades";

const EMPTY_FORM: TradeFormValues = {
  date: "", // empty means "today", filled in at render time
  pair: "",
  direction: "long",
  entry: "",
  stopLoss: "",
  takeProfit: "",
  lotSize: "",
  result: "open",
};

function toFormValues(trade: Trade): TradeFormValues {
  return {
    date: trade.date,
    pair: trade.pair,
    direction: trade.direction,
    entry: String(trade.entry),
    stopLoss: String(trade.stopLoss),
    takeProfit: String(trade.takeProfit),
    lotSize: String(trade.lotSize),
    result: trade.result,
  };
}

// Today's date only exists in the browser; the server renders "" so hydration matches.
const subscribeNever = () => () => {};
function useToday(): string {
  return useSyncExternalStore(subscribeNever, () => toLocalDateString(new Date()), () => "");
}

const baseInputClass =
  "w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:bg-zinc-950";
const okInputClass =
  "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-400 dark:focus:ring-zinc-500";
const errorInputClass =
  "border-red-500 focus:border-red-500 focus:ring-red-300 dark:border-red-500 dark:focus:ring-red-700";
const labelClass = "mb-1 block text-sm font-medium";
const primaryButtonClass =
  "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
const secondaryButtonClass =
  "rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export interface SaveTarget {
  id: string;
  expectedVersion: number;
}

/**
 * Adds a new trade, or edits one when `editing` is set. The parent remounts this form (via key) when
 * switching between trades. `editing.current` is the live stored trade, so changes from other tabs
 * show up here; it is undefined if the trade was deleted elsewhere.
 */
export default function TradeForm({
  editing,
  onSave,
  onCancel,
}: {
  editing?: { current: Trade | undefined };
  onSave: (trade: NewTrade, target: SaveTarget | null) => UpdateResult;
  onCancel?: () => void;
}) {
  const today = useToday();
  // The version this edit started from; a different live version means another tab changed it.
  const [base, setBase] = useState<Trade | undefined>(editing?.current);
  const [values, setValues] = useState<TradeFormValues>(() =>
    editing?.current ? toFormValues(editing.current) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<TradeFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const current = editing?.current;
  const conflict: "changed" | "deleted" | null = !editing
    ? null
    : !current
      ? "deleted"
      : base && current.version !== base.version
        ? "changed"
        : null;

  function update<K extends keyof TradeFormValues>(field: K, value: TradeFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev, [field]: undefined };
      // Stop loss and take profit rules depend on entry and direction.
      if (field === "entry" || field === "direction") {
        next.stopLoss = undefined;
        next.takeProfit = undefined;
      }
      return next;
    });
  }

  function controlProps(field: keyof TradeFormValues) {
    return {
      id: field,
      name: field,
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": errors[field] ? `${field}-error` : undefined,
      className: `${baseInputClass} ${errors[field] ? errorInputClass : okInputClass}`,
    };
  }

  // Text inputs rather than type="number": the scroll wheel and arrow keys can't silently change a price,
  // and anything that isn't a number reaches validation instead of being blanked out by the browser.
  function numberProps(field: "entry" | "stopLoss" | "takeProfit" | "lotSize") {
    return {
      ...controlProps(field),
      type: "text",
      inputMode: "decimal" as const,
      autoComplete: "off",
      value: values[field],
      onChange: (e: ChangeEvent<HTMLInputElement>) => update(field, e.target.value),
    };
  }

  function save(target: SaveTarget | null) {
    const { errors: nextErrors, trade } = validateTrade({ ...values, date: values.date || today }, today);
    setErrors(nextErrors);
    setSaveError(null);
    if (!trade) return;

    const result = onSave(trade, target);
    if (result === "failed") {
      setSaveError("Couldn't save the trade. Your browser's storage may be full or disabled.");
    } else if (result === "saved" && !editing) {
      setValues(EMPTY_FORM);
    }
    // "conflict" and "missing" re-render this form from storage, which shows the matching warning.
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (conflict) return; // the warning above the buttons offers the choices
    save(editing && base ? { id: base.id, expectedVersion: base.version } : null);
  }

  function loadLatest() {
    if (!current) return;
    setBase(current);
    setValues(toFormValues(current));
    setErrors({});
    setSaveError(null);
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold">{editing ? "Edit trade" : "New trade"}</h2>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field id="date" label="Date" error={errors.date}>
            <input
              {...controlProps("date")}
              type="date"
              max={today || undefined}
              value={values.date || today}
              onChange={(e) => update("date", e.target.value)}
            />
          </Field>
          <Field id="pair" label="Pair" error={errors.pair}>
            <input
              {...controlProps("pair")}
              type="text"
              placeholder="EUR/USD"
              autoComplete="off"
              autoFocus={Boolean(editing)}
              value={values.pair}
              onChange={(e) => update("pair", e.target.value)}
              className={`${controlProps("pair").className} uppercase placeholder:normal-case`}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="direction" label="Direction" error={errors.direction}>
            <select
              {...controlProps("direction")}
              value={values.direction}
              onChange={(e) => update("direction", e.target.value as TradeFormValues["direction"])}
            >
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </Field>
          <Field id="result" label="Result" error={errors.result}>
            <select
              {...controlProps("result")}
              value={values.result}
              onChange={(e) => update("result", e.target.value as TradeFormValues["result"])}
            >
              <option value="open">Open</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="entry" label="Entry" error={errors.entry}>
            <input {...numberProps("entry")} />
          </Field>
          <Field id="lotSize" label="Lot size" error={errors.lotSize}>
            <input {...numberProps("lotSize")} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="stopLoss" label="Stop loss" error={errors.stopLoss}>
            <input {...numberProps("stopLoss")} />
          </Field>
          <Field id="takeProfit" label="Take profit" error={errors.takeProfit}>
            <input {...numberProps("takeProfit")} />
          </Field>
        </div>

        {conflict && (
          <div
            role="alert"
            className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
          >
            {conflict === "changed" ? (
              <>
                <p>
                  <span className="font-semibold">This trade was changed in another tab.</span> Saving now would
                  replace those changes.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={loadLatest} className={secondaryButtonClass}>
                    Load latest version
                  </button>
                  <button
                    type="button"
                    onClick={() => current && save({ id: current.id, expectedVersion: current.version })}
                    className={secondaryButtonClass}
                  >
                    Overwrite with my changes
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>
                  <span className="font-semibold">This trade was deleted in another tab.</span> You can keep your
                  changes as a new trade or discard them.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => save(null)} className={secondaryButtonClass}>
                    Save as new trade
                  </button>
                  <button type="button" onClick={onCancel} className={secondaryButtonClass}>
                    Discard
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {saveError && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {saveError}
          </p>
        )}
        <div className="flex gap-3">
          <button type="submit" disabled={conflict !== null} className={`flex-1 ${primaryButtonClass}`}>
            {editing ? "Save changes" : "Save trade"}
          </button>
          {editing && (
            <button type="button" onClick={onCancel} className={secondaryButtonClass}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
