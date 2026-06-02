import type { NextRequest } from "next/server"
import { readJson, withAuth } from "@/server/mcs/http"
import { createMedia, listMedia } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return withAuth(request, "media.read", listMedia)
}

export async function POST(request: NextRequest) {
  const body = await readJson(request)

  return withAuth(request, "media.upload", (auth) => createMedia(auth, body))
}
