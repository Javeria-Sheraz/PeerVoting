"use client";

import { useEffect, useState } from "react";
import type { Poll, PollResult } from "@/lib/types";
import Podium from "@/components/Podium";
import ConfirmModal from "@/components/ConfirmModal";
import { CLASS_ROSTER } from "@/lib/constants";

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
  const top3 = sorted.slice(0, 3).map((r) => ({ roll: r.voted_for_roll, votes: r.vote_count }));
  const totalVotes = sorted.reduce((sum, r) => sum + r.vote_count, 0);
  const maxVotes = sorted[0]?.vote_count ?? 0;

  const rest = CLASS_ROSTER.map((roll) => {
    const found = sorted.find((r) => r.voted_for_roll === roll);
    return { roll, votes: found?.vote_count ?? 0 };
  }).sort((a, b) => b.votes - a.votes);

  useEffect(() => {
    if (results === undefined) {
      onLoadResults(poll.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.id]);

  return (
    <div className="card-surface fade-in relative flex flex-col rounded-2xl p-5">
      {isAdmin && (
        <button
          onClick={() => setShowDelete(true)}
          title="Delete Poll"
          className="absolute right-3 top-3 rounded-lg border border-[#3f1d1d] bg-[#1a1a1a] p-1.5 text-[#f87171] hover:border-[#ef4444]"
        >
          🗑️
        </button>
      )}

      <div className="mb-3 flex items-center gap-2 pr-10">
        <span className="text-xs font-medium text-[#71717a]">Created by:</span>
        <span className="rounded-full bg-[#4f46e5]/15 px-2 py-0.5 text-xs font-semibold text-[#a5b4fc]">
          {creatorRoll}
        </span>
        <span className="ml-auto rounded-full bg-[#2a2a2a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#a1a1aa]">
          Closed
        </span>
      </div>

      <h3 className="mb-2 text-base font-semibold leading-snug text-[#f5f5f5]">{poll.question}</h3>
      <p className="mb-3 text-xs text-[#71717a]">Ended {new Date(poll.expires_at).toLocaleString()}</p>

      {results === undefined ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4f46e5] border-t-transparent" />
        </div>
      ) : (
        <>
          <Podium top3={top3} />
          <p className="mt-2 text-center text-xs text-[#71717a]">{totalVotes} total votes cast</p>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 w-full rounded-lg border border-[#2e2e2e] py-2 text-xs font-medium text-[#a1a1aa] hover:bg-[#242424]"
          >
            {expanded ? "Hide All Results ▲" : "Show All Results ▼"}
          </button>

          {expanded && (
            <div className="fade-in mt-3 space-y-2">
              {rest.map(({ roll, votes }) => (
                <div key={roll} className="flex items-center gap-2 text-xs">
                  <span className="w-14 shrink-0 font-medium text-[#d4d4d8]">{roll.replace("2024mc", "#")}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#161616]">
                    <div
                      className="h-full rounded-full bg-[#4f46e5]"
                      style={{ width: maxVotes ? `${(votes / maxVotes) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-[#71717a]">{votes}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showDelete && (
        <ConfirmModal
          title="Delete Poll"
          message="This will permanently delete the poll and all associated votes and results."
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
