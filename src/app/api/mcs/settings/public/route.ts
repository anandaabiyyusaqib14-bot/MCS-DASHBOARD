import { readPublicMcsSettings } from "@/server/mcs/settings-store"

export const dynamic = "force-dynamic"

export async function GET() {
  return Response.json(await readPublicMcsSettings())
}
