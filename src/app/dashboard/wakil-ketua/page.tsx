import type { Metadata } from "next"

import { RoleDashboardScreen } from "@/components/dashboard/internal-dashboard-screens"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Wakil Ketua - Sistem Kepanitiaan MCS 1",
  description: "Ringkasan progres kepanitiaan untuk wakil ketua Melati Championship Series 1.",
}

export const dynamic = "force-dynamic"

export default async function WakilKetuaDashboardPage() {
  const { auth, summary } = await getDashboardOverviewContext("/dashboard/wakil-ketua")

  return <RoleDashboardScreen role="wakil_ketua" summary={summary} user={auth.user} />
}
