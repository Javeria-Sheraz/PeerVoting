"use client";

import Modal from "@/components/Modal";

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="mb-5 text-sm text-[#a1a1aa]">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-[#2e2e2e] px-4 py-2 text-sm font-medium text-[#d4d4d8] hover:bg-[#242424]"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
            danger ? "bg-[#ef4444] hover:bg-[#dc2626]" : "bg-[#4f46e5] hover:bg-[#4338ca]"
          }`}
        >
          {busy ? "Working..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
