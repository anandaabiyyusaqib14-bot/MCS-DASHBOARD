import { NextResponse, type NextRequest } from "next/server"
import { McsError, requireAuth } from "./service"
import type { AuthContext, Permission } from "./types"

type AuthenticatedHandler<T> = (auth: AuthContext) => Promise<T> | T

export async function withAuth<T>(
  request: NextRequest,
  permission: Permission | undefined,
  handler: AuthenticatedHandler<T>
) {
  try {
    const auth = requireAuth(request, permission)
    const data = await handler(auth)

    return ok(data)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function readJson(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()

    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>
    }
  } catch {
    return {}
  }

  return {}
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init)
}

export function toErrorResponse(error: unknown) {
  if (error instanceof McsError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status }
    )
  }

  const message = error instanceof Error ? error.message : "Unexpected server error."

  return NextResponse.json(
    {
      error: {
        code: "internal_error",
        message,
      },
    },
    { status: 500 }
  )
}
