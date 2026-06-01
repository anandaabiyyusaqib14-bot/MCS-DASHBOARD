import type { Metadata } from "next"

import { LiveMatchScreen } from "@/components/dashboard/live-match-screen"

export const metadata: Metadata = {
  title: "Live Match - MCS 1",
  description:
    "Live championship scoreboard, match timeline, tournament progression, and match control panel for Melati Championship Series 1.",
}

export default function LiveMatchPage() {
  return <LiveMatchScreen />
}
