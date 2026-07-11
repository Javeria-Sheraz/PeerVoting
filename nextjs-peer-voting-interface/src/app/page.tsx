"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { isValidStudentEmail } from "@/lib/constants";
import ExcludedModal from "@/components/ExcludedModal";

export default function AuthPage() {
  const router = useRouter();
  const { session, profile, loading, isExcluded, isConfigured, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session && profile && !isExcluded) {
      router.replace("/dashboard/active");
    }
  }, [loading, session, profile, isExcluded, router]);

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

    setSubmitting(true);
    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) setFormError(error);
    } else {
      const { error, needsConfirmation } = await signUp(email, password);
      if (error) {
        setFormError(error);
      } else if (needsConfirmation) {
        setInfo("Account created. Please check your email to confirm before logging in.");
        setMode("login");
      }
    }
    setSubmitting(false);
  }

  if (isExcluded) {
    return <ExcludedModal />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
            <Image
              src="/logo.png"
              alt="Logo "
              width={80}
              height={80}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Class Email</label>
              <input
                type="email"
                required
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#52525b] outline-none focus:border-[#4f46e5]"
              />
            </div>

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
              disabled={submitting || !isConfigured || Boolean(emailError)}
              className="w-full rounded-lg bg-[#4f46e5] py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-[#52525b]">
          Only registered roll numbers 2024mc1 through 2024mc40 may access this application.
        </p>
      </div>
    </main>
  );
}
