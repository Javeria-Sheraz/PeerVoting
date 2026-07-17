"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fetchMyVotedPollIds, fetchIsExcluded } from "@/lib/pollService";
import type { PollAnswerArchive } from "@/lib/types";

type ArchiveRow = PollAnswerArchive & {
  question: string;
  expires_at: string;
  total_votes_cast: number;
};

const PAGE_SIZE = 10;

export default function ArchivePage() {
  const [rows, setRows] = useState<ArchiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Derived from RPC calls — not from direct table queries
  const [isAdmin, setIsAdmin] = useState(false);
  const [isExcluded, setIsExcluded] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());

const loadArchiveChunk = useCallback(async (pageIndex: number) => {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  if (pageIndex === 0) {
    setLoading(true);

    const [excluded, voted] = await Promise.all([
      fetchIsExcluded(supabase),
      fetchMyVotedPollIds(supabase),
    ]);

    setIsExcluded(excluded);
    setVotedPolls(voted);

    if (excluded) {
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      setIsAdmin(profileData?.is_admin ?? false);
    }
  } else {
    setLoadingMore(true);
  }

  setError(null);

  try {
    // ── CHANGED: use RPC instead of direct view query ──────────────────
    // get_poll_archive() is SECURITY DEFINER and enforces the exclusion
    // gate internally. Direct SELECT on the view is now revoked, so this
    // is the only valid read path for the authenticated role.
    const { data, error: fetchError } = await supabase.rpc("get_poll_archive", {
      p_limit:  PAGE_SIZE,
      p_offset: pageIndex * PAGE_SIZE,
    });
    // ── END CHANGE ───────────────────────────────────────────────────────

    if (fetchError) throw fetchError;

    const archiveRows = (data ?? []) as ArchiveRow[];
    setHasMore(archiveRows.length === PAGE_SIZE);
    setRows((prev) => (pageIndex === 0 ? archiveRows : [...prev, ...archiveRows]));
  } catch {
    setError("Failed to load the archive.");
  } finally {
    setLoading(false);
    setLoadingMore(false);
  }
}, []);

  useEffect(() => {
    loadArchiveChunk(0);
  }, [loadArchiveChunk]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    void loadArchiveChunk(nextPage);
  };

  // ── Exclusion wall: shown before any data is rendered ──────────────────
  if (!loading && isExcluded) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#f5f5f5]">All Answers Archive</h1>
        </div>
        <div className="card-surface flex flex-col items-center justify-center rounded-2xl py-16 text-center">
          <span className="mb-3 text-3xl">🚫</span>
          <p className="text-sm font-semibold text-[#f87171]">Access Restricted</p>
          <p className="mt-1 text-xs text-[#71717a]">
            Your account does not have permission to view this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#f5f5f5]">All Answers Archive</h1>
        <p className="text-sm text-[#a1a1aa]">
          A historical directory of every completed poll and its top finishers.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#3f1d1d] bg-[#241414] px-3 py-2 text-sm text-[#f87171]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface h-24 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card-surface flex flex-col items-center justify-center rounded-2xl py-16 text-center">
          <span className="mb-3 text-3xl">📜</span>
          <p className="text-sm text-[#a1a1aa]">No archived poll results yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            // votedPolls is now populated via get_my_voted_poll_ids() RPC,
            // so this correctly reflects the user's real vote history.
            const canViewResults = isAdmin || votedPolls.has(String(row.poll_id));

            return (
              <div key={row.poll_id} className="card-surface fade-in rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-xl">
                    <h3 className="text-sm font-semibold text-[#f5f5f5]">
                      {row.question ?? "Untitled poll"}
                    </h3>
                    <p className="mt-1 text-xs text-[#71717a]">
                      {row.total_votes_cast} votes cast
                      {row.expires_at
                        ? ` · Ended ${new Date(row.expires_at).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {canViewResults ? (
                      [
                        { label: row.top_1_roll, medal: "🥇" },
                        { label: row.top_2_roll, medal: "🥈" },
                        { label: row.top_3_roll, medal: "🥉" },
                      ].map(
                        (entry, idx) =>
                          entry.label && (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 rounded-lg border border-[#2e2e2e] bg-[#161616] px-2.5 py-1.5"
                            >
                              <span>{entry.medal}</span>
                              <span className="text-xs font-semibold text-[#d4d4d8]">
                                {entry.label.replace("2024mc", "#")}
                              </span>
                            </div>
                          )
                      )
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-lg border border-[#2e2e2e] bg-[#1a1a1a]/50 px-3 py-1.5">
                        <span className="text-sm">🔒</span>
                        <span className="text-xs font-medium text-[#a1a1aa]">
                          You did not vote on this poll!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pb-8 pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-lg bg-[#2e2e2e] px-4 py-2 text-sm font-medium text-[#e4e4e7] transition-colors hover:bg-[#3f3f46] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}

          {!hasMore && rows.length > 0 && (
            <p className="pb-8 pt-4 text-center text-xs text-[#71717a]">
              You have reached the end of the archive.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
