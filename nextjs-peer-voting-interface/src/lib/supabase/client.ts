"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

declare global {
  var __peerVoteSupabaseClient: SupabaseClient | undefined;
}

const memoryStore = new Map<string, string>();

/**
 * Tab-scoped storage for auth tokens: the session lives only as long as the
 * browser tab/window is open. Closing it — or opening the site in a fresh
 * window or a new tab — leaves no session, so the user has to log in again.
 * Falls back to an in-memory map during SSR where `window` is absent.
 *
 * This is also where the "last real sign-in" timestamp lives (see AuthContext),
 * so both die together.
 */
export const browserAuthStorage = {
  getItem(key: string): string | null {
    try {
      return typeof window !== "undefined"
        ? window.sessionStorage.getItem(key)
        : memoryStore.get(key) ?? null;
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== "undefined") window.sessionStorage.setItem(key, value);
      else memoryStore.set(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== "undefined") window.sessionStorage.removeItem(key);
      else memoryStore.delete(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

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
        storage: browserAuthStorage,
      },
    });
  }

  return globalThis.__peerVoteSupabaseClient;
}
