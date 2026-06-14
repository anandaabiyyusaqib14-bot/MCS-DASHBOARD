# MCS Supabase Schema

## Current Compatibility Layer

`001_mcs_snapshot_store.sql` creates `mcs_snapshots`.

The app can currently read/write:

- `operational`
- `competition`

This keeps the existing MCS backend stable while Supabase is introduced.

## Normalized Schema

`002_mcs_normalized_schema.sql` creates separate tables so the Supabase database is easier to inspect and maintain.

Operational tables:

- `mcs_tournaments`
- `mcs_users`
- `mcs_sessions`
- `mcs_competitions`
- `mcs_schedules`
- `mcs_matches`
- `mcs_announcements`
- `mcs_media`
- `mcs_committee_divisions`
- `mcs_tasks`
- `mcs_issues`
- `mcs_issue_evidence`
- `mcs_issue_history`
- `mcs_division_handoffs`
- `mcs_handoff_history`
- `mcs_venue_statuses`
- `mcs_audit_logs`
- `mcs_notifications`

Competition Center tables:

- `mcs_center_competitions`
- `mcs_center_participants`
- `mcs_center_teams`
- `mcs_center_matches`
- `mcs_center_bracket_rounds`
- `mcs_center_judging_criteria`
- `mcs_center_judge_scores`
- `mcs_center_results`
- `mcs_center_logs`
- `mcs_center_notifications`

### Auto Bracket Flow

When all `Babak 1` matches for one match-based competition are finished, the server writes the generated next-round matches and bracket rows into the existing `competition` snapshot.

The normalized sync then mirrors that snapshot into:

- `mcs_center_matches`
- `mcs_center_bracket_rounds`

No extra migration is required for the automatic bracket generator because the generated bracket still uses the current Competition Center snapshot shape.

## Security

All normalized tables enable RLS and allow access only through the Supabase `service_role` role. Do not expose the service role key to the browser.

## Migration Order

Run in Supabase SQL Editor:

1. `supabase/migrations/001_mcs_snapshot_store.sql`
2. `supabase/migrations/002_mcs_normalized_schema.sql`

`002` does not insert fake users, fake teams, fake schedules, fake results, or dummy event records.

## Backfill Normalized Tables

After running `002`, restart the app and call:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/mcs/supabase/sync-normalized" `
  -Method POST `
  -Headers @{ "x-mcs-bootstrap-secret" = "ISI_SESUAI_MCS_BOOTSTRAP_SECRET" }
```

This copies the current `mcs_snapshots` rows into the normalized `mcs_*` tables.
