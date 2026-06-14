import type { Metadata } from "next"

import { CertificateEngine } from "@/components/dashboard/event-operating-system-modules"
import { getCertificateCenterSnapshot } from "@/server/mcs/operating-system"
import { getOperatingDashboardAuth } from "../_lib/operating-context"

export const metadata: Metadata = {
  title: "Certificate Engine - MCS 1",
  description: "Generator sertifikat MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function CertificatesPage() {
  const auth = await getOperatingDashboardAuth("/dashboard/certificates")

  return <CertificateEngine snapshot={getCertificateCenterSnapshot(auth)} />
}
