"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

declare global {
  // eslint-disable-next-line no-var
  var __peerVoteSupabaseClient: SupabaseClient | undefined;
}

/**
 * Lazily-created singleton browser Supabase client.
 * Returns `null` when the environment has not been configured yet so the UI
 * can render a friendly "not configured" state instead of crashing.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;

  if (!globalThis.__peerVoteSupabaseClient) {
    globalThis.__peerVoteSupabaseClient = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return globalThis.__peerVoteSupabaseClient;
}
