import type { Metadata } from "next"

import { RoleDashboardScreen } from "@/components/dashboard/internal-dashboard-screens"
import { SuperAdminOverview } from "@/components/dashboard/super-admin-overview"
import { getDashboardOverviewContext } from "./_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "MCS 1 - Event Control Center",
  description:
    "Live command center dashboard for Melati Championship Series 1 event operations.",
}

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { auth, summary } = await getDashboardOverviewContext("/dashboard")

  if (auth.user.role === "super_admin") {
    return <SuperAdminOverview permissions={auth.permissions} summary={summary} user={auth.user} />
  }

  return <RoleDashboardScreen role={auth.user.role} summary={summary} user={auth.user} />
}
