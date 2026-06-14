import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { ensureCompetitionSystemReady } from "@/server/mcs/competition-system"
import { ensureMcsRepositoryReady } from "@/server/mcs/repository"
import { getAuthContextFromSessionToken } from "@/server/mcs/service"
import { SESSION_COOKIE_NAME } from "@/server/mcs/types"

export async function getOperatingDashboardAuth(fromPath: string) {
  const cookieStore = await cookies()
  await Promise.all([ensureMcsRepositoryReady(), ensureCompetitionSystemReady()])

  try {
    return getAuthContextFromSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value)
  } catch {
    redirect(`/login?from=${encodeURIComponent(fromPath)}`)
  }
}
