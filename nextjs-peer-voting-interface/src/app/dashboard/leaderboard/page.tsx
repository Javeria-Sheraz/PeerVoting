"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  Flame,
  Trophy,
  Info,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fetchLeaderboardData } from "@/lib/pollService";
import type { StudentRanking } from "@/lib/types";
import {
  VOTER_TITLES,
  CREATOR_TITLES,
  STATUS_TITLES,
  UNTITLED_EXPLAINER,
  titleColor,
  titleCondition,
  titleRank,
} from "@/lib/titles";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "Updating...";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

type SortKey =
  | "votes_cast_count"
  | "polls_created_count"
  | "creating_streak"
  | "roll_number"
  | "voter_title"
  | "creator_title"
  | "status_title";

type RoleFilter = "all" | "admin" | "member";

function TitleCell({ title }: { title: string | null }) {
  if (!title) {
    return (
      <span
        className="text-xs text-[var(--text-faint)]"
        title={UNTITLED_EXPLAINER}
      >
        —
      </span>
    );
  }
  return (
    <span
      className={`text-xs font-medium ${titleColor(title)}`}
      title={titleCondition(title)}
    >
      {title}
    </span>
  );
}

function SortHeader({
  label,
  col,
  sort,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  col: SortKey;
  sort: SortKey;
  dir: "asc" | "desc";
  onSort: (c: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort === col;
  return (
    <th className={`px-4 py-3 ${align === "right" ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => onSort(col)}
        aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
        className={`inline-flex items-center gap-1 transition-colors hover:text-[var(--text-primary)] ${
          active ? "text-[var(--accent-text)]" : ""
        }`}
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ChevronUp aria-hidden="true" className="h-3 w-3" />
          ) : (
            <ChevronDown aria-hidden="true" className="h-3 w-3" />
          )
        ) : null}
      </button>
    </th>
  );
}

export default function LeaderboardPage() {
  const { profile } = useAuth();
  const [rankings, setRankings] = useState<StudentRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(SIX_HOURS_MS);
  const nextRunRef = useRef<number | null>(null);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("votes_cast_count");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [role, setRole] = useState<RoleFilter>("all");
  const [showLegend, setShowLegend] = useState(false);

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
      setError("Couldn't load the leaderboard. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

  function handleSort(col: SortKey) {
    if (sort === col) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(col);
      setDir(col === "roll_number" ? "asc" : "desc");
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    let out = rankings.filter((r) => {
      if (role !== "all" && r.status_title !== role) return false;
      if (!q) return true;
      return (
        r.roll_number.toLowerCase().includes(q) ||
        r.roll_number.replace("2024mc", "#").includes(q) ||
        (r.voter_title ?? "").toLowerCase().includes(q) ||
        (r.creator_title ?? "").toLowerCase().includes(q)
      );
    });

    out = [...out].sort((a, b) => {
      let cmp: number;
      switch (sort) {
        case "roll_number": {
          const na = parseInt(a.roll_number.replace("2024mc", ""), 10);
          const nb = parseInt(b.roll_number.replace("2024mc", ""), 10);
          cmp = (Number.isNaN(na) ? 0 : na) - (Number.isNaN(nb) ? 0 : nb);
          break;
        }
        case "voter_title":
          cmp = titleRank(b.voter_title) - titleRank(a.voter_title);
          break;
        case "creator_title":
          cmp = titleRank(b.creator_title) - titleRank(a.creator_title);
          break;
        case "status_title":
          cmp = a.status_title.localeCompare(b.status_title) * -1;
          break;
        default:
          cmp = (a[sort] as number) - (b[sort] as number);
      }
      if (cmp === 0) cmp = a.roll_number.localeCompare(b.roll_number);
      return dir === "asc" ? cmp : -cmp;
    });

    return out;
  }, [rankings, query, sort, dir, role]);

  const activeFilters = query.trim() !== "" || role !== "all";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-[var(--text-primary)]">
            Participation leaderboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Who shows up — never who voted for whom.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
          <span className="text-xs text-[var(--text-secondary)]">Next update in</span>
          <span className="tabular-nums text-xs font-medium text-[var(--text-primary)]">
            {fmtCountdown(countdown)}
          </span>
        </div>
      </div>

      {/* controls */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roll number or title..."
            aria-label="Search the leaderboard"
            className="field w-full py-2 pl-9 pr-3 text-sm"
          />
        </div>

        <div
          role="group"
          aria-label="Filter by role"
          className="flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1"
        >
          {(["all", "admin", "member"] as RoleFilter[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              aria-pressed={role === r}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                role === r
                  ? "bg-[var(--accent)] text-[var(--on-accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowLegend((v) => !v)}
          aria-expanded={showLegend}
          className="btn-ghost inline-flex items-center gap-1.5 px-3 py-2 text-xs"
        >
          <Info aria-hidden="true" className="h-3.5 w-3.5" />
          How titles work
        </button>
      </div>

      {/* title legend */}
      {showLegend && (
        <div className="fade-in mb-4 grid gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 sm:grid-cols-3">
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              <Trophy aria-hidden="true" className="h-3.5 w-3.5" /> Voter titles
            </h2>
            <ul className="space-y-2">
              {VOTER_TITLES.map((t) => (
                <li key={t.name}>
                  <span className={`text-xs font-medium ${t.color}`}>{t.name}</span>
                  <p className="text-[11px] leading-snug text-[var(--text-muted)]">
                    {t.condition}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              <Flame aria-hidden="true" className="h-3.5 w-3.5" /> Creator titles
            </h2>
            <ul className="space-y-2">
              {CREATOR_TITLES.map((t) => (
                <li key={t.name}>
                  <span className={`text-xs font-medium ${t.color}`}>{t.name}</span>
                  <p className="text-[11px] leading-snug text-[var(--text-muted)]">
                    {t.condition}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] leading-snug text-[var(--text-faint)]">
              A poll only counts once it reaches 20 votes.
            </p>
          </div>

          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> Status
            </h2>
            <ul className="space-y-2">
              {STATUS_TITLES.map((t) => (
                <li key={t.name}>
                  <span className={`text-xs font-medium ${t.color}`}>{t.name}</span>
                  <p className="text-[11px] leading-snug text-[var(--text-muted)]">
                    {t.condition}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] leading-snug text-[var(--text-faint)]">
              A dash means: {UNTITLED_EXPLAINER.toLowerCase()}.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading leaderboard">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <div className="card-surface flex flex-col items-center justify-center rounded-2xl py-16 text-center">
          <Trophy aria-hidden="true" className="mb-3 h-8 w-8 text-[var(--text-faint)]" />
          <p className="text-sm text-[var(--text-secondary)]">No ranking data yet.</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Rankings appear after the first poll closes.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="card-surface flex flex-col items-center justify-center rounded-2xl py-16 text-center">
          <Search aria-hidden="true" className="mb-3 h-8 w-8 text-[var(--text-faint)]" />
          <p className="text-sm text-[var(--text-secondary)]">Nothing matches those filters.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setRole("all");
            }}
            className="btn-ghost mt-3 px-3 py-1.5 text-xs"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {activeFilters && (
            <p className="mb-2 text-xs text-[var(--text-muted)]">
              Showing {visible.length} of {rankings.length}
            </p>
          )}

          <div className="card-surface overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Participation leaderboard, sortable by votes cast, polls created,
                  streak, titles and status.
                </caption>
                <thead className="bg-[var(--bg-inset)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <tr>
                    <th className="w-10 px-4 py-3">#</th>
                    <SortHeader label="Roll" col="roll_number" sort={sort} dir={dir} onSort={handleSort} />
                    <SortHeader label="Votes cast" col="votes_cast_count" sort={sort} dir={dir} onSort={handleSort} align="right" />
                    <SortHeader label="Polls made" col="polls_created_count" sort={sort} dir={dir} onSort={handleSort} align="right" />
                    <SortHeader label="Streak" col="creating_streak" sort={sort} dir={dir} onSort={handleSort} align="right" />
                    <SortHeader label="Voter title" col="voter_title" sort={sort} dir={dir} onSort={handleSort} />
                    <SortHeader label="Creator title" col="creator_title" sort={sort} dir={dir} onSort={handleSort} />
                    <SortHeader label="Status" col="status_title" sort={sort} dir={dir} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row, idx) => {
                    const isOwn = row.roll_number === profile?.roll_number;
                    return (
                      <tr
                        key={row.roll_number}
                        className={`border-t border-[var(--border-subtle)] transition-colors ${
                          isOwn
                            ? "bg-[var(--accent-soft)]"
                            : "hover:bg-[var(--bg-elevated-2)]"
                        }`}
                      >
                        <td className="px-4 py-3 text-xs tabular-nums text-[var(--text-muted)]">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                          {row.roll_number.replace("2024mc", "#")}
                          {isOwn && (
                            <span className="ml-1.5 text-[10px] font-normal text-[var(--text-muted)]">
                              (you)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[var(--text-primary)]">
                          {row.votes_cast_count}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[var(--text-primary)]">
                          {row.polls_created_count}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.creating_streak > 1 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warning-soft)] px-2 py-0.5 text-xs font-medium text-[var(--warning)]">
                              <Flame aria-hidden="true" className="h-3 w-3" />
                              {row.creating_streak}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--text-faint)]">
                              {row.creating_streak || "—"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <TitleCell title={row.voter_title} />
                        </td>
                        <td className="px-4 py-3">
                          <TitleCell title={row.creator_title} />
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium ${titleColor(row.status_title)}`}
                            title={titleCondition(row.status_title)}
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
        </>
      )}
    </div>
  );
}
