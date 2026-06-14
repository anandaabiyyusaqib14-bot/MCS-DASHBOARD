import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import { getDashboard, getAuthContextFromSessionToken } from "@/server/mcs/service"
import { ensureMcsRepositoryReady } from "@/server/mcs/repository"
import { SESSION_COOKIE_NAME } from "@/server/mcs/types"

export async function getDashboardOverviewContext(fromPath: string) {
  const cookieStore = await cookies()
  await ensureMcsRepositoryReady()

  try {
    const auth = getAuthContextFromSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value)

    return {
      auth,
      summary: getDashboard(auth),
    }
  } catch {
    redirect(`/login?from=${encodeURIComponent(fromPath)}`)
  }
}
