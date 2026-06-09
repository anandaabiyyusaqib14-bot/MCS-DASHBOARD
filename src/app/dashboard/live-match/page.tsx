import type { Metadata } from "next"

import { DashboardModuleScreen } from "@/components/dashboard/internal-dashboard-screens"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Pantauan Pertandingan - MCS 1",
  description:
    "Pantauan pertandingan live untuk Melati Championship Series 1.",
}

export const dynamic = "force-dynamic"

export default async function LiveMatchPage() {
  const { summary } = await getDashboardOverviewContext("/dashboard/live-match")

  return <DashboardModuleScreen moduleKey="live-match" summary={summary} />
}
