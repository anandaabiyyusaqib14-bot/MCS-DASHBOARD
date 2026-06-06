import { mkdir, writeFile } from "node:fs/promises"
import { extname, join } from "node:path"
import { randomUUID } from "node:crypto"
import type { NextRequest } from "next/server"

import { withAuth } from "@/server/mcs/http"
import { McsError, addIssueEvidence } from "@/server/mcs/service"

export const dynamic = "force-dynamic"

type Params = {
  params: Promise<{ id: string }>
}

const uploadDir = join(process.cwd(), "public", "uploads", "mcs-evidence")

export async function POST(request: NextRequest, context: Params) {
  const { id } = await context.params

  return withAuth(request, "issues.update", async (auth) => {
    const form = await request.formData()
    const file = form.get("file")
    const title = getFormString(form, "title") || "Bukti Kendala"
    const notes = getFormString(form, "notes")

    if (!(file instanceof File) || file.size === 0) {
      throw new McsError(400, "invalid_evidence_file", "File bukti wajib diunggah.")
    }

    await mkdir(uploadDir, { recursive: true })
    const extension = extname(file.name) || getExtensionFromType(file.type)
    const fileName = `${randomUUID()}${extension}`
    const storagePath = join(uploadDir, fileName)
    await writeFile(storagePath, Buffer.from(await file.arrayBuffer()))

    return addIssueEvidence(auth, id, {
      notes,
      title,
      type: getEvidenceType(file.type),
      url: `/uploads/mcs-evidence/${fileName}`,
    })
  })
}

function getFormString(form: FormData, key: string) {
  const value = form.get(key)
  return typeof value === "string" ? value.trim() : undefined
}

function getEvidenceType(contentType: string) {
  if (contentType.startsWith("image/")) return "image"
  if (contentType.startsWith("video/")) return "video"
  return "document"
}

function getExtensionFromType(contentType: string) {
  if (contentType === "image/png") return ".png"
  if (contentType === "image/jpeg") return ".jpg"
  if (contentType === "image/webp") return ".webp"
  if (contentType === "video/mp4") return ".mp4"
  if (contentType === "application/pdf") return ".pdf"
  return ".bin"
}
