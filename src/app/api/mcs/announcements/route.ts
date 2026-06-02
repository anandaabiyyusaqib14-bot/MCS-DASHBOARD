import type { NextRequest } from "next/server"
import { readJson, withAuth } from "@/server/mcs/http"
import { createAnnouncement, listAnnouncements } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return withAuth(request, "announcements.read", listAnnouncements)
}

export async function POST(request: NextRequest) {
  const body = await readJson(request)

  return withAuth(request, "announcements.create", (auth) => createAnnouncement(auth, body))
}
