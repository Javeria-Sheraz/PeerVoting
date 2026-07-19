"use client";

import { useState, type FormEvent } from "react";
import type { WhitelistEntry } from "@/lib/types";

export default function AdminWhitelistTable({
  entries,
  onToggleExclusion,
  onToggleCanBeVotedFor,
  onAdd,
}: {
  entries: WhitelistEntry[];
  onToggleExclusion: (id: string, next: boolean) => Promise<void>;
  onToggleCanBeVotedFor: (id: string, next: boolean) => Promise<void>;
  onAdd: (rollNumber: string) => Promise<{ error: string | null }>;
}) {
  const [newRoll, setNewRoll] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [togglingVoteId, setTogglingVoteId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    const trimmed = newRoll.trim().toLowerCase();
    if (!/^2024mc([1-9]|[1-3][0-9]|40)$/.test(trimmed)) {
      setAddError("Roll number must look like 2024mc1 through 2024mc40.");
      return;
    }
    setAdding(true);
    const { error } = await onAdd(trimmed);
    setAdding(false);
    if (error) setAddError(error);
    else setNewRoll("");
  }

  return (
    <div className="card-surface rounded-2xl p-5">
      <h2 className="mb-1 text-base font-semibold text-[#f5f5f5]">Whitelist Roster</h2>
      <p className="mb-4 text-xs text-[#71717a]">
        Toggle exclusion to instantly ban a roll number from the app. Toggle votable to hide a roll number from being targeted in polls.
      </p>

      <form onSubmit={handleAdd} className="mb-4 flex flex-wrap gap-2">
        <input
          value={newRoll}
          onChange={(e) => setNewRoll(e.target.value)}
          placeholder="e.g. 2024mc41"
          className="flex-1 rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#52525b] outline-none focus:border-[#4f46e5]"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca] disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add Roll Number"}
        </button>
      </form>
      {addError && <p className="mb-3 text-xs text-[#f87171]">{addError}</p>}

      <div className="max-h-96 overflow-y-auto rounded-lg border border-[#2e2e2e]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#1a1a1a] text-xs uppercase tracking-wide text-[#71717a]">
            <tr>
              <th className="px-3 py-2">Roll Number</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Excluded</th>
              <th className="px-3 py-2 text-right">Votable</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-[#2a2a2a]">
                <td className="px-3 py-2 font-medium text-[#d4d4d8]">{entry.roll_number}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      entry.is_excluded ? "bg-[#3f1d1d] text-[#f87171]" : "bg-[#1a2e2a] text-[#10b981]"
                    }`}
                  >
                    {entry.is_excluded ? "Excluded" : "Allowed"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    disabled={togglingId === entry.id}
                    onClick={async () => {
                      setTogglingId(entry.id);
                      await onToggleExclusion(entry.id, !entry.is_excluded);
                      setTogglingId(null);
                    }}
                    className={`relative h-6 w-11 rounded-full transition ${
                      entry.is_excluded ? "bg-[#ef4444]" : "bg-[#3a3a3a]"
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                        entry.is_excluded ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    disabled={togglingVoteId === entry.id}
                    title={entry.can_be_voted_for ? "Click to hide from voting targets" : "Click to allow as voting target"}
                    onClick={async () => {
                      setTogglingVoteId(entry.id);
                      await onToggleCanBeVotedFor(entry.id, !entry.can_be_voted_for);
                      setTogglingVoteId(null);
                    }}
                    className={`relative h-6 w-11 rounded-full transition ${
                      entry.can_be_voted_for ? "bg-[#10b981]" : "bg-[#3a3a3a]"
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                        entry.can_be_voted_for ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-xs text-[#71717a]">
                  No whitelist entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
