create table if not exists public.mcs_tournaments (
  id text primary key,
  name text not null,
  short_name text not null,
  theme text,
  slogan text,
  organizer text,
  starts_at text,
  ends_at text,
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mcs_users (
  id text primary key,
  display_name text not null,
  email text not null unique,
  role text not null,
  status text not null,
  tournament_ids text[] not null default '{}',
  division_ids text[] not null default '{}',
  assigned_competition_ids text[] not null default '{}',
  phone text,
  photo_url text,
  password_hash text not null,
  password_salt text not null,
  password_iterations integer not null,
  last_active_at text,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.mcs_sessions (
  id text primary key,
  token_hash text not null unique,
  user_id text not null references public.mcs_users(id) on delete cascade,
  created_at text not null,
  last_seen_at text not null,
  expires_at text not null,
  ip_address text,
  user_agent text
);

create table if not exists public.mcs_competitions (
  id text primary key,
  tournament_id text not null,
  name text not null,
  short_name text not null,
  kind text not null,
  category text not null,
  venue text not null,
  pj text[] not null default '{}',
  status text not null,
  progress integer not null default 0,
  participant_count integer not null default 0,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.mcs_schedules (
  id text primary key,
  tournament_id text not null,
  competition_id text references public.mcs_competitions(id) on delete set null,
  date text not null,
  label text not null,
  day_name text not null,
  time text not null,
  duration text not null,
  title text not null,
  venue text not null,
  pic text not null,
  type text not null,
  status text not null,
  notes text,
  published_at text,
  published_by text,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.mcs_matches (
  id text primary key,
  tournament_id text not null,
  competition_id text not null references public.mcs_competitions(id) on delete cascade,
  sport text not null,
  category text not null,
  round text not null,
  venue text not null,
  time text not null,
  team_a text not null,
  team_b text not null,
  score_a integer not null default 0,
  score_b integer not null default 0,
  status text not null,
  clock text not null,
  winner text,
  updated_by text,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.mcs_announcements (
  id text primary key,
  tournament_id text not null,
  title text not null,
  body text not null,
  priority text not null,
  audience text[] not null default '{}',
  visibility text not null,
  status text not null,
  created_by text not null,
  approved_by text,
  published_at text,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.mcs_media (
  id text primary key,
  tournament_id text not null,
  title text not null,
  type text not null,
  category text not null,
  meta text not null,
  views integer not null default 0,
  src text,
  storage_path text,
  visibility text not null,
  approval_status text not null,
  uploaded_by text not null,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.mcs_committee_divisions (
  id text primary key,
  tournament_id text not null,
  name text not null,
  coordinator text not null,
  members integer not null default 0,
  present integer not null default 0,
  late integer not null default 0,
  absent integer not null default 0,
  excused integer not null default 0,
  active_tasks integer not null default 0,
  completion integer not null default 0,
  responsiveness integer not null default 0,
  status text not null,
  focus text not null,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.mcs_tasks (
  id text primary key,
  tournament_id text not null,
  title text not null,
  description text,
  assignee_id text references public.mcs_users(id) on delete set null,
  assignee_name text not null,
  division_id text not null,
  division text not null,
  deadline text not null,
  progress integer not null default 0,
  priority text not null,
  status text not null,
  created_by text not null,
  completed_at text,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.mcs_issues (
  id text primary key,
  tournament_id text not null,
  issue_code text not null unique,
  title text not null,
  description text not null,
  category text not null,
  severity text not null,
  venue text,
  reported_by text not null,
  reported_by_name text not null,
  assigned_to_user_id text references public.mcs_users(id) on delete set null,
  assigned_to_name text,
  assigned_division_id text,
  assigned_division_name text,
  deadline text not null,
  status text not null,
  resolution_notes text,
  escalated_at text,
  resolved_at text,
  closed_at text,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.mcs_issue_evidence (
  id text primary key,
  tournament_id text not null,
  issue_id text not null references public.mcs_issues(id) on delete cascade,
  title text not null,
  type text not null,
  url text,
  notes text,
  uploaded_by text not null,
  created_at text not null
);

create table if not exists public.mcs_issue_history (
  id text primary key,
  tournament_id text not null,
  issue_id text not null references public.mcs_issues(id) on delete cascade,
  actor_id text not null,
  actor_name text not null,
  action text not null,
  from_status text,
  to_status text,
  notes text,
  created_at text not null
);

create table if not exists public.mcs_division_handoffs (
  id text primary key,
  tournament_id text not null,
  activity text not null,
  source_division_id text not null,
  source_division_name text not null,
  target_division_id text not null,
  target_division_name text not null,
  status text not null,
  owner_user_id text references public.mcs_users(id) on delete set null,
  owner_name text not null,
  deadline text not null,
  notes text,
  linked_issue_id text references public.mcs_issues(id) on delete set null,
  created_by text not null,
  accepted_at text,
  blocked_at text,
  completed_at text,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.mcs_handoff_history (
  id text primary key,
  tournament_id text not null,
  handoff_id text not null references public.mcs_division_handoffs(id) on delete cascade,
  actor_id text not null,
  actor_name text not null,
  action text not null,
  from_status text,
  to_status text,
  notes text,
  created_at text not null
);

create table if not exists public.mcs_venue_statuses (
  id text primary key,
  tournament_id text not null,
  venue text not null,
  status text not null,
  current_activity_id text,
  next_activity_id text,
  owner_division_id text,
  owner_name text,
  blocker_issue_id text references public.mcs_issues(id) on delete set null,
  last_update text not null,
  updated_at text not null
);

create table if not exists public.mcs_audit_logs (
  id text primary key,
  tournament_id text not null,
  user_id text not null,
  user_name text not null,
  role text not null,
  action text not null,
  resource text not null,
  resource_id text,
  timestamp text not null,
  metadata jsonb
);

create table if not exists public.mcs_notifications (
  id text primary key,
  tournament_id text not null,
  user_id text references public.mcs_users(id) on delete cascade,
  role text,
  type text not null,
  title text not null,
  body text not null,
  resource text,
  resource_id text,
  status text not null,
  created_at text not null,
  read_at text
);

create table if not exists public.mcs_center_competitions (
  id text primary key,
  name text not null,
  category text not null,
  type text not null,
  description text not null,
  rules text[] not null default '{}',
  venue text not null,
  pic text[] not null default '{}',
  status text not null,
  registration_start text not null,
  registration_end text not null,
  competition_start text not null,
  competition_end text not null,
  max_participants integer,
  participant_count integer,
  match_count integer,
  current_round text not null,
  judges integer,
  submission_count integer,
  image text,
  crop text,
  created_by text not null,
  created_date text not null,
  updated_date text not null
);

create table if not exists public.mcs_center_participants (
  id text primary key,
  competition_id text not null references public.mcs_center_competitions(id) on delete cascade,
  name text not null,
  class_name text not null,
  major text not null,
  country_name text not null,
  country_flag text not null,
  registration_date text not null,
  status text not null,
  avatar text not null,
  attendance_status text,
  gender text,
  notes text,
  team_name text,
  verification_notes text
);

create table if not exists public.mcs_center_teams (
  id text primary key,
  competition_id text not null references public.mcs_center_competitions(id) on delete cascade,
  name text not null,
  captain text not null,
  members text[] not null default '{}',
  class_name text not null,
  country_name text not null,
  country_flag text not null,
  status text not null
);

create table if not exists public.mcs_center_matches (
  id text primary key,
  competition_id text not null references public.mcs_center_competitions(id) on delete cascade,
  round text not null,
  venue text not null,
  date text not null,
  start_time text not null,
  end_time text,
  team_a text not null,
  team_b text not null,
  score_a integer not null default 0,
  score_b integer not null default 0,
  status text not null,
  live_clock text,
  match_format text,
  timeline jsonb,
  winner text,
  notes text
);

create table if not exists public.mcs_center_bracket_rounds (
  id bigserial primary key,
  title text not null,
  matches jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

create table if not exists public.mcs_center_judging_criteria (
  id text primary key,
  competition_id text not null references public.mcs_center_competitions(id) on delete cascade,
  label text not null,
  weight integer not null
);

create table if not exists public.mcs_center_judge_scores (
  id text primary key,
  competition_id text not null references public.mcs_center_competitions(id) on delete cascade,
  judge text not null,
  participant_id text not null,
  criteria_id text not null references public.mcs_center_judging_criteria(id) on delete cascade,
  score integer not null,
  comments text not null
);

create table if not exists public.mcs_center_results (
  id text primary key,
  competition_id text not null references public.mcs_center_competitions(id) on delete cascade,
  winner text not null,
  runner_up text not null,
  third_place text not null,
  special_award_label text not null,
  special_award_winner text not null,
  final_notes text not null,
  approved_by text,
  published_at text
);

create table if not exists public.mcs_center_logs (
  id text primary key,
  user_id text not null,
  user_name text not null,
  role text not null,
  action text not null,
  resource text not null,
  resource_id text,
  timestamp text not null,
  previous_value jsonb,
  new_value jsonb
);

create table if not exists public.mcs_center_notifications (
  id text primary key,
  type text not null,
  title text not null,
  body text not null,
  role text,
  resource text not null,
  resource_id text not null,
  status text not null,
  created_at text not null
);

create index if not exists mcs_users_email_idx on public.mcs_users (email);
create index if not exists mcs_sessions_token_hash_idx on public.mcs_sessions (token_hash);
create index if not exists mcs_schedules_competition_id_idx on public.mcs_schedules (competition_id);
create index if not exists mcs_matches_competition_id_idx on public.mcs_matches (competition_id);
create index if not exists mcs_tasks_division_id_idx on public.mcs_tasks (division_id);
create index if not exists mcs_issues_status_idx on public.mcs_issues (status);
create index if not exists mcs_issues_assigned_to_user_id_idx on public.mcs_issues (assigned_to_user_id);
create index if not exists mcs_notifications_user_id_idx on public.mcs_notifications (user_id);
create index if not exists mcs_notifications_role_idx on public.mcs_notifications (role);
create index if not exists mcs_center_participants_competition_id_idx on public.mcs_center_participants (competition_id);
create index if not exists mcs_center_teams_competition_id_idx on public.mcs_center_teams (competition_id);
create index if not exists mcs_center_matches_competition_id_idx on public.mcs_center_matches (competition_id);

create or replace function public.set_mcs_updated_at()
returns trigger
language plpgsql
as $$
begin
  if to_jsonb(new) ? 'updated_at' then
    new.updated_at = now()::text;
  end if;
  return new;
end;
$$;

create or replace function public.set_mcs_updated_date()
returns trigger
language plpgsql
as $$
begin
  if to_jsonb(new) ? 'updated_date' then
    new.updated_date = now()::text;
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mcs_tournaments',
    'mcs_users',
    'mcs_competitions',
    'mcs_schedules',
    'mcs_matches',
    'mcs_announcements',
    'mcs_media',
    'mcs_committee_divisions',
    'mcs_tasks',
    'mcs_issues',
    'mcs_division_handoffs',
    'mcs_venue_statuses'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_mcs_updated_at()', table_name, table_name);
  end loop;

  execute 'drop trigger if exists set_mcs_center_competitions_updated_date on public.mcs_center_competitions';
  execute 'create trigger set_mcs_center_competitions_updated_date before update on public.mcs_center_competitions for each row execute function public.set_mcs_updated_date()';
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mcs_tournaments',
    'mcs_users',
    'mcs_sessions',
    'mcs_competitions',
    'mcs_schedules',
    'mcs_matches',
    'mcs_announcements',
    'mcs_media',
    'mcs_committee_divisions',
    'mcs_tasks',
    'mcs_issues',
    'mcs_issue_evidence',
    'mcs_issue_history',
    'mcs_division_handoffs',
    'mcs_handoff_history',
    'mcs_venue_statuses',
    'mcs_audit_logs',
    'mcs_notifications',
    'mcs_center_competitions',
    'mcs_center_participants',
    'mcs_center_teams',
    'mcs_center_matches',
    'mcs_center_bracket_rounds',
    'mcs_center_judging_criteria',
    'mcs_center_judge_scores',
    'mcs_center_results',
    'mcs_center_logs',
    'mcs_center_notifications'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "%s_service_role_all" on public.%I', table_name, table_name);
    execute format(
      'create policy "%s_service_role_all" on public.%I for all to service_role using (true) with check (true)',
      table_name,
      table_name
    );
  end loop;
end;
$$;
