import type { SupabaseClient } from "@supabase/supabase-js";
import type { Poll, PollResult, PollAnswerArchive, Profile, WhitelistEntry } from "@/lib/types";
import type { StudentRanking } from "@/lib/types";


export type PollWithCreator = {
  id: string;
  creator_id: string;
  question: string;
  created_at: string;
  expires_at: string;
  is_archived: boolean;
  creator_roll: string;
  is_active: boolean;
  has_voted: boolean;
};

export async function fetchProfilesByIds(supabase: SupabaseClient, ids: string[]): Promise<Map<string, Profile>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase.from("profiles").select("*").in("id", ids);
  const map = new Map<string, Profile>();
  (data ?? []).forEach((p: Profile) => map.set(p.id, p));
  return map;
}

export async function fetchActivePolls(supabase: SupabaseClient): Promise<Poll[]> {
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("is_archived", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Poll[];
}

export async function fetchClosedPolls(supabase: SupabaseClient): Promise<Poll[]> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .or(`is_archived.eq.true,expires_at.lte.${now.toISOString()}`)
    .gt("expires_at", oneDayAgo.toISOString())
    .order("expires_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Poll[];
}

export async function fetchUserVotedPollIds(supabase: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data } = await supabase.from("vote_trackers").select("poll_id").eq("user_id", userId);
  return new Set((data ?? []).map((row: { poll_id: string }) => row.poll_id));
}

export async function submitSecretVote(
  supabase: SupabaseClient,
  pollId: string,
  userId: string,
  votedForRoll: string
): Promise<{ error: string | null }> {
  const { error: trackerError } = await supabase
    .from("vote_trackers")
    .insert({ 
      poll_id: pollId, 
      user_id: userId,
      voted_for_roll_temp: votedForRoll
    });

  if (trackerError) {
    if (trackerError.code === "23505") {
      return { error: "You have already voted on this poll." };
    }
    return { error: trackerError.message };
  }

  return { error: null };
}

export async function fetchPollResults(supabase: SupabaseClient, pollId: string): Promise<PollResult[]> {
  const { data, error } = await supabase
    .from("poll_results")
    .select("*")
    .eq("poll_id", pollId)
    .order("vote_count", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PollResult[];
}

export async function fetchArchive(supabase: SupabaseClient, page: number = 0) {
  const pageSize = 10;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("poll_answers_archive")
    .select("*") 
    .order("id", { ascending: false })
    .range(from, to); 

  if (error) throw error;
  return data ?? [];
}

export async function createPoll(
  supabase: SupabaseClient,
  creatorId: string,
  question: string,
  expiresAt: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("polls").insert({
    creator_id: creatorId,
    question,
    expires_at: expiresAt,
    is_archived: false,
  });
  return { error: error?.message ?? null };
}

export async function deletePollCascade(supabase: SupabaseClient, pollId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("polls").delete().eq("id", pollId);
  return { error: error?.message ?? null };
}

export async function updatePollExpiration(
  supabase: SupabaseClient,
  pollId: string,
  expiresAt: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("polls").update({ expires_at: expiresAt }).eq("id", pollId);
  return { error: error?.message ?? null };
}

export async function fetchWhitelist(supabase: SupabaseClient): Promise<WhitelistEntry[]> {
  const { data, error } = await supabase.from("whitelist").select("*").order("roll_number", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WhitelistEntry[];
}

export async function setWhitelistExclusion(
  supabase: SupabaseClient,
  id: string,
  isExcluded: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("whitelist").update({ is_excluded: isExcluded }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function addWhitelistEntry(
  supabase: SupabaseClient,
  rollNumber: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("whitelist").insert({ roll_number: rollNumber, is_excluded: false });
  return { error: error?.message ?? null };
}

export async function fetchAllProfiles(supabase: SupabaseClient): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("roll_number", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function setCanCreatePolls(
  supabase: SupabaseClient,
  id: string,
  canCreate: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("profiles").update({ can_create_polls: canCreate }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function setIsAdmin(
  supabase: SupabaseClient,
  id: string,
  isAdmin: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function closePollAdmin(
  supabase: SupabaseClient,
  pollId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("polls")
    .update({ 
      is_archived: true,
      expires_at: new Date().toISOString()
    })
    .eq("id", pollId);
    
  return { error: error?.message ?? null };
}

export async function checkUserHasActivePoll(
  supabase: SupabaseClient, 
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_active_poll", {
    user_uuid: userId,
  });
  
  if (error) {
    console.error("Error checking active poll status:", error);
    return true; // Fail safe: assume they have one to prevent database errors
  }
  
  return Boolean(data);
}

export async function fetchTotalVoteCount(supabase: SupabaseClient, pollId: string) {
  // Call the secure RPC function to get the total regardless of RLS blocks
  const { data, error } = await supabase.rpc("get_poll_total_votes", { 
    p_poll_id: pollId 
  });
    
  if (error) {
    console.error("Error fetching total votes:", error);
    return 0;
  }
  
  return data || 0;
}

export async function fetchPollsWithCreator(
  supabase: SupabaseClient
): Promise<PollWithCreator[]> {
  const { data, error } = await supabase.rpc("get_polls_with_creator");
  if (error) throw error;
  return (data ?? []) as PollWithCreator[];
}

export async function fetchIsExcluded(
  supabase: SupabaseClient
): Promise<boolean> {
  const { data, error } = await supabase.rpc("get_is_excluded");
  if (error) return true; 
  return Boolean(data);
}

export async function fetchMyVotedPollIds(
  supabase: SupabaseClient
): Promise<Set<string>> {
  const { data, error } = await supabase.rpc("get_my_voted_poll_ids");
  if (error) {
    console.error("fetchMyVotedPollIds error:", error);
    return new Set();
  }
  return new Set(
    (data ?? []).map((row: unknown) => {
      if (row !== null && typeof row === "object" && "poll_id" in row) {
        return String((row as { poll_id: number }).poll_id);
      }
      return String(row);
    })
  );
}

type LeaderboardRow = StudentRanking & { last_run_at: string };
export async function fetchLeaderboardData(
  supabase: SupabaseClient
): Promise<{ rankings: StudentRanking[]; lastRunAt: string }> {
  const { data, error } = await supabase.rpc("get_leaderboard_data");
  if (error) throw error;
  const rows = (data ?? []) as LeaderboardRow[];
  const lastRunAt = rows[0]?.last_run_at ?? new Date().toISOString();
  const rankings: StudentRanking[] = rows.map((row) => ({
    roll_number: row.roll_number,
    polls_created_count: row.polls_created_count,
    votes_cast_count: row.votes_cast_count,
    voter_title: row.voter_title,
    creator_title: row.creator_title,
    status_title: row.status_title,
  }));
  return { rankings, lastRunAt };
}

export async function fetchProtectedRolls(supabase: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await supabase.rpc("get_protected_rolls");
  if (error) {
    console.error("fetchProtectedRolls error:", error);
    return new Set();
  }
  return new Set(
    (data ?? []).map((row: unknown) =>
      typeof row === "string" ? row : String((row as { get_protected_rolls: string }).get_protected_rolls)
    )
  );
}

export async function setCanBeVotedFor(
  supabase: SupabaseClient,
  id: string,
  canBeVoted: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("whitelist").update({ can_be_voted_for: canBeVoted }).eq("id", id);
  return { error: error?.message ?? null };
}
