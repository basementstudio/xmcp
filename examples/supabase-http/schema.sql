create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  body text not null
);
alter table public.notes enable row level security;
grant select on public.notes to authenticated;
create policy "Read own notes" on public.notes for select to authenticated
  using ((select auth.uid()) = user_id);
-- Seed rows through the SQL editor using IDs from two existing Auth users.
-- Do not disable RLS to make the example work.
