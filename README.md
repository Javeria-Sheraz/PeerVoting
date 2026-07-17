# 📊 Anonymous Cohort Polling Platform

## 1. Project Overview

This project is a real-time, anonymous polling application designed specifically for university cohorts. Built with a Next.js (App Router) frontend and a Supabase (PostgreSQL) backend, the platform eliminates the need for manual moderation or expensive server-side timers by relying on database-level automation, Row Level Security (RLS), and time-based queries.

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
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── api/
    │   │   └── health/
    │   │       └── route.ts
    │   └── dashboard/
    │       ├── layout.tsx
    │       ├── page.tsx
    │       ├── active/
    │       │   └── page.tsx
    │       ├── admin/
    │       │   └── page.tsx
    │       ├── archive/
    │       │   └── page.tsx
    │       └── closed/
    │           └── page.tsx
    ├── components/
    │   ├── ActivePollCard.tsx
    │   ├── AdminPermissionsTable.tsx
    │   ├── AdminWhitelistTable.tsx
    │   ├── ClosedPollCard.tsx
    │   ├── ConfirmModal.tsx
    │   ├── CountdownTimer.tsx
    │   ├── CreatePollModal.tsx
    │   ├── EditExpirationModal.tsx
    │   ├── ExcludedModal.tsx
    │   ├── Modal.tsx
    │   ├── Podium.tsx
    │   ├── RollNumberPicker.tsx
    │   └── TopNav.tsx
    ├── context/
    │   └── AuthContext.tsx
    ├── db/
    │   ├── index.ts
    │   └── schema.ts
    └── lib/
        ├── constants.ts
        ├── pollService.ts
        ├── types.ts
        └── supabase/
            └── client.ts

```

## 8. Getting Started & Deployment

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
