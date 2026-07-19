"use client";

import { useState } from "react";
import type { Poll } from "@/lib/types";
import CountdownTimer from "@/components/CountdownTimer";
import RollNumberPicker from "@/components/RollNumberPicker";
import EditExpirationModal from "@/components/EditExpirationModal";
import ConfirmModal from "@/components/ConfirmModal";

export default function ActivePollCard({
  poll,
  totalVotes,
  creatorRoll,
  hasVoted,
  isAdmin,
  ownRoll,
  protectedRolls,
  onVote,
  onDelete,
  onUpdateExpiration,
  onExpire,
  onClose,
}: {
  poll: Poll;
  totalVotes: number;
  creatorRoll: string;
  hasVoted: boolean;
  isAdmin: boolean;
  ownRoll: string | null;
  protectedRolls: Set<string>;
  onVote: (pollId: string, roll: string) => Promise<{ error: string | null }>;
  onDelete: (pollId: string) => Promise<void>;
  onUpdateExpiration: (pollId: string, isoDate: string) => Promise<void>;
  onExpire: () => void;
  onClose: (pollId: string) => Promise<void>;
}) {
  const [selectedRoll, setSelectedRoll] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(hasVoted);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [busyAction, setBusyAction] = useState(false);

async function handleSubmit() {
  if (!selectedRoll) {
    setError("Select a roll number first.");
    return;
  }
  setSubmitting(true);
  setError(null);
  const { error: voteError } = await onVote(poll.id, selectedRoll);
  setSubmitting(false);
  if (voteError) {
    setError(voteError);
  }
  // No setVoted(true) — the parent updates votedIds in its own state,
  // which causes a re-render of this component with hasVoted=true.
}

  return (
    <div className="card-surface fade-in relative flex flex-col rounded-2xl p-5">
      {isAdmin && (
        <div className="absolute right-3 top-3 flex gap-1.5">
          <button
            onClick={() => setShowEdit(true)}
            title="Edit Expiration"
            className="rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] p-1.5 text-[#a5b4fc] hover:border-[#4f46e5]"
          >
            📅
          </button>
          <button
            onClick={async () => {
              setBusyAction(true);
              await onClose(poll.id);
              setBusyAction(false);
            }}
            title="Instant Close"
            className="rounded-lg border border-[#3f1d1d] bg-[#1a1a1a] p-1.5 text-[#fbbf24] hover:border-[#f59e0b]"
          >
            🛑
          </button>
          <button
            onClick={() => setShowDelete(true)}
            title="Delete Poll"
            className="rounded-lg border border-[#3f1d1d] bg-[#1a1a1a] p-1.5 text-[#f87171] hover:border-[#ef4444]"
          >
            🗑️
          </button>
        </div>
      )}

      {/* Structured to avoid button overlap using pr-16 */}
      <div className="mb-3 pr-16">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-[#71717a]">Created by:</span>
          <span className="rounded-full bg-[#4f46e5]/15 px-2 py-0.5 text-xs font-semibold text-[#a5b4fc]">
            {creatorRoll}
          </span>
        </div>
        <div className="text-xs font-medium text-[#a1a1aa]">
          {totalVotes} total votes cast
        </div>
      </div>

      <h3 className="mb-3 text-base font-semibold leading-snug text-[#f5f5f5]">
        {poll.question}
      </h3>

      <div className="mb-4">
        <CountdownTimer expiresAt={poll.expires_at} onExpire={onExpire} />
      </div>

{hasVoted ? (
  <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-[#1a2e2a] bg-[#10231d]/40 py-8 text-center">
    <span className="mb-1 text-2xl">🔒</span>
    <p className="text-sm font-medium text-[#34d399]">
      Your secret vote was recorded
    </p>
    <p className="mt-1 text-xs text-[#71717a]">
      Results stay hidden until the poll closes.
    </p>
  </div>
) : (
        <div>
          <RollNumberPicker
            value={selectedRoll}
            onChange={setSelectedRoll}
            excludeRoll={ownRoll}
            protectedRolls={protectedRolls}
          />
          {error && <p className="mt-2 text-xs text-[#f87171]">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedRoll}
            className="mt-4 w-full rounded-lg bg-[#4f46e5] py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Secret Vote"}
          </button>
        </div>
      )}

      {showEdit && (
        <EditExpirationModal
          currentExpiresAt={poll.expires_at}
          busy={busyAction}
          onCancel={() => setShowEdit(false)}
          onSave={async (iso) => {
            setBusyAction(true);
            await onUpdateExpiration(poll.id, iso);
            setBusyAction(false);
            setShowEdit(false);
          }}
        />
      )}

      {showDelete && (
        <ConfirmModal
          title="Delete Poll"
          message="This will permanently delete the poll and all associated votes and results. This action cannot be undone."
          confirmLabel="Delete"
          danger
          busy={busyAction}
          onCancel={() => setShowDelete(false)}
          onConfirm={async () => {
            setBusyAction(true);
            await onDelete(poll.id);
            setBusyAction(false);
            setShowDelete(false);
          }}
        />
      )}
    </div>
  );
}
