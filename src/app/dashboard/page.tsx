import type { Metadata } from "next"

import { RoleDashboardScreen } from "@/components/dashboard/internal-dashboard-screens"
import { TournamentOperationCenter } from "@/components/dashboard/tournament-operation-center"
import { getDashboardOverviewContext } from "./_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "MCS 1 - Tournament Operation Center",
  description:
    "Dashboard operasional Hari-H untuk Melati Championship Series 1.",
}

export const dynamic = "force-dynamic"

// Roles that use the Tournament Operation Center as their main dashboard
const tocRoles = new Set([
  "super_admin",
  "ketua_pelaksana",
  "wakil_ketua",
  "pj_lomba",
  "operator",
  "acara",
])

export default async function DashboardPage() {
  const { auth, summary } = await getDashboardOverviewContext("/dashboard")

  if (tocRoles.has(auth.user.role)) {
    return <TournamentOperationCenter summary={summary} user={auth.user} />
  }

  return <RoleDashboardScreen role={auth.user.role} summary={summary} user={auth.user} />
}
