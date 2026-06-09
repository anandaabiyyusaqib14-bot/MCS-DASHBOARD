import type { Metadata } from "next"

import { SuperAdminOverview } from "@/components/dashboard/super-admin-overview"
import { getDashboardOverviewContext } from "../_lib/dashboard-overview-context"

export const metadata: Metadata = {
  title: "Super Admin - Sistem Kepanitiaan MCS 1",
  description: "Ringkasan manajemen kepanitiaan untuk Melati Championship Series 1.",
}

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const { auth, summary } = await getDashboardOverviewContext("/dashboard/admin")

  return <SuperAdminOverview permissions={auth.permissions} summary={summary} user={auth.user} />
}
