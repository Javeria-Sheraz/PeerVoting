"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ResetPasswordModal from "@/components/ResetPasswordModal";

const BASE_TABS = [
  { href: "/dashboard/active", label: "Active" },
  { href: "/dashboard/closed", label: "Closed" },
  { href: "/dashboard/archive", label: "Archive" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/about", label: "About" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tabs = profile?.is_admin
    ? [...BASE_TABS, { href: "/dashboard/admin", label: "Admin" }]
    : BASE_TABS;

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const shortRoll = profile?.roll_number?.replace("2024mc", "#") ?? "?";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6">
        <Link
          href="/dashboard/active"
          className="flex shrink-0 items-center gap-2"
          aria-label="PeerVote home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 rounded-lg object-contain"
          />
          <span className="hidden text-sm font-medium tracking-tight text-[var(--text-primary)] sm:block">
            PeerVote
          </span>
        </Link>

        <nav
          aria-label="Main"
          className="no-scrollbar flex min-w-0 flex-1 items-center justify-center overflow-x-auto"
        >
          <div className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1">
            {tabs.map((tab) => {
              const active = pathname?.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3.5 sm:text-sm ${
                    active
                      ? "bg-[var(--accent)] text-[var(--on-accent)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Account menu for ${profile?.roll_number ?? "your account"}`}
            className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-1 pl-1 pr-2.5 transition-colors hover:border-[var(--accent)]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-medium text-[var(--accent-text)]">
              {shortRoll}
            </span>
            <span className="hidden text-xs font-medium text-[var(--text-secondary)] sm:block">
              {profile?.roll_number ?? "Loading"}
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="fade-in absolute right-0 top-11 w-52 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1.5 shadow-xl"
            >
              <div className="truncate px-2 py-1.5 text-xs text-[var(--text-muted)]">
                {profile?.email}
              </div>

              {profile?.is_admin && (
                <div className="mx-2 mb-1 inline-flex items-center gap-1 rounded bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--accent-text)]">
                  <ShieldCheck aria-hidden="true" className="h-3 w-3" />
                  Admin
                </div>
              )}

              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setShowResetModal(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated-2)] hover:text-[var(--text-primary)]"
              >
                <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
                Change password
              </button>

              <button
                role="menuitem"
                onClick={() => signOut()}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
              >
                <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {showResetModal && (
        <ResetPasswordModal onClose={() => setShowResetModal(false)} />
      )}
    </header>
  );
}
