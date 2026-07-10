"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Poll, PollAnswerArchive } from "@/lib/types";

type ArchiveRow = PollAnswerArchive & { poll?: Poll };

export default function ArchivePage() {
  const [rows, setRows] = useState<ArchiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      setLoading(true);
      setError(null);
      try {
        // Attempt an embedded join first (requires FK poll_answers_archive.poll_id -> polls.id).
        const { data, error: joinError } = await supabase
          .from("poll_answers_archive")
          .select("*, poll:polls(*)")
          .order("id", { ascending: false });

        if (joinError) throw joinError;

        let archiveRows = (data ?? []) as ArchiveRow[];

        // Fallback: manually stitch in poll questions if the embed didn't resolve.
        if (archiveRows.some((r) => !r.poll)) {
          const pollIds = [...new Set(archiveRows.map((r) => r.poll_id))];
          const { data: polls } = await supabase.from("polls").select("*").in("id", pollIds);
          const pollMap = new Map((polls ?? []).map((p: Poll) => [p.id, p]));
          archiveRows = archiveRows.map((r) => ({ ...r, poll: r.poll ?? pollMap.get(r.poll_id) }));
        }

        setRows(archiveRows);
      } catch {
        setError("Failed to load the archive. Please check your Supabase configuration.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#f5f5f5]">All Answers Archive</h1>
        <p className="text-sm text-[#a1a1aa]">A historical directory of every completed poll and its top finishers.</p>
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
          {rows.map((row) => (
            <div key={row.id} className="card-surface fade-in rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-xl">
                  <h3 className="text-sm font-semibold text-[#f5f5f5]">{row.poll?.question ?? "Untitled poll"}</h3>
                  <p className="mt-1 text-xs text-[#71717a]">
                    {row.total_votes_cast} votes cast
                    {row.poll?.expires_at ? ` · Ended ${new Date(row.poll.expires_at).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {[
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
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
