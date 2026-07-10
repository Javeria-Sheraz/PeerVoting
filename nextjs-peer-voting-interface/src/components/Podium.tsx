"use client";

interface PodiumEntry {
  roll: string;
  votes: number;
}

export default function Podium({ top3 }: { top3: PodiumEntry[] }) {
  const [first, second, third] = [top3[0], top3[1], top3[2]];

  const steps: { entry?: PodiumEntry; place: 1 | 2 | 3; height: string; medal: string; color: string }[] = [
    { entry: second, place: 2, height: "h-20", medal: "🥈", color: "#c0c0c0" },
    { entry: first, place: 1, height: "h-28", medal: "🥇", color: "#fbbf24" },
    { entry: third, place: 3, height: "h-14", medal: "🥉", color: "#cd7f32" },
  ];

  if (!first) {
    return <p className="py-6 text-center text-sm text-[#71717a]">No votes were cast for this poll.</p>;
  }

  return (
    <div className="flex items-end justify-center gap-3 pt-4">
      {steps.map(({ entry, place, height, medal, color }) => (
        <div key={place} className="flex w-24 flex-col items-center">
          {entry ? (
            <>
              <span className="mb-1 text-2xl">{medal}</span>
              <span className="mb-2 text-sm font-semibold text-[#f5f5f5]">{entry.roll.replace("2024mc", "#")}</span>
              <div
                style={{ borderTopColor: color }}
                className={`podium-rise flex ${height} w-full origin-bottom items-start justify-center rounded-t-lg border-t-4 bg-gradient-to-b from-[#262626] to-[#1a1a1a] pt-2`}
              >
                <span className="text-xs font-bold text-[#d4d4d8]">{entry.votes} votes</span>
              </div>
              <div className="w-full rounded-b-lg bg-[#141414] py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[#71717a]">
                {place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"}
              </div>
            </>
          ) : (
            <div className="flex h-8 w-full items-center justify-center text-xs text-[#52525b]">—</div>
          )}
        </div>
      ))}
    </div>
  );
}
