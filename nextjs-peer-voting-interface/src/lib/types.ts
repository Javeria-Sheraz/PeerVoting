// Types that mirror the Supabase database schema exactly.

export interface Profile {
  id: string;
  email: string;
  roll_number: string;
  is_admin: boolean;
  can_create_polls: boolean;
}

export interface Poll {
  id: string;
  creator_id: string;
  question: string;
  created_at: string;
  expires_at: string;
  is_archived: boolean;
}

export interface VoteTracker {
  id?: string;
  poll_id: string;
  user_id: string;
  voted_for_roll_temp?: string; // Add this line so your frontend components don't throw type errors!
  voted_at?: string;
}

export interface PollResult {
  id: string;
  poll_id: string;
  voted_for_roll: string;
  vote_count: number;
}

export interface WhitelistEntry {
  id: string;
  roll_number: string;
  is_excluded: boolean;
}

export interface PollAnswerArchive {
  id: string;
  poll_id: string;
  top_1_roll: string | null;
  top_2_roll: string | null;
  top_3_roll: string | null;
  total_votes_cast: number;
}

// UI-only helper shape combining a poll with everything a card needs to render.
export interface PollWithMeta extends Poll {
  creatorRoll?: string;
  hasVoted?: boolean;
}

export interface StudentRanking {
  roll_number: string;
  polls_created_count: number;
  votes_cast_count: number;
  voter_title: string | null;
  creator_title: string | null;
  status_title: string;
  creating_streak: number;
}

export interface WhitelistEntry {
  id: string;
  roll_number: string;
  is_excluded: boolean;
  can_be_voted_for: boolean;
}
