import type { NextRequest } from "next/server"

import { excelResponse, normalizeExportPayload } from "@/server/mcs/export"
import { readJson, toErrorResponse } from "@/server/mcs/http"
import { ensureMcsRepositoryReady } from "@/server/mcs/repository"
import { requireAuth } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    await ensureMcsRepositoryReady()
    requireAuth(request, "reports.read")
    const body = await readJson(request)

    return excelResponse(normalizeExportPayload(body))
  } catch (error) {
    return toErrorResponse(error)
  }
}
