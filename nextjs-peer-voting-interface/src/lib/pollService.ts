import type { SupabaseClient } from "@supabase/supabase-js";
import type { Poll, PollResult, PollAnswerArchive, Profile, WhitelistEntry } from "@/lib/types";

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
    // Brings back the check for EITHER manually archived polls OR naturally expired polls
    .or(`is_archived.eq.true,expires_at.lte.${now.toISOString()}`)
    // AND ensures they are not older than 24 hours
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
  // Record the vote securely. The database trigger will handle incrementing the count automatically.
  // We pass the selection 'votedForRoll' in the payload so the database can catch it.
  const { error: trackerError } = await supabase
    .from("vote_trackers")
    .insert({ 
      poll_id: pollId, 
      user_id: userId,
      voted_for_roll_temp: votedForRoll // Add a temporary column to send the choice safely
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

export async function fetchArchive(supabase: SupabaseClient): Promise<(PollAnswerArchive & { poll?: Poll })[]> {
  const { data, error } = await supabase
    .from("poll_answers_archive")
    .select("*, poll:polls(*)")
    .order("id", { ascending: false });
  if (error) throw error;
  return (data ?? []) as (PollAnswerArchive & { poll?: Poll })[];
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
  // The database foreign keys handle cleaning up trackers, results, and archives automatically!
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
      expires_at: new Date().toISOString() // Automatically sets the time to exactly NOW
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
