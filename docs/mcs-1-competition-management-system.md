# MCS 1 Competition Management System

This module is the operational center for Melati Championship Series 1 competitions. It must use only official owner-provided content from `src/data/mcs.ts`, uploaded files, database records, or manually entered records.

No fictional teams, participants, schedules, scores, standings, winners, announcements, committee data, or media are seeded here. When official data is unavailable, the API returns empty collections or nullable fields and the UI displays `No Data Available`, `Data Not Published Yet`, or `Match data not available.`

## Official Competition Scope

The Competition Center accepts only these MCS 1 competitions:

| ID | Display Name |
| --- | --- |
| `futsal` | Futsal |
| `basket` | Basket 3x3 |
| `volly` | Voli |
| `badminton` | Badminton |
| `mobile-legends` | Mobile Legends |
| `canvas-drawing` | Canvas Drawing |
| `solo-vokal` | Solo Vokal |
| `best-news-card` | Best News Card |
| `best-news-video` | Best News Video |

Unofficial competition creation is rejected by the backend.

## Data Architecture

Implemented files:

| File | Purpose |
| --- | --- |
| `src/data/competition-center.ts` | Domain types, official competition shells derived from `src/data/mcs.ts`, and empty record collections for unpublished data |
| `src/server/mcs/competition-system.ts` | Business rules, RBAC, validation, audit logs, notifications, and reports |
| `src/app/api/mcs/competition-center/[[...path]]/route.ts` | REST-style route dispatcher |
| `src/components/dashboard/competition-management-center.tsx` | Competition Center UI with real images or image placeholders |

The in-memory state mirrors database tables that can later be moved to SQL or Firestore:

| Table | Purpose |
| --- | --- |
| `competitions` | Official competition master records |
| `participants` | Manually provided participant records |
| `teams` | Manually provided team records |
| `matches` | Manually provided fixture and score records |
| `match_scores` | Score changes represented by match state and audit logs |
| `judging_criteria` | Manually provided judging criteria |
| `judge_scores` | Manually provided judge score submissions |
| `competition_results` | Official published results |
| `competition_logs` | Audit trail with previous and new values |
| `competition_notifications` | Operational notifications generated from real actions |

## API Endpoint Structure

Base route: `/api/mcs/competition-center`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | Full competition center overview |
| `GET` | `/competitions` | List official competitions |
| `POST` | `/competitions` | Create an official competition record only |
| `PATCH` | `/competitions/[id]` | Update competition metadata/status |
| `DELETE` | `/competitions/[id]` | Archive competition |
| `GET` | `/participants?competitionId=` | List participant records |
| `POST` | `/participants` | Create participant registration |
| `PATCH` | `/participants/[id]` | Verify/update participant |
| `GET` | `/teams?competitionId=` | List team records |
| `POST` | `/teams` | Create team |
| `PATCH` | `/teams/[id]` | Update team |
| `GET` | `/brackets?competitionId=` | List bracket rounds |
| `POST` | `/brackets/generate` | Generate bracket only from approved real entrants |
| `GET` | `/matches?competitionId=` | List match records |
| `PATCH` | `/matches/[id]` | Update match metadata/status |
| `PATCH` | `/scores/[id]` | Update score for an existing real match |
| `GET` | `/judging-criteria?competitionId=` | List judging criteria |
| `POST` | `/judging-criteria` | Create judging criteria |
| `POST` | `/judge-scores` | Submit judge score |
| `GET` | `/results?competitionId=` | List official results |
| `POST` | `/results/publish` | Publish approved official result |
| `GET` | `/reports` | Generate operational reports |
| `GET` | `/logs` | Competition audit log |
| `GET` | `/notifications` | Competition notifications |

## Access Control Matrix

| Capability | Super Admin | Ketua Pelaksana | PJ Lomba | Panitia |
| --- | --- | --- | --- | --- |
| Create/edit/delete competitions | Yes | Monitor/approve via workflow | Assigned only | No |
| Manage participants | Yes | View/approve changes | Assigned only | View |
| Manage teams | Yes | View | Assigned only | View |
| Generate brackets | Yes | View | Assigned only | No |
| Update matches | Yes | Monitor | Assigned only | View |
| Update scores | Yes | Monitor | Assigned only | View |
| Manage judging criteria | Yes | Monitor | Assigned only | No |
| Publish results | Yes | View | Yes | View |
| Reports | Yes | Yes | Assigned scope | No |
| Audit logs | Yes | Yes | Own actions | Own actions |

## Business Rules

- Menus and API routes are protected by RBAC.
- PJ Lomba can manage only assigned competition IDs.
- The backend rejects competitions outside the official MCS 1 list.
- The backend never generates schedules, entrants, scores, standings, winners, or announcements.
- Brackets can be generated only after at least two approved real entrants exist.
- Match scores can be updated only for existing real matches.
- Results require official winner, runner-up, and third-place input before publication.
- Completed and archived competitions are read-only.
- All mutations create audit log entries.
- Notifications are generated only from real actions such as registration approval, score update, result publication, and competition completion.

## UI Behavior

The `/dashboard/tournament` route renders the Competition Management Center with:

- Official school/OSIS/MPK logos only
- Official competition list only
- Real project gallery images when available
- Image placeholders when no official image exists
- Empty states for unpublished participants, teams, matches, brackets, criteria, results, and activity
- No invented supporter category, sample teams, fake scores, fake winners, or generated event photos
