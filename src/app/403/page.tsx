import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Access Restricted - MCS 1",
  description: "Role access boundary for Melati Championship Series 1.",
}

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F9FB] px-6 py-12 text-[#111827]">
      <section className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-[#B91C1C]">403</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-normal">Access restricted</h1>
        <p className="mt-3 text-sm leading-6 text-[#64748B]">
          Your current role does not have permission to open this dashboard route.
        </p>
        <Link
          className="mt-6 inline-flex h-10 items-center rounded-md bg-[#0F172A] px-4 text-sm font-medium text-white transition hover:bg-[#1E293B]"
          href="/dashboard"
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  )
}
