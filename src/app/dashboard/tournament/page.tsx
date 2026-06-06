import type { Metadata } from "next"

import { CompetitionManagementScreen } from "@/components/dashboard/competition-management-screen"
import { getCompetitionManagementContext } from "../_lib/competition-management-context"

export const metadata: Metadata = {
  title: "Competition Management - MCS 1",
  description:
    "Operational competition management for Melati Championship Series 1.",
}

export const dynamic = "force-dynamic"

export default async function TournamentPage() {
  const { auth: _auth, ...screenProps } = await getCompetitionManagementContext("/dashboard/tournament")
  void _auth

  return <CompetitionManagementScreen {...screenProps} />
}
