"use client";

interface PodiumEntry {
  roll: string;
  votes: number;
}

const STEPS = [
  { place: 2 as const, height: "5rem", metal: "var(--silver)", label: "2nd" },
  { place: 1 as const, height: "7rem", metal: "var(--gold)", label: "1st" },
  { place: 3 as const, height: "3.5rem", metal: "var(--bronze)", label: "3rd" },
];

export default function Podium({ top3 }: { top3: PodiumEntry[] }) {
  const byPlace = { 1: top3[0], 2: top3[1], 3: top3[2] };

  if (!byPlace[1]) {
    return (
      <p className="py-6 text-center text-sm text-[var(--text-muted)]">
        No votes were cast for this poll.
      </p>
    );
  }

  return (
    <div className="flex items-end justify-center gap-3 pt-4">
      {STEPS.map(({ place, height, metal, label }, i) => {
        const entry = byPlace[place];
        if (!entry) {
          return (
            <div key={place} className="flex w-24 flex-col items-center">
              <div className="flex h-8 w-full items-center justify-center text-xs text-[var(--text-faint)]">
                —
              </div>
            </div>
          );
        }

        const isWinner = place === 1;
        const display =
          entry.roll === "NONE" ? "Abstain" : entry.roll.replace("2024mc", "#");

        return (
          <div key={place} className="flex w-24 flex-col items-center">
            <span
              className={`mb-1.5 text-sm font-medium ${
                isWinner ? "text-[var(--accent-text)]" : "text-[var(--text-primary)]"
              }`}
            >
              {display}
            </span>

            <div
              className="podium-rise flex w-full items-start justify-center rounded-t-lg"
              style={{
                height,
                borderTop: `3px solid ${metal}`,
                backgroundColor: isWinner
                  ? "var(--accent-soft)"
                  : "var(--bg-elevated-2)",
                animationDelay: `${i * 90}ms`,
              }}
            >
              <span
                className={`pt-2 text-xs font-medium tabular-nums ${
                  isWinner ? "text-[var(--accent-text)]" : "text-[var(--text-secondary)]"
                }`}
              >
                {entry.votes}
              </span>
            </div>

            <div className="w-full rounded-b-lg bg-[var(--bg-inset)] py-1 text-center text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
