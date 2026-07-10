"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/constants";

export default function CountdownTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire?: () => void }) {
  const [remaining, setRemaining] = useState(() => new Date(expiresAt).getTime() - Date.now());

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

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        expired ? "bg-[#3f1d1d] text-[#f87171]" : "bg-[#1a2e2a] text-[#10b981]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${expired ? "bg-[#f87171]" : "bg-[#10b981]"}`} />
      {expired ? "Expired" : formatCountdown(remaining)}
    </span>
  );
}
