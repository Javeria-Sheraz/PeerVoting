
"use client";

import { Ban } from "lucide-react";
import { CLASS_ROSTER } from "@/lib/constants";

interface RollNumberPickerProps {
  value: string | null;
  onChange: (roll: string) => void;
  excludeRoll?: string | null;
  protectedRolls?: Set<string>;
  disabled?: boolean;
}

export default function RollNumberPicker({
  value,
  onChange,
  excludeRoll,
  protectedRolls,
  disabled,
}: RollNumberPickerProps) {
  const roster = CLASS_ROSTER.filter(
    (roll) => roll !== excludeRoll && !protectedRolls?.has(roll),
  );

  return (
    <div className="w-full">
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
            No roll numbers available.
          </p>
        )}
      </div>
    </div>
  );
}
