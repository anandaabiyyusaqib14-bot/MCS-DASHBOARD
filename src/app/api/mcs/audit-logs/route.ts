import type { NextRequest } from "next/server"
import { withAuth } from "@/server/mcs/http"
import { listAuditLogs } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return withAuth(request, undefined, listAuditLogs)
}
