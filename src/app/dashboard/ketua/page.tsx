import type { Metadata } from "next"

import { RoleDashboardScreen } from "@/components/dashboard/internal-dashboard-screens"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Ketua Pelaksana - Sistem Kepanitiaan MCS 1",
  description: "Ringkasan progres kepanitiaan untuk pimpinan Melati Championship Series 1.",
}

export const dynamic = "force-dynamic"

export default async function KetuaDashboardPage() {
  const { auth, summary } = await getDashboardOverviewContext("/dashboard/ketua")

  return <RoleDashboardScreen role="ketua_pelaksana" summary={summary} user={auth.user} />
}
