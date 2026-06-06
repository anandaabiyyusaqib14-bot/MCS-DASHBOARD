# MCS 1 Backend Implementation

This document describes the backend system implemented for Melati Championship Series 1.

## Architecture

Runtime stack:

- Next.js 16 App Router route handlers under `src/app/api/mcs`
- Server business layer under `src/server/mcs`
- Repository initialized from official MCS source data in `src/data/mcs.ts` and `src/data/panitia.ts`
- HTTP-only signed session cookie named `mcs_session`
- PBKDF2 password hashing with per-user salts
- Role based access control for every route and menu
- Audit log and notification side effects on operational mutations
- Empty collections or nullable fields for unpublished owner-provided data

Backend flow:

1. Client calls `/api/mcs/auth/login`.
2. Server verifies the hashed password and creates a signed session token.
3. Route handlers call `requireAuth()` and then the service layer.
4. Service layer enforces RBAC, scope rules, business validation, audit logs, and notifications.
5. Repository returns official MCS records or empty/no-data states when owner-provided data is unavailable.

The repository is intentionally isolated behind `src/server/mcs/repository.ts`, so it can be swapped with Firestore or Firebase Admin SDK without changing route contracts.

## Database Architecture

Current in-memory collections mirror the intended Firestore model:

| Collection | Purpose |
| --- | --- |
| `users` | Operator accounts, roles, division IDs, assigned competition IDs |
| `sessions` | Hashed session tokens, expiry, device metadata |
| `competitions` | MCS competition categories, PJ ownership, status, progress |
| `schedules` | Event rundown, match blocks, ceremonies, operations |
| `matches` | Official match state, teams, score, status, winner |
| `announcements` | Official internal and public broadcast messages |
| `media` | Official uploaded media metadata and approval state |
| `committees` | Panitia divisions, attendance summary, task health |
| `tasks` | Operational assignments by division and assignee |
| `auditLogs` | Login activity, data updates, schedule changes, score updates, announcement updates |
| `notifications` | Announcement, schedule, score, and task notifications |

Recommended Firestore indexes when migrating:

| Collection | Index |
| --- | --- |
| `users` | `role ASC, status ASC` |
| `competitions` | `tournamentId ASC, status ASC` |
| `schedules` | `tournamentId ASC, date ASC, time ASC` |
| `matches` | `tournamentId ASC, status ASC, time ASC` |
| `matches` | `tournamentId ASC, competitionId ASC, status ASC` |
| `announcements` | `tournamentId ASC, status ASC, updatedAt DESC` |
| `media` | `tournamentId ASC, approvalStatus ASC, createdAt DESC` |
| `tasks` | `divisionId ASC, status ASC, deadline ASC` |
| `tasks` | `assigneeId ASC, status ASC, deadline ASC` |
| `auditLogs` | `tournamentId ASC, timestamp DESC` |
| `notifications` | `userId ASC, status ASC, createdAt DESC` |
| `notifications` | `role ASC, status ASC, createdAt DESC` |

## API Structure

All responses use:

```json
{ "data": {} }
```

Errors use:

```json
{ "error": { "code": "forbidden", "message": "Missing permission: users.read" } }
```

### Auth

| Method | Route | Permission | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/mcs/auth/login` | Public | Login and set HTTP-only session |
| `POST` | `/api/mcs/auth/logout` | Session | Delete session |
| `GET` | `/api/mcs/auth/me` | Session | Current user, permissions, menus |
| `GET` | `/api/mcs/permissions` | Session | Current permission set and allowed menus |

Local development operator accounts all use password `mcs12345`:

| Email | Role |
| --- | --- |
| `superadmin@mcs1.id` | Super Admin |
| `ketua@mcs1.id` | Ketua Pelaksana |
| `wakil@mcs1.id` | Wakil Ketua |
| `pjlomba@mcs1.id` | PJ Lomba |
| `humas@mcs1.id` | Humas |
| `bendahara@mcs1.id` | Bendahara |
| `dokumentasi@mcs1.id` | Dokumentasi |
| `panitia@mcs1.id` | Panitia |

### Operations

| Method | Route | Permission |
| --- | --- | --- |
| `GET` | `/api/mcs/dashboard` | `dashboard.read` |
| `GET` | `/api/mcs/users` | `users.read` |
| `POST` | `/api/mcs/users` | `users.create` |
| `PATCH` | `/api/mcs/users/[id]` | `users.update` |
| `DELETE` | `/api/mcs/users/[id]` | `users.delete` |
| `GET` | `/api/mcs/competitions` | `competitions.read` |
| `POST` | `/api/mcs/competitions` | `competitions.create` |
| `PATCH` | `/api/mcs/competitions/[id]` | `competitions.update` |
| `DELETE` | `/api/mcs/competitions/[id]` | `competitions.delete` |
| `GET` | `/api/mcs/schedules` | `schedules.read` |
| `POST` | `/api/mcs/schedules` | `schedules.create` |
| `PATCH` | `/api/mcs/schedules/[id]` | `schedules.update` |
| `DELETE` | `/api/mcs/schedules/[id]` | `schedules.delete` |
| `GET` | `/api/mcs/matches` | `competitions.read` |
| `PATCH` | `/api/mcs/matches/[id]/score` | `scores.update` |
| `GET` | `/api/mcs/announcements` | `announcements.read` |
| `POST` | `/api/mcs/announcements` | `announcements.create` |
| `PATCH` | `/api/mcs/announcements/[id]` | `announcements.update` |
| `DELETE` | `/api/mcs/announcements/[id]` | `announcements.delete` |
| `PATCH` | `/api/mcs/announcements/[id]/approve` | `announcements.approve` |
| `GET` | `/api/mcs/media` | `media.read` |
| `POST` | `/api/mcs/media` | `media.upload` |
| `PATCH` | `/api/mcs/media/[id]` | `media.update` or `media.approve` |
| `DELETE` | `/api/mcs/media/[id]` | `media.delete` |
| `GET` | `/api/mcs/committees` | `committees.read` |
| `PATCH` | `/api/mcs/committees` | `committees.update` |
| `GET` | `/api/mcs/tasks` | `tasks.read` |
| `POST` | `/api/mcs/tasks` | `tasks.create` |
| `PATCH` | `/api/mcs/tasks/[id]` | `tasks.update` |
| `GET` | `/api/mcs/audit-logs` | `audit.read`, or own logs only |
| `GET` | `/api/mcs/notifications` | `notifications.read` |
| `PATCH` | `/api/mcs/notifications/[id]/read` | `notifications.update` |

## Role Permissions

| Role | Access |
| --- | --- |
| Super Admin | Full system access |
| Ketua Pelaksana | Monitor all divisions, approve announcements, update schedules, manage tasks, view reports, read audit logs |
| Wakil Ketua | Same operational access as Ketua Pelaksana |
| PJ Lomba | Read and update assigned competitions, update scores, update schedules, view tasks and announcements |
| Humas | Create and update announcements, manage publication flow, send notifications |
| Dokumentasi | Upload and update media, view schedules, announcements, tasks |
| Panitia | View dashboard, schedules, announcements, committees, notifications, and assigned/division tasks |

PJ Lomba is additionally scoped by `assignedCompetitionIds`. Panitia task updates are scoped to assigned tasks or the user's division.

## Business Logic

Authentication:

- Passwords are stored as PBKDF2 hashes with salts.
- Sessions use signed tokens stored in the `mcs_session` HTTP-only cookie; token hashes are still stored server-side when a route bundle has access to the in-memory repository.
- `MCS_SESSION_SECRET` or `NEXTAUTH_SECRET` should be set outside local development.
- `/dashboard` is protected by `src/proxy.ts` as an optimistic session-cookie guard.
- API routes still perform authoritative session and permission checks.

Content integrity:

- The backend does not seed fictional teams, participants, schedules, scores, announcements, media, committee data, or results.
- If owner-provided records are unavailable, routes return empty arrays, nullable metrics, or no-data status values.
- Official competition scope is limited to Futsal, Basket 3x3, Voli, Badminton, Mobile Legends, Canvas Drawing, Solo Vokal, Best News Card, and Best News Video.

Score updates:

- `PATCH /api/mcs/matches/[id]/score` updates score, clock, status, and winner.
- Final scores update competition progress.
- Writes create `scores.update` audit logs.
- Score notifications fan out to Super Admin, Ketua, Wakil, PJ Lomba, and Humas.

Schedules:

- Create/update/delete writes are permission-gated.
- Schedule mutations create audit entries.
- Schedule update notifications fan out to leadership, PJ Lomba, and Panitia.

Announcements:

- Humas can create announcements, which default to `pending_approval`.
- Ketua, Wakil, or Super Admin can approve and publish.
- Published announcements notify the target role audience.
- Announcement mutations are audit logged.

Media:

- Dokumentasi can upload media metadata.
- Media approval is reserved for users with `media.approve`.
- Public readers only see approved media outside leadership and Dokumentasi roles.

Tasks:

- Leadership can create and assign tasks.
- Task assignment creates user-specific notifications.
- Panitia can update only assigned or same-division tasks.

Dashboard:

- Aggregates official competitions, schedule records, matches, announcements, event progress, committee status, recent audit logs, and unread notifications.
- Missing owner-provided data is surfaced as empty or no-data state, never generated filler.
