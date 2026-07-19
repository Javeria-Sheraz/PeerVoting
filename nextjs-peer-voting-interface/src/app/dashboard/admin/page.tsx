"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  fetchWhitelist,
  setWhitelistExclusion,
  setCanBeVotedFor,
  addWhitelistEntry,
  fetchAllProfiles,
  setCanCreatePolls,
  fetchPendingPollsForAdmin,
  approvePendingPoll,
  rejectPendingPoll,
  type PendingPoll,
} from "@/lib/pollService";
import PendingPollsReview from "@/components/PendingPollsReview";
import type { Profile, WhitelistEntry } from "@/lib/types";
import AdminWhitelistTable from "@/components/AdminWhitelistTable";
import AdminPermissionsTable from "@/components/AdminPermissionsTable";



export default function AdminPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingPolls, setPendingPolls] = useState<PendingPoll[]>([]);

  useEffect(() => {
    if (!authLoading && profile && !profile.is_admin) {
      router.replace("/dashboard/active");
    }
  }, [authLoading, profile, router]);

  const loadData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const [whitelistData, profilesData, pendingData] = await Promise.all([
        fetchWhitelist(supabase),
        fetchAllProfiles(supabase),
        fetchPendingPollsForAdmin(supabase),
        ]);
        setWhitelist(whitelistData);
        setProfiles(profilesData);
        setPendingPolls(pendingData);
    } catch {
      setError("Failed to load admin data. Please check your Supabase configuration.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.is_admin) {
      const id = setTimeout(() => {
        void loadData();
      }, 0);
      return () => clearTimeout(id);
    }
  }, [profile, loadData]);

  async function handleToggleCanBeVotedFor(id: string, next: boolean) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await setCanBeVotedFor(supabase, id, next);
  setWhitelist((prev) => prev.map((w) => (w.id === id ? { ...w, can_be_voted_for: next } : w)));
}
  
  async function handleToggleExclusion(id: string, next: boolean) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await setWhitelistExclusion(supabase, id, next);
    setWhitelist((prev) => prev.map((w) => (w.id === id ? { ...w, is_excluded: next } : w)));
  }

  async function handleAddWhitelist(rollNumber: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: "Not connected." };
    const result = await addWhitelistEntry(supabase, rollNumber);
    if (!result.error) void loadData();
    return result;
  }

  async function handleToggleCanCreate(id: string, next: boolean) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await setCanCreatePolls(supabase, id, next);
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, can_create_polls: next } : p)));
  }

  async function handleApprovePending(id: number) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await approvePendingPoll(supabase, id);
  setPendingPolls((prev) => prev.filter((p) => p.id !== id));
}

async function handleRejectPending(id: number) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await rejectPendingPoll(supabase, id);
  setPendingPolls((prev) => prev.filter((p) => p.id !== id));
}

  if (!profile?.is_admin) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#f5f5f5]">Admin Panel</h1>
        <p className="text-sm text-[#a1a1aa]">Manage the class whitelist and poll-creation permissions.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#3f1d1d] bg-[#241414] px-3 py-2 text-sm text-[#f87171]">
          {error}
        </div>
      )}

     {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card-surface h-96 animate-pulse rounded-2xl" />
          <div className="card-surface h-96 animate-pulse rounded-2xl" />
        </div>
      ) : (
        <> 
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AdminWhitelistTable
              entries={whitelist}
              onToggleExclusion={handleToggleExclusion}
              onToggleCanBeVotedFor={handleToggleCanBeVotedFor}
              onAdd={handleAddWhitelist}
            />
            <AdminPermissionsTable profiles={profiles} onToggleCanCreate={handleToggleCanCreate} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <PendingPollsReview
              pending={pendingPolls}
              onApprove={handleApprovePending}
              onReject={handleRejectPending}
            />
          </div>
        </> 
      )}
    </div>
  );
}
