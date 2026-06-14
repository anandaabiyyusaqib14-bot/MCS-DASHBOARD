import type { Metadata } from "next"

import { IncidentCenter } from "@/components/dashboard/event-operating-system-modules"
import { listIssues } from "@/server/mcs/service"
import { getOperatingDashboardAuth } from "../_lib/operating-context"

export const metadata: Metadata = {
  title: "Incident Center - MCS 1",
  description: "Pusat kendala operasional MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function IncidentsPage() {
  const auth = await getOperatingDashboardAuth("/dashboard/incidents")

  return <IncidentCenter initialIssues={listIssues(auth)} />
}
