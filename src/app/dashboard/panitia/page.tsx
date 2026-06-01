import type { Metadata } from "next"

import { PanitiaManagementScreen } from "@/components/dashboard/panitia-management-screen"

export const metadata: Metadata = {
  title: "MCS 1 - Panitia Management",
  description:
    "Committee workforce command center for Melati Championship Series 1 event operations.",
}

export default function PanitiaPage() {
  return <PanitiaManagementScreen />
}
