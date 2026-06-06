import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"

import { DashboardShell } from "@/components/dashboard/dashboard-shell-refined"
import { canAccessDashboardPath, getRoleHomePath, getRoleNavigation } from "@/lib/mcs-rbac"
import { getAuthContextFromSessionToken } from "@/server/mcs/service"
import { SESSION_COOKIE_NAME, roleLabels } from "@/server/mcs/types"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const pathname = headerStore.get("x-mcs-pathname") ?? "/dashboard"
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
  let auth: ReturnType<typeof getAuthContextFromSessionToken>

  try {
    auth = getAuthContextFromSessionToken(sessionToken, {
      ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: headerStore.get("user-agent") ?? undefined,
    })
  } catch {
    redirect(`/login?from=${encodeURIComponent(pathname)}`)
  }

  const homePath = getRoleHomePath(auth.user.role)

  if (!canAccessDashboardPath(auth.user.role, pathname)) {
    redirect(`/403?from=${encodeURIComponent(pathname)}`)
  }

  return (
    <DashboardShell
      homePath={homePath}
      navigation={getRoleNavigation(auth.user.role)}
      roleLabel={roleLabels[auth.user.role]}
      user={auth.user}
    >
      {children}
    </DashboardShell>
  )
}
