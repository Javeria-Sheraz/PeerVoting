"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordModal({ onClose }: { onClose: () => void }) {
  const { profile, changePassword } = useAuth();
  const [email, setEmail] = useState(profile?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!email.trim() || !currentPassword || !newPassword || !confirmNewPassword) {
      setError("Please fill in email, current password, new password, and confirm password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error: changeError } = await changePassword(email, currentPassword, newPassword);

      if (changeError) {
        setError(changeError);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccess("Password updated successfully.");
    } finally {
      setBusy(false);
    }

  return (
    <Modal title="Change Password" onClose={busy ? undefined : onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@student.uet.edu.pk"
            className="w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#52525b] outline-none focus:border-[#4f46e5]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] outline-none focus:border-[#4f46e5]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] outline-none focus:border-[#4f46e5]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Confirm new password</label>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] outline-none focus:border-[#4f46e5]"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-[#3f1d1d] bg-[#241414] px-3 py-2 text-xs text-[#f87171]">{error}</div>
        )}

        {success && (
          <div className="rounded-lg border border-[#16351f] bg-[#102217] px-3 py-2 text-xs text-[#4ade80]">{success}</div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-[#2e2e2e] px-4 py-2 text-sm font-medium text-[#d4d4d8] hover:bg-[#242424] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca] disabled:opacity-50"
          >
            {busy ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
