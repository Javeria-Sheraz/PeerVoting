/**
 * Title definitions — single source of truth for the leaderboard legend
 * and the About page.
 *
 * These MUST stay in sync with public.refresh_student_rankings() in the
 * database. The conditions below are transcribed from that function as
 * it currently exists. If you change the SQL tiers, change them here too.
 */

export interface TitleDef {
  /** exact string stored in student_rankings */
  name: string;
  /** plain-English earning condition, shown to students */
  condition: string;
  /** tailwind text colour class */
  color: string;
  /** ordering, best first */
  rank: number;
}

/**
 * Voter titles are based on how many CLOSED polls you voted in,
 * as a percentage of all closed polls.
 */
export const VOTER_TITLES: TitleDef[] = [
  {
    name: "the supernova",
    condition: "Voted in 95% or more of all closed polls",
    color: "text-[#FBBF24]",
    rank: 1,
  },
  {
    name: "the constellation",
    condition: "Voted in 70–94% of all closed polls",
    color: "text-[#A78BFA]",
    rank: 2,
  },
  {
    name: "the star gazer",
    condition: "Voted in 50–69% of all closed polls",
    color: "text-[#6EE7B7]",
    rank: 3,
  },
  {
    name: "the lurker",
    condition: "Never voted in any poll",
    color: "text-[#7B5E8C]",
    rank: 5,
  },
];

/**
 * Creator titles count "qualifying" polls — polls you created that
 * went on to collect 20 or more votes in total.
 */
export const CREATOR_TITLES: TitleDef[] = [
  {
    name: "the blackhole",
    condition: "Created 10+ polls that each reached 20 votes",
    color: "text-[#F43F5E]",
    rank: 1,
  },
  {
    name: "the star",
    condition: "Created 5–9 polls that each reached 20 votes",
    color: "text-[#FB923C]",
    rank: 2,
  },
  {
    name: "the planet",
    condition: "Created 2–4 polls that each reached 20 votes",
    color: "text-[#38BDF8]",
    rank: 3,
  },
  {
    name: "the observer",
    condition: "Never created a poll",
    color: "text-[#7B5E8C]",
    rank: 5,
  },
];

export const STATUS_TITLES: TitleDef[] = [
  {
    name: "admin",
    condition: "Can moderate polls, manage the whitelist and grant permissions",
    color: "text-[#F0ABFC]",
    rank: 1,
  },
  {
    name: "member",
    condition: "Standard access — vote, and create polls if granted permission",
    color: "text-[#A78FB5]",
    rank: 2,
  },
];

/**
 * Shown wherever a title is blank. Both voter and creator titles fall
 * through to NULL in the SQL when someone is active but hasn't reached
 * the lowest named tier yet.
 */
export const UNTITLED_EXPLAINER =
  "Active, but not yet at the lowest named tier";

const ALL = [...VOTER_TITLES, ...CREATOR_TITLES, ...STATUS_TITLES];

export function titleColor(title: string | null | undefined): string {
  if (!title) return "text-[#4A3A55]";
  return ALL.find((t) => t.name === title)?.color ?? "text-[#A78FB5]";
}

export function titleCondition(title: string | null | undefined): string {
  if (!title) return UNTITLED_EXPLAINER;
  return ALL.find((t) => t.name === title)?.condition ?? "";
}

/** Sort helper: ranked titles first, blanks last. */
export function titleRank(title: string | null | undefined): number {
  if (!title) return 99;
  return ALL.find((t) => t.name === title)?.rank ?? 50;
}
