import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Dashboard - MCS 1",
  description:
    "Role-based internal dashboard for Melati Championship Series 1.",
}

export const dynamic = "force-dynamic"

export default async function PanitiaPage() {
  redirect("/dashboard")
}
