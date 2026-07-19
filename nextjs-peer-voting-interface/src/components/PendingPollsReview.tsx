"use client";

import { useState } from "react";
import type { PendingPoll } from "@/lib/pollService";

export default function PendingPollsReview({
  pending,
  onApprove,
  onReject,
}: {
  pending: PendingPoll[];
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);

  return (
    <div className="card-surface rounded-2xl p-5 lg:col-span-2">
      <h2 className="mb-1 text-base font-semibold text-[#f5f5f5]">Pending Secret Polls</h2>
      <p className="mb-4 text-xs text-[#71717a]">
        Creator identity is hidden. Review question content only.
      </p>

      <div className="space-y-3">
        {pending.map((p) => (
          <div key={p.id} className="rounded-lg border border-[#2e2e2e] bg-[#161616] p-4">
            <p className="mb-1 text-sm font-medium text-[#f5f5f5]">{p.question}</p>
            <p className="mb-3 text-xs text-[#71717a]">
              Duration: {p.duration_hours}h · Submitted {new Date(p.created_at).toLocaleString()}
            </p>
            <div className="flex gap-2">
              <button
                disabled={busyId === p.id}
                onClick={async () => {
                  setBusyId(p.id);
                  await onApprove(p.id);
                  setBusyId(null);
                }}
                className="rounded-lg bg-[#10b981] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0ea371] disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={busyId === p.id}
                onClick={async () => {
                  setBusyId(p.id);
                  await onReject(p.id);
                  setBusyId(null);
                }}
                className="rounded-lg bg-[#ef4444] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#dc2626] disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <p className="py-6 text-center text-xs text-[#71717a]">No pending secret polls.</p>
        )}
      </div>
    </div>
  );
}
