import type { Metadata } from "next"

import { RoleDashboardScreen } from "@/components/dashboard/internal-dashboard-screens"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Wakil Ketua Dashboard - MCS 1",
  description: "Operational command center overview for Melati Championship Series 1 leadership.",
}

export const dynamic = "force-dynamic"

export default async function WakilKetuaDashboardPage() {
  const { auth, summary } = await getDashboardOverviewContext("/dashboard/wakil-ketua")

  return <RoleDashboardScreen role="wakil_ketua" summary={summary} user={auth.user} />
}
