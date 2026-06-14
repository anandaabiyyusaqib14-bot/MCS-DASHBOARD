import type { NextRequest } from "next/server"
import { getPaginationOptions, paginated, readJson, withAuth } from "@/server/mcs/http"
import { listAuditLogs, recordAuditActivity } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const pagination = getPaginationOptions(request)

  return withAuth(request, undefined, (auth) =>
    paginated(
      listAuditLogs(auth),
      pagination,
      (log) => [log.action, log.resource, log.resourceId, log.userName, log.timestamp].join(" "),
      (log) => [log.action, log.resource, log.userName].join(" "),
    ),
  )
}

export async function POST(request: NextRequest) {
  const body = await readJson(request)

  return withAuth(request, undefined, (auth) => recordAuditActivity(auth, body))
}
