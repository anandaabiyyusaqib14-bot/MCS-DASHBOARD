import type { Metadata } from "next"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "MCS 1 - Event Control Center",
  description:
    "Live command center dashboard for Melati Championship Series 1 event operations.",
}

export default function DashboardPage() {
  return <DashboardShell />
}
