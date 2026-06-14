import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  DashboardModuleScreen,
  RoleDashboardScreen,
  type DashboardModuleKey,
} from "@/components/dashboard/internal-dashboard-screens"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"
import type { UserRole } from "@/server/mcs/types"

export const metadata: Metadata = {
  title: "Dashboard Workspace - MCS 1",
  description: "Internal dashboard workspace for Melati Championship Series 1.",
}

export const dynamic = "force-dynamic"

const roleRouteMap: Record<string, UserRole> = {
  acara: "acara",
  bendahara: "bendahara",
  dokumentasi: "dokumentasi",
  humas: "humas",
  keamanan: "keamanan",
  kebersihan: "kebersihan",
  kewirausahaan: "kewirausahaan",
  operator: "operator",
  perlengkapan: "perlengkapan",
  "pj-lomba": "pj_lomba",
  sekretaris: "sekretaris",
}

const moduleRouteMap: Record<string, DashboardModuleKey> = {
  administration: "administration",
  analytics: "analytics",
  audit: "reports",
  bracket: "bracket-management",
  budgeting: "budgeting",
  business: "business-operations",
  cleanliness: "cleanliness-operations",
  "division-activities": "division-activities",
  "division-status": "division-status",
  documents: "documents",
  "event-rundown": "event-rundown",
  "financial-reports": "financial-reports",
  "humas-sponsorship": "humas-sponsorship",
  inventory: "equipment-inventory",
  juknis: "juknis-management",
  "match-results": "match-results",
  media: "media-center",
  "media/archive": "media-archive",
  "media/gallery": "media-gallery",
  "media/highlights": "media-highlights",
  "media/upload": "media-upload",
  "media-posts": "media-posts",
  news: "news-center",
  "panitia-management": "panitia-management",
  participants: "participant-management",
  "publication-schedule": "publication-schedule",
  reports: "reports",
  "schedule-monitoring": "schedule-management",
  schedules: "schedule-management",
  security: "security-operations",
  settings: "settings",
  tasks: "tasks",
  "technical-support": "technical-support",
  users: "users",
}

export default async function DashboardWorkspacePage({
  params,
}: {
  params: Promise<{ path: string[] }>
}) {
  const { path } = await params
  const route = path.join("/")
  const fromPath = `/dashboard/${route}`
  const { auth, summary } = await getDashboardOverviewContext(fromPath)
  const role = roleRouteMap[route]

  if (role) {
    return <RoleDashboardScreen role={role} summary={summary} user={auth.user} />
  }

  const moduleKey = moduleRouteMap[route]

  if (moduleKey) {
    return <DashboardModuleScreen moduleKey={moduleKey} permissions={auth.permissions} summary={summary} user={auth.user} />
  }

  notFound()
}
