import type { Metadata } from "next"

import { VenueOperationsScreen } from "@/components/dashboard/event-operations-center"
import { listVenueStatuses } from "@/server/mcs/service"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Status Venue - MCS 1",
  description: "Status venue operasional untuk MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function VenuesPage() {
  const { auth, summary } = await getDashboardOverviewContext("/dashboard/venues")
  const divisions = summary.committeeStatus.map((division) => ({
    coordinator: division.coordinator,
    id: division.id,
    name: division.name,
  }))

  return <VenueOperationsScreen divisions={divisions} permissions={auth.permissions} venues={listVenueStatuses(auth)} />
}
