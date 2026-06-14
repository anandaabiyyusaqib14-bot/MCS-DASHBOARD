import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx-js-style"

// Models for export
export type ProductCategory = "Makanan" | "Minuman" | "Snack" | "Merchandise" | "Voucher" | "Lainnya"
export type PaymentMethod = "Cash" | "QRIS" | "Transfer" | "E-Wallet"
export type ExpenseCategory = "Produksi" | "Logistik" | "Konsumsi" | "Operasional" | "Marketing" | "Lainnya"

export type Product = {
  id: string
  name: string
  category: ProductCategory
  price: number
  capitalPrice: number
  initialStock: number
  currentStock: number
  minStockAlert: number
  unit: string
  description: string
  status: "Aman" | "Stok Rendah" | "Kritis" | "Stok Habis" | "Tersedia"
  createdAt: string
}

export type SalesTransaction = {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
  discount: number
  subtotal: number
  total: number
  profit: number
  paymentMethod: PaymentMethod
  recordedBy: string
  notes: string
  createdAt: string
}

export type StockMovement = {
  id: string
  productId: string
  productName: string
  type: "Tambah Stok" | "Kurangi Stok" | "Koreksi Stok"
  quantity: number
  reason: string
  createdAt: string
}

export type Expense = {
  id: string
  name: string
  category: ExpenseCategory
  amount: number
  date: string
  pic: string
  notes: string
  createdAt: string
}

export type ActivityLogEntry = {
  id: string
  action: string
  resource: string
  details: string
  timestamp: string
  actor: string
}

export type ExportDataPayload = {
  products: Product[]
  transactions: SalesTransaction[]
  expenses: Expense[]
  inventoryMovements: StockMovement[]
  generatedBy: string
  generatedAt?: string
  reportType?: "Harian" | "Mingguan" | "Event Summary"
}

export function exportEntrepreneurshipPdf(payload: ExportDataPayload, type: "Harian" | "Mingguan" | "Event Summary") {
  const metrics = calculateExportMetrics(payload)
  const generatedAt = payload.generatedAt ?? new Date().toISOString()
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const navy = "#0F172A"
  const red = "#B91C1C"
  const gold = "#F59E0B"

  doc.setFillColor(navy)
  doc.rect(0, 0, pageWidth, 150, "F")
  doc.setTextColor("#FFFFFF")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.text("MELATI CHAMPIONSHIP SERIES", 40, 58)
  doc.setFontSize(15)
  doc.text("ENTREPRENEURSHIP REPORT", 40, 86)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`SMKN 20 JAKARTA - ${type}`, 40, 112)
  doc.setFillColor(red)
  doc.rect(40, 128, 150, 5, "F")
  doc.setFillColor(gold)
  doc.rect(196, 128, 96, 5, "F")

  doc.setTextColor(navy)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Executive Summary", 40, 190)

  autoTable(doc, {
    body: [
      ["Total Revenue", formatCurrency(metrics.revenue), "Total Expense", formatCurrency(metrics.expense)],
      ["Net Profit", formatCurrency(metrics.netProfit), "Transactions", metrics.transactions.toString()],
      ["Products Sold", metrics.productsSold.toString(), "Average Transaction", formatCurrency(metrics.averageTransaction)],
      ["Best Seller Product", metrics.bestSeller, "Exported By", payload.generatedBy],
    ],
    margin: { left: 40, right: 40 },
    startY: 205,
    styles: { fontSize: 9, cellPadding: 7, lineColor: "#E5E7EB", lineWidth: 0.5 },
    alternateRowStyles: { fillColor: "#FFF7ED" },
    columnStyles: { 0: { fontStyle: "bold" }, 2: { fontStyle: "bold" } },
  })

  const chartRows = buildTrendRows(payload)
  autoTable(doc, {
    head: [["Date", "Revenue Trend", "Expense Trend", "Profit Trend"]],
    body: chartRows,
    margin: { left: 40, right: 40 },
    startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
      ? (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 28
      : 330,
    headStyles: { fillColor: navy, textColor: "#FFFFFF" },
    styles: { fontSize: 8, cellPadding: 6 },
  })

  autoTable(doc, {
    head: [["Ranking", "Product", "Sold", "Revenue", "Profit"]],
    body: buildTopProducts(payload).map((item, index) => [
      `#${index + 1}`,
      item.product,
      item.sold,
      formatCurrency(item.revenue),
      formatCurrency(item.profit),
    ]),
    margin: { left: 40, right: 40 },
    startY: (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 28,
    headStyles: { fillColor: red, textColor: "#FFFFFF" },
    styles: { fontSize: 8, cellPadding: 6 },
  })

  doc.addPage()
  doc.setTextColor(navy)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Transaction Summary", 40, 44)
  autoTable(doc, {
    head: [["Date", "Product", "Qty", "Payment", "Recorded By", "Total", "Profit"]],
    body: payload.transactions.map((transaction) => [
      formatDate(transaction.createdAt),
      transaction.productName,
      transaction.quantity,
      transaction.paymentMethod,
      transaction.recordedBy,
      formatCurrency(transaction.total),
      formatCurrency(transaction.profit),
    ]),
    margin: { left: 40, right: 40 },
    startY: 60,
    headStyles: { fillColor: navy, textColor: "#FFFFFF" },
    styles: { fontSize: 8, cellPadding: 5 },
  })

  doc.text("Expense Summary", 40, (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 32)
  autoTable(doc, {
    head: [["Date", "Expense", "Category", "PIC", "Amount", "Notes"]],
    body: payload.expenses.map((expense) => [
      formatDate(expense.date),
      expense.name,
      expense.category,
      expense.pic,
      formatCurrency(expense.amount),
      expense.notes || "-",
    ]),
    margin: { left: 40, right: 40 },
    startY: (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 46,
    headStyles: { fillColor: gold, textColor: navy },
    styles: { fontSize: 8, cellPadding: 5 },
  })

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor("#64748B")
    doc.text(`Exported by MCS Dashboard | ${formatDateTime(generatedAt)} | System Version 0.1.0`, 40, 812)
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - 90, 812)
  }

  doc.save(`MCS_Entrepreneurship_Report_${type.replaceAll(" ", "_")}.pdf`)
}

export function exportEntrepreneurshipExcel(payload: ExportDataPayload) {
  const workbook = XLSX.utils.book_new()
  const metrics = calculateExportMetrics(payload)
  const topProducts = buildTopProducts(payload)

  appendStyledSheet(workbook, "Dashboard Summary", [
    ["Metric", "Value"],
    ["Total Revenue", metrics.revenue],
    ["Total Expense", metrics.expense],
    ["Net Profit", metrics.netProfit],
    ["Transactions", metrics.transactions],
    ["Products Sold", metrics.productsSold],
    ["Average Transaction", metrics.averageTransaction],
    ["Best Seller Product", metrics.bestSeller],
    ["Exported By", payload.generatedBy],
  ])

  appendStyledSheet(workbook, "Transactions", [
    ["ID", "Date", "Product", "Quantity", "Unit Price", "Discount", "Total", "Profit", "Payment", "Recorded By", "Notes"],
    ...payload.transactions.map((transaction) => [
      transaction.id,
      formatDateTime(transaction.createdAt),
      transaction.productName,
      transaction.quantity,
      transaction.price,
      transaction.discount,
      transaction.total,
      transaction.profit,
      transaction.paymentMethod,
      transaction.recordedBy,
      transaction.notes,
    ]),
  ])

  appendStyledSheet(workbook, "Products", [
    ["ID", "Product", "Category", "Selling Price", "Capital Price", "Initial Stock", "Current Stock", "Min Alert", "Unit", "Status", "Description"],
    ...payload.products.map((product) => [
      product.id,
      product.name,
      product.category,
      product.price,
      product.capitalPrice,
      product.initialStock,
      product.currentStock,
      product.minStockAlert,
      product.unit,
      product.status,
      product.description,
    ]),
  ])

  appendStyledSheet(workbook, "Inventory", [
    ["ID", "Date", "Product", "Movement Type", "Quantity", "Reason"],
    ...payload.inventoryMovements.map((movement) => [
      movement.id,
      formatDateTime(movement.createdAt),
      movement.productName,
      movement.type,
      movement.quantity,
      movement.reason,
    ]),
  ])

  appendStyledSheet(workbook, "Expenses", [
    ["ID", "Date", "Expense", "Category", "PIC", "Amount", "Notes"],
    ...payload.expenses.map((expense) => [
      expense.id,
      formatDate(expense.date),
      expense.name,
      expense.category,
      expense.pic,
      expense.amount,
      expense.notes,
    ]),
  ])

  appendStyledSheet(workbook, "Profit Analysis", [
    ["Ranking", "Product", "Sold", "Revenue", "Profit"],
    ...topProducts.map((product, index) => [`#${index + 1}`, product.product, product.sold, product.revenue, product.profit]),
  ])

  XLSX.writeFile(workbook, "MCS_Entrepreneurship_Premium_Report.xlsx")
}

export function exportEntrepreneurshipCsv(payload: ExportDataPayload) {
  const rows = [
    ["ID", "Date", "Product", "Quantity", "Unit Price", "Discount", "Total", "Profit", "Payment", "Recorded By", "Notes"],
    ...payload.transactions.map((transaction) => [
      transaction.id,
      formatDateTime(transaction.createdAt),
      transaction.productName,
      transaction.quantity,
      transaction.price,
      transaction.discount,
      transaction.total,
      transaction.profit,
      transaction.paymentMethod,
      transaction.recordedBy,
      transaction.notes,
    ]),
  ]
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "MCS_Entrepreneurship_Transactions.csv"
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function calculateExportMetrics(payload: ExportDataPayload) {
  const revenue = payload.transactions.reduce((sum, transaction) => sum + transaction.total, 0)
  const expense = payload.expenses.reduce((sum, item) => sum + item.amount, 0)
  const productsSold = payload.transactions.reduce((sum, transaction) => sum + transaction.quantity, 0)
  const transactions = payload.transactions.length
  const topProducts = buildTopProducts(payload)

  return {
    averageTransaction: transactions > 0 ? revenue / transactions : 0,
    bestSeller: topProducts[0]?.product ?? "Data Not Published Yet",
    expense,
    netProfit: revenue - expense,
    productsSold,
    revenue,
    transactions,
  }
}

function buildTopProducts(payload: ExportDataPayload) {
  const map = new Map<string, { product: string; profit: number; revenue: number; sold: number }>()
  for (const transaction of payload.transactions) {
    const current = map.get(transaction.productId) ?? {
      product: transaction.productName,
      profit: 0,
      revenue: 0,
      sold: 0,
    }
    current.profit += transaction.profit
    current.revenue += transaction.total
    current.sold += transaction.quantity
    map.set(transaction.productId, current)
  }

  return [...map.values()].sort((a, b) => b.sold - a.sold || b.revenue - a.revenue).slice(0, 10)
}

function buildTrendRows(payload: ExportDataPayload) {
  const dates = new Set<string>()
  payload.transactions.forEach((transaction) => dates.add(transaction.createdAt.slice(0, 10)))
  payload.expenses.forEach((expense) => dates.add(expense.date.slice(0, 10)))
  const sortedDates = [...dates].sort()

  if (sortedDates.length === 0) {
    return [["Data Not Published Yet", formatCurrency(0), formatCurrency(0), formatCurrency(0)]]
  }

  return sortedDates.map((date) => {
    const revenue = payload.transactions
      .filter((transaction) => transaction.createdAt.slice(0, 10) === date)
      .reduce((sum, transaction) => sum + transaction.total, 0)
    const expense = payload.expenses
      .filter((item) => item.date.slice(0, 10) === date)
      .reduce((sum, item) => sum + item.amount, 0)

    return [formatDate(date), formatCurrency(revenue), formatCurrency(expense), formatCurrency(revenue - expense)]
  })
}

function appendStyledSheet(workbook: XLSX.WorkBook, name: string, rows: Array<Array<string | number>>) {
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1:A1")
  worksheet["!cols"] = Array.from({ length: range.e.c + 1 }, (_, column) => ({
    wch: Math.max(14, ...rows.map((row) => String(row[column] ?? "").length + 2)),
  }))
  worksheet["!autofilter"] = { ref: XLSX.utils.encode_range(range) }
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1 }

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const address = XLSX.utils.encode_cell({ c: column, r: row })
      const cell = worksheet[address]
      if (!cell) continue
      cell.s = {
        alignment: { vertical: "center", wrapText: true },
        border: {
          bottom: { color: { rgb: "E5E7EB" }, style: "thin" },
          left: { color: { rgb: "E5E7EB" }, style: "thin" },
          right: { color: { rgb: "E5E7EB" }, style: "thin" },
          top: { color: { rgb: "E5E7EB" }, style: "thin" },
        },
        fill:
          row === 0
            ? { fgColor: { rgb: "F97316" }, patternType: "solid" }
            : columnMatches(rows[0]?.[column], "Profit")
              ? { fgColor: { rgb: "DCFCE7" }, patternType: "solid" }
              : columnMatches(rows[0]?.[column], "Revenue", "Total")
                ? { fgColor: { rgb: "DBEAFE" }, patternType: "solid" }
                : undefined,
        font: row === 0 ? { bold: true, color: { rgb: "FFFFFF" } } : { color: { rgb: "111827" } },
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, name)
}

function columnMatches(value: string | number | undefined, ...keywords: string[]) {
  const label = String(value ?? "").toLowerCase()
  return keywords.some((keyword) => label.includes(keyword.toLowerCase()))
}

function csvCell(value: string | number) {
  const raw = String(value ?? "")
  return /[",\n]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw
}

function formatCurrency(amount: number) {
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))
}
