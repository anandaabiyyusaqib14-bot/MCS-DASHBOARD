import type { Metadata } from "next"

import { CertificateVerificationPage } from "@/components/dashboard/event-operating-system-modules"

export const metadata: Metadata = {
  title: "Verifikasi Sertifikat - MCS 1",
  description: "Halaman verifikasi sertifikat MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function VerifyCertificatePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams

  return <CertificateVerificationPage certificateId={id} />
}
