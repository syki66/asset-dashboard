create table if not exists public.asset_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  encrypted_payload text not null check (length(encrypted_payload) > 0),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.asset_data enable row level security;
alter table public.asset_data force row level security;

revoke all on table public.asset_data from anon, authenticated;
grant select, insert, update on table public.asset_data to authenticated;

create policy "Users can read only their asset data"
on public.asset_data
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert only their asset data"
on public.asset_data
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update only their asset data"
on public.asset_data
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
