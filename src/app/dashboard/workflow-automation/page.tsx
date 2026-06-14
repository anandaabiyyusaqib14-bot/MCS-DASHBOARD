import type { Metadata } from "next"

import { WorkflowAutomationCenter } from "@/components/dashboard/event-operating-system-modules"
import { getOperatingDashboardAuth } from "../_lib/operating-context"

export const metadata: Metadata = {
  title: "Workflow Automation - MCS 1",
  description: "Alur otomatis jadwal, live match, bracket, ranking, landing page, dan analytics.",
}

export const dynamic = "force-dynamic"

export default async function WorkflowAutomationPage() {
  await getOperatingDashboardAuth("/dashboard/workflow-automation")

  return <WorkflowAutomationCenter />
}
