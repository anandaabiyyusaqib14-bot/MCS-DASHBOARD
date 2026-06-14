import type { Metadata } from "next"

import { EventCommandCenter } from "@/components/dashboard/event-operating-system-modules"
import { getCommandCenterSnapshot } from "@/server/mcs/operating-system"
import { getOperatingDashboardAuth } from "../_lib/operating-context"

export const metadata: Metadata = {
  title: "Event Command Center - MCS 1",
  description: "Pusat komando Hari H MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function CommandCenterPage() {
  const auth = await getOperatingDashboardAuth("/dashboard/command-center")

  return <EventCommandCenter snapshot={getCommandCenterSnapshot(auth)} />
}
