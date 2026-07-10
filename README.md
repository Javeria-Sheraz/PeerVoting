Anonymous Cohort Polling Platform

## 1. What the Project Is

This project is a real-time, anonymous polling platform built specifically for university cohorts and private groups. It allows whitelisted members to create time-sensitive polls, cast secret votes for their peers (using roll numbers), and view automated podium results.

Instead of relying on manual moderation, the platform is designed around a self-sustaining **Automated Poll Lifecycle**. Polls transition seamlessly from an Active voting phase, to a 24-hour full-results reveal, and finally into a permanent, lightweight "Hall of Fame" archive.

## 2. How the Project Works (Architecture)

The application is a full-stack web app built with **Next.js (App Router)** on the frontend and **Supabase (PostgreSQL)** on the backend.

* **The Frontend (Next.js & React):** The user interface is built with React components and Tailwind CSS. It communicates with the database using the Supabase JavaScript client, organized cleanly into a dedicated service layer (`pollService.ts`). The UI is highly responsive, conditionally rendering admin controls and enforcing frontend validation before sending requests.
* **The Backend (Supabase):** The true engine of the app lives in the database. Instead of using expensive server-side cron jobs (timers) to manage poll states, the system relies on **"Smart Database" mechanics**:
* **Time-based Queries:** The frontend instantly routes polls to different tabs (Active vs. Closed) by comparing the current clock time against the poll's `expires_at` timestamp.
* **PostgreSQL Views:** The "Archive" tab does not use a physical table. It relies on a SQL View that automatically calculates the Top 3 vote-getters for any poll exactly 24 hours after it closes.
* **Row Level Security (RLS):** Security is handled entirely at the database level. RLS policies combined with Security Definer functions physically block unauthorized users from voting twice, viewing active results prematurely, or spamming the feed with multiple active polls.



## 3. Key Features

* 🔒 **Secret Voting System:** Votes are strictly anonymous. Results are hidden from all normal users until the poll officially closes, preventing bandwagon voting.
* ⏳ **Automated 3-Stage Lifecycle:**
* **Active Phase:** Users cast their votes before the countdown timer hits zero.
* **Closed Phase (24 Hours):** Once closed, full voting tallies are revealed to the cohort for exactly 24 hours.
* **Archive Phase:** After 24 hours, the full results are hidden, and only the 🥇 1st, 🥈 2nd, and 🥉 3rd place winners are permanently immortalized in the Answers Archive.


* 🛡️ **Advanced Anti-Spam & Security:**
* **1-Active-Poll Limit:** A strict database-level rule ensures a single user can only have one active poll running at a time.
* **Whitelist Enforcement:** Only pre-approved roll numbers can log in, create polls, or cast votes.


* 👑 **Comprehensive Admin Dashboard:** Admins have exclusive controls to manage the whitelist, grant/revoke poll creation permissions, change active poll expiration times, or instantly close/delete inappropriate polls.

## 4. File & Folder Structure

The codebase follows a modern Next.js App Router structure, separating server-side routing, UI components, and database logic.

```text
📦 src
 ┣ 📂 app
 ┃ ┣ 📂 api               # API routes (e.g., health checks)
 ┃ ┣ 📂 dashboard         # Main application interface
 ┃ ┃ ┣ 📂 active          # Renders the "Active Polls" feed
 ┃ ┃ ┣ 📂 admin           # Renders the Admin management panel
 ┃ ┃ ┣ 📂 archive         # Renders the Top 3 "Hall of Fame" View
 ┃ ┃ ┣ 📂 closed          # Renders the 24-hour full results feed
 ┃ ┃ ┣ 📜 layout.tsx      # Shared dashboard layout and navigation
 ┃ ┃ ┗ 📜 page.tsx        # Dashboard entry point
 ┃ ┣ 📜 globals.css       # Global styles and Tailwind imports
 ┃ ┗ 📜 layout.tsx        # Root application layout
 ┣ 📂 components          # Reusable UI elements
 ┃ ┣ 📜 ActivePollCard.tsx   # Card for voting and countdowns
 ┃ ┣ 📜 ClosedPollCard.tsx   # Card for rendering full vote tallies
 ┃ ┣ 📜 AdminPermissionsTable.tsx # UI for toggling user rights
 ┃ ┣ 📜 RollNumberPicker.tsx # Dropdown for selecting vote targets
 ┃ ┗ 📜 (Various Modals, Navbars, and Podium components)
 ┣ 📂 context
 ┃ ┗ 📜 AuthContext.tsx   # Global state for Supabase user sessions
 ┣ 📂 db                  # Database schema definitions 
 ┣ 📂 lib                 # Core utilities and services
 ┃ ┣ 📂 supabase          # Supabase client initialization
 ┃ ┣ 📜 pollService.ts    # Centralized Supabase data fetching functions
 ┃ ┣ 📜 types.ts          # TypeScript interfaces (Poll, Profile, etc.)
 ┃ ┗ 📜 constants.ts      # Global app configurations

```
