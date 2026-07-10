"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TopNav from "@/components/TopNav";
import ExcludedModal from "@/components/ExcludedModal";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, profile, loading, isExcluded, isConfigured } = useAuth();

  useEffect(() => {
    if (!loading && (!session || !isConfigured)) {
      router.replace("/");
    }
  }, [loading, session, isConfigured, router]);

  if (!isConfigured) {
    return null;
  }

  if (loading || !session || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#a1a1aa]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4f46e5] border-t-transparent" />
          <p className="text-sm">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (isExcluded) {
    return <ExcludedModal />;
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
