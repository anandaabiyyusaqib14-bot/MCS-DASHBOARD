import type { Metadata } from "next"

import { CompetitionManagementCenter } from "@/components/dashboard/competition-management-center"

export const metadata: Metadata = {
  title: "Competition Center - MCS 1",
  description:
    "Competition headquarters for registration, participants, brackets, judging, scoring, results, and reports for Melati Championship Series 1.",
}

export default function TournamentPage() {
  return <CompetitionManagementCenter />
}
