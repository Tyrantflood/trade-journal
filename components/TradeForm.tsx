"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  validateTrade,
  type NewTrade,
  type Trade,
  type TradeFormErrors,
  type TradeFormValues,
} from "@/lib/trades";

const EMPTY_FORM: TradeFormValues = {
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
    pair: trade.pair,
    direction: trade.direction,
    entry: String(trade.entry),
    stopLoss: String(trade.stopLoss),
    takeProfit: String(trade.takeProfit),
    lotSize: String(trade.lotSize),
    result: trade.result,
  };
}

const baseInputClass =
  "w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:bg-zinc-950";
const okInputClass =
  "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-200 dark:border-zinc-700 dark:focus:ring-zinc-800";
const errorInputClass =
  "border-red-500 focus:border-red-500 focus:ring-red-200 dark:border-red-500 dark:focus:ring-red-900";
const labelClass = "mb-1 block text-sm font-medium";

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

// The parent remounts this form (via key) when switching between adding and editing a trade.
export default function TradeForm({
  editingTrade,
  onSave,
  onCancel,
}: {
  editingTrade?: Trade;
  onSave: (trade: NewTrade) => boolean;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<TradeFormValues>(() =>
    editingTrade ? toFormValues(editingTrade) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<TradeFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);

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

  function numberProps(field: "entry" | "stopLoss" | "takeProfit" | "lotSize") {
    return {
      ...controlProps(field),
      type: "number",
      inputMode: "decimal" as const,
      min: "0",
      step: "any",
      value: values[field],
      onChange: (e: ChangeEvent<HTMLInputElement>) => update(field, e.target.value),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { errors: nextErrors, trade } = validateTrade(values);
    setErrors(nextErrors);
    if (!trade) {
      setSaveError(null);
      return;
    }
    if (!onSave(trade)) {
      setSaveError("Couldn't save the trade. Your browser's storage may be full or disabled.");
      return;
    }
    setSaveError(null);
    setValues(EMPTY_FORM);
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold">{editingTrade ? "Edit trade" : "New trade"}</h2>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field id="pair" label="Pair" error={errors.pair}>
            <input
              {...controlProps("pair")}
              type="text"
              placeholder="EUR/USD"
              autoComplete="off"
              autoFocus={Boolean(editingTrade)}
              value={values.pair}
              onChange={(e) => update("pair", e.target.value)}
              className={`${controlProps("pair").className} uppercase placeholder:normal-case`}
            />
          </Field>
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
        {saveError && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {saveError}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {editingTrade ? "Save changes" : "Save trade"}
          </button>
          {editingTrade && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
