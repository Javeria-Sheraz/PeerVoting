"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";

export default function AdminPermissionsTable({
  profiles,
  onToggleCanCreate,
}: {
  profiles: Profile[];
  onToggleCanCreate: (id: string, next: boolean) => Promise<void>;
}) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  return (
    <div className="card-surface rounded-2xl p-5">
      <h2 className="mb-1 text-base font-semibold text-[#f5f5f5]">User Permissions</h2>
      <p className="mb-4 text-xs text-[#71717a]">Control which registered accounts are allowed to create new polls.</p>

      <div className="max-h-96 overflow-y-auto rounded-lg border border-[#2e2e2e]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#1a1a1a] text-xs uppercase tracking-wide text-[#71717a]">
            <tr>
              <th className="px-3 py-2">Roll Number</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2 text-right">Can Create Polls</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t border-[#2a2a2a]">
                <td className="px-3 py-2 font-medium text-[#d4d4d8]">
                  {p.roll_number}
                  {p.is_admin && (
                    <span className="ml-2 rounded bg-[#4f46e5]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#a5b4fc]">
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-[#a1a1aa]">{p.email}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    disabled={togglingId === p.id}
                    onClick={async () => {
                      setTogglingId(p.id);
                      await onToggleCanCreate(p.id, !p.can_create_polls);
                      setTogglingId(null);
                    }}
                    className={`relative h-6 w-11 rounded-full transition ${
                      p.can_create_polls ? "bg-[#10b981]" : "bg-[#3a3a3a]"
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                        p.can_create_polls ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-xs text-[#71717a]">
                  No registered accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
