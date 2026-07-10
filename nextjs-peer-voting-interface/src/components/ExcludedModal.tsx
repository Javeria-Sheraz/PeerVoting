"use client";

import Modal from "@/components/Modal";
import { useAuth } from "@/context/AuthContext";

export default function ExcludedModal() {
  const { signOut } = useAuth();

  return (
    <Modal title="Access Denied">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-[#3f1d1d] bg-[#241414] p-3 text-[#f87171]">
          <span className="text-2xl">⛔</span>
          <p className="text-sm font-medium">This roll number is not authorized.</p>
        </div>
        <p className="text-sm text-[#a1a1aa]">
          Your roll number has been excluded from this voting cycle by an administrator. If you believe this is a
          mistake, contact your class representative.
        </p>
        <button
          onClick={() => signOut()}
          className="w-full rounded-lg bg-[#4f46e5] py-2.5 text-sm font-semibold text-white hover:bg-[#4338ca]"
        >
          Log out
        </button>
      </div>
    </Modal>
  );
}
