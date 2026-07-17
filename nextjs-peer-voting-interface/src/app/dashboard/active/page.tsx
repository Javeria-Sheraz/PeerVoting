"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  fetchPollsWithCreator,       // replaces fetchActivePolls + fetchProfilesByIds
  fetchMyVotedPollIds,         // replaces fetchUserVotedPollIds (was broken)
  submitSecretVote,
  deletePollCascade,
  updatePollExpiration,
  createPoll,
  closePollAdmin,
  checkUserHasActivePoll,
  fetchTotalVoteCount,
  type PollWithCreator,
} from "@/lib/pollService";
import ActivePollCard from "@/components/ActivePollCard";
import CreatePollModal from "@/components/CreatePollModal";

export default function ActivePollsPage() {
  const { profile } = useAuth();

  // PollWithCreator already contains creator_roll — no separate profiles map needed
  const [polls, setPolls] = useState<PollWithCreator[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [countsMap, setCountsMap] = useState<Record<string, number>>({});
  const [hasActivePoll, setHasActivePoll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !profile) return;
    setLoading(true);
    setError(null);

    try {
      // Single RPC replaces fetchActivePolls + fetchProfilesByIds.
      // is_active is computed by the DB; we filter here for the active tab.
      const allPolls = await fetchPollsWithCreator(supabase);
      const activePolls = allPolls.filter((p) => p.is_active);

      // fetchMyVotedPollIds uses get_my_voted_poll_ids() RPC (SECURITY DEFINER).
      // This is the fix for Issue 3 — the old direct vote_trackers query
      // returned empty rows because non-admins have no SELECT policy on that table.
      const [voted, activeStatus] = await Promise.all([
        fetchMyVotedPollIds(supabase),
        checkUserHasActivePoll(supabase, profile.id),
      ]);

      // Fetch total vote counts for all active polls in parallel
      const voteCounts = await Promise.all(
        activePolls.map(async (poll) => {
          const count = await fetchTotalVoteCount(supabase, poll.id);
          return { pollId: poll.id, count };
        })
      );
      const newCountsMap = voteCounts.reduce(
        (acc, { pollId, count }) => ({ ...acc, [pollId]: count }),
        {} as Record<string, number>
      );

      setPolls(activePolls);
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
    const id = setTimeout(() => void loadData(), 0);
    return () => clearTimeout(id);
  }, [loadData]);

  async function handleVote(pollId: string, roll: string) {
    const supabase = getSupabaseClient();
    if (!supabase || !profile) return { error: "Not connected." };
    const result = await submitSecretVote(supabase, pollId, profile.id, roll);
    if (!result.error) {
      setVotedIds((prev) => new Set(prev).add(pollId));
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
    setPolls((prev) =>
      prev.map((p) => (p.id === pollId ? { ...p, expires_at: isoDate } : p))
    );
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
            className="rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-50"
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
              creatorRoll={poll.creator_roll}          // ← direct from RPC, no map lookup
              hasVoted={votedIds.has(String(poll.id))} // ← now correctly populated via RPC
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
