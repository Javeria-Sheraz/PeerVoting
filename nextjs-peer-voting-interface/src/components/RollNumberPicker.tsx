"use client";

import { useMemo, useState } from "react";
import { Search, Ban } from "lucide-react";
import { CLASS_ROSTER } from "@/lib/constants";

interface RollNumberPickerProps {
  value: string | null;
  onChange: (roll: string) => void;
  excludeRoll?: string | null;
  protectedRolls?: Set<string>;
  disabled?: boolean;
}

/**
 * Scrollable grid of roll-number chips.
 *
 * NOTE: this file previously contained two `return` statements, so
 * roughly half of it — including the abstain button — was unreachable
 * dead code. This version has a single return.
 */
export default function RollNumberPicker({
  value,
  onChange,
  excludeRoll,
  protectedRolls,
  disabled,
}: RollNumberPickerProps) {
  const [search, setSearch] = useState("");

  const roster = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CLASS_ROSTER.filter((roll) => roll !== excludeRoll)
      .filter((roll) => !protectedRolls?.has(roll))
      .filter(
        (roll) =>
          !q ||
          roll.toLowerCase().includes(q) ||
          roll.replace("2024mc", "#").includes(q),
      );
  }, [search, excludeRoll, protectedRolls]);

  return (
    <div className="w-full">
      <div className="relative mb-3">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roll number..."
          aria-label="Search roll numbers"
          disabled={disabled}
          className="field w-full py-2 pl-9 pr-3 text-sm disabled:opacity-50"
        />
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("NONE")}
        aria-pressed={value === "NONE"}
        className={`chip-btn mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
          value === "NONE"
            ? "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]"
            : "border-[var(--border-subtle)] bg-[var(--bg-elevated-2)] text-[var(--text-muted)] hover:border-[var(--danger)] hover:text-[var(--danger)]"
        }`}
      >
        <Ban aria-hidden="true" className="h-3.5 w-3.5" />
        None / abstain
      </button>

      <div
        role="group"
        aria-label="Choose a roll number"
        className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-5"
      >
        {roster.map((roll) => {
          const isSelected = value === roll;
          return (
            <button
              type="button"
              key={roll}
              disabled={disabled}
              onClick={() => onChange(roll)}
              aria-pressed={isSelected}
              aria-label={`Roll number ${roll}`}
              className={`chip-btn rounded-lg border px-2 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-elevated-2)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
              }`}
              style={
                isSelected
                  ? { boxShadow: "0 0 0 3px var(--accent-soft)" }
                  : undefined
              }
            >
              {roll.replace("2024mc", "#")}
            </button>
          );
        })}

        {roster.length === 0 && (
          <p className="col-span-full py-4 text-center text-xs text-[var(--text-muted)]">
            No roll numbers match that search.
          </p>
        )}
      </div>
    </div>
  );
}
