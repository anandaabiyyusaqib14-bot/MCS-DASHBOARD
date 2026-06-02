import type { NextRequest } from "next/server"
import { readJson, withAuth } from "@/server/mcs/http"
import { createSchedule, listSchedules } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return withAuth(request, "schedules.read", listSchedules)
}

export async function POST(request: NextRequest) {
  const body = await readJson(request)

  return withAuth(request, "schedules.create", (auth) => createSchedule(auth, body))
}
