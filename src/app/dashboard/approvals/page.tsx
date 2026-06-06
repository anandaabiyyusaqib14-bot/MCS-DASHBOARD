import type { Metadata } from "next"

import { ApprovalCenterScreen } from "@/components/dashboard/operational-center-screens"
import { listAnnouncements, listIssues, listMedia } from "@/server/mcs/service"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Pusat Approval - MCS 1",
  description: "Pusat approval pengumuman, media, dan issue close untuk MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function ApprovalsPage() {
  const { auth } = await getDashboardOverviewContext("/dashboard/approvals")
  const announcements = auth.permissions.includes("announcements.read") ? listAnnouncements(auth) : []
  const media = auth.permissions.includes("media.read") ? listMedia(auth) : []
  const issues = auth.permissions.includes("issues.read") ? listIssues(auth) : []

  return (
    <ApprovalCenterScreen
      announcements={announcements}
      issues={issues}
      media={media}
      permissions={auth.permissions}
    />
  )
}
