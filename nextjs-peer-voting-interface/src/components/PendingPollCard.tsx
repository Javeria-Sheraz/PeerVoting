"use client";

import type { PendingPoll } from "@/lib/pollService";

export default function PendingPollCard({ poll }: { poll: PendingPoll }) {
  return (
    <div className="card-surface fade-in flex flex-col rounded-2xl border-dashed p-5 opacity-80">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-[#71717a]">Visibility:</span>
        <span className="rounded-full bg-[#4f46e5]/15 px-2 py-0.5 text-xs font-semibold text-[#a5b4fc]">
          Secret
        </span>
        <span className="ml-auto rounded-full bg-[#4a3a1a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#f5c26b]">
          Pending Review
        </span>
      </div>
      <h3 className="mb-2 text-base font-semibold leading-snug text-[#f5f5f5]">{poll.question}</h3>
      <p className="text-xs text-[#71717a]">
        Voting window: {poll.duration_hours}h once approved
      </p>
      <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-[#2e2e2e] bg-[#1a1a1a]/50 py-6 text-center">
        <span className="mb-1 text-2xl">⏳</span>
        <p className="text-sm font-medium text-[#f5c26b]">Awaiting admin approval</p>
        <p className="mt-1 px-4 text-xs text-[#71717a]">
          You&apos;ll see this poll go live once it&apos;s reviewed. Silently removed if rejected.
        </p>
      </div>
    </div>
  );
}
