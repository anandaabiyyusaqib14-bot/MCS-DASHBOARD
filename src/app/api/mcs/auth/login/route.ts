import { NextResponse, type NextRequest } from "next/server"
import { readJson, toErrorResponse } from "@/server/mcs/http"
import { ensureMcsRepositoryReady } from "@/server/mcs/repository"
import { login } from "@/server/mcs/service"
import { SESSION_COOKIE_NAME } from "@/server/mcs/types"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    await ensureMcsRepositoryReady()
    const body = await readJson(request)
    const { sessionToken, maxAge, ...data } = login(body, request)
    const response = NextResponse.json({ data })

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    })

    return response
  } catch (error) {
    return toErrorResponse(error)
  }
}
