import type { Metadata } from "next"

import { NotificationCenterScreen } from "@/components/dashboard/operational-center-screens"
import { listNotifications } from "@/server/mcs/service"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Pusat Notifikasi - MCS 1",
  description: "Feed notifikasi kepanitiaan penuh untuk MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const { auth } = await getDashboardOverviewContext("/dashboard/notifications")

  return <NotificationCenterScreen notifications={listNotifications(auth)} permissions={auth.permissions} />
}
