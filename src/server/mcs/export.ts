type ExportColumn = {
  key: string
  label: string
}

const MAX_EXPORT_COLUMNS = 40
const MAX_EXPORT_ROWS = 5_000
const MAX_EXPORT_CELL_LENGTH = 2_000

export type ExportPayload = {
  columns?: ExportColumn[]
  filename?: string
  rows?: Array<Record<string, unknown>>
  title?: string
}

export function normalizeExportPayload(input: unknown): Required<ExportPayload> {
  const payload = input && typeof input === "object" ? (input as ExportPayload) : {}
  const rows = Array.isArray(payload.rows) ? payload.rows.slice(0, MAX_EXPORT_ROWS).map(normalizeRow) : []
  const inferredColumns = rows[0]
    ? Object.keys(rows[0]).map((key) => ({ key, label: formatColumnLabel(key) }))
    : []
  const columns = normalizeColumns(
    Array.isArray(payload.columns) && payload.columns.length > 0 ? payload.columns : inferredColumns
  )

  return {
    columns,
    filename: sanitizeFilename(payload.filename || "mcs-export"),
    rows,
    title: payload.title || "MCS 1 Export",
  }
}

function normalizeColumns(columns: ExportColumn[]) {
  return columns
    .filter((column) => typeof column.key === "string" && typeof column.label === "string")
    .slice(0, MAX_EXPORT_COLUMNS)
    .map((column) => ({
      key: column.key.slice(0, 120),
      label: column.label.slice(0, 120),
    }))
}

function normalizeRow(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      typeof value === "string" && value.length > MAX_EXPORT_CELL_LENGTH
        ? `${value.slice(0, MAX_EXPORT_CELL_LENGTH)}...`
        : value,
    ])
  )
}

export function csvResponse(payload: Required<ExportPayload>) {
  const csv = [
    payload.columns.map((column) => escapeCsv(column.label)).join(","),
    ...payload.rows.map((row) => payload.columns.map((column) => escapeCsv(row[column.key])).join(",")),
  ].join("\n")

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${payload.filename}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  })
}

export async function excelResponse(payload: Required<ExportPayload>) {
  const XLSX = await import("xlsx-js-style")
  const table = [
    payload.columns.map((column) => column.label),
    ...payload.rows.map((row) => payload.columns.map((column) => formatCell(row[column.key]))),
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(table)
  worksheet["!cols"] = payload.columns.map((column) => ({ wch: Math.max(column.label.length + 4, 18) }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Export")
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition": `attachment; filename="${payload.filename}.xlsx"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  })
}

export async function pdfResponse(payload: Required<ExportPayload>) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
  const autoTable = autoTableModule.default
  const doc = new jsPDF({ orientation: payload.columns.length > 6 ? "landscape" : "portrait", unit: "pt" })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text(payload.title, 40, 40)
  autoTable(doc, {
    head: [payload.columns.map((column) => column.label)],
    body: payload.rows.map((row) => payload.columns.map((column) => formatCell(row[column.key]))),
    margin: { top: 58, left: 40, right: 40 },
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [8, 28, 58], textColor: 255 },
  })
  const buffer = Buffer.from(doc.output("arraybuffer"))

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition": `attachment; filename="${payload.filename}.pdf"`,
      "Content-Type": "application/pdf",
    },
  })
}

function escapeCsv(value: unknown) {
  const text = formatCell(value)

  if (!/[",\n]/.test(text)) return text

  return `"${text.replaceAll("\"", "\"\"")}"`
}

function formatCell(value: unknown) {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function formatColumnLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, "_").replace(/^_+|_+$/g, "") || "mcs-export"
}
