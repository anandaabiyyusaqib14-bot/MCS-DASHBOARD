import type { NextRequest } from "next/server"
import { readJson, withAuth } from "@/server/mcs/http"
import { createUser, listUsers } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return withAuth(request, "users.read", listUsers)
}

export async function POST(request: NextRequest) {
  const body = await readJson(request)

  return withAuth(request, "users.create", (auth) => createUser(auth, body))
}
