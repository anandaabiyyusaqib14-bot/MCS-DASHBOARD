import type { NextRequest } from "next/server"
import { getPaginationOptions, paginated, readJson, withAuth } from "@/server/mcs/http"
import { createMedia, listMedia } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const pagination = getPaginationOptions(request)

  return withAuth(request, "media.read", (auth) =>
    paginated(
      listMedia(auth),
      pagination,
      (media) => [media.title, media.type, media.category, media.meta, media.visibility, media.approvalStatus].join(" "),
      (media) => [media.type, media.category, media.visibility, media.approvalStatus].join(" "),
    ),
  )
}

export async function POST(request: NextRequest) {
  const body = await readJson(request)

  return withAuth(request, "media.upload", (auth) => createMedia(auth, body))
}
