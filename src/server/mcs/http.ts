import { NextResponse, type NextRequest } from "next/server"
import { McsError, requireAuth } from "./service"
import { ensureMcsRepositoryReady } from "./repository"
import type { AuthContext, Permission } from "./types"

type AuthenticatedHandler<T> = (auth: AuthContext) => Promise<T> | T

export async function withAuth<T>(
  request: NextRequest,
  permission: Permission | undefined,
  handler: AuthenticatedHandler<T>
) {
  try {
    await ensureMcsRepositoryReady()
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
  if (isPaginatedResult(data)) {
    return NextResponse.json({ data: data.data, pagination: data.pagination }, init)
  }

  return NextResponse.json({ data }, init)
}

export type PaginationOptions = {
  filter: string
  limit: number
  page: number
  search: string
}

export function getPaginationOptions(request: NextRequest): PaginationOptions {
  const page = clampNumber(request.nextUrl.searchParams.get("page"), 1, 1, 10_000)
  const limit = clampNumber(request.nextUrl.searchParams.get("limit"), 25, 1, 200)

  return {
    filter: request.nextUrl.searchParams.get("filter")?.trim().toLowerCase() ?? "",
    limit,
    page,
    search: request.nextUrl.searchParams.get("search")?.trim().toLowerCase() ?? "",
  }
}

export function paginated<T>(
  items: T[],
  options: PaginationOptions,
  getSearchText: (item: T) => string,
  getFilterText: (item: T) => string = getSearchText,
) {
  const filtered = items.filter((item) => {
    const searchText = getSearchText(item).toLowerCase()
    const filterText = getFilterText(item).toLowerCase()
    const matchesSearch = !options.search || searchText.includes(options.search)
    const matchesFilter = !options.filter || filterText.includes(options.filter)

    return matchesSearch && matchesFilter
  })
  const total = filtered.length
  const start = (options.page - 1) * options.limit
  const data = filtered.slice(start, start + options.limit)

  return {
    __paginated: true as const,
    data,
    pagination: {
      limit: options.limit,
      page: options.page,
      total,
      totalPages: Math.max(Math.ceil(total / options.limit), 1),
    },
  }
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

function clampNumber(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return fallback

  return Math.min(Math.max(Math.trunc(parsed), min), max)
}

function isPaginatedResult(value: unknown): value is {
  __paginated: true
  data: unknown[]
  pagination: { limit: number; page: number; total: number; totalPages: number }
} {
  return Boolean(value && typeof value === "object" && "__paginated" in value)
}
