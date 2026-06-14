import type { NextRequest } from "next/server"
import { getPaginationOptions, paginated, readJson, withAuth } from "@/server/mcs/http"
import { createUser, listUsers } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const pagination = getPaginationOptions(request)

  return withAuth(request, "users.read", (auth) =>
    paginated(
      listUsers(auth),
      pagination,
      (user) => [user.displayName, user.email, user.role, user.status, user.divisionIds.join(" ")].join(" "),
      (user) => [user.role, user.status, user.divisionIds.join(" ")].join(" "),
    ),
  )
}

export async function POST(request: NextRequest) {
  const body = await readJson(request)

  return withAuth(request, "users.create", (auth) => createUser(auth, body))
}
