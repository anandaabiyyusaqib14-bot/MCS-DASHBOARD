import type { Metadata } from "next"

import { LiveScoreControlRoom } from "@/components/dashboard/live-score-control-room"

export const metadata: Metadata = {
  title: "Live Score Control Room - MCS 1",
  description: "Control room skor pertandingan MCS Nations Championship.",
}

export const dynamic = "force-dynamic"

export default function LiveScoreControlRoomPage() {
  return <LiveScoreControlRoom />
}
