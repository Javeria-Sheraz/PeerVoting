# PeerVote — Supabase Integration Notes

This frontend expects a Supabase project already provisioned with the following tables
(exact shapes used by the UI):

```sql
profiles (id uuid pk references auth.users, email text, roll_number text, is_admin bool default false, can_create_polls bool default false)
polls (id uuid pk default gen_random_uuid(), creator_id uuid references profiles(id), question text, created_at timestamptz default now(), expires_at timestamptz, is_archived bool default false)
vote_trackers (id uuid pk default gen_random_uuid(), poll_id uuid references polls(id), user_id uuid references profiles(id), unique(poll_id, user_id))
poll_results (id uuid pk default gen_random_uuid(), poll_id uuid references polls(id), voted_for_roll text, vote_count int default 0, unique(poll_id, voted_for_roll))
whitelist (id uuid pk default gen_random_uuid(), roll_number text unique, is_excluded bool default false)
poll_answers_archive (id uuid pk default gen_random_uuid(), poll_id uuid references polls(id), top_1_roll text, top_2_roll text, top_3_roll text, total_votes_cast int)
```

## 1. Environment variables
Set these in `.env` (and in your Netlify site's Environment Variables panel for production):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

The app renders a "not configured" banner and disables the auth form until both are present —
it will never crash the build if they're missing.

## 2. Unique constraints that guarantee anonymity + no double-voting
- `vote_trackers` should have a **unique constraint on `(poll_id, user_id)`** — this is what the
  UI relies on (Postgres error code `23505`) to block a second vote from the same user, while
  never storing *who* they voted for. That linkage only exists transiently in the browser during
  submission and is written anonymously into `poll_results`.
- `poll_results` should have a **unique constraint on `(poll_id, voted_for_roll)`** so the tally
  can be looked up and incremented per candidate.

## 3. Recommended: auto-create a profile row on signup
The frontend already upserts a `profiles` row after `signUp`, but for defense-in-depth add a
Postgres trigger on `auth.users`:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, roll_number, is_admin, can_create_polls)
  values (
    new.id,
    new.email,
    regexp_replace(new.email, '@student\.uet\.edu\.pk$', ''),
    false,
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 4. Recommended Row Level Security policies
Enable RLS on every table, then (adjust to taste):

```sql
-- profiles: everyone can read (needed to resolve "Created by" + roster), only the owner/admin can update.
create policy "profiles are readable" on profiles for select using (true);
create policy "users update own profile" on profiles for update using (auth.uid() = id);

-- polls: everyone can read; only users with can_create_polls/is_admin can insert; only admins can delete/update.
create policy "polls are readable" on polls for select using (true);

-- vote_trackers: users can insert their own row and read only their own rows (never reveal who voted for what).
create policy "insert own vote tracker" on vote_trackers for insert with check (auth.uid() = user_id);
create policy "read own vote tracker" on vote_trackers for select using (auth.uid() = user_id);

-- poll_results: readable by everyone (client hides it in the UI for active polls), insert/update via anon key.
create policy "poll results readable" on poll_results for select using (true);
create policy "poll results writable" on poll_results for insert with check (true);
create policy "poll results updatable" on poll_results for update using (true);

-- whitelist + admin-only writes should be enforced with a `is_admin` check via a security-definer function
-- or handled through the Supabase dashboard/service role for stricter guarantees.
```

## 5. Atomic vote tally (optional hardening)
The client currently does a read-then-write to increment `poll_results.vote_count`, which is fine
for a class-sized poll but not perfectly race-proof under heavy concurrent load. For stronger
guarantees, add this RPC and swap the client call in `src/lib/pollService.ts` (`submitSecretVote`)
to `supabase.rpc('increment_poll_result', { p_poll_id, p_roll })`:

```sql
create or replace function public.increment_poll_result(p_poll_id uuid, p_roll text)
returns void as $$
begin
  insert into poll_results (poll_id, voted_for_roll, vote_count)
  values (p_poll_id, p_roll, 1)
  on conflict (poll_id, voted_for_roll)
  do update set vote_count = poll_results.vote_count + 1;
end;
$$ language plpgsql security definer;
```
