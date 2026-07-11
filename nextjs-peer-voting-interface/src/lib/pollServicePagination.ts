import { SupabaseClient } from "@supabase/supabase-js";
import type { PollAnswerArchive, Poll } from "@/lib/types";

export async function fetchArchiveWithPagination(
  supabase: SupabaseClient,
  limit: number = 10,
  offset: number = 0,
  searchQuery?: string,
  startDate?: string,
  endDate?: string
): Promise<{
  data: (PollAnswerArchive & { poll?: Poll })[];
  hasMore: boolean;
  total: number;
}> {
  let query = supabase
    .from("poll_answers_archive")
    .select("*, poll:polls(*)", { count: "exact" });

  // Apply date range filter if provided
  if (startDate) {
    query = query.gte("poll:polls(created_at)", startDate);
  }
  if (endDate) {
    query = query.lte("poll:polls(created_at)", endDate);
  }

  // Apply search filter on question text if provided
  if (searchQuery) {
    query = query.or(
      `poll->question.ilike.%${searchQuery}%,top_1_roll.ilike.%${searchQuery}%,top_2_roll.ilike.%${searchQuery}%,top_3_roll.ilike.%${searchQuery}%`
    );
  }

  const { data, error, count } = await query
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    data: (data ?? []) as (PollAnswerArchive & { poll?: Poll })[],
    hasMore: offset + limit < (count ?? 0),
    total: count ?? 0,
  };
}

export async function searchArchive(
  supabase: SupabaseClient,
  keyword: string
): Promise<(PollAnswerArchive & { poll?: Poll })[]> {
  const { data, error } = await supabase
    .from("poll_answers_archive")
    .select("*, poll:polls(*)")
    .or(
      `poll->question.ilike.%${keyword}%,top_1_roll.ilike.%${keyword}%,top_2_roll.ilike.%${keyword}%,top_3_roll.ilike.%${keyword}%`
    )
    .order("id", { ascending: false });

  if (error) throw error;
  return (data ?? []) as (PollAnswerArchive & { poll?: Poll })[];
}
