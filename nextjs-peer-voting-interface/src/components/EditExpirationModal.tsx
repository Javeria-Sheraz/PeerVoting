"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditExpirationModal({
  currentExpiresAt,
  busy,
  onCancel,
  onSave,
}: {
  currentExpiresAt: string;
  busy?: boolean;
  onCancel: () => void;
  onSave: (isoDate: string) => void;
}) {
  const [value, setValue] = useState(toLocalInputValue(currentExpiresAt));

  return (
    <Modal title="Edit Expiration" onClose={onCancel}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">New expiration date &amp; time</label>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] outline-none focus:border-[#4f46e5]"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-[#2e2e2e] px-4 py-2 text-sm font-medium text-[#d4d4d8] hover:bg-[#242424]"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(new Date(value).toISOString())}
            disabled={busy}
            className="rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca] disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
