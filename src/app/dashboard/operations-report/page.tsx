import type { Metadata } from "next"

import { OperationsReportScreen } from "@/components/dashboard/operational-center-screens"
import { getEventDaySummary, listHandoffs, listIssues, listVenueStatuses } from "@/server/mcs/service"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Laporan Operasional - MCS 1",
  description: "Rekap kendala, handoff, venue, dan post-event summary MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function OperationsReportPage() {
  const { auth } = await getDashboardOverviewContext("/dashboard/operations-report")

  return (
    <OperationsReportScreen
      eventDay={getEventDaySummary(auth)}
      handoffs={listHandoffs(auth)}
      issues={listIssues(auth)}
      venues={listVenueStatuses(auth)}
    />
  )
}
