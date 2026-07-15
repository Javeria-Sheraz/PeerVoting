"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ResetPasswordModal from "@/components/ResetPasswordModal";

const BASE_TABS = [
  { href: "/dashboard/active", label: "Active Polls" },
  { href: "/dashboard/closed", label: "Closed Polls" },
  { href: "/dashboard/archive", label: "Answers Archive" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const tabs = profile?.is_admin ? [...BASE_TABS, { href: "/dashboard/admin", label: "Admin Panel" }] : BASE_TABS;

  return (
    <header className="sticky top-0 z-40 border-b border-[#2e2e2e] bg-[#121212]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-2 py-3 sm:gap-4 sm:px-6">
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Image
            src="/logo.png"
            alt="PeerVote Logo"
            width={100}
            height={100}
            className="rounded-lg shrink-0 w-8 h-12 sm:w-[100px] sm:h-[100px]"
          />
          <span className="hidden text-sm font-semibold tracking-tight text-[#f5f5f5] sm:block">PeerVote</span>
        </div>

        <nav className="flex flex-1 items-center justify-center min-w-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-1">
            {tabs.map((tab) => {
              const active = pathname?.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:px-3.5 sm:text-sm ${
                    active ? "bg-[#4f46e5] text-white shadow" : "text-[#a1a1aa] hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-[#2e2e2e] bg-[#1a1a1a] py-1 pl-1 pr-2.5 hover:border-[#4f46e5]/60"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4f46e5]/20 text-xs font-semibold text-[#a5b4fc]">
              {profile?.roll_number?.replace("2024mc", "#") ?? "?"}
            </span>
            <span className="hidden text-xs font-medium text-[#d4d4d8] sm:block">
              {profile?.roll_number ?? "Loading"}
            </span>
          </button>
          {menuOpen && (
            <div className="fade-in absolute right-0 top-11 w-44 rounded-xl border border-[#2e2e2e] bg-[#1e1e1e] p-1.5 shadow-xl">
              <div className="px-2 py-1.5 text-xs text-[#71717a]">{profile?.email}</div>
              {profile?.is_admin && (
                <div className="mx-2 mb-1 rounded bg-[#4f46e5]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#a5b4fc]">
                  Admin
                </div>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setShowResetModal(true);
                }}
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-[#d4d4d8] hover:bg-[#2a2a2a]"
              >
                Change Password
              </button>
              <button
                onClick={() => signOut()}
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-[#f87171] hover:bg-[#2a1a1a]"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      {showResetModal && <ResetPasswordModal onClose={() => setShowResetModal(false)} />}
    </header>
  );
}
