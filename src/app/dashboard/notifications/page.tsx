import type { Metadata } from "next"

import { NotificationCenterV2 } from "@/components/dashboard/event-operating-system-modules"
import { getNotificationCenterSnapshot } from "@/server/mcs/operating-system"
import { getOperatingDashboardAuth } from "../_lib/operating-context"

export const metadata: Metadata = {
  title: "Notification Center V2 - MCS 1",
  description: "Feed notifikasi operasional penuh untuk MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const auth = await getOperatingDashboardAuth("/dashboard/notifications")

  return <NotificationCenterV2 notifications={getNotificationCenterSnapshot(auth)} />
}
