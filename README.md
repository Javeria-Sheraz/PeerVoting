# 📊 Anonymous Cohort Polling Platform

## 1. Project Overview

This project is a real-time, anonymous polling application designed specifically for university cohorts. Built with a Next.js (App Router) frontend and a Supabase (PostgreSQL) backend, the platform eliminates the need for manual moderation or expensive server-side timers by relying on database-level automation, Row Level Security (RLS), and time-based queries.

> **New to this repo (including AI agents)?** Read section 7 for the full file tree and section 8 for a
> task → file lookup table telling you exactly where to make a given change.

## 2. Core Features & Automated Lifecycle

The platform operates on a strict, automated 3-stage lifecycle driven entirely by the database:

* **Active Phase:** Polls accept secret votes until a countdown timer reaches zero (or an admin forces it closed). Results remain completely hidden to prevent bandwagon voting.
* **Closed Phase (24 Hours):** Once expired, polls automatically migrate to the "Closed" tab where the full voting tallies are revealed to the cohort for exactly 24 hours.
* **Archive Phase:** After 24 hours, the full results are hidden. A database maintenance function saves only the 1st, 2nd, and 3rd place winners into a permanent "Hall of Fame" archive.

### Architectural Highlights

* **Anti-Spam System:** A strict 1-active-poll limit per user is enforced directly at the database level using a Security Definer function.
* **Database Automation:** A `pg_cron` job runs hourly inside Supabase to execute the archiving logic (`compile_expired_polls()`), meaning the Next.js frontend handles zero background tasks.
* **Trigger-Based Tallies:** Votes are tracked via a secure `vote_trackers` table, which triggers an automatic server-side increment (`process_anonymous_vote_increment()`) in the `poll_results` table without exposing voter identities.

## 3. Database Schema & Architecture

The database is built on a highly relational structure using `bigint` for primary identifiers and `varchar` for cohort roll numbers. Referential integrity is strictly maintained through exact foreign key constraints and cascading deletions to prevent orphaned data.

### Core Tables & Data Types

* **`polls`**: `id` (bigint, Identity PK), `creator_id` (FK), `expires_at` (timestamp), `is_archived` (boolean).
* **`poll_results`**: `poll_id` (bigint, FK), `voted_for_roll` (varchar), `vote_count` (integer).
* **`vote_trackers`**: `poll_id` (bigint, FK), `user_id` (FK), `voted_for_roll_temp` (varchar).
* **`poll_answers_archive`**: `poll_id` (bigint), `top_1_roll` (varchar), `top_2_roll` (varchar), `top_3_roll` (varchar), `total_votes_cast` (integer).
* **`profiles`**: `id` (uuid, FK), `roll_number` (varchar), `can_create_polls` (boolean).
* **`whitelist`**: `roll_number` (varchar), `isexcluded` (boolean).

### Foreign Keys & Deletion Behavior

* `vote_trackers.poll_id` references `polls.id` (**ON DELETE CASCADE**)
* `vote_trackers.user_id` references `profiles.id` (**ON DELETE CASCADE**)
* `poll_results.poll_id` references `polls.id` (**ON DELETE CASCADE**)
* `polls.creator_id` references `profiles.id` (**ON DELETE SET NULL** - Preserves historical polls even if the creator's profile is removed)
* `profiles.id` references `auth.users.id` (**ON DELETE CASCADE**)

## 4. Authentication Flow & Profile Generation

The application bypasses automatic database triggers for user profile creation. Instead, the creation of rows in `public.profiles` is explicitly managed within the application code (e.g., following a successful signup via a Next.js server action or API route).

When a user attempts to interact with the database, PostgreSQL Row Level Security (RLS) dynamically joins `public.profiles.roll_number` against `public.whitelist.roll_number` to verify that their specific varchar identifier exists and is not flagged as excluded.

## 5. Role Permissions & Access Control

| Action / Capability | Standard Users | Administrators |
| --- | --- | --- |
| **Login & Access** | Restricted to whitelisted roll numbers | Restricted to whitelisted roll numbers |
| **Voting** | One secret vote per active poll | One secret vote per active poll |
| **Vote Modification** | Cannot update/change cast votes | Cannot update/change cast votes |
| **Create Polls** | Yes (if individually granted permission) | Yes (Default) |
| **Active Poll Limits** | Maximum 1 active poll at a time | Maximum 1 active poll at a time |
| **View Vote Trackers** | Can only read their own vote history | Can only read their own vote history |
| **View Full Whitelist** | No (can only see their own status) | Yes |
| **Manage Whitelist** | No | Yes (Add/ban roll numbers) |
| **Manage User Rights** | No | Yes (Grant creation rights, promote Admins) |
| **Edit Poll Expiration** | No | Yes (Manually change time/date of any poll) |
| **Instant Close** | No | Yes (Forces poll into 24-hr Closed phase) |
| **Delete Polls** | No | Yes (Permanently wipes poll and associated data) |
| **Falsify Results** | No | No (Cannot alter actual database vote counts) |

## 6. Database Security & RPC Routing

To maintain strict security, Remote Procedure Call (RPC) functions are heavily locked down to prevent API abuse:

* **`has_active_poll(user_id)`**: Evaluates if a user has hit their 1-poll limit. Execution is revoked from the `PUBLIC` API and granted only to authenticated users for use within RLS policies.
* **`compile_expired_polls()`**: Calculates the top 3 podium winners and archives the poll. Execution is revoked from the `PUBLIC` API and granted only to the `service_role` (executed natively by pg_cron).
* **`process_anonymous_vote_increment()`**: Updates the vote tally. Execution is revoked from the `PUBLIC` API entirely, as it operates exclusively as an internal PostgreSQL trigger function.
* **Pending poll approval RPCs**: New polls are first inserted into `pending_polls` via `createPendingPoll`. Admins review them through `get_pending_polls_for_admin()`, then call `approve_pending_poll(p_pending_id)` (promotes the row into `polls`) or `reject_pending_poll(p_pending_id)`. A creator can check their own submission with `get_my_pending_poll()`.

## 7. Project Structure

```text
nextjs-peer-voting-interface/
├── SUPABASE_SETUP.md
├── drizzle.config.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── public/
│   ├── .gitkeep
│   └── logo.png
└── src/
    ├── app/
    │   ├── globals.css          # Theme tokens (light/dark), Tailwind base
    │   ├── layout.tsx           # Root layout, wraps app in AuthProvider
    │   ├── page.tsx             # Public landing / login+signup page
    │   ├── api/
    │   │   └── health/
    │   │       └── route.ts     # Health-check endpoint
    │   └── dashboard/
    │       ├── layout.tsx       # Auth guard + TopNav shell for all dashboard routes
    │       ├── page.tsx         # Redirects to /dashboard/active
    │       ├── active/page.tsx      # Active polls tab (vote, create, pending review)
    │       ├── admin/page.tsx       # Admin console (whitelist, permissions, security)
    │       ├── archive/page.tsx     # Hall of Fame (past podium winners)
    │       ├── closed/page.tsx      # Closed polls tab (results visible for 24h)
    │       ├── leaderboard/page.tsx # Cohort rankings / titles
    │       └── about/page.tsx       # Static "about this app" page
    ├── components/
    │   ├── ActivePollCard.tsx       # Single active poll: vote UI + countdown
    │   ├── AdminPermissionsTable.tsx # Admin: grant poll-creation / admin rights
    │   ├── AdminWhitelistTable.tsx   # Admin: manage whitelist (add/exclude roll numbers)
    │   ├── ClosedPollCard.tsx        # Single closed poll: revealed results
    │   ├── ConfirmModal.tsx          # Generic yes/no confirmation dialog
    │   ├── CountdownTimer.tsx        # Shared countdown display, used by poll cards
    │   ├── CreatePollModal.tsx       # Form to submit a new poll (goes to pending review)
    │   ├── EditExpirationModal.tsx   # Admin: change a poll's expiry date/time
    │   ├── ExcludedModal.tsx         # Blocking modal shown to excluded/whitelist-banned users
    │   ├── Modal.tsx                 # Base modal/dialog primitive used by other modals
    │   ├── PendingPollCard.tsx       # A user's own poll awaiting admin approval
    │   ├── PendingPollsReview.tsx    # Admin: approve/reject pending polls queue
    │   ├── Podium.tsx                # 1st/2nd/3rd place display (archive + results)
    │   ├── ResetPasswordModal.tsx    # Password reset flow
    │   ├── ResultsBreakdown.tsx      # Full vote tally breakdown for a poll
    │   ├── RollNumberPicker.tsx      # Searchable roll-number selector used when voting
    │   ├── SecurityPanel.tsx         # Admin: security/audit info panel
    │   └── TopNav.tsx                # Dashboard navigation bar (tabs, theme toggle, logout)
    ├── context/
    │   └── AuthContext.tsx      # Session, profile, isExcluded, isConfigured — app-wide auth state
    ├── db/
    │   ├── index.ts             # Drizzle/pg connection helper (server-side only)
    │   └── schema.ts            # Drizzle schema entrypoint (currently unused stub)
    └── lib/
        ├── constants.ts         # Class roster, roll-number regex/email validation, countdown formatting
        ├── pollService.ts       # All Supabase queries/RPCs: polls, votes, whitelist, admin, leaderboard, pending polls
        ├── titles.ts            # Maps leaderboard stats to earned "titles"
        ├── types.ts             # TypeScript types mirroring the Supabase schema
        └── supabase/
            └── client.ts        # Browser Supabase client factory

```

> **Note:** `db/schema.ts` and `SUPABASE_SETUP.md` currently disagree on ID types (`bigint` vs `uuid`) —
> `SUPABASE_SETUP.md` reflects what the frontend (`src/lib/types.ts`, `pollService.ts`) actually expects
> (`uuid` primary keys), so treat it as the source of truth over section 3 of this document if they conflict.

## 8. Where to Make Changes (Quick Map for AI Agents & Contributors)

Use this table to jump straight to the right file instead of searching the codebase. All paths are
relative to `nextjs-peer-voting-interface/`.

| I want to change... | Edit this file |
| --- | --- |
| The active-poll voting UI, vote button, per-poll countdown display | `src/components/ActivePollCard.tsx` (uses `src/components/CountdownTimer.tsx`, `src/components/RollNumberPicker.tsx`) |
| The closed-poll results view (revealed tallies) | `src/components/ClosedPollCard.tsx`, `src/components/ResultsBreakdown.tsx` |
| The "create a poll" form/modal | `src/components/CreatePollModal.tsx` → calls `createPendingPoll()` in `src/lib/pollService.ts` |
| What happens to a poll before it goes live (pending/review queue) | `src/components/PendingPollCard.tsx` (creator's own view), `src/components/PendingPollsReview.tsx` (admin approve/reject queue) |
| Archive / Hall of Fame podium display | `src/app/dashboard/archive/page.tsx`, `src/components/Podium.tsx` |
| Leaderboard rankings, titles, streaks | `src/app/dashboard/leaderboard/page.tsx`, `src/lib/titles.ts`, `fetchLeaderboardData()` in `src/lib/pollService.ts`, `StudentRanking` type in `src/lib/types.ts` |
| Admin: whitelist management (add/exclude roll numbers) | `src/components/AdminWhitelistTable.tsx` |
| Admin: granting poll-creation / admin permissions | `src/components/AdminPermissionsTable.tsx` |
| Admin: security/audit panel | `src/components/SecurityPanel.tsx` |
| Admin: editing a poll's expiration | `src/components/EditExpirationModal.tsx` |
| Admin dashboard page composition (which panels show up) | `src/app/dashboard/admin/page.tsx` |
| Any Supabase query, insert, update, or RPC call | `src/lib/pollService.ts` — this is the single data-access layer; UI components should not call Supabase directly |
| Database schema, RLS policies, triggers, cron jobs (SQL) | `nextjs-peer-voting-interface/SUPABASE_SETUP.md` (the actual source of truth — see note in section 7) |
| TypeScript shapes for DB rows / UI props | `src/lib/types.ts` |
| Login/signup, roll-number → email validation, class roster size | `src/lib/constants.ts` (`ROLL_EMAIL_REGEX`, `CLASS_ROSTER`) and `src/app/page.tsx` |
| Session/auth state, "who is logged in", excluded-user gating | `src/context/AuthContext.tsx` |
| Navigation bar, tabs, theme toggle, logout | `src/components/TopNav.tsx` |
| Dashboard route guard / loading state / excluded-user modal | `src/app/dashboard/layout.tsx`, `src/components/ExcludedModal.tsx` |
| Global colors, spacing, dark/light theme tokens | `src/app/globals.css` |
| Password reset flow | `src/components/ResetPasswordModal.tsx` |
| Generic confirmation dialogs / base modal styling | `src/components/ConfirmModal.tsx`, `src/components/Modal.tsx` |
| The "About" static page | `src/app/dashboard/about/page.tsx` |
| Health-check endpoint (used by uptime monitors) | `src/app/api/health/route.ts` |
| Supabase client creation / env var handling | `src/lib/supabase/client.ts` |
| Netlify build config, base directory, Node version | Netlify dashboard (*Site configuration > Build & deploy*) — see section 9 below, not a repo file |

**Rule of thumb:** UI components under `src/components/` and pages under `src/app/dashboard/` should stay
presentation-focused and call into `src/lib/pollService.ts` for any read/write against Supabase. If a
change requires a new query or RPC, add it to `pollService.ts` first, then consume it from the component/page.
If it requires a schema change, update the SQL in `SUPABASE_SETUP.md` and mirror the new shape in
`src/lib/types.ts`.

## 9. Getting Started & Deployment

### Environment Variables

To run this project locally or in production, you must configure a `.env.local` file in the root of your project with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

```

*(Note: Never commit your `.env.local` file to version control.)*

### Database Setup

The repository includes a `SUPABASE_SETUP.md` containing the exact SQL snippets required to initialize the database. You must execute these scripts in your Supabase SQL Editor to configure:

1. Table schemas and views.
2. Row Level Security (RLS) policies.
3. Database triggers (`process_anonymous_vote_increment`).
4. The `pg_cron` hourly scheduling extension.

### Netlify Deployment Configuration

This Next.js application is optimized for deployment on Netlify. Because the source code is nested within a folder, ensure the following settings are applied in your Netlify dashboard (*Site configuration > Build & deploy*):

* **Base directory:** `nextjs-peer-voting-interface` (Crucial for locating the `package.json`).
* **Build command:** `npm run build`
* **Publish directory:** `.next`
* **Node Version:** Set a `NODE_VERSION` environment variable to `20` to ensure modern Next.js compatibility.
