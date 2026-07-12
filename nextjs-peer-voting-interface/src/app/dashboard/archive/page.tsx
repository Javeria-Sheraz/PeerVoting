"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PollAnswerArchive } from "@/lib/types";

// Keep this type simple, mapping the flat view columns to the expected structure
type ArchiveRow = PollAnswerArchive & { 
  question: string; 
  expires_at: string; 
  total_votes_cast: number 
};

const PAGE_SIZE = 10; 

export default function ArchivePage() {
  const [rows, setRows] = useState<ArchiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadArchiveChunk = useCallback(async (pageIndex: number) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (pageIndex === 0) setLoading(true);
    else setLoadingMore(true);
    
    setError(null);

    try {
      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Now we just select everything from the flat view!
      const { data, error: fetchError } = await supabase
        .from("poll_answers_archive")
        .select("*") 
        .order("id", { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      const archiveRows = (data ?? []) as ArchiveRow[];

      if (archiveRows.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

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
    loadArchiveChunk(nextPage);
  };

  return (
    <div>
      {/* ... keep your Header and Error UI exactly as they were ... */}

      {loading ? (
        /* ... keep your loading skeleton ... */
      ) : rows.length === 0 ? (
        /* ... keep your empty state ... */
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.poll_id} className="card-surface fade-in rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-xl">
                  {/* Updated to use flat data */}
                  <h3 className="text-sm font-semibold text-[#f5f5f5]">{row.question ?? "Untitled poll"}</h3>
                  <p className="mt-1 text-xs text-[#71717a]">
                    {row.total_votes_cast} votes cast
                    {row.expires_at ? ` · Ended ${new Date(row.expires_at).toLocaleDateString()}` : ""}
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
                        <div key={idx} className="flex items-center gap-1.5 rounded-lg border border-[#2e2e2e] bg-[#161616] px-2.5 py-1.5">
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

          {/* ... Load More Section (Your current code works perfectly here) ... */}
        </div>
      )}
    </div>
  );
}
