"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { handleFirstTimeLogin } from "@/app/first-time-login/actions";

export default function FirstTimeLoginForm() {
  const router = useRouter();
  const [rollNumber, setRollNumber] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!rollNumber.trim()) {
      setError("Roll number is required.");
      return;
    }

    if (!temporaryPassword) {
      setError("Temporary password is required.");
      return;
    }

    if (!newPassword) {
      setError("New password is required.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await handleFirstTimeLogin(rollNumber, temporaryPassword, newPassword);

      if (result.success) {
        setSuccess(true);
        setError(null);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard/active");
        }, 2000);
      } else {
        setError(result.error || "An unexpected error occurred.");
        setSuccess(false);
      }
    } catch (err) {
      setError("Failed to process login. Please try again.");
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Roll Number */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Roll Number</label>
        <input
          type="text"
          value={rollNumber}
          onChange={(e) => {
            setRollNumber(e.target.value);
            setError(null);
          }}
          placeholder="2024mc1"
          disabled={loading || success}
          className="w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#52525b] outline-none focus:border-[#4f46e5] disabled:opacity-50"
        />
      </div>

      {/* Temporary Password */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Temporary Password</label>
        <div className="relative">
          <input
            type={showPasswords ? "text" : "password"}
            value={temporaryPassword}
            onChange={(e) => {
              setTemporaryPassword(e.target.value);
              setError(null);
            }}
            placeholder="••••••••"
            disabled={loading || success}
            className="w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#52525b] outline-none focus:border-[#4f46e5] disabled:opacity-50"
          />
        </div>
      </div>

      {/* New Password */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">New Password</label>
        <input
          type={showPasswords ? "text" : "password"}
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setError(null);
          }}
          placeholder="••••••••"
          disabled={loading || success}
          minLength={6}
          className="w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#52525b] outline-none focus:border-[#4f46e5] disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-[#71717a]">Must be at least 6 characters</p>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Confirm New Password</label>
        <input
          type={showPasswords ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError(null);
          }}
          placeholder="••••••••"
          disabled={loading || success}
          minLength={6}
          className="w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#52525b] outline-none focus:border-[#4f46e5] disabled:opacity-50"
        />
      </div>

      {/* Show Passwords Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showPasswords}
          onChange={(e) => setShowPasswords(e.target.checked)}
          disabled={loading || success}
          className="h-4 w-4 rounded border border-[#2e2e2e] bg-[#161616] checked:bg-[#4f46e5]"
        />
        <span className="text-xs text-[#a1a1aa]">Show passwords</span>
      </label>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-[#3f1d1d] bg-[#241414] px-3 py-2 text-xs text-[#f87171]">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-[#1a2e2a] bg-[#10231d] px-3 py-2 text-xs text-[#34d399]">
          ✓ Password updated successfully! Redirecting to dashboard...
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || success}
        className="w-full rounded-lg bg-[#4f46e5] py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
        {loading ? "Setting up your account..." : "Complete First-Time Login"}
      </button>
    </form>
  );
}
