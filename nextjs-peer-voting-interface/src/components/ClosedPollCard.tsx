"use client";

import { useEffect, useState } from "react";
import { Trash2, Lock, ChevronDown, ChevronUp } from "lucide-react";
import type { Poll, PollResult } from "@/lib/types";
import Podium from "@/components/Podium";
import ResultsBreakdown from "@/components/ResultsBreakdown";
import ConfirmModal from "@/components/ConfirmModal";

export default function ClosedPollCard({
  poll,
  creatorRoll,
  results,
  isAdmin,
  onDelete,
  onLoadResults,
}: {
  poll: Poll;
  creatorRoll: string;
  results: PollResult[] | undefined;
  isAdmin: boolean;
  onDelete: (pollId: string) => Promise<void>;
  onLoadResults: (pollId: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const sorted = [...(results ?? [])].sort((a, b) => b.vote_count - a.vote_count);
  const top3 = sorted
    .slice(0, 3)
    .map((r) => ({ roll: r.voted_for_roll, votes: r.vote_count }));
  const totalVotes = sorted.reduce((sum, r) => sum + r.vote_count, 0);

  useEffect(() => {
    if (results === undefined) {
      onLoadResults(poll.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.id]);

  // If a non-admin gets an empty array back, RLS withheld the rows —
  // which means they did not vote before the poll closed.
  const isResultsHidden = !isAdmin && results !== undefined && results.length === 0;

  return (
    <div className="card-surface fade-in relative flex flex-col rounded-2xl p-5">
      {isAdmin && (
        <button
          onClick={() => setShowDelete(true)}
          aria-label="Delete poll"
          title="Delete poll"
          className="btn-ghost absolute right-3 top-3 p-1.5 text-[var(--danger)] hover:border-[var(--danger)]"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </button>
      )}

      <div className="mb-3 flex items-center gap-2 pr-10">
        <span className="text-xs text-[var(--text-muted)]">Created by</span>
        <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent-text)]">
          {creatorRoll.replace("2024mc", "#")}
        </span>
        <span className="ml-auto rounded-full bg-[var(--bg-elevated-2)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
          Closed
        </span>
      </div>

      <h3 className="mb-2 text-base font-medium leading-snug text-[var(--text-primary)]">
        {poll.question}
      </h3>
      <p className="mb-3 text-xs text-[var(--text-muted)]">
        Ended {new Date(poll.expires_at).toLocaleString()}
      </p>

      {results === undefined ? (
        <div className="space-y-2 py-4" aria-busy="true" aria-label="Loading results">
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-3 w-1/3" />
        </div>
      ) : isResultsHidden ? (
        <div className="my-4 flex flex-col items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)] py-8 text-center">
          <Lock aria-hidden="true" className="mb-2 h-6 w-6 text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">Results hidden</p>
          <p className="mt-1 px-4 text-xs text-[var(--text-muted)]">
            You did not vote in this poll before it closed.
          </p>
        </div>
      ) : (
        <>
          <Podium top3={top3} />
          <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
            {totalVotes} total {totalVotes === 1 ? "vote" : "votes"} cast
          </p>

          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="btn-ghost mt-4 flex w-full items-center justify-center gap-1.5 py-2 text-xs"
          >
            {expanded ? (
              <>
                Hide full breakdown
                <ChevronUp aria-hidden="true" className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Show full breakdown
                <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
              </>
            )}
          </button>

          {expanded && (
            <ResultsBreakdown results={sorted} totalVotes={totalVotes} />
          )}
        </>
      )}

      {showDelete && (
        <ConfirmModal
          title="Delete poll"
          message="This permanently deletes the poll and all associated votes and results."
          confirmLabel="Delete"
          danger
          busy={busy}
          onCancel={() => setShowDelete(false)}
          onConfirm={async () => {
            setBusy(true);
            await onDelete(poll.id);
            setBusy(false);
            setShowDelete(false);
          }}
        />
      )}
    </div>
  );
}
