"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/constants";

const ONE_HOUR = 60 * 60 * 1000;

export default function CountdownTimer({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire?: () => void;
}) {
  const [remaining, setRemaining] = useState(
    () => new Date(expiresAt).getTime() - Date.now(),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const next = new Date(expiresAt).getTime() - Date.now();
      setRemaining(next);
      if (next <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const expired = remaining <= 0;
  const urgent = !expired && remaining < ONE_HOUR;

  const tone = expired
    ? { bg: "var(--danger-soft)", fg: "var(--danger)" }
    : urgent
      ? { bg: "var(--warning-soft)", fg: "var(--warning)" }
      : { bg: "var(--success-soft)", fg: "var(--success)" };

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${expired ? "" : "pulse-dot"}`}
        style={{ backgroundColor: tone.fg }}
        aria-hidden="true"
      />
      {expired ? "Expired" : formatCountdown(remaining)}
      <span className="sr-only">
        {expired ? "This poll has closed" : "remaining until this poll closes"}
      </span>
    </span>
  );
}
