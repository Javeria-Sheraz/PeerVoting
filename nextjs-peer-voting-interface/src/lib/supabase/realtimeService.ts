import { SupabaseClient } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Poll } from "@/lib/types";

export function subscribeToPollsRealtimeUpdates(
  supabase: SupabaseClient,
  onPollsChange: (polls: Poll[]) => void,
  onError?: (error: Error) => void
): RealtimeChannel | null {
  if (!supabase) return null;

  const channel = supabase
    .channel("polls_changes")
    .on(
      "postgres_changes",
      {
        event: "*", // Listen to all events: INSERT, UPDATE, DELETE
        schema: "public",
        table: "polls",
        filter: `is_archived=eq.false`, // Only active polls
      },
      async (payload) => {
        // Re-fetch active polls when any change occurs
        try {
          const { data, error } = await supabase
            .from("polls")
            .select("*")
            .eq("is_archived", false)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false });

          if (error) throw error;
          onPollsChange((data ?? []) as Poll[]);
        } catch (err) {
          if (onError) onError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    )
    .subscribe((status) => {
      if (status === "CLOSED") {
        console.log("Realtime subscription closed");
      } else if (status === "CHANNEL_ERROR") {
        if (onError) onError(new Error("Realtime channel error"));
      }
    });

  return channel;
}

export function unsubscribePollsRealtimeUpdates(
  supabase: SupabaseClient,
  channel: RealtimeChannel
): Promise<void> {
  return supabase.removeChannel(channel);
}
