create table if not exists public.mcs_snapshots (
  store_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.mcs_snapshots enable row level security;

create policy "mcs_snapshots_service_role_all"
  on public.mcs_snapshots
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.set_mcs_snapshot_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_mcs_snapshot_updated_at on public.mcs_snapshots;

create trigger set_mcs_snapshot_updated_at
  before update on public.mcs_snapshots
  for each row
  execute function public.set_mcs_snapshot_updated_at();

insert into public.mcs_snapshots (store_key, payload)
values
  ('operational', '{"version":1}'::jsonb),
  ('competition', '{"version":1}'::jsonb)
on conflict (store_key) do nothing;
