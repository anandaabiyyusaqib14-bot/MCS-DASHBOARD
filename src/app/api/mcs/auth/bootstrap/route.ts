import { NextResponse, type NextRequest } from "next/server"
import { readJson, toErrorResponse } from "@/server/mcs/http"
import { ensureMcsRepositoryReady } from "@/server/mcs/repository"
import { bootstrapInitialAdmin } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    await ensureMcsRepositoryReady()
    const body = await readJson(request)
    const secret =
      request.headers.get("x-mcs-bootstrap-secret") ??
      (typeof body.bootstrapSecret === "string" ? body.bootstrapSecret : null)

    const user = bootstrapInitialAdmin(body, secret)

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
