import type { Metadata } from "next"

import { AttendanceSystem } from "@/components/dashboard/event-operating-system-modules"
import { getAttendanceCenterSnapshot } from "@/server/mcs/operating-system"
import { getOperatingDashboardAuth } from "../_lib/operating-context"

export const metadata: Metadata = {
  title: "QR Attendance System - MCS 1",
  description: "Absensi QR untuk panitia, peserta, dan juri MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function AttendancePage() {
  const auth = await getOperatingDashboardAuth("/dashboard/attendance")

  return <AttendanceSystem snapshot={getAttendanceCenterSnapshot(auth)} />
}
