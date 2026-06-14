import type { Metadata } from "next"

import { LiveScoreControlRoom } from "@/components/dashboard/live-score-control-room"

export const metadata: Metadata = {
  title: "Pantauan Pertandingan - MCS 1",
  description:
    "Pantauan pertandingan live untuk Melati Championship Series 1.",
}

export const dynamic = "force-dynamic"

export default function LiveMatchPage() {
  return <LiveScoreControlRoom />
}
