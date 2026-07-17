"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  fetchPollsWithCreator,   // replaces fetchClosedPolls + fetchProfilesByIds
  fetchPollResults,
  deletePollCascade,
  type PollWithCreator,
} from "@/lib/pollService";
import type { PollResult } from "@/lib/types";
import ClosedPollCard from "@/components/ClosedPollCard";

export default function ClosedPollsPage() {
  const { profile } = useAuth();

  // PollWithCreator has creator_roll built in — no profilesById map needed
  const [polls, setPolls] = useState<PollWithCreator[]>([]);
  const [resultsByPoll, setResultsByPoll] = useState<Map<string, PollResult[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const allPolls = await fetchPollsWithCreator(supabase);
      // is_active = false covers both: manually archived AND naturally expired polls.
      // No more manual date arithmetic in JS — the DB computes this correctly.
      // AFTER — only show polls that closed within the last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const closedPolls = allPolls.filter(
      (p) => !p.is_active && new Date(p.expires_at).getTime() > oneDayAgo
    );
      setPolls(closedPolls);
    } catch {
      setError("Failed to load closed polls. Please check your Supabase configuration.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleLoadResults(pollId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const results = await fetchPollResults(supabase, pollId);
    setResultsByPoll((prev) => new Map(prev).set(pollId, results));
  }

  async function handleDelete(pollId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await deletePollCascade(supabase, pollId);
    setPolls((prev) => prev.filter((p) => p.id !== pollId));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#f5f5f5]">Closed Polls</h1>
        <p className="text-sm text-[#a1a1aa]">Final tallies and podium results for polls that have ended.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#3f1d1d] bg-[#241414] px-3 py-2 text-sm text-[#f87171]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface h-80 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="card-surface flex flex-col items-center justify-center rounded-2xl py-16 text-center">
          <span className="mb-3 text-3xl">🏁</span>
          <p className="text-sm text-[#a1a1aa]">No polls have closed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <ClosedPollCard
              key={poll.id}
              poll={poll}
              creatorRoll={poll.creator_roll}     // ← direct from RPC
              results={resultsByPoll.get(poll.id)}
              isAdmin={Boolean(profile?.is_admin)}
              onDelete={handleDelete}
              onLoadResults={handleLoadResults}
            />
          ))}
        </div>
      )}
    </div>
  );
}
