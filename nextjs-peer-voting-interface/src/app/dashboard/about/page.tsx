"use client";

import {
  EyeOff,
  Clock,
  Archive,
  ShieldCheck,
  Trophy,
  Flame,
  UserCheck,
  Ban,
  AlertTriangle,
} from "lucide-react";
import { VOTER_TITLES, CREATOR_TITLES, STATUS_TITLES } from "@/lib/titles";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-surface rounded-2xl p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
        <Icon aria-hidden="true" className="h-4 w-4 text-[var(--accent)]" />
        {title}
      </h2>
      <div className="space-y-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">
        {children}
      </div>
    </section>
  );
}

function Stage({
  n,
  name,
  detail,
}: {
  n: number;
  name: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-medium text-[var(--accent-text)]">
        {n}
      </span>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{name}</p>
        <p className="text-sm text-[var(--text-secondary)]">{detail}</p>
      </div>
    </li>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-medium text-[var(--text-primary)]">
          About PeerVote
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          An anonymous peer-voting board for Mecha 24A.
        </p>
      </div>

      <div className="fade-in space-y-4">
        <Section icon={EyeOff} title="What this is">
          <p>
            PeerVote lets the cohort ask each other light-hearted questions —
            who's most likely to do X, who has the best taste in Y — and answer
            them without anyone knowing who voted for whom.
          </p>
          <p>
            Anyone on the class whitelist can vote. Creating polls needs
            permission from an admin. Everything runs on a fixed timer, so no
            one decides when results appear.
          </p>
        </Section>

        <Section icon={ShieldCheck} title="How your vote stays secret">
          <p>
            When you vote, your choice is added to a running tally and then{" "}
            <span className="text-[var(--text-primary)]">
              immediately erased
            </span>
            . The database keeps a record that you voted, so you can't vote
            twice, but it does not keep what you chose.
          </p>
          <p>
            This isn't a policy — it's how the system is built. Even a full
            database administrator cannot look up who you voted for, because
            that information no longer exists anywhere.
          </p>
          <p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-3 text-xs">
            What is stored: that roll number #X voted in poll #Y. What is never
            stored: who #X voted for.
          </p>
        </Section>

        <Section icon={Clock} title="The life of a poll">
          <ol className="space-y-3">
            <Stage
              n={1}
              name="Active"
              detail="Votes are accepted and results stay completely hidden, so nobody can be swayed by a running total."
            />
            <Stage
              n={2}
              name="Closed — 24 hours"
              detail="The timer runs out and the full tally is revealed to everyone who voted. You can see every candidate's count, not just the top three."
            />
            <Stage
              n={3}
              name="Archived"
              detail="After 24 hours the detailed numbers disappear for good. Only the top three are kept permanently in the Answers Archive."
            />
          </ol>
        </Section>

        <Section icon={UserCheck} title="The rules">
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="text-[var(--accent)]">·</span>
              One vote per person per poll. Deleting and remaking your account
              won't reset this.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--accent)]">·</span>
              You can't change a vote once it's cast.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--accent)]">·</span>
              One active poll per person at a time.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--accent)]">·</span>
              Only roll numbers on the class whitelist can sign in.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--accent)]">·</span>
              You can abstain. Choosing{" "}
              <span className="inline-flex items-center gap-1 text-[var(--text-primary)]">
                <Ban aria-hidden="true" className="h-3 w-3" />
                None
              </span>{" "}
              counts as taking part without naming anyone.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--accent)]">·</span>
              Results are only visible to people who voted in that poll.
            </li>
          </ul>
        </Section>

        <Section icon={Trophy} title="Titles and the leaderboard">
          <p>
            The leaderboard tracks participation only — how often you vote and
            how many polls you start. It never reveals anyone's choices.
            Rankings recalculate every six hours.
          </p>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Voter titles
              </h3>
              <ul className="space-y-1.5">
                {VOTER_TITLES.map((t) => (
                  <li key={t.name} className="text-xs">
                    <span className={`font-medium ${t.color}`}>{t.name}</span>
                    <span className="text-[var(--text-muted)]"> — {t.condition}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Creator titles
              </h3>
              <ul className="space-y-1.5">
                {CREATOR_TITLES.map((t) => (
                  <li key={t.name} className="text-xs">
                    <span className={`font-medium ${t.color}`}>{t.name}</span>
                    <span className="text-[var(--text-muted)]"> — {t.condition}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-[var(--text-faint)]">
                A poll only counts toward a creator title once it reaches 20
                votes.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-3">
            <Flame
              aria-hidden="true"
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warning)]"
            />
            <p className="text-xs text-[var(--text-secondary)]">
              A streak counts how many rounds in a row you've created a poll.
            </p>
          </div>
        </Section>

        <Section icon={Archive} title="Who can do what">
          <ul className="space-y-2">
            {STATUS_TITLES.map((t) => (
              <li key={t.name} className="text-sm">
                <span className={`font-medium ${t.color}`}>{t.name}</span>
                <span className="text-[var(--text-secondary)]"> — {t.condition}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Admins can close polls early, edit expiry times, delete polls and
            manage the whitelist. They cannot change vote counts — every tally
            change is recorded in a tamper-evident log.
          </p>
        </Section>

        <Section icon={AlertTriangle} title="Play nicely">
          <p>
            Polls are meant to be funny, not cruel. Anything targeting someone
            hurtfully can be removed by an admin, and roll numbers can be
            excluded from being voted for on request.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            If a poll makes you uncomfortable, tell an admin — being anonymous
            is not a licence to be unkind.
          </p>
        </Section>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--text-faint)]">
        Built for the class of 2024mc · Launched by Stalkers
      </p>
    </div>
  );
}
