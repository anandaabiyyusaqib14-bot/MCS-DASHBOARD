import type { NextRequest } from "next/server"
import { ok, toErrorResponse } from "@/server/mcs/http"
import { logoutRequest } from "@/server/mcs/service"
import { SESSION_COOKIE_NAME } from "@/server/mcs/types"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    logoutRequest(request)
    const response = ok({ loggedOut: true })
    response.cookies.delete(SESSION_COOKIE_NAME)

    return response
  } catch (error) {
    return toErrorResponse(error)
  }
}
