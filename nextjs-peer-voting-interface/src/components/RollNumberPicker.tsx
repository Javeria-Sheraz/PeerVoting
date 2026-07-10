"use client";

import { useMemo, useState } from "react";
import { CLASS_ROSTER } from "@/lib/constants";

interface RollNumberPickerProps {
  value: string | null;
  onChange: (roll: string) => void;
  excludeRoll?: string | null;
  disabled?: boolean;
}

/** Compact scrollable grid of 40 minimalist chip buttons representing the class roster. */
export default function RollNumberPicker({ value, onChange, excludeRoll, disabled }: RollNumberPickerProps) {
  const [search, setSearch] = useState("");

  const roster = useMemo(() => {
    return CLASS_ROSTER.filter((roll) => roll !== excludeRoll).filter((roll) =>
      roll.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [search, excludeRoll]);

  return (
    <div className="w-full">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search roll number..."
        disabled={disabled}
        className="mb-3 w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#71717a] outline-none focus:border-[#4f46e5] disabled:opacity-50"
      />
      <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-5">
        {roster.map((roll) => {
          const isSelected = value === roll;
          return (
            <button
              type="button"
              key={roll}
              disabled={disabled}
              onClick={() => onChange(roll)}
              className={`chip-btn rounded-lg border px-2 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? "border-[#4f46e5] bg-[#4f46e5] text-white shadow-[0_0_0_2px_rgba(79,70,229,0.35)]"
                  : "border-[#2e2e2e] bg-[#1a1a1a] text-[#d4d4d8] hover:border-[#4f46e5]/60 hover:text-white"
              }`}
            >
              {roll.replace("2024mc", "#")}
            </button>
          );
        })}
        {roster.length === 0 && (
          <p className="col-span-full py-4 text-center text-xs text-[#71717a]">No matches found.</p>
        )}
      </div>
    </div>
  );
}
