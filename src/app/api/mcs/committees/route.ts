import type { NextRequest } from "next/server"
import { getPaginationOptions, paginated, readJson, withAuth } from "@/server/mcs/http"
import { listCommittees, updateCommittee } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const pagination = getPaginationOptions(request)

  return withAuth(request, "committees.read", (auth) =>
    paginated(
      listCommittees(auth),
      pagination,
      (division) => [division.name, division.coordinator, division.status, division.id].join(" "),
      (division) => [division.status, division.id].join(" "),
    ),
  )
}

export async function PATCH(request: NextRequest) {
  const body = await readJson(request)
  const id = typeof body.id === "string" ? body.id : ""

  return withAuth(request, "committees.update", (auth) => updateCommittee(auth, id, body))
}
