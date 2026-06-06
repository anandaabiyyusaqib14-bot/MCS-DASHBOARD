import type { Metadata } from "next"

import { RoleDashboardScreen } from "@/components/dashboard/internal-dashboard-screens"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Ketua Dashboard - MCS 1",
  description: "Operational command center overview for Melati Championship Series 1 leadership.",
}

export const dynamic = "force-dynamic"

export default async function KetuaDashboardPage() {
  const { auth, summary } = await getDashboardOverviewContext("/dashboard/ketua")

  return <RoleDashboardScreen role="ketua_pelaksana" summary={summary} user={auth.user} />
}
