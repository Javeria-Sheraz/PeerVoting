"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fetchLeaderboardData } from "@/lib/pollService";
import type { StudentRanking } from "@/lib/types";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "Updating...";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

const VOTER_COLOR: Record<string, string> = {
  "the supernova":     "text-[#fbbf24]",
  "the constellation": "text-[#a5b4fc]",
  "the star gazer":    "text-[#6ee7b7]",
  "the lurker":        "text-[#52525b]",
};

const CREATOR_COLOR: Record<string, string> = {
  "the blackhole": "text-[#f43f5e]",
  "the star":      "text-[#fb923c]",
  "the planet":    "text-[#38bdf8]",
  "the observer":  "text-[#52525b]",
};

const STATUS_COLOR: Record<string, string> = {
  admin:  "text-[#a5b4fc]",
  member: "text-[#71717a]",
};

function TitleCell({
  title,
  colorMap,
}: {
  title: string | null;
  colorMap: Record<string, string>;
}) {
  if (!title) return <span className="text-[#3a3a3a]">—</span>;
  return (
    <span className={`text-xs font-medium ${colorMap[title] ?? "text-[#a1a1aa]"}`}>
      {title}
    </span>
  );
}

export default function LeaderboardPage() {
  const { profile } = useAuth();
  const [rankings, setRankings] = useState<StudentRanking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [countdown, setCountdown] = useState(SIX_HOURS_MS);
  // Fixed anchor — set once on first successful load, reset only after cron fires
  const nextRunRef = useRef<number | null>(null);

  const loadData = useCallback(async (resetAnchor = false) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setError(null);
    try {
      const { rankings: data, lastRunAt } = await fetchLeaderboardData(supabase);
      setRankings(data);
      if (nextRunRef.current === null || resetAnchor) {
        nextRunRef.current = new Date(lastRunAt).getTime() + SIX_HOURS_MS;
      }
    } catch {
      setError("Failed to load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Countdown tick — auto-refreshes when anchor elapses
  useEffect(() => {
    const tick = setInterval(() => {
      if (nextRunRef.current === null) return;
      const remaining = nextRunRef.current - Date.now();
      setCountdown(Math.max(0, remaining));
      if (remaining <= 0) {
        nextRunRef.current = null;
        void loadData(true);
      }
    }, 1_000);
    return () => clearInterval(tick);
  }, [loadData]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#f5f5f5]">Participation Leaderboard</h1>
          <p className="text-sm text-[#a1a1aa]">Rankings recalculate every 6 hours.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
          <span className="text-xs text-[#a1a1aa]">Next update in</span>
          <span className="tabular-nums text-xs font-semibold text-[#f5f5f5]">
            {fmtCountdown(countdown)}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#3f1d1d] bg-[#241414] px-3 py-2 text-sm text-[#f87171]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card-surface h-96 animate-pulse rounded-2xl" />
      ) : rankings.length === 0 ? (
        <div className="card-surface flex flex-col items-center justify-center rounded-2xl py-16 text-center">
          <span className="mb-3 text-3xl">🏆</span>
          <p className="text-sm text-[#a1a1aa]">No ranking data yet.</p>
        </div>
      ) : (
        <div className="card-surface overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1a1a1a] text-xs uppercase tracking-wide text-[#71717a]">
                <tr>
                  <th className="w-10 px-4 py-3">#</th>
                  <th className="px-4 py-3">Roll</th>
                  <th className="px-4 py-3 text-right">Votes Cast</th>
                  <th className="px-4 py-3 text-right">Polls Created</th>
                  <th className="px-4 py-3">Voter Title</th>
                  <th className="px-4 py-3">Creator Title</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((row, idx) => {
                  const isOwn = row.roll_number === profile?.roll_number;
                  return (
                    <tr
                      key={row.roll_number}
                      className={`border-t border-[#2a2a2a] transition-colors ${
                        isOwn ? "bg-[#4f46e5]/10" : "hover:bg-[#1e1e1e]"
                      }`}
                    >
                      <td className="px-4 py-3 text-xs text-[#71717a]">{idx + 1}</td>

                      <td className="px-4 py-3 font-semibold text-[#d4d4d8]">
                        {row.roll_number.replace("2024mc", "#")}
                        {isOwn && (
                          <span className="ml-1.5 text-[10px] font-normal text-[#71717a]">
                            (you)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right text-[#d4d4d8]">
                        {row.votes_cast_count}
                      </td>

                      <td className="px-4 py-3 text-right text-[#d4d4d8]">
                        {row.polls_created_count}
                      </td>

                      <td className="px-4 py-3">
                        <TitleCell title={row.voter_title}   colorMap={VOTER_COLOR}   />
                      </td>
                      <td className="px-4 py-3">
                        <TitleCell title={row.creator_title} colorMap={CREATOR_COLOR} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${
                            STATUS_COLOR[row.status_title] ?? "text-[#a1a1aa]"
                          }`}
                        >
                          {row.status_title}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
