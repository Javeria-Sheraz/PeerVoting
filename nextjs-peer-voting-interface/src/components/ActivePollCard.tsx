"use client";

import { useState } from "react";
import { CalendarClock, CircleStop, Trash2, LockKeyhole } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [busyAction, setBusyAction] = useState(false);

  async function handleSubmit() {
    if (!selectedRoll) {
      setError("Pick someone first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: voteError } = await onVote(poll.id, selectedRoll);
    setSubmitting(false);
    if (voteError) setError(voteError);
    // On success the parent updates votedIds, which re-renders this
    // component with hasVoted=true. Deliberately no local setVoted.
  }

  return (
    <div className="card-surface card-lift fade-in relative flex flex-col rounded-2xl p-5">
      {isAdmin && (
        <div className="absolute right-3 top-3 flex gap-1.5">
          <button
            onClick={() => setShowEdit(true)}
            aria-label="Edit expiry time"
            title="Edit expiry time"
            className="btn-ghost p-1.5 text-[var(--accent-text)]"
          >
            <CalendarClock aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            onClick={async () => {
              setBusyAction(true);
              await onClose(poll.id);
              setBusyAction(false);
            }}
            disabled={busyAction}
            aria-label="Close poll now"
            title="Close poll now"
            className="btn-ghost p-1.5 text-[var(--warning)] hover:border-[var(--warning)]"
          >
            <CircleStop aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowDelete(true)}
            aria-label="Delete poll"
            title="Delete poll"
            className="btn-ghost p-1.5 text-[var(--danger)] hover:border-[var(--danger)]"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mb-3 pr-24">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Created by</span>
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent-text)]">
            {creatorRoll.replace("2024mc", "#")}
          </span>
        </div>
        <div className="text-xs text-[var(--text-secondary)]">
          {totalVotes} total {totalVotes === 1 ? "vote" : "votes"} cast
        </div>
      </div>

      <h3 className="mb-3 text-base font-medium leading-snug text-[var(--text-primary)]">
        {poll.question}
      </h3>

      <div className="mb-4">
        <CountdownTimer expiresAt={poll.expires_at} onExpire={onExpire} />
      </div>

      {hasVoted ? (
        <div className="pop-in flex flex-1 flex-col items-center justify-center rounded-xl border border-[var(--success)]/25 bg-[var(--success-soft)] py-8 text-center">
          <LockKeyhole
            aria-hidden="true"
            className="mb-2 h-6 w-6 text-[var(--success)]"
          />
          <p className="text-sm font-medium text-[var(--success)]">
            Your secret vote was recorded
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Results unlock when the poll closes.
          </p>
        </div>
      ) : (
        <div>
          <RollNumberPicker
            value={selectedRoll}
            onChange={(r) => {
              setSelectedRoll(r);
              setError(null);
            }}
            protectedRolls={protectedRolls}
            disabled={submitting}
          />

          {error && (
            <p role="alert" className="mt-2 text-xs text-[var(--danger)]">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedRoll}
            className="btn-primary mt-4 w-full py-2.5 text-sm"
          >
            {submitting ? "Submitting..." : "Submit secret vote"}
          </button>

          <p className="mt-2 text-center text-[11px] text-[var(--text-faint)]">
            Your choice is counted then erased. It can't be traced back to you.
          </p>
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
          title="Delete poll"
          message="This permanently deletes the poll and all associated votes and results. It cannot be undone."
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
