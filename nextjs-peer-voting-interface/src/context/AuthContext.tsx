"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import {
  browserAuthStorage,
  getSupabaseClient,
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/client";
import {
  extractRollNumber,
  isValidStudentEmail,
  AWAY_AT_STORAGE_KEY,
  AWAY_TIMEOUT_MS,
} from "@/lib/constants";
import type { Profile } from "@/lib/types";

/** Bank the moment the tab became hidden, so the absence can be measured on return. */
function markAway() {
  browserAuthStorage.setItem(AWAY_AT_STORAGE_KEY, String(Date.now()));
}

function clearAwayMark() {
  browserAuthStorage.removeItem(AWAY_AT_STORAGE_KEY);
}

/**
 * True when the tab has been hidden (user away) for longer than AWAY_TIMEOUT_MS.
 * No mark means the user is present or was only briefly away — not expired. Lives
 * in the same tab-scoped storage as the Supabase session, so both die together.
 */
function isAwayExpired(): boolean {
  const raw = browserAuthStorage.getItem(AWAY_AT_STORAGE_KEY);
  if (!raw) return false;
  const awayAt = Number(raw);
  if (!Number.isFinite(awayAt)) return false;
  return Date.now() - awayAt > AWAY_TIMEOUT_MS;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isExcluded: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    captchaToken?: string
  ) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  changePassword: (
    email: string,
    currentPassword: string,
    newPassword: string,
    captchaToken?: string
  ) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [isExcluded, setIsExcluded] = useState(false);

  const loadProfileAndWhitelist = useCallback(async (userId: string, email: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let { data: profileRow } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

    if (!profileRow) {
      const rollNumber = extractRollNumber(email) ?? "";
      const { data: created } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            email,
            roll_number: rollNumber,
            is_admin: false,
            can_create_polls: false,
          },
          { onConflict: "id" }
        )
        .select("*")
        .maybeSingle();
      profileRow = created ?? null;
    }

    setProfile(profileRow as Profile | null);

    if (profileRow?.roll_number) {
      const { data: whitelistRow } = await supabase
        .from("whitelist")
        .select("is_excluded")
        .eq("roll_number", profileRow.roll_number)
        .maybeSingle();
      setIsExcluded(Boolean(whitelistRow?.is_excluded));
    } else {
      setIsExcluded(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    await loadProfileAndWhitelist(session.user.id, session.user.email ?? "");
  }, [session, loadProfileAndWhitelist]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let isMounted = true;
    let hasSession = false;

    // A visible tab never expires. When it goes hidden we bank the time; when it
    // comes back, a too-long absence drops the session. Only acts with a session,
    // so the logged-out login page never fires a redundant signOut.
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (hasSession) markAway();
        return;
      }
      if (hasSession && isAwayExpired()) {
        clearAwayMark();
        void supabase.auth.signOut();
      } else {
        clearAwayMark();
      }
    };

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;
      // A session left idle past the away window is signed out before we trust it.
      if (data.session && isAwayExpired()) {
        clearAwayMark();
        await supabase.auth.signOut();
        setSession(null);
        setLoading(false);
        return;
      }
      clearAwayMark();
      hasSession = Boolean(data.session);
      setSession(data.session);
      if (data.session?.user) {
        await loadProfileAndWhitelist(data.session.user.id, data.session.user.email ?? "");
      }
      setLoading(false);
    });

    document.addEventListener("visibilitychange", onVisibilityChange);

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      hasSession = Boolean(newSession);
      setSession(newSession);
      if (newSession?.user) {
        setLoading(true);
        await loadProfileAndWhitelist(newSession.user.id, newSession.user.email ?? "");
        setLoading(false);
      } else {
        setProfile(null);
        setIsExcluded(false);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadProfileAndWhitelist]);

  const signIn = useCallback(async (email: string, password: string, captchaToken?: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: "Supabase is not configured." };
    if (!isValidStudentEmail(email)) {
      return { error: "Email must match 2024mc[1-40]@student.uet.edu.pk exactly." };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    if (!error) clearAwayMark();
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, captchaToken?: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: "Supabase is not configured." };
    if (!isValidStudentEmail(email)) {
      return { error: "Email must match 2024mc[1-40]@student.uet.edu.pk exactly." };
    }
    const rollNumber = extractRollNumber(email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    if (error) return { error: error.message };

    if (data.user) {
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email,
          roll_number: rollNumber,
          is_admin: false,
          can_create_polls: false,
        },
        { onConflict: "id" }
      );
    }

    // signUp returns a session immediately only when email confirmation is off.
    if (data.session) clearAwayMark();

    const needsConfirmation = !data.session;
    return { error: null, needsConfirmation };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    clearAwayMark();
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setIsExcluded(false);
  }, []);

  const changePassword = useCallback(
    async (email: string, currentPassword: string, newPassword: string, captchaToken?: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "Supabase is not configured." };
      if (!session?.user) return { error: "You need to be logged in to change your password." };

      const normalizedEmail = email.trim().toLowerCase();
      const sessionEmail = (session.user.email ?? "").trim().toLowerCase();

      if (!normalizedEmail || !currentPassword || !newPassword) {
        return { error: "Email, current password, and new password are required." };
      }

      if (normalizedEmail !== sessionEmail) {
        return { error: "Email must match your currently signed-in account." };
      }

      if (currentPassword === newPassword) {
        return { error: "New password must be different from your current password." };
      }

      if (!supabaseUrl || !supabaseAnonKey) {
        return { error: "Supabase is not configured." };
      }

      const verifier = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { error: reauthError } = await verifier.auth.signInWithPassword({
        email: normalizedEmail,
        password: currentPassword,
        options: captchaToken ? { captchaToken } : undefined,
      });

      if (reauthError) {
        return { error: "Current password is incorrect." };
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        return { error: updateError.message };
      }

      clearAwayMark();
      await supabase.auth.signOut({ scope: "global" });
      return { error: null };
    },
    [session]
  );

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      loading,
      isExcluded,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      changePassword,
      refreshProfile,
    }),
    [session, profile, loading, isExcluded, signIn, signUp, signOut, changePassword, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
