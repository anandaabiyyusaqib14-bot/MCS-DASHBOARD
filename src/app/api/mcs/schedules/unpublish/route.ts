import type { NextRequest } from "next/server"

import { withAuth } from "@/server/mcs/http"
import { unpublishRundown } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  return withAuth(request, "schedules.update", unpublishRundown)
}
