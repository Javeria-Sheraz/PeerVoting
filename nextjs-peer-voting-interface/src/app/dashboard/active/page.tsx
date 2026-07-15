"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  fetchActivePolls,
  fetchProfilesByIds,
  fetchUserVotedPollIds,
  submitSecretVote,
  deletePollCascade,
  updatePollExpiration,
  createPoll,
  closePollAdmin,
  checkUserHasActivePoll,
  fetchTotalVoteCount // <-- Imported our secure function
} from "@/lib/pollService";
import type { Poll, Profile } from "@/lib/types";
import ActivePollCard from "@/components/ActivePollCard";
import CreatePollModal from "@/components/CreatePollModal";

export default function ActivePollsPage() {
  const { profile } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [profilesById, setProfilesById] = useState<Map<string, Profile>>(new Map());
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // State for 1-poll limit
  const [hasActivePoll, setHasActivePoll] = useState(false);
  
  // State for bulk vote counts
  const [countsMap, setCountsMap] = useState<Record<string, number>>({});

  const loadData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !profile) return;
    setLoading(true);
    setError(null);
    try {
      const activePolls = await fetchActivePolls(supabase);
      const creatorIds = [...new Set(activePolls.map((p) => p.creator_id))];
      
      // Perform bulk fetches: Profiles, Votes, and Active Status
      const [profilesMap, voted, activeStatus] = await Promise.all([
        fetchProfilesByIds(supabase, creatorIds),
        fetchUserVotedPollIds(supabase, profile.id),
        checkUserHasActivePoll(supabase, profile.id),
      ]);
      
      // NEW: Securely fetch the total vote counts for each poll.
      // We use our secure RPC function so it works even if the user hasn't voted.
      const voteCounts = await Promise.all(
        activePolls.map(async (poll) => {
          const count = await fetchTotalVoteCount(supabase, poll.id);
          return { pollId: poll.id, count };
        })
      );
      
      const newCountsMap = voteCounts.reduce((acc, { pollId, count }) => {
        acc[pollId] = count;
        return acc;
      }, {} as Record<string, number>);

      setPolls(activePolls);
      setProfilesById(profilesMap);
      setVotedIds(voted);
      setHasActivePoll(activeStatus);
      setCountsMap(newCountsMap); 
    } catch {
      setError("Failed to load active polls. Please check your Supabase configuration.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    const id = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(id);
  }, [loadData]);

  async function handleVote(pollId: string, roll: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !profile) return { error: "Not connected." };
    const result = await submitSecretVote(supabase, pollId, profile.id, roll);
    if (!result.error) {
      setVotedIds((prev) => new Set(prev).add(pollId));
      // Optimistically update local count to feel instant
      setCountsMap((prev) => ({ ...prev, [pollId]: (prev[pollId] || 0) + 1 }));
    }
    return result;
  }

  async function handleDelete(pollId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await deletePollCascade(supabase, pollId);
    setPolls((prev) => prev.filter((p) => p.id !== pollId));
  }

  async function handleClose(pollId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await closePollAdmin(supabase, pollId);
    void loadData();
  }

  async function handleUpdateExpiration(pollId: string, isoDate: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await updatePollExpiration(supabase, pollId, isoDate);
    setPolls((prev) => prev.map((p) => (p.id === pollId ? { ...p, expires_at: isoDate } : p)));
  }

  async function handleCreate(question: string, expiresAt: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !profile) return;
    setCreating(true);
    const { error: createError } = await createPoll(supabase, profile.id, question, expiresAt);
    setCreating(false);
    if (!createError) {
      setShowCreate(false);
      void loadData();
    } else {
      setError(createError);
    }
  }

  const canCreate = profile?.can_create_polls || profile?.is_admin;
  const isButtonDisabled = hasActivePoll && !profile?.is_admin; 

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#f5f5f5]">Active Polls</h1>
          <p className="text-sm text-[#a1a1aa]">Cast your anonymous vote before time runs out.</p>
        </div>
        
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            disabled={isButtonDisabled}
            title={isButtonDisabled ? "You must wait for your current poll to expire" : "Create a new poll"}
            className="rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isButtonDisabled ? "Poll Already Active" : "+ Create Poll"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#3f1d1d] bg-[#241414] px-3 py-2 text-sm text-[#f87171]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface h-72 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="card-surface flex flex-col items-center justify-center rounded-2xl py-16 text-center">
          <span className="mb-3 text-3xl">🗳️</span>
          <p className="text-sm text-[#a1a1aa]">No active polls right now. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <ActivePollCard
              key={poll.id}
              poll={poll}
              totalVotes={countsMap[poll.id] || 0}
              creatorRoll={profilesById.get(poll.creator_id)?.roll_number ?? "Unknown"}
              hasVoted={votedIds.has(poll.id)}
              isAdmin={Boolean(profile?.is_admin)}
              ownRoll={profile?.roll_number ?? null}
              onVote={handleVote}
              onDelete={handleDelete}
              onUpdateExpiration={handleUpdateExpiration}
              onExpire={loadData}
              onClose={handleClose}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePollModal busy={creating} onCancel={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
