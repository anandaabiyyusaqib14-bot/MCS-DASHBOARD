import type { Metadata } from "next"

import { AnnouncementBroadcastScreen } from "@/components/dashboard/announcement-broadcast-screen"

export const metadata: Metadata = {
  title: "Announcements & Broadcast - MCS 1",
  description:
    "Event communication command center, broadcast composer, delivery analytics, and announcement timeline for Melati Championship Series 1.",
}

export default function AnnouncementsPage() {
  return <AnnouncementBroadcastScreen />
}
