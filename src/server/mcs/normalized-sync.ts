import type { SupabaseClient } from "@supabase/supabase-js"

type JsonObject = Record<string, unknown>

type OperationalSnapshot = {
  announcements?: JsonObject[]
  auditLogs?: JsonObject[]
  committees?: JsonObject[]
  competitions?: JsonObject[]
  handoffHistory?: JsonObject[]
  handoffs?: JsonObject[]
  issueEvidence?: JsonObject[]
  issueHistory?: JsonObject[]
  issues?: JsonObject[]
  matches?: JsonObject[]
  media?: JsonObject[]
  notifications?: JsonObject[]
  schedules?: JsonObject[]
  sessions?: JsonObject[]
  tasks?: JsonObject[]
  users?: JsonObject[]
  venueStatuses?: JsonObject[]
  version?: number
}

type CompetitionSnapshot = {
  brackets?: JsonObject[]
  competitions?: JsonObject[]
  criteria?: JsonObject[]
  judgeScores?: JsonObject[]
  logs?: JsonObject[]
  matches?: JsonObject[]
  notifications?: JsonObject[]
  participants?: JsonObject[]
  results?: JsonObject[]
  teams?: JsonObject[]
  version?: number
}

export async function syncNormalizedStore(client: SupabaseClient, storeKey: string, payload: unknown) {
  try {
    if (storeKey === "operational") {
      await syncOperationalSnapshot(client, asObject(payload) as OperationalSnapshot)
      return
    }

    if (storeKey === "competition") {
      await syncCompetitionSnapshot(client, asObject(payload) as CompetitionSnapshot)
    }
  } catch (error) {
    console.error(error)
  }
}

async function syncOperationalSnapshot(client: SupabaseClient, snapshot: OperationalSnapshot) {
  if (snapshot.version !== 1) return

  await clearTables(client, [
    "mcs_notifications",
    "mcs_audit_logs",
    "mcs_venue_statuses",
    "mcs_handoff_history",
    "mcs_division_handoffs",
    "mcs_issue_history",
    "mcs_issue_evidence",
    "mcs_issues",
    "mcs_tasks",
    "mcs_media",
    "mcs_announcements",
    "mcs_matches",
    "mcs_schedules",
    "mcs_sessions",
    "mcs_users",
    "mcs_committee_divisions",
    "mcs_competitions",
  ])

  await upsertRows(client, "mcs_competitions", (snapshot.competitions ?? []).map(mapCompetition))
  await upsertRows(client, "mcs_committee_divisions", (snapshot.committees ?? []).map(mapCommitteeDivision))
  await upsertRows(client, "mcs_users", (snapshot.users ?? []).map(mapUser))
  await upsertRows(client, "mcs_sessions", (snapshot.sessions ?? []).map(mapSession))
  await upsertRows(client, "mcs_schedules", (snapshot.schedules ?? []).map(mapSchedule))
  await upsertRows(client, "mcs_matches", (snapshot.matches ?? []).map(mapMatch))
  await upsertRows(client, "mcs_announcements", (snapshot.announcements ?? []).map(mapAnnouncement))
  await upsertRows(client, "mcs_media", (snapshot.media ?? []).map(mapMedia))
  await upsertRows(client, "mcs_tasks", (snapshot.tasks ?? []).map(mapTask))
  await upsertRows(client, "mcs_issues", (snapshot.issues ?? []).map(mapIssue))
  await upsertRows(client, "mcs_issue_evidence", (snapshot.issueEvidence ?? []).map(mapIssueEvidence))
  await upsertRows(client, "mcs_issue_history", (snapshot.issueHistory ?? []).map(mapIssueHistory))
  await upsertRows(client, "mcs_division_handoffs", (snapshot.handoffs ?? []).map(mapHandoff))
  await upsertRows(client, "mcs_handoff_history", (snapshot.handoffHistory ?? []).map(mapHandoffHistory))
  await upsertRows(client, "mcs_venue_statuses", (snapshot.venueStatuses ?? []).map(mapVenueStatus))
  await upsertRows(client, "mcs_audit_logs", (snapshot.auditLogs ?? []).map(mapAuditLog))
  await upsertRows(client, "mcs_notifications", (snapshot.notifications ?? []).map(mapNotification))
}

async function syncCompetitionSnapshot(client: SupabaseClient, snapshot: CompetitionSnapshot) {
  if (snapshot.version !== 1) return

  await clearTables(client, [
    "mcs_center_notifications",
    "mcs_center_logs",
    "mcs_center_results",
    "mcs_center_judge_scores",
    "mcs_center_judging_criteria",
    "mcs_center_bracket_rounds",
    "mcs_center_matches",
    "mcs_center_teams",
    "mcs_center_participants",
    "mcs_center_competitions",
  ])

  await upsertRows(client, "mcs_center_competitions", (snapshot.competitions ?? []).map(mapCenterCompetition))
  await upsertRows(client, "mcs_center_participants", (snapshot.participants ?? []).map(mapCenterParticipant))
  await upsertRows(client, "mcs_center_teams", (snapshot.teams ?? []).map(mapCenterTeam))
  await upsertRows(client, "mcs_center_matches", (snapshot.matches ?? []).map(mapCenterMatch))
  await upsertRows(client, "mcs_center_bracket_rounds", (snapshot.brackets ?? []).map(mapCenterBracketRound))
  await upsertRows(client, "mcs_center_judging_criteria", (snapshot.criteria ?? []).map(mapCenterCriteria))
  await upsertRows(client, "mcs_center_judge_scores", (snapshot.judgeScores ?? []).map(mapCenterJudgeScore))
  await upsertRows(client, "mcs_center_results", (snapshot.results ?? []).map(mapCenterResult))
  await upsertRows(client, "mcs_center_logs", (snapshot.logs ?? []).map(mapCenterLog))
  await upsertRows(client, "mcs_center_notifications", (snapshot.notifications ?? []).map(mapCenterNotification))
}

async function clearTables(client: SupabaseClient, tables: string[]) {
  for (const table of tables) {
    const { error } = await client.from(table).delete().not("id", "is", null)

    if (error) {
      throw new Error(`Unable to clear ${table}: ${error.message}`)
    }
  }
}

async function upsertRows(client: SupabaseClient, table: string, rows: JsonObject[]) {
  if (rows.length === 0) return

  const { error } = await client.from(table).upsert(rows)

  if (error) {
    throw new Error(`Unable to sync ${table}: ${error.message}`)
  }
}

function mapCompetition(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    name: stringValue(item.name),
    short_name: stringValue(item.shortName),
    kind: stringValue(item.kind),
    category: stringValue(item.category),
    venue: stringValue(item.venue),
    pj: stringArray(item.pj),
    status: stringValue(item.status),
    progress: numberValue(item.progress),
    participant_count: numberValue(item.participantCount),
    created_at: stringValue(item.createdAt),
    updated_at: stringValue(item.updatedAt),
  }
}

function mapCommitteeDivision(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    name: stringValue(item.name),
    coordinator: stringValue(item.coordinator),
    members: numberValue(item.members),
    present: numberValue(item.present),
    late: numberValue(item.late),
    absent: numberValue(item.absent),
    excused: numberValue(item.excused),
    active_tasks: numberValue(item.activeTasks),
    completion: numberValue(item.completion),
    responsiveness: numberValue(item.responsiveness),
    status: stringValue(item.status),
    focus: stringValue(item.focus),
    created_at: stringValue(item.createdAt),
    updated_at: stringValue(item.updatedAt),
  }
}

function mapUser(item: JsonObject) {
  return {
    id: stringValue(item.id),
    display_name: stringValue(item.displayName),
    email: stringValue(item.email),
    role: stringValue(item.role),
    status: stringValue(item.status),
    tournament_ids: stringArray(item.tournamentIds),
    division_ids: stringArray(item.divisionIds),
    assigned_competition_ids: stringArray(item.assignedCompetitionIds),
    phone: nullableString(item.phone),
    photo_url: nullableString(item.photoUrl),
    password_hash: stringValue(item.passwordHash),
    password_salt: stringValue(item.passwordSalt),
    password_iterations: numberValue(item.passwordIterations),
    last_active_at: nullableString(item.lastActiveAt),
    created_at: stringValue(item.createdAt),
    updated_at: stringValue(item.updatedAt),
  }
}

function mapSession(item: JsonObject) {
  return {
    id: stringValue(item.id),
    token_hash: stringValue(item.tokenHash),
    user_id: stringValue(item.userId),
    created_at: stringValue(item.createdAt),
    last_seen_at: stringValue(item.lastSeenAt),
    expires_at: stringValue(item.expiresAt),
    ip_address: nullableString(item.ipAddress),
    user_agent: nullableString(item.userAgent),
  }
}

function mapSchedule(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    competition_id: nullableString(item.competitionId),
    date: stringValue(item.date),
    label: stringValue(item.label),
    day_name: stringValue(item.dayName),
    time: stringValue(item.time),
    duration: stringValue(item.duration),
    title: stringValue(item.title),
    venue: stringValue(item.venue),
    pic: stringValue(item.pic),
    type: stringValue(item.type),
    status: stringValue(item.status),
    notes: nullableString(item.notes),
    published_at: nullableString(item.publishedAt),
    published_by: nullableString(item.publishedBy),
    created_at: stringValue(item.createdAt),
    updated_at: stringValue(item.updatedAt),
  }
}

function mapMatch(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    competition_id: stringValue(item.competitionId),
    sport: stringValue(item.sport),
    category: stringValue(item.category),
    round: stringValue(item.round),
    venue: stringValue(item.venue),
    time: stringValue(item.time),
    team_a: stringValue(item.teamA),
    team_b: stringValue(item.teamB),
    score_a: numberValue(item.scoreA),
    score_b: numberValue(item.scoreB),
    status: stringValue(item.status),
    clock: stringValue(item.clock),
    winner: nullableString(item.winner),
    updated_by: nullableString(item.updatedBy),
    created_at: stringValue(item.createdAt),
    updated_at: stringValue(item.updatedAt),
  }
}

function mapAnnouncement(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    title: stringValue(item.title),
    body: stringValue(item.body),
    priority: stringValue(item.priority),
    audience: stringArray(item.audience),
    visibility: stringValue(item.visibility),
    status: stringValue(item.status),
    created_by: stringValue(item.createdBy),
    approved_by: nullableString(item.approvedBy),
    published_at: nullableString(item.publishedAt),
    created_at: stringValue(item.createdAt),
    updated_at: stringValue(item.updatedAt),
  }
}

function mapMedia(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    title: stringValue(item.title),
    type: stringValue(item.type),
    category: stringValue(item.category),
    meta: stringValue(item.meta),
    views: numberValue(item.views),
    src: nullableString(item.src),
    storage_path: nullableString(item.storagePath),
    visibility: stringValue(item.visibility),
    approval_status: stringValue(item.approvalStatus),
    uploaded_by: stringValue(item.uploadedBy),
    created_at: stringValue(item.createdAt),
    updated_at: stringValue(item.updatedAt),
  }
}

function mapTask(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    title: stringValue(item.title),
    description: nullableString(item.description),
    assignee_id: nullableString(item.assigneeId),
    assignee_name: stringValue(item.assigneeName),
    division_id: stringValue(item.divisionId),
    division: stringValue(item.division),
    deadline: stringValue(item.deadline),
    progress: numberValue(item.progress),
    priority: stringValue(item.priority),
    status: stringValue(item.status),
    created_by: stringValue(item.createdBy),
    completed_at: nullableString(item.completedAt),
    created_at: stringValue(item.createdAt),
    updated_at: stringValue(item.updatedAt),
  }
}

function mapIssue(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    issue_code: stringValue(item.issueCode),
    title: stringValue(item.title),
    description: stringValue(item.description),
    category: stringValue(item.category),
    severity: stringValue(item.severity),
    venue: nullableString(item.venue),
    reported_by: stringValue(item.reportedBy),
    reported_by_name: stringValue(item.reportedByName),
    assigned_to_user_id: nullableString(item.assignedToUserId),
    assigned_to_name: nullableString(item.assignedToName),
    assigned_division_id: nullableString(item.assignedDivisionId),
    assigned_division_name: nullableString(item.assignedDivisionName),
    deadline: stringValue(item.deadline),
    status: stringValue(item.status),
    resolution_notes: nullableString(item.resolutionNotes),
    escalated_at: nullableString(item.escalatedAt),
    resolved_at: nullableString(item.resolvedAt),
    closed_at: nullableString(item.closedAt),
    created_at: stringValue(item.createdAt),
    updated_at: stringValue(item.updatedAt),
  }
}

function mapIssueEvidence(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    issue_id: stringValue(item.issueId),
    title: stringValue(item.title),
    type: stringValue(item.type),
    url: nullableString(item.url),
    notes: nullableString(item.notes),
    uploaded_by: stringValue(item.uploadedBy),
    created_at: stringValue(item.createdAt),
  }
}

function mapIssueHistory(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    issue_id: stringValue(item.issueId),
    actor_id: stringValue(item.actorId),
    actor_name: stringValue(item.actorName),
    action: stringValue(item.action),
    from_status: nullableString(item.fromStatus),
    to_status: nullableString(item.toStatus),
    notes: nullableString(item.notes),
    created_at: stringValue(item.createdAt),
  }
}

function mapHandoff(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    activity: stringValue(item.activity),
    source_division_id: stringValue(item.sourceDivisionId),
    source_division_name: stringValue(item.sourceDivisionName),
    target_division_id: stringValue(item.targetDivisionId),
    target_division_name: stringValue(item.targetDivisionName),
    status: stringValue(item.status),
    owner_user_id: nullableString(item.ownerUserId),
    owner_name: stringValue(item.ownerName),
    deadline: stringValue(item.deadline),
    notes: nullableString(item.notes),
    linked_issue_id: nullableString(item.linkedIssueId),
    created_by: stringValue(item.createdBy),
    accepted_at: nullableString(item.acceptedAt),
    blocked_at: nullableString(item.blockedAt),
    completed_at: nullableString(item.completedAt),
    created_at: stringValue(item.createdAt),
    updated_at: stringValue(item.updatedAt),
  }
}

function mapHandoffHistory(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    handoff_id: stringValue(item.handoffId),
    actor_id: stringValue(item.actorId),
    actor_name: stringValue(item.actorName),
    action: stringValue(item.action),
    from_status: nullableString(item.fromStatus),
    to_status: nullableString(item.toStatus),
    notes: nullableString(item.notes),
    created_at: stringValue(item.createdAt),
  }
}

function mapVenueStatus(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    venue: stringValue(item.venue),
    status: stringValue(item.status),
    current_activity_id: nullableString(item.currentActivityId),
    next_activity_id: nullableString(item.nextActivityId),
    owner_division_id: nullableString(item.ownerDivisionId),
    owner_name: nullableString(item.ownerName),
    blocker_issue_id: nullableString(item.blockerIssueId),
    last_update: stringValue(item.lastUpdate),
    updated_at: stringValue(item.updatedAt),
  }
}

function mapAuditLog(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    user_id: stringValue(item.userId),
    user_name: stringValue(item.userName),
    role: stringValue(item.role),
    action: stringValue(item.action),
    resource: stringValue(item.resource),
    resource_id: nullableString(item.resourceId),
    timestamp: stringValue(item.timestamp),
    metadata: objectOrNull(item.metadata),
  }
}

function mapNotification(item: JsonObject) {
  return {
    id: stringValue(item.id),
    tournament_id: stringValue(item.tournamentId),
    user_id: nullableString(item.userId),
    role: nullableString(item.role),
    type: stringValue(item.type),
    title: stringValue(item.title),
    body: stringValue(item.body),
    resource: nullableString(item.resource),
    resource_id: nullableString(item.resourceId),
    status: stringValue(item.status),
    created_at: stringValue(item.createdAt),
    read_at: nullableString(item.readAt),
  }
}

function mapCenterCompetition(item: JsonObject) {
  return {
    id: stringValue(item.id),
    name: stringValue(item.name),
    category: stringValue(item.category),
    type: stringValue(item.type),
    description: stringValue(item.description),
    rules: stringArray(item.rules),
    venue: stringValue(item.venue),
    pic: stringArray(item.pic),
    status: stringValue(item.status),
    registration_start: stringValue(item.registrationStart),
    registration_end: stringValue(item.registrationEnd),
    competition_start: stringValue(item.competitionStart),
    competition_end: stringValue(item.competitionEnd),
    max_participants: nullableNumber(item.maxParticipants),
    participant_count: nullableNumber(item.participantCount),
    match_count: nullableNumber(item.matchCount),
    current_round: stringValue(item.currentRound),
    judges: nullableNumber(item.judges),
    submission_count: nullableNumber(item.submissionCount),
    image: nullableString(item.image),
    crop: nullableString(item.crop),
    created_by: stringValue(item.createdBy),
    created_date: stringValue(item.createdDate),
    updated_date: stringValue(item.updatedDate),
  }
}

function mapCenterParticipant(item: JsonObject) {
  return {
    id: stringValue(item.id),
    competition_id: stringValue(item.competitionId),
    name: stringValue(item.name),
    class_name: stringValue(item.className),
    major: stringValue(item.major),
    country_name: stringValue(item.countryName),
    country_flag: stringValue(item.countryFlag),
    registration_date: stringValue(item.registrationDate),
    status: stringValue(item.status),
    avatar: stringValue(item.avatar),
    attendance_status: nullableString(item.attendanceStatus),
    gender: nullableString(item.gender),
    notes: nullableString(item.notes),
    team_name: nullableString(item.teamName),
    verification_notes: nullableString(item.verificationNotes),
  }
}

function mapCenterTeam(item: JsonObject) {
  return {
    id: stringValue(item.id),
    competition_id: stringValue(item.competitionId),
    name: stringValue(item.name),
    captain: stringValue(item.captain),
    members: stringArray(item.members),
    class_name: stringValue(item.className),
    country_name: stringValue(item.countryName),
    country_flag: stringValue(item.countryFlag),
    status: stringValue(item.status),
  }
}

function mapCenterMatch(item: JsonObject) {
  return {
    id: stringValue(item.id),
    competition_id: stringValue(item.competitionId),
    round: stringValue(item.round),
    venue: stringValue(item.venue),
    date: stringValue(item.date),
    start_time: stringValue(item.startTime),
    end_time: nullableString(item.endTime),
    team_a: stringValue(item.teamA),
    team_b: stringValue(item.teamB),
    score_a: numberValue(item.scoreA),
    score_b: numberValue(item.scoreB),
    status: stringValue(item.status),
    live_clock: nullableString(item.liveClock),
    match_format: nullableString(item.matchFormat),
    timeline: objectOrNull(item.timeline),
    winner: nullableString(item.winner),
    notes: nullableString(item.notes),
  }
}

function mapCenterBracketRound(item: JsonObject, index: number) {
  return {
    title: stringValue(item.title),
    matches: Array.isArray(item.matches) ? item.matches : [],
    sort_order: index,
  }
}

function mapCenterCriteria(item: JsonObject) {
  return {
    id: stringValue(item.id),
    competition_id: stringValue(item.competitionId),
    label: stringValue(item.label),
    weight: numberValue(item.weight),
  }
}

function mapCenterJudgeScore(item: JsonObject) {
  return {
    id: stringValue(item.id),
    competition_id: stringValue(item.competitionId),
    judge: stringValue(item.judge),
    participant_id: stringValue(item.participantId),
    criteria_id: stringValue(item.criteriaId),
    score: numberValue(item.score),
    comments: stringValue(item.comments),
  }
}

function mapCenterResult(item: JsonObject) {
  return {
    id: stringValue(item.id),
    competition_id: stringValue(item.competitionId),
    winner: stringValue(item.winner),
    runner_up: stringValue(item.runnerUp),
    third_place: stringValue(item.thirdPlace),
    special_award_label: stringValue(item.specialAwardLabel),
    special_award_winner: stringValue(item.specialAwardWinner),
    final_notes: stringValue(item.finalNotes),
    approved_by: nullableString(item.approvedBy),
    published_at: nullableString(item.publishedAt),
  }
}

function mapCenterLog(item: JsonObject) {
  return {
    id: stringValue(item.id),
    user_id: stringValue(item.userId),
    user_name: stringValue(item.userName),
    role: stringValue(item.role),
    action: stringValue(item.action),
    resource: stringValue(item.resource),
    resource_id: nullableString(item.resourceId),
    timestamp: stringValue(item.timestamp),
    previous_value: objectOrNull(item.previousValue),
    new_value: objectOrNull(item.newValue),
  }
}

function mapCenterNotification(item: JsonObject) {
  return {
    id: stringValue(item.id),
    type: stringValue(item.type),
    title: stringValue(item.title),
    body: stringValue(item.body),
    role: nullableString(item.role),
    resource: stringValue(item.resource),
    resource_id: stringValue(item.resourceId),
    status: stringValue(item.status),
    created_at: stringValue(item.createdAt),
  }
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {}
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : ""
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function objectOrNull(value: unknown) {
  return value && typeof value === "object" ? value : null
}
