import type { Metadata } from "next"

import { TvDisplayMode } from "@/components/dashboard/event-operating-system-modules"
import { ensureCompetitionSystemReady } from "@/server/mcs/competition-system"
import { ensureMcsRepositoryReady } from "@/server/mcs/repository"
import { getDisplaySnapshot } from "@/server/mcs/operating-system"

export const metadata: Metadata = {
  title: "TV Display Mode - MCS 1",
  description: "Tampilan publik fullscreen untuk live score, ranking, bracket, sponsor, dan announcement.",
}

export const dynamic = "force-dynamic"

export default async function DisplayPage() {
  await Promise.all([ensureMcsRepositoryReady(), ensureCompetitionSystemReady()])

  return <TvDisplayMode snapshot={getDisplaySnapshot()} />
}
