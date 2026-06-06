import type { Metadata } from "next"

import { DashboardModuleScreen } from "@/components/dashboard/internal-dashboard-screens"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Announcement Center - MCS 1",
  description:
    "Internal announcement center for Melati Championship Series 1.",
}

export const dynamic = "force-dynamic"

export default async function AnnouncementsPage() {
  const { summary } = await getDashboardOverviewContext("/dashboard/announcements")

  return <DashboardModuleScreen moduleKey="announcement-center" summary={summary} />
}
