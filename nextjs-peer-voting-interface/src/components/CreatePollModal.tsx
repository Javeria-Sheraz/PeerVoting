"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

const DURATION_PRESETS = [
  { label: "1 Hour", ms: 60 * 60 * 1000 },
  { label: "6 Hours", ms: 6 * 60 * 60 * 1000 },
  { label: "24 Hours", ms: 24 * 60 * 60 * 1000 },
  { label: "3 Days", ms: 3 * 24 * 60 * 60 * 1000 },
  { label: "7 Days", ms: 7 * 24 * 60 * 60 * 1000 },
];

export default function CreatePollModal({
  busy,
  onCancel,
  onCreate,
  onCreateSecret,
}: {
  busy?: boolean;
  onCancel: () => void;
  onCreate: (question: string, expiresAt: string) => void;
  onCreateSecret: (question: string, durationHours: number) => void;
}) {
  const [question, setQuestion] = useState("");
  const [durationMs, setDurationMs] = useState(DURATION_PRESETS[2].ms);
  const [visibility, setVisibility] = useState<"public" | "secret">("public");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (question.trim().length < 5) {
      setError("Question must be at least 5 characters.");
      return;
    }
    if (visibility === "secret") {
      const durationHours = Math.round(durationMs / (60 * 60 * 1000));
      onCreateSecret(question.trim(), durationHours);
      return;
    }
    const expiresAt = new Date(Date.now() + durationMs).toISOString();
    onCreate(question.trim(), expiresAt);
  }

  return (
    <Modal title="Create a New Poll" onClose={onCancel}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Visibility</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                visibility === "public"
                  ? "border-[#4f46e5] bg-[#4f46e5]/20 text-[#a5b4fc]"
                  : "border-[#2e2e2e] text-[#a1a1aa] hover:border-[#4f46e5]/50"
              }`}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setVisibility("secret")}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                visibility === "secret"
                  ? "border-[#4f46e5] bg-[#4f46e5]/20 text-[#a5b4fc]"
                  : "border-[#2e2e2e] text-[#a1a1aa] hover:border-[#4f46e5]/50"
              }`}
            >
              Secret (admin review)
            </button>
          </div>
          {visibility === "secret" && (
            <p className="mt-1.5 text-[11px] text-[#71717a]">
              Hidden from admins&apos; view of who created it. Reviewed before it goes live. You can only have one pending at a time.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Poll question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="e.g. Who contributed the most to the final project?"
            className="w-full resize-none rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#52525b] outline-none focus:border-[#4f46e5]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Voting window</label>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setDurationMs(preset.ms)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  durationMs === preset.ms
                    ? "border-[#4f46e5] bg-[#4f46e5]/20 text-[#a5b4fc]"
                    : "border-[#2e2e2e] text-[#a1a1aa] hover:border-[#4f46e5]/50"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-[#3f1d1d] bg-[#241414] px-3 py-2 text-xs text-[#f87171]">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-[#2e2e2e] px-4 py-2 text-sm font-medium text-[#d4d4d8] hover:bg-[#242424]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca] disabled:opacity-50"
          >
            {busy ? "Publishing..." : visibility === "secret" ? "Submit for Review" : "Publish Poll"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
