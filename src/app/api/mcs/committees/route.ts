import type { NextRequest } from "next/server"
import { readJson, withAuth } from "@/server/mcs/http"
import { listCommittees, updateCommittee } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return withAuth(request, "committees.read", listCommittees)
}

export async function PATCH(request: NextRequest) {
  const body = await readJson(request)
  const id = typeof body.id === "string" ? body.id : ""

  return withAuth(request, "committees.update", (auth) => updateCommittee(auth, id, body))
}
