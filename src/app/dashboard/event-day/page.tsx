import type { Metadata } from "next"

import { EventDayModeScreen } from "@/components/dashboard/event-operations-center"
import { getEventDaySummary } from "@/server/mcs/service"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Hari Kegiatan - MCS 1",
  description: "Ringkasan hari kegiatan untuk MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function EventDayPage() {
  const { auth } = await getDashboardOverviewContext("/dashboard/event-day")

  return <EventDayModeScreen eventDay={getEventDaySummary(auth)} permissions={auth.permissions} />
}
