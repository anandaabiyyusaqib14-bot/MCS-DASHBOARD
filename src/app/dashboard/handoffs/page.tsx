import type { Metadata } from "next"

import { HandoffsCenterScreen } from "@/components/dashboard/event-operations-center"
import { listCommittees, listHandoffs } from "@/server/mcs/service"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Koordinasi Divisi - MCS 1",
  description: "Catatan koordinasi antar divisi untuk MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function HandoffsPage() {
  const { auth } = await getDashboardOverviewContext("/dashboard/handoffs")
  const divisions = listCommittees(auth).map((division) => ({
    coordinator: division.coordinator,
    id: division.id,
    name: division.name,
  }))

  return (
    <HandoffsCenterScreen
      divisions={divisions}
      handoffs={listHandoffs(auth)}
      permissions={auth.permissions}
      user={auth.user}
    />
  )
}
