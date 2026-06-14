import type { Metadata } from "next"

import { JudgePanel } from "@/components/dashboard/event-operating-system-modules"
import { getJudgingCenterSnapshot } from "@/server/mcs/operating-system"
import { getOperatingDashboardAuth } from "../_lib/operating-context"

export const metadata: Metadata = {
  title: "Judge Panel - MCS 1",
  description: "Panel penilaian Solo Vokal, Canvas Drawing, Best News Card, dan Best News Video.",
}

export const dynamic = "force-dynamic"

export default async function JudgingPage() {
  const auth = await getOperatingDashboardAuth("/dashboard/judging")

  return <JudgePanel snapshot={getJudgingCenterSnapshot(auth)} />
}
