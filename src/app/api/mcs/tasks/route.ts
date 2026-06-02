import type { NextRequest } from "next/server"
import { readJson, withAuth } from "@/server/mcs/http"
import { createTask, listTasks } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return withAuth(request, "tasks.read", listTasks)
}

export async function POST(request: NextRequest) {
  const body = await readJson(request)

  return withAuth(request, "tasks.create", (auth) => createTask(auth, body))
}
