"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Link2,
  Link2Off,
  Check,
  RefreshCw,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

interface Alert {
  id: number;
  created_at: string;
  severity: "critical" | "warning" | "notice";
  type: string;
  title: string;
  detail: Record<string, unknown> | null;
  acknowledged: boolean;
}

interface Dashboard {
  open_critical: number;
  open_warning: number;
  open_total: number;
  audit_events: number;
  last_scan_at: string | null;
  recent_alerts: Alert[];
}

interface ChainResult {
  ok: boolean;
  rows_checked: number;
  first_bad_id: number | null;
  failure_reason: string | null;
}

const SEVERITY = {
  critical: {
    border: "var(--danger)",
    text: "var(--danger)",
    bg: "var(--danger-soft)",
    label: "Critical",
  },
  warning: {
    border: "var(--warning)",
    text: "var(--warning)",
    bg: "var(--warning-soft)",
    label: "Warning",
  },
  notice: {
    border: "var(--border-strong)",
    text: "var(--text-secondary)",
    bg: "var(--bg-elevated-2)",
    label: "Notice",
  },
} as const;

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "bad" | "warn" | "ok";
}) {
  const color =
    tone === "bad"
      ? "var(--danger)"
      : tone === "warn"
        ? "var(--warning)"
        : tone === "ok"
          ? "var(--success)"
          : "var(--text-primary)";
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <div
        className="text-2xl font-medium tabular-nums"
        style={{ color }}
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs text-[var(--text-secondary)]">{label}</div>
    </div>
  );
}

export default function SecurityPanel() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [chain, setChain] = useState<ChainResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAcked, setShowAcked] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setError(null);
    const { data: res, error: err } = await supabase.rpc("get_security_dashboard");
    if (err) {
      setError("Couldn't load security data.");
    } else {
      setData(res as unknown as Dashboard);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function verifyChain() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setChecking(true);
    const { data: res, error: err } = await supabase.rpc("verify_audit_chain");
    setChecking(false);
    if (err) {
      setError("Chain verification failed to run.");
      return;
    }
    const row = Array.isArray(res) ? res[0] : res;
    setChain(row as ChainResult);
  }

  async function acknowledge(id: number) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error: err } = await supabase.rpc("acknowledge_alert", {
      p_alert_id: id,
    });
    if (!err) void load();
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading security data">
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  const alerts = (data?.recent_alerts ?? []).filter(
    (a) => showAcked || !a.acknowledged,
  );

  return (
    <div className="fade-in">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium text-[var(--text-primary)]">Security</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Tamper-evident audit trail and automatic anomaly detection.
          </p>
        </div>
        <button onClick={() => void load()} className="btn-ghost inline-flex items-center gap-1.5 px-3 py-2 text-xs">
          <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Stat
          label="Open critical"
          value={data?.open_critical ?? 0}
          tone={data?.open_critical ? "bad" : "ok"}
        />
        <Stat
          label="Open warnings"
          value={data?.open_warning ?? 0}
          tone={data?.open_warning ? "warn" : undefined}
        />
        <Stat label="Audit entries" value={data?.audit_events ?? 0} />
        <Stat
          label="Last scan"
          value={
            data?.last_scan_at
              ? new Date(data.last_scan_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"
          }
        />
      </div>

      {/* chain verification */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Audit log integrity
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Recomputes every hash to prove no entry was edited or deleted.
          </p>
        </div>

        {chain && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: chain.ok ? "var(--success-soft)" : "var(--danger-soft)",
              color: chain.ok ? "var(--success)" : "var(--danger)",
            }}
          >
            {chain.ok ? (
              <>
                <Link2 aria-hidden="true" className="h-3.5 w-3.5" />
                Intact · {chain.rows_checked} entries
              </>
            ) : (
              <>
                <Link2Off aria-hidden="true" className="h-3.5 w-3.5" />
                Broken at #{chain.first_bad_id}
              </>
            )}
          </span>
        )}

        <button
          onClick={verifyChain}
          disabled={checking}
          className="btn-ghost inline-flex items-center gap-1.5 px-3 py-2 text-xs"
        >
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          {checking ? "Checking..." : "Verify now"}
        </button>
      </div>

      {chain && !chain.ok && chain.failure_reason && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] p-3">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]"
          />
          <div className="text-xs text-[var(--danger)]">
            <p className="font-medium">Audit history was altered.</p>
            <p className="mt-0.5">{chain.failure_reason}</p>
          </div>
        </div>
      )}

      {/* alerts */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Alerts</h3>
        <button
          onClick={() => setShowAcked((v) => !v)}
          aria-pressed={showAcked}
          className="btn-ghost px-2.5 py-1 text-xs"
        >
          {showAcked ? "Hide acknowledged" : "Show acknowledged"}
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-12 text-center">
          <ShieldCheck aria-hidden="true" className="mb-2 h-8 w-8 text-[var(--success)]" />
          <p className="text-sm text-[var(--text-secondary)]">Nothing needs your attention.</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Scans run automatically every 10 minutes.
          </p>
        </div>
      ) : (
        <ul className="stagger space-y-2">
          {alerts.map((a, i) => {
            const s = SEVERITY[a.severity] ?? SEVERITY.notice;
            return (
              <li
                key={a.id}
                style={{
                  ["--i" as string]: Math.min(i, 12),
                  borderLeftColor: s.border,
                }}
                className={`flex items-start gap-3 rounded-r-lg border border-l-[3px] border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 ${
                  a.acknowledged ? "opacity-50" : ""
                }`}
              >
                <ShieldAlert
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: s.text }}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text-primary)]">{a.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {a.type.replace(/_/g, " ")} ·{" "}
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                  {a.detail && (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        Details
                      </summary>
                      <pre className="mt-1.5 overflow-x-auto rounded-lg bg-[var(--bg-inset)] p-2.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                        {JSON.stringify(a.detail, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: s.bg, color: s.text }}
                >
                  {s.label}
                </span>

                {!a.acknowledged && (
                  <button
                    onClick={() => acknowledge(a.id)}
                    className="btn-ghost shrink-0 px-2.5 py-1 text-xs"
                    aria-label={`Acknowledge alert: ${a.title}`}
                  >
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
