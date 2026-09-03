"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { isValidStudentEmail } from "@/lib/constants";
import ExcludedModal from "@/components/ExcludedModal";
import Turnstile, { type TurnstileHandle } from "@/components/Turnstile";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function AuthPage() {
  const router = useRouter();
  const { session, profile, loading, isExcluded, isConfigured, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  // A still-valid session (e.g. same tab, just reloaded) never auto-redirects —
  // the user always lands here and must click through to the dashboard.
  const signedIn = !loading && Boolean(session && profile) && !isExcluded;

  function handleEmailChange(value: string) {
    setEmail(value);
    if (value.length === 0) {
      setEmailError(null);
      return;
    }
    setEmailError(isValidStudentEmail(value) ? null : "Must match 2024mc[1-40]@student.uet.edu.pk");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setInfo(null);

    if (!isValidStudentEmail(email)) {
      setEmailError("Must match 2024mc[1-40]@student.uet.edu.pk");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (turnstileSiteKey && !captchaToken) {
      setFormError("Please complete the verification challenge.");
      return;
    }

    setSubmitting(true);
    // An explicit sign-in/sign-up here goes straight to the dashboard; only a
    // pre-existing session on page load has to click "Continue".
    if (mode === "login") {
      const { error } = await signIn(email, password, captchaToken ?? undefined);
      if (error) setFormError(error);
      else router.replace("/dashboard/active");
    } else {
      const { error, needsConfirmation } = await signUp(email, password, captchaToken ?? undefined);
      if (error) {
        setFormError(error);
      } else if (needsConfirmation) {
        setInfo("Account created. Please check your email to confirm before logging in.");
        setMode("login");
      } else {
        router.replace("/dashboard/active");
      }
    }
    turnstileRef.current?.reset();
    setSubmitting(false);
  }

  if (isExcluded) {
    return <ExcludedModal />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4">
            <Image
              src="/logo.png"
              alt="PeerVote Logo"
              width={170}
              height={170}
              priority
              className="rounded-2xl"
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#f5f5f5]">PeerVote</h1>
          <p className="mt-1 text-sm text-[#a1a1aa]">Anonymous peer-voting for Mecha 24A</p>
          <p className="mt-1 text-sm text-[#a1a1aa]">Launched by Stalkers!</p>
        </div>

        {!isConfigured && (
          <div className="mb-4 rounded-lg border border-[#4a3a1a] bg-[#241d10] p-3 text-xs text-[#f5c26b]">
            Supabase environment variables are not configured. Set{" "}
            <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable authentication.
          </div>
        )}

        {loading ? (
          <div className="card-surface rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col items-center gap-3 py-6 text-[#a1a1aa]">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4f46e5] border-t-transparent" />
              <p className="text-sm">Checking your session...</p>
            </div>
          </div>
        ) : signedIn ? (
          <div className="card-surface rounded-2xl p-6 shadow-xl">
            <p className="text-sm text-[#f5f5f5]">
              Signed in as{" "}
              <span className="font-medium">{session?.user.email}</span>
            </p>
            <p className="mt-1 text-xs text-[#a1a1aa]">
              Your session is still valid. Continue, or log out to switch accounts.
            </p>
            <button
              onClick={() => router.push("/dashboard/active")}
              className="mt-4 w-full rounded-lg bg-[#4f46e5] py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338ca]"
            >
              Continue to dashboard
            </button>
            <button
              onClick={() => signOut()}
              className="mt-2 w-full rounded-lg border border-[#2e2e2e] bg-transparent py-2.5 text-sm font-medium text-[#a1a1aa] transition hover:text-[#f5f5f5]"
            >
              Log out
            </button>
          </div>
        ) : (
        <div className="card-surface rounded-2xl p-6 shadow-xl">
          <div className="mb-6 flex rounded-lg border border-[#2e2e2e] bg-[#161616] p-1">
            <button
              onClick={() => {
                setMode("login");
                setFormError(null);
                setInfo(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === "login" ? "bg-[#4f46e5] text-white" : "text-[#a1a1aa]"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setFormError(null);
                setInfo(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === "signup" ? "bg-[#4f46e5] text-white" : "text-[#a1a1aa]"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Class Email</label>
              <input
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="2024mcX@student.uet.edu.pk"
                className={`w-full rounded-lg border bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#52525b] outline-none focus:border-[#4f46e5] ${
                  emailError ? "border-[#ef4444]" : "border-[#2e2e2e]"
                }`}
              />
              {emailError && <p className="mt-1.5 text-xs text-[#f87171]">{emailError}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Password</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#52525b] outline-none focus:border-[#4f46e5]"
              />
            </div>

            {turnstileSiteKey && (
              <Turnstile ref={turnstileRef} siteKey={turnstileSiteKey} onToken={setCaptchaToken} />
            )}

            {formError && (
              <div className="rounded-lg border border-[#3f1d1d] bg-[#241414] px-3 py-2 text-xs text-[#f87171]">
                {formError}
              </div>
            )}
            {info && (
              <div className="rounded-lg border border-[#1a2e2a] bg-[#10231d] px-3 py-2 text-xs text-[#34d399]">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={
                submitting || !isConfigured || Boolean(emailError) || Boolean(turnstileSiteKey && !captchaToken)
              }
              className="w-full rounded-lg bg-[#4f46e5] py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>
        )}

        <p className="mt-5 text-center text-xs text-[#52525b]">
          Only registered roll numbers 2024mc1 through 2024mc40 may access this application.
        </p>
      </div>
    </main>
  );
}
