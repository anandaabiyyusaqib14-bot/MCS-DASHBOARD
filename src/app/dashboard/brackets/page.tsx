import type { Metadata } from "next"

import { MasterBracketCenter } from "@/components/dashboard/event-operating-system-modules"
import { getBracketCenterSnapshot } from "@/server/mcs/operating-system"
import { getOperatingDashboardAuth } from "../_lib/operating-context"

export const metadata: Metadata = {
  title: "Master Bracket Center - MCS 1",
  description: "Pusat bracket pertandingan MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function BracketsPage() {
  const auth = await getOperatingDashboardAuth("/dashboard/brackets")

  return <MasterBracketCenter snapshot={getBracketCenterSnapshot(auth)} />
}
