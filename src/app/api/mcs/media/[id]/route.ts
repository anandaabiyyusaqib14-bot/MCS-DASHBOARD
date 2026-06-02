import type { NextRequest } from "next/server"
import { readJson, withAuth } from "@/server/mcs/http"
import { deleteMedia, updateMedia } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

type Params = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: Params) {
  const body = await readJson(request)
  const { id } = await context.params

  return withAuth(request, undefined, (auth) => updateMedia(auth, id, body))
}

export async function DELETE(request: NextRequest, context: Params) {
  const { id } = await context.params

  return withAuth(request, "media.delete", (auth) => deleteMedia(auth, id))
}
