import type { Metadata } from "next"

import { NationRankingCenter } from "@/components/dashboard/event-operating-system-modules"
import { getNationRankingRows } from "@/server/mcs/operating-system"
import { getOperatingDashboardAuth } from "../_lib/operating-context"

export const metadata: Metadata = {
  title: "Nation Ranking Center - MCS 1",
  description: "Ranking negara dari live score, bracket, dan hasil pertandingan.",
}

export const dynamic = "force-dynamic"

export default async function NationRankingPage() {
  await getOperatingDashboardAuth("/dashboard/nation-ranking")

  return <NationRankingCenter rows={getNationRankingRows()} />
}
