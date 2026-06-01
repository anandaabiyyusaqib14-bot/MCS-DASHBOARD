import type { Metadata } from "next"

import { TournamentManagementScreen } from "@/components/dashboard/tournament-management-screen"

export const metadata: Metadata = {
  title: "Tournament Management - MCS 1",
  description:
    "Match operations, live scoring, bracket progression, and tournament controls for Melati Championship Series 1.",
}

export default function TournamentPage() {
  return <TournamentManagementScreen />
}
