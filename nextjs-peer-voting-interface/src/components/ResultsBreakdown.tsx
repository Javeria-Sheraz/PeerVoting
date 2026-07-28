"use client";

import { useMemo, useState } from "react";
import { Search, ArrowUpDown, Ban } from "lucide-react";
import type { PollResult } from "@/lib/types";
import { CLASS_ROSTER } from "@/lib/constants";

type SortKey = "votes" | "roll";

interface Row {
  roll: string;
  votes: number;
  share: number;
  rank: number | null;
}

/**
 * Full per-candidate vote breakdown.
 *
 * Shows EVERY roll number on the roster, including those with zero
 * votes, plus the abstain ("NONE") bucket when present. Ranks are
 * competition-style, so ties share a position.
 */
export default function ResultsBreakdown({
  results,
  totalVotes,
}: {
  results: PollResult[];
  totalVotes: number;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("votes");
  const [hideZero, setHideZero] = useState(false);

  const rows: Row[] = useMemo(() => {
    const byRoll = new Map(results.map((r) => [r.voted_for_roll, r.vote_count]));

    const base = CLASS_ROSTER.map((roll) => ({
      roll,
      votes: byRoll.get(roll) ?? 0,
    }));

    const abstain = byRoll.get("NONE");
    if (abstain !== undefined) base.push({ roll: "NONE", votes: abstain });

    // Competition ranking over vote counts (ties share a rank).
    const descending = [...base].sort((a, b) => b.votes - a.votes);
    const rankFor = new Map<number, number>();
    descending.forEach((row, i) => {
      if (!rankFor.has(row.votes)) rankFor.set(row.votes, i + 1);
    });

    return base.map((row) => ({
      ...row,
      share: totalVotes > 0 ? (row.votes / totalVotes) * 100 : 0,
      rank: row.votes > 0 ? rankFor.get(row.votes) ?? null : null,
    }));
  }, [results, totalVotes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (hideZero && r.votes === 0) return false;
      if (!q) return true;
      return (
        r.roll.toLowerCase().includes(q) ||
        r.roll.replace("2024mc", "#").toLowerCase().includes(q)
      );
    });

    out = [...out].sort((a, b) => {
      if (sort === "roll") {
        // NONE always last in roll order
        if (a.roll === "NONE") return 1;
        if (b.roll === "NONE") return -1;
        const na = parseInt(a.roll.replace("2024mc", ""), 10);
        const nb = parseInt(b.roll.replace("2024mc", ""), 10);
        return (Number.isNaN(na) ? 0 : na) - (Number.isNaN(nb) ? 0 : nb);
      }
      if (b.votes !== a.votes) return b.votes - a.votes;
      return a.roll.localeCompare(b.roll);
    });

    return out;
  }, [rows, query, sort, hideZero]);

  const maxVotes = Math.max(...rows.map((r) => r.votes), 0);
  const withVotes = rows.filter((r) => r.votes > 0).length;

  return (
    <div className="fade-in mt-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[140px] flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a roll number..."
            aria-label="Filter results by roll number"
            className="field w-full py-1.5 pl-8 pr-2 text-xs"
          />
        </div>

        <button
          type="button"
          onClick={() => setSort((s) => (s === "votes" ? "roll" : "votes"))}
          className="btn-ghost inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
          aria-label={`Sort by ${sort === "votes" ? "roll number" : "vote count"}`}
        >
          <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />
          {sort === "votes" ? "By votes" : "By roll"}
        </button>

        <button
          type="button"
          onClick={() => setHideZero((v) => !v)}
          aria-pressed={hideZero}
          className={`btn-ghost px-2.5 py-1.5 text-xs ${
            hideZero ? "border-[var(--accent)] text-[var(--accent-text)]" : ""
          }`}
        >
          {hideZero ? "Showing voted only" : "Hide zero votes"}
        </button>
      </div>

      <p className="mb-2 text-[11px] text-[var(--text-muted)]">
        {withVotes} of {rows.length} received at least one vote · {totalVotes} votes total
      </p>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-xs text-[var(--text-muted)]">
          No roll numbers match that search.
        </p>
      ) : (
        <ul className="stagger space-y-1.5">
          {visible.map((r, i) => {
            const isAbstain = r.roll === "NONE";
            const label = isAbstain ? "Abstained" : r.roll.replace("2024mc", "#");
            return (
              <li
                key={r.roll}
                style={{ ["--i" as string]: Math.min(i, 12) }}
                className="flex items-center gap-2 text-xs"
              >
                <span
                  className="w-6 shrink-0 text-right tabular-nums text-[10px] text-[var(--text-faint)]"
                  aria-hidden="true"
                >
                  {r.rank ?? "—"}
                </span>

                <span
                  className={`flex w-16 shrink-0 items-center gap-1 font-medium ${
                    isAbstain
                      ? "text-[var(--text-muted)]"
                      : r.votes > 0
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-faint)]"
                  }`}
                >
                  {isAbstain && <Ban aria-hidden="true" className="h-3 w-3" />}
                  {label}
                </span>

                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-inset)]"
                  role="img"
                  aria-label={`${isAbstain ? "Abstained" : label}: ${r.votes} ${
                    r.votes === 1 ? "vote" : "votes"
                  }, ${r.share.toFixed(1)} percent`}
                >
                  <div
                    className="bar-grow h-full origin-left rounded-full"
                    style={{
                      width: maxVotes ? `${(r.votes / maxVotes) * 100}%` : "0%",
                      backgroundColor: isAbstain
                        ? "var(--text-faint)"
                        : r.rank === 1
                          ? "var(--gold)"
                          : "var(--accent)",
                    }}
                  />
                </div>

                <span className="w-7 shrink-0 text-right tabular-nums font-medium text-[var(--text-primary)]">
                  {r.votes}
                </span>
                <span className="w-11 shrink-0 text-right tabular-nums text-[10px] text-[var(--text-muted)]">
                  {r.share.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
