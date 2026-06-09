import type { Metadata } from "next"

import { IssuesCenterScreen } from "@/components/dashboard/event-operations-center"
import { listCommittees, listIssues } from "@/server/mcs/service"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Kendala Aktif - MCS 1",
  description: "Catatan kendala aktif dan tindak lanjut kepanitiaan MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function IssuesPage() {
  const { auth } = await getDashboardOverviewContext("/dashboard/issues")
  const divisions = listCommittees(auth).map((division) => ({
    coordinator: division.coordinator,
    id: division.id,
    name: division.name,
  }))

  return (
    <IssuesCenterScreen
      divisions={divisions}
      issues={listIssues(auth)}
      permissions={auth.permissions}
      user={auth.user}
    />
  )
}
