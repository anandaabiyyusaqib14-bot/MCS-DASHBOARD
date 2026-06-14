"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Archive,
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  Download,
  FileText,
  Globe,
  PackagePlus,
  Search,
  UserCheck,
  Wallet,
  X,
} from "lucide-react"

import {
  exportEntrepreneurshipCsv,
  exportEntrepreneurshipExcel,
  exportEntrepreneurshipPdf,
  type ActivityLogEntry,
  type Expense,
  type ExpenseCategory,
  type ExportDataPayload,
  type PaymentMethod,
  type Product,
  type ProductCategory,
  type SalesTransaction,
  type StockMovement,
} from "@/lib/entrepreneurship-export"
import { cn } from "@/lib/utils"

type ReportType = "Harian" | "Mingguan" | "Event Summary"
type ModalType = "product" | "sale" | "stock" | "expense" | "report" | null
type DateFilter = "Today" | "Yesterday" | "Last 7 Days" | "Last 30 Days" | "Custom" | "All"

type ModuleState = {
  activities: ActivityLogEntry[]
  expenses: Expense[]
  inventoryMovements: StockMovement[]
  products: Product[]
  transactions: SalesTransaction[]
}

const emptyState: ModuleState = {
  activities: [],
  expenses: [],
  inventoryMovements: [],
  products: [],
  transactions: [],
}

const storageKey = "mcs-entrepreneurship-management-v1"
const productCategories: ProductCategory[] = ["Makanan", "Minuman", "Snack", "Merchandise", "Voucher", "Lainnya"]
const visibleProductFilters = ["Semua Produk", "Makanan", "Minuman", "Snack", "Merchandise"] as const
const paymentMethods: PaymentMethod[] = ["Cash", "QRIS", "Transfer", "E-Wallet"]
const expenseCategories: ExpenseCategory[] = ["Produksi", "Logistik", "Konsumsi", "Operasional", "Marketing", "Lainnya"]
const noActivityMessage = "Data akan muncul setelah aktivitas kewirausahaan mulai dicatat."

export function EntrepreneurshipManagementModule({
  eventName,
  eventOrganizer,
  eventTheme,
  generatedAt,
  notificationCount,
  operator,
  title,
}: {
  eventName: string
  eventOrganizer: string
  eventTheme: string
  generatedAt: string
  notificationCount: number
  operator: string
  title: string
}) {
  const [state, setState] = useState<ModuleState>(() => loadStoredState())
  const [modal, setModal] = useState<ModalType>(null)
  const [toast, setToast] = useState("")
  const [search, setSearch] = useState("")
  const [productFilter, setProductFilter] = useState<(typeof visibleProductFilters)[number]>("Semua Produk")
  const [dateFilter, setDateFilter] = useState<DateFilter>("All")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state])

  const metrics = useMemo(() => getMetrics(state), [state])
  const filteredTransactions = useMemo(
    () => filterTransactions(state.transactions, state.products, search, productFilter, dateFilter, customStart, customEnd),
    [customEnd, customStart, dateFilter, productFilter, search, state.products, state.transactions],
  )
  const topProducts = useMemo(() => getTopProducts(state), [state])
  const lowStockProducts = state.products.filter((product) => product.currentStock <= Math.max(product.minStockAlert, 20))
  const exportPayload: ExportDataPayload = {
    expenses: state.expenses,
    generatedAt,
    generatedBy: operator,
    inventoryMovements: state.inventoryMovements,
    products: state.products,
    transactions: filteredTransactions,
  }

  function pushToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(""), 2600)
  }

  function addActivity(action: string, resource: string, details: string) {
    const entry: ActivityLogEntry = {
      action,
      actor: operator,
      details,
      id: createId("log"),
      resource,
      timestamp: new Date().toISOString(),
    }
    setState((current) => ({ ...current, activities: [entry, ...current.activities].slice(0, 40) }))
  }

  function createProduct(values: ProductFormValues, draft: boolean) {
    const product: Product = normalizeProductStatus({
      capitalPrice: values.capitalPrice,
      category: values.category,
      createdAt: new Date().toISOString(),
      currentStock: values.initialStock,
      description: values.description,
      id: createId("prd"),
      initialStock: values.initialStock,
      minStockAlert: values.minStockAlert,
      name: values.name,
      price: values.price,
      status: "Aman",
      unit: values.unit,
    })
    setState((current) => ({ ...current, products: [product, ...current.products] }))
    addActivity(draft ? "Simpan Draft Produk" : "Tambah Produk", product.name, `Produk ${product.category} ditambahkan.`)
    pushToast(draft ? "Draft produk tersimpan." : "Product added, inventory updated, statistics updated.")
    setModal(null)
  }

  function createSale(values: SaleFormValues) {
    const product = state.products.find((item) => item.id === values.productId)
    if (!product) return pushToast("Pilih produk terlebih dahulu.")
    if (values.quantity <= 0 || values.quantity > product.currentStock) return pushToast("Stok tidak cukup untuk transaksi ini.")
    const subtotal = values.quantity * values.price
    const total = Math.max(0, subtotal - values.discount)
    const profit = total - product.capitalPrice * values.quantity
    const transaction: SalesTransaction = {
      createdAt: new Date().toISOString(),
      discount: values.discount,
      id: createId("trx"),
      notes: values.notes,
      paymentMethod: values.paymentMethod,
      price: values.price,
      productId: product.id,
      productName: product.name,
      profit,
      quantity: values.quantity,
      recordedBy: values.recordedBy,
      subtotal,
      total,
    }
    const movement: StockMovement = {
      createdAt: transaction.createdAt,
      id: createId("stk"),
      productId: product.id,
      productName: product.name,
      quantity: values.quantity,
      reason: `Penjualan ${transaction.id}`,
      type: "Kurangi Stok",
    }
    setState((current) => ({
      ...current,
      inventoryMovements: [movement, ...current.inventoryMovements],
      products: current.products.map((item) =>
        normalizeProductStatus(item.id === product.id ? { ...item, currentStock: item.currentStock - values.quantity } : item),
      ),
      transactions: [transaction, ...current.transactions],
    }))
    addActivity("Penjualan", product.name, `${values.quantity} ${product.unit} via ${values.paymentMethod}.`)
    pushToast("Sales transaction created, inventory reduced, revenue updated.")
    setModal(null)
  }

  function createStockMovement(values: StockFormValues) {
    const product = state.products.find((item) => item.id === values.productId)
    if (!product) return pushToast("Pilih produk terlebih dahulu.")
    const nextStock =
      values.type === "Tambah Stok"
        ? product.currentStock + values.quantity
        : values.type === "Kurangi Stok"
          ? Math.max(0, product.currentStock - values.quantity)
          : Math.max(0, values.quantity)
    const movement: StockMovement = {
      createdAt: new Date().toISOString(),
      id: createId("stk"),
      productId: product.id,
      productName: product.name,
      quantity: values.quantity,
      reason: values.reason,
      type: values.type,
    }
    setState((current) => ({
      ...current,
      inventoryMovements: [movement, ...current.inventoryMovements],
      products: current.products.map((item) => normalizeProductStatus(item.id === product.id ? { ...item, currentStock: nextStock } : item)),
    }))
    addActivity("Update Stok", product.name, `${values.type}: ${values.quantity}. ${values.reason}`)
    pushToast("Inventory movement created, activity log updated.")
    setModal(null)
  }

  function createExpense(values: ExpenseFormValues) {
    const expense: Expense = {
      amount: values.amount,
      category: values.category,
      createdAt: new Date().toISOString(),
      date: values.date,
      id: createId("exp"),
      name: values.name,
      notes: values.notes,
      pic: values.pic,
    }
    setState((current) => ({ ...current, expenses: [expense, ...current.expenses] }))
    addActivity("Pengeluaran", expense.name, `${expense.category} sebesar ${formatRupiah(expense.amount)}.`)
    pushToast("Cash flow updated, daily report updated.")
    setModal(null)
  }

  function generateReport(type: ReportType) {
    exportEntrepreneurshipPdf({ ...exportPayload, reportType: type }, type)
    addActivity("Generate Report", "Entrepreneurship Report", `Laporan ${type} dibuat.`)
    pushToast("Generate premium report functioning.")
    setModal(null)
  }

  function runExport(type: "pdf" | "excel" | "csv") {
    if (type === "pdf") exportEntrepreneurshipPdf(exportPayload, "Event Summary")
    if (type === "excel") exportEntrepreneurshipExcel(exportPayload)
    if (type === "csv") exportEntrepreneurshipCsv(exportPayload)
    addActivity("Export", "Transaksi Kewirausahaan", `Export ${type.toUpperCase()} dibuat.`)
    pushToast(`Export ${type.toUpperCase()} premium functioning.`)
  }

  return (
    <div className="grid gap-5">
      {toast ? (
        <div className="fixed right-5 top-5 z-50 rounded-lg border border-[#DCFCE7] bg-[#F0FDF4] px-4 py-3 text-sm font-semibold text-[#166534] shadow-lg">
          {toast}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#64748B]">{getGreeting(new Date(generatedAt))}, Entrepreneurship Team</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-[#111827]">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#64748B]">
              {eventName} - {eventTheme} - {eventOrganizer}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <HeaderLink href="/" icon={Globe} label="Public Website" />
            <HeaderLink href="/dashboard/announcements" icon={Bell} label={`Notifications ${notificationCount > 0 ? `(${notificationCount})` : ""}`} />
            <HeaderLink href="/dashboard/settings" icon={UserCheck} label="Profile" />
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm xl:grid-cols-[minmax(220px,1fr)_180px_180px_180px_auto]">
        <FieldShell label="Cari Transaksi">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
            <input
              className="h-10 w-full rounded-md border border-[#E5E7EB] bg-white pl-9 pr-3 text-sm font-medium text-[#111827] outline-none focus:border-[#B91C1C]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Produk, PIC, tanggal, pembayaran"
              value={search}
            />
          </div>
        </FieldShell>
        <SelectField label="Filter Produk" onChange={(value) => setProductFilter(value as (typeof visibleProductFilters)[number])} value={productFilter} options={[...visibleProductFilters]} />
        <SelectField label="Filter Tanggal" onChange={(value) => setDateFilter(value as DateFilter)} value={dateFilter} options={["All", "Today", "Yesterday", "Last 7 Days", "Last 30 Days", "Custom"]} />
        {dateFilter === "Custom" ? (
          <FieldShell label="Custom Range">
            <div className="grid grid-cols-2 gap-2">
              <input className={inputClass} type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
              <input className={inputClass} type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
            </div>
          </FieldShell>
        ) : (
          <div className="hidden xl:block" />
        )}
        <div className="flex items-end gap-2">
          <button className={secondaryButtonClass} onClick={() => runExport("pdf")} type="button">
            PDF
          </button>
          <button className={secondaryButtonClass} onClick={() => runExport("excel")} type="button">
            Excel
          </button>
          <button className={secondaryButtonClass} onClick={() => runExport("csv")} type="button">
            CSV
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <Panel icon={Wallet} title="Ringkasan Penjualan Hari Ini" description="Ringkasan penjualan, stok, dan target Kewirausahaan hari ini.">
            <MetricGrid metrics={metrics} />
          </Panel>

          <Panel icon={Wallet} title="Aksi Cepat" description="Aksi utama Kewirausahaan.">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <ActionButton icon={PackagePlus} label="Tambah Produk" onClick={() => setModal("product")} />
              <ActionButton icon={Wallet} label="Catat Penjualan" onClick={() => setModal("sale")} />
              <ActionButton icon={ClipboardList} label="Update Stok" onClick={() => setModal("stock")} />
              <ActionButton icon={FileText} label="Tambah Pengeluaran" onClick={() => setModal("expense")} />
              <ActionButton icon={Download} label="Buat Laporan" onClick={() => setModal("report")} />
            </div>
          </Panel>

          <Panel icon={ClipboardList} title="Sales Transactions" description="Transaction time, product, quantity, unit price, total, and recording officer.">
            {filteredTransactions.length > 0 ? <TransactionsTable transactions={filteredTransactions} /> : <OperationalEmpty onProduct={() => setModal("product")} onSale={() => setModal("sale")} />}
          </Panel>

          <Panel icon={Archive} title="Manajemen Produk" description="Product catalog, category, price, initial stock, remaining stock, and sales status.">
            {state.products.length > 0 ? <ProductsTable products={state.products} /> : <OperationalEmpty onProduct={() => setModal("product")} onSale={() => setModal("sale")} />}
          </Panel>

          <Panel icon={Activity} title="Inventory Monitoring" description="Stock movement overview for safe, low, critical, and out-of-stock conditions.">
            {state.products.length > 0 ? <InventoryTable products={state.products} transactions={state.transactions} /> : <OperationalEmpty onProduct={() => setModal("product")} onSale={() => setModal("sale")} />}
          </Panel>

          <Panel icon={BarChart3} title="Top Product Analytics" description="Best seller, highest revenue, highest profit, fastest growing, and lowest selling products.">
            <TopProductAnalytics products={state.products} topProducts={topProducts} />
          </Panel>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.7fr)]">
            <Panel icon={Wallet} title="Cashflow Management" description="Modal awal, pemasukan, pengeluaran, laba bersih, margin profit, dan ROI.">
              <CashflowSummary metrics={metrics} />
            </Panel>
            <Panel icon={CalendarDays} title="Laporan Harian" description="Laporan penjualan, stok, pemasukan, pengeluaran, dan laba dari hari 1 sampai hari 4.">
              <DailyReports transactions={state.transactions} expenses={state.expenses} />
            </Panel>
          </section>

          <Panel icon={Activity} title="Activity Log" description="Tambah produk, penjualan, update stok, pengeluaran, export, dan generate report.">
            <ActivityLog activities={state.activities} onProduct={() => setModal("product")} onSale={() => setModal("sale")} />
          </Panel>
        </div>

        <aside className="grid content-start gap-5">
          <Panel icon={Activity} title="Peringatan Stok Rendah" description="Produk yang perlu ditambah stoknya.">
            <MiniProductList products={lowStockProducts} empty="Tidak ada peringatan stok saat ini." />
          </Panel>
          <Panel icon={BarChart3} title="Produk Terlaris" description="Ringkasan produk dengan penjualan tertinggi.">
            <MiniRankList items={topProducts.slice(0, 5)} />
          </Panel>
          <Panel icon={Wallet} title="Progress Target Penjualan" description="Perbandingan pemasukan dengan target.">
            <TargetProgress revenue={metrics.revenue} />
          </Panel>
          <Panel icon={ClipboardList} title="Transaksi Terbaru" description="Catatan penjualan terakhir.">
            {state.transactions.slice(0, 3).length > 0 ? <RecentTransactions transactions={state.transactions.slice(0, 3)} /> : <SmallEmpty message={noActivityMessage} />}
          </Panel>
          <Panel icon={Wallet} title="Ringkasan Keuangan Hari Ini" description="Pemasukan, pengeluaran, dan estimasi laba.">
            <StatMiniList items={[["Pemasukan", formatRupiah(metrics.revenue)], ["Pengeluaran", formatRupiah(metrics.expense)], ["Laba Bersih", formatRupiah(metrics.netProfit)]]} />
          </Panel>
        </aside>
      </section>

      {modal === "product" ? <ProductModal onClose={() => setModal(null)} onSubmit={createProduct} /> : null}
      {modal === "sale" ? <SaleModal operator={operator} products={state.products} onClose={() => setModal(null)} onSubmit={createSale} /> : null}
      {modal === "stock" ? <StockModal products={state.products} onClose={() => setModal(null)} onSubmit={createStockMovement} /> : null}
      {modal === "expense" ? <ExpenseModal operator={operator} onClose={() => setModal(null)} onSubmit={createExpense} /> : null}
      {modal === "report" ? <ReportModal onClose={() => setModal(null)} onSubmit={generateReport} /> : null}
    </div>
  )
}

type ProductFormValues = Omit<Product, "createdAt" | "currentStock" | "id" | "status">
type SaleFormValues = Pick<SalesTransaction, "discount" | "notes" | "paymentMethod" | "price" | "productId" | "quantity" | "recordedBy">
type StockFormValues = Pick<StockMovement, "productId" | "quantity" | "reason" | "type">
type ExpenseFormValues = Pick<Expense, "amount" | "category" | "date" | "name" | "notes" | "pic">

function ProductModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (values: ProductFormValues, draft: boolean) => void }) {
  const [values, setValues] = useState<ProductFormValues>({
    capitalPrice: 0,
    category: "Makanan",
    description: "",
    initialStock: 0,
    minStockAlert: 10,
    name: "",
    price: 0,
    unit: "pcs",
  })

  return (
    <Modal title="Tambah Produk" onClose={onClose}>
      <FormGrid>
        <TextField label="Nama Produk" value={values.name} onChange={(name) => setValues({ ...values, name })} required />
        <SelectField label="Kategori" value={values.category} options={productCategories} onChange={(category) => setValues({ ...values, category: category as ProductCategory })} />
        <NumberField label="Harga Jual" value={values.price} onChange={(price) => setValues({ ...values, price })} />
        <NumberField label="Harga Modal" value={values.capitalPrice} onChange={(capitalPrice) => setValues({ ...values, capitalPrice })} />
        <NumberField label="Stok Awal" value={values.initialStock} onChange={(initialStock) => setValues({ ...values, initialStock })} />
        <NumberField label="Minimum Stock Alert" value={values.minStockAlert} onChange={(minStockAlert) => setValues({ ...values, minStockAlert })} />
        <TextField label="Satuan" value={values.unit} onChange={(unit) => setValues({ ...values, unit })} required />
        <TextField label="Deskripsi" value={values.description} onChange={(description) => setValues({ ...values, description })} />
      </FormGrid>
      <ModalActions>
        <button className={secondaryButtonClass} onClick={() => onSubmit(values, true)} type="button">Simpan Draft</button>
        <button className={primaryButtonClass} onClick={() => values.name && onSubmit(values, false)} type="button">Tambah Produk</button>
      </ModalActions>
    </Modal>
  )
}

function SaleModal({ operator, products, onClose, onSubmit }: { operator: string; products: Product[]; onClose: () => void; onSubmit: (values: SaleFormValues) => void }) {
  const firstProduct = products[0]
  const [values, setValues] = useState<SaleFormValues>({
    discount: 0,
    notes: "",
    paymentMethod: "Cash",
    price: firstProduct?.price ?? 0,
    productId: firstProduct?.id ?? "",
    quantity: 1,
    recordedBy: operator,
  })
  const product = products.find((item) => item.id === values.productId)
  const subtotal = values.quantity * values.price
  const total = Math.max(0, subtotal - values.discount)
  const profit = total - (product?.capitalPrice ?? 0) * values.quantity

  return (
    <Modal title="Catat Penjualan" onClose={onClose}>
      {products.length === 0 ? (
        <SmallEmpty message="Tambahkan produk terlebih dahulu sebelum mencatat penjualan." />
      ) : (
        <>
          <FormGrid>
            <SelectField
              label="Produk"
              value={values.productId}
              options={products.map((item) => item.id)}
              optionLabels={Object.fromEntries(products.map((item) => [item.id, `${item.name} (${item.currentStock} ${item.unit})`]))}
              onChange={(productId) => {
                const nextProduct = products.find((item) => item.id === productId)
                setValues({ ...values, price: nextProduct?.price ?? values.price, productId })
              }}
            />
            <NumberField label="Jumlah" value={values.quantity} onChange={(quantity) => setValues({ ...values, quantity })} />
            <NumberField label="Harga Jual" value={values.price} onChange={(price) => setValues({ ...values, price })} />
            <NumberField label="Diskon" value={values.discount} onChange={(discount) => setValues({ ...values, discount })} />
            <SelectField label="Metode Pembayaran" value={values.paymentMethod} options={paymentMethods} onChange={(paymentMethod) => setValues({ ...values, paymentMethod: paymentMethod as PaymentMethod })} />
            <TextField label="Dicatat Oleh" value={values.recordedBy} onChange={(recordedBy) => setValues({ ...values, recordedBy })} required />
            <TextField label="Catatan" value={values.notes} onChange={(notes) => setValues({ ...values, notes })} />
          </FormGrid>
          <CalculationStrip items={[["Subtotal", subtotal], ["Diskon", values.discount], ["Total", total], ["Profit", profit]]} />
          <ModalActions>
            <button className={primaryButtonClass} onClick={() => onSubmit(values)} type="button">Catat Penjualan</button>
          </ModalActions>
        </>
      )}
    </Modal>
  )
}

function StockModal({ products, onClose, onSubmit }: { products: Product[]; onClose: () => void; onSubmit: (values: StockFormValues) => void }) {
  const [values, setValues] = useState<StockFormValues>({
    productId: products[0]?.id ?? "",
    quantity: 1,
    reason: "",
    type: "Tambah Stok",
  })

  return (
    <Modal title="Update Stok" onClose={onClose}>
      {products.length === 0 ? (
        <SmallEmpty message="Tambahkan produk terlebih dahulu sebelum update stok." />
      ) : (
        <>
          <FormGrid>
            <SelectField label="Produk" value={values.productId} options={products.map((item) => item.id)} optionLabels={Object.fromEntries(products.map((item) => [item.id, item.name]))} onChange={(productId) => setValues({ ...values, productId })} />
            <SelectField label="Jenis Perubahan" value={values.type} options={["Tambah Stok", "Kurangi Stok", "Koreksi Stok"]} onChange={(type) => setValues({ ...values, type: type as StockMovement["type"] })} />
            <NumberField label={values.type === "Koreksi Stok" ? "Stok Baru" : "Quantity"} value={values.quantity} onChange={(quantity) => setValues({ ...values, quantity })} />
            <TextField label="Reason" value={values.reason} onChange={(reason) => setValues({ ...values, reason })} required />
          </FormGrid>
          <ModalActions>
            <button className={primaryButtonClass} onClick={() => onSubmit(values)} type="button">Update Stok</button>
          </ModalActions>
        </>
      )}
    </Modal>
  )
}

function ExpenseModal({ operator, onClose, onSubmit }: { operator: string; onClose: () => void; onSubmit: (values: ExpenseFormValues) => void }) {
  const [values, setValues] = useState<ExpenseFormValues>({
    amount: 0,
    category: "Produksi",
    date: new Date().toISOString().slice(0, 10),
    name: "",
    notes: "",
    pic: operator,
  })

  return (
    <Modal title="Tambah Pengeluaran" onClose={onClose}>
      <FormGrid>
        <TextField label="Nama Pengeluaran" value={values.name} onChange={(name) => setValues({ ...values, name })} required />
        <SelectField label="Kategori" value={values.category} options={expenseCategories} onChange={(category) => setValues({ ...values, category: category as ExpenseCategory })} />
        <NumberField label="Nominal" value={values.amount} onChange={(amount) => setValues({ ...values, amount })} />
        <FieldShell label="Tanggal">
          <input className={inputClass} type="date" value={values.date} onChange={(event) => setValues({ ...values, date: event.target.value })} />
        </FieldShell>
        <TextField label="PIC" value={values.pic} onChange={(pic) => setValues({ ...values, pic })} required />
        <TextField label="Catatan" value={values.notes} onChange={(notes) => setValues({ ...values, notes })} />
      </FormGrid>
      <ModalActions>
        <button className={primaryButtonClass} onClick={() => values.name && onSubmit(values)} type="button">Tambah Pengeluaran</button>
      </ModalActions>
    </Modal>
  )
}

function ReportModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (type: ReportType) => void }) {
  return (
    <Modal title="Generate Laporan" onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-3">
        {(["Harian", "Mingguan", "Event Summary"] as ReportType[]).map((type) => (
          <button key={type} className="rounded-lg border border-[#E5E7EB] bg-white p-4 text-left text-sm font-semibold text-[#111827] transition hover:border-[#B91C1C] hover:bg-[#FEF2F2]" onClick={() => onSubmit(type)} type="button">
            {type}
          </button>
        ))}
      </div>
    </Modal>
  )
}

function Panel({ children, description, icon: Icon, title }: { children: ReactNode; description: string; icon: LucideIcon; title: string }) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-[#FEF2F2] text-[#B91C1C]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[#0F172A]/45 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
          <button className="flex size-9 items-center justify-center rounded-md border border-[#E5E7EB] text-[#64748B] hover:bg-[#F8FAFC]" onClick={onClose} type="button" aria-label="Tutup modal">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function HeaderLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]">
      <Icon className="size-4 text-[#64748B]" aria-hidden="true" />
      {label}
    </Link>
  )
}

function ActionButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button className="mcs-list-row flex min-h-20 items-center gap-3 rounded-lg p-4 text-left transition hover:border-[#B91C1C] hover:bg-[#FFF7ED]" onClick={onClick} type="button">
      <Icon className="size-5 shrink-0 text-[#B91C1C]" aria-hidden="true" />
      <span className="text-sm font-semibold text-[#111827]">{label}</span>
    </button>
  )
}

function MetricGrid({ metrics }: { metrics: ReturnType<typeof getMetrics> }) {
  const items = [
    ["Pemasukan Hari Ini", formatRupiah(metrics.todayRevenue), "success"],
    ["Total Transaksi", metrics.transactions.toString(), "info"],
    ["Produk Terjual", metrics.productsSold.toString(), "gold"],
    ["Sisa Inventaris", metrics.remainingStock.toString(), "neutral"],
    ["Net Profit", formatRupiah(metrics.netProfit), metrics.netProfit >= 0 ? "success" : "danger"],
  ]
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{items.map(([label, value, tone]) => <MetricCard key={label} label={label} value={value} tone={tone} />)}</div>
}

function MetricCard({ label, tone, value }: { label: string; tone: string; value: string }) {
  return (
    <article className="mcs-list-row rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
        <span className={cn("mt-1 size-2 shrink-0 rounded-full", tone === "success" ? "bg-[#16A34A]" : tone === "danger" ? "bg-[#DC2626]" : tone === "gold" ? "bg-[#F59E0B]" : tone === "info" ? "bg-[#2563EB]" : "bg-[#CBD5E1]")} />
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#111827]">{value}</p>
    </article>
  )
}

function TransactionsTable({ transactions }: { transactions: SalesTransaction[] }) {
  return <DataTable columns={["Waktu", "Produk", "Jumlah", "Harga Satuan", "Total", "Dicatat Oleh"]} rows={transactions.map((item) => [formatDateTime(item.createdAt), item.productName, item.quantity, formatRupiah(item.price), formatRupiah(item.total), item.recordedBy])} />
}

function ProductsTable({ products }: { products: Product[] }) {
  return <DataTable columns={["Nama Produk", "Kategori", "Harga", "Stok Awal", "Sisa Stok", "Status"]} rows={products.map((item) => [item.name, item.category, formatRupiah(item.price), item.initialStock, item.currentStock, item.status])} />
}

function InventoryTable({ products, transactions }: { products: Product[]; transactions: SalesTransaction[] }) {
  return <DataTable columns={["Produk", "Stok Awal", "Terjual", "Sisa", "Status"]} rows={products.map((product) => [product.name, product.initialStock, transactions.filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0), product.currentStock, product.status])} />
}

function DataTable({ columns, rows }: { columns: string[]; rows: Array<Array<number | string>> }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-[#F8FAFC] text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            <tr>{columns.map((column) => <th key={column} className="border-b border-[#E5E7EB] px-4 py-3">{column}</th>)}</tr>
          </thead>
          <tbody>{rows.map((row, index) => <tr key={index} className="text-[#111827]">{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="border-b border-[#F1F5F9] px-4 py-3 font-medium">{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}

function OperationalEmpty({ onProduct, onSale }: { onProduct: () => void; onSale: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-6 text-center">
      <p className="text-sm font-semibold text-[#111827]">Data Not Published Yet</p>
      <p className="mx-auto mt-1 max-w-md text-sm font-medium leading-6 text-[#64748B]">{noActivityMessage}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button className={secondaryButtonClass} onClick={onProduct} type="button">Tambah Produk</button>
        <button className={primaryButtonClass} onClick={onSale} type="button">Catat Penjualan</button>
      </div>
    </div>
  )
}

function TopProductAnalytics({ products, topProducts }: { products: Product[]; topProducts: ReturnType<typeof getTopProducts> }) {
  const highestRevenue = [...topProducts].sort((a, b) => b.revenue - a.revenue)[0]
  const highestProfit = [...topProducts].sort((a, b) => b.profit - a.profit)[0]
  const lowestSelling = [...products].sort((a, b) => salesForProduct(topProducts, a.id) - salesForProduct(topProducts, b.id))[0]
  const cards = [
    ["Best Seller", topProducts[0]?.productName],
    ["Highest Revenue", highestRevenue?.productName],
    ["Highest Profit", highestProfit?.productName],
    ["Fastest Growing", topProducts[0]?.productName],
    ["Lowest Selling", lowestSelling?.name],
  ]
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value]) => <MetricCard key={label} label={label ?? ""} value={value ?? "Data Not Published Yet"} tone="neutral" />)}</div>
}

function CashflowSummary({ metrics }: { metrics: ReturnType<typeof getMetrics> }) {
  const items = [
    ["Modal Awal", formatRupiah(metrics.capital)],
    ["Pemasukan", formatRupiah(metrics.revenue)],
    ["Pengeluaran", formatRupiah(metrics.expense)],
    ["Laba Bersih", formatRupiah(metrics.netProfit)],
    ["Margin Profit", `${metrics.margin.toFixed(1)}%`],
    ["ROI", `${metrics.roi.toFixed(1)}%`],
  ]
  return <StatMiniList items={items} />
}

function DailyReports({ expenses, transactions }: { expenses: Expense[]; transactions: SalesTransaction[] }) {
  const dates = [...new Set([...transactions.map((item) => item.createdAt.slice(0, 10)), ...expenses.map((item) => item.date)])].sort()
  if (dates.length === 0) return <SmallEmpty message={noActivityMessage} />
  return (
    <div className="grid gap-3">
      {dates.map((date, index) => {
        const revenue = transactions.filter((item) => item.createdAt.slice(0, 10) === date).reduce((sum, item) => sum + item.total, 0)
        const expense = expenses.filter((item) => item.date === date).reduce((sum, item) => sum + item.amount, 0)
        return (
          <div key={date} className="mcs-list-row rounded-lg p-3">
            <p className="text-sm font-semibold text-[#111827]">Hari {index + 1} - {formatDate(date)}</p>
            <p className="mt-1 text-xs font-medium text-[#64748B]">Pemasukan {formatRupiah(revenue)} / Pengeluaran {formatRupiah(expense)} / Laba {formatRupiah(revenue - expense)}</p>
          </div>
        )
      })}
    </div>
  )
}

function ActivityLog({ activities, onProduct, onSale }: { activities: ActivityLogEntry[]; onProduct: () => void; onSale: () => void }) {
  if (activities.length === 0) return <OperationalEmpty onProduct={onProduct} onSale={onSale} />
  return (
    <div className="grid gap-2">
      {activities.map((activity) => (
        <div key={activity.id} className="mcs-list-row rounded-lg p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#111827]">{activity.action} - {activity.resource}</p>
            <span className="text-xs font-semibold text-[#64748B]">{formatDateTime(activity.timestamp)}</span>
          </div>
          <p className="mt-1 text-xs font-medium leading-5 text-[#64748B]">{activity.details} Oleh {activity.actor}.</p>
        </div>
      ))}
    </div>
  )
}

function MiniProductList({ empty, products }: { empty: string; products: Product[] }) {
  if (products.length === 0) return <SmallEmpty message={empty} />
  return <div className="grid gap-2">{products.slice(0, 5).map((product) => <div key={product.id} className="mcs-list-row rounded-lg p-3 text-sm font-semibold text-[#111827]">{product.name}<span className="ml-2 text-[#64748B]">{product.currentStock} {product.unit}</span></div>)}</div>
}

function MiniRankList({ items }: { items: ReturnType<typeof getTopProducts> }) {
  if (items.length === 0) return <SmallEmpty message={noActivityMessage} />
  return <div className="grid gap-2">{items.map((item, index) => <div key={item.productId} className="mcs-list-row flex items-center justify-between rounded-lg p-3 text-sm"><span className="font-semibold text-[#111827]">#{index + 1} {item.productName}</span><span className="font-medium text-[#64748B]">{item.sold} terjual</span></div>)}</div>
}

function TargetProgress({ revenue }: { revenue: number }) {
  const target = 5_000_000
  const progress = Math.min(100, (revenue / target) * 100)
  return (
    <div>
      <div className="h-3 overflow-hidden rounded-full bg-[#E5E7EB]"><div className="h-full bg-[#B91C1C]" style={{ width: `${progress}%` }} /></div>
      <p className="mt-2 text-sm font-semibold text-[#111827]">{progress.toFixed(1)}% dari target {formatRupiah(target)}</p>
    </div>
  )
}

function RecentTransactions({ transactions }: { transactions: SalesTransaction[] }) {
  return <div className="grid gap-2">{transactions.map((item) => <div key={item.id} className="mcs-list-row rounded-lg p-3"><p className="text-sm font-semibold text-[#111827]">{item.productName}</p><p className="text-xs font-medium text-[#64748B]">{formatRupiah(item.total)} - {item.paymentMethod}</p></div>)}</div>
}

function StatMiniList({ items }: { items: string[][] }) {
  return <div className="grid gap-3 sm:grid-cols-2">{items.map(([label, value]) => <div key={label} className="mcs-list-row min-w-0 rounded-lg p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</p><p className="mt-2 text-sm font-semibold leading-6 text-[#111827]">{value}</p></div>)}</div>
}

function SmallEmpty({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-5 text-center text-sm font-medium leading-6 text-[#64748B]">{message}</div>
}

function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}

function ModalActions({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex flex-wrap justify-end gap-2">{children}</div>
}

function FieldShell({ children, label }: { children: ReactNode; label: string }) {
  return <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}{children}</label>
}

function TextField({ label, onChange, required, value }: { label: string; onChange: (value: string) => void; required?: boolean; value: string }) {
  return <FieldShell label={label}><input className={inputClass} required={required} value={value} onChange={(event) => onChange(event.target.value)} /></FieldShell>
}

function NumberField({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
  return <FieldShell label={label}><input className={inputClass} min={0} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></FieldShell>
}

function SelectField({ label, onChange, optionLabels, options, value }: { label: string; onChange: (value: string) => void; optionLabels?: Record<string, string>; options: readonly string[]; value: string }) {
  return (
    <FieldShell label={label}>
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{optionLabels?.[option] ?? option}</option>)}
      </select>
    </FieldShell>
  )
}

function CalculationStrip({ items }: { items: Array<[string, number]> }) {
  return <div className="mt-4 grid gap-3 sm:grid-cols-4">{items.map(([label, value]) => <MetricCard key={label} label={label} value={formatRupiah(value)} tone={value >= 0 ? "success" : "danger"} />)}</div>
}

function getMetrics(state: ModuleState) {
  const today = new Date().toISOString().slice(0, 10)
  const revenue = state.transactions.reduce((sum, item) => sum + item.total, 0)
  const todayRevenue = state.transactions.filter((item) => item.createdAt.slice(0, 10) === today).reduce((sum, item) => sum + item.total, 0)
  const expense = state.expenses.reduce((sum, item) => sum + item.amount, 0)
  const capital = state.products.reduce((sum, product) => sum + product.capitalPrice * product.initialStock, 0)
  const productsSold = state.transactions.reduce((sum, item) => sum + item.quantity, 0)
  const remainingStock = state.products.reduce((sum, item) => sum + item.currentStock, 0)
  const netProfit = revenue - expense - capital
  return {
    capital,
    expense,
    margin: revenue > 0 ? ((revenue - expense) / revenue) * 100 : 0,
    netProfit,
    productsSold,
    remainingStock,
    revenue,
    roi: capital > 0 ? (netProfit / capital) * 100 : 0,
    todayRevenue,
    transactions: state.transactions.length,
  }
}

function loadStoredState(): ModuleState {
  if (typeof window === "undefined") return emptyState
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return emptyState
  try {
    return { ...emptyState, ...JSON.parse(raw) }
  } catch {
    window.localStorage.removeItem(storageKey)
    return emptyState
  }
}

function getTopProducts(state: ModuleState) {
  return state.products
    .map((product) => {
      const transactions = state.transactions.filter((item) => item.productId === product.id)
      return {
        productId: product.id,
        productName: product.name,
        profit: transactions.reduce((sum, item) => sum + item.profit, 0),
        revenue: transactions.reduce((sum, item) => sum + item.total, 0),
        sold: transactions.reduce((sum, item) => sum + item.quantity, 0),
      }
    })
    .sort((a, b) => b.sold - a.sold || b.revenue - a.revenue || b.profit - a.profit)
}

function salesForProduct(items: ReturnType<typeof getTopProducts>, productId: string) {
  return items.find((item) => item.productId === productId)?.sold ?? 0
}

function filterTransactions(transactions: SalesTransaction[], products: Product[], search: string, productFilter: string, dateFilter: DateFilter, customStart: string, customEnd: string) {
  const query = search.trim().toLowerCase()
  const productCategoriesById = new Map(products.map((product) => [product.id, product.category]))
  return transactions.filter((transaction) => {
    const haystack = `${transaction.productName} ${transaction.recordedBy} ${transaction.createdAt} ${transaction.paymentMethod}`.toLowerCase()
    const categoryMatch = productFilter === "Semua Produk" || productCategoriesById.get(transaction.productId) === productFilter
    return (!query || haystack.includes(query)) && categoryMatch && matchesDate(transaction.createdAt, dateFilter, customStart, customEnd)
  })
}

function matchesDate(value: string, dateFilter: DateFilter, customStart: string, customEnd: string) {
  if (dateFilter === "All") return true
  const date = new Date(value)
  const today = new Date()
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  if (dateFilter === "Today") return date >= start
  if (dateFilter === "Yesterday") {
    const yesterday = new Date(start)
    yesterday.setDate(yesterday.getDate() - 1)
    return date >= yesterday && date < start
  }
  if (dateFilter === "Last 7 Days") start.setDate(start.getDate() - 6)
  if (dateFilter === "Last 30 Days") start.setDate(start.getDate() - 29)
  if (dateFilter === "Custom") {
    const from = customStart ? new Date(`${customStart}T00:00:00`) : new Date("1970-01-01")
    const to = customEnd ? new Date(`${customEnd}T23:59:59`) : new Date("2999-12-31")
    return date >= from && date <= to
  }
  return date >= start
}

function normalizeProductStatus(product: Product): Product {
  const status = product.currentStock <= 0 ? "Stok Habis" : product.currentStock <= 10 ? "Kritis" : product.currentStock <= 20 || product.currentStock <= product.minStockAlert ? "Stok Rendah" : "Aman"
  return { ...product, status }
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function formatRupiah(amount: number) {
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value))
}

function getGreeting(date: Date) {
  const hour = date.getHours()
  if (hour < 11) return "Selamat pagi"
  if (hour < 15) return "Selamat siang"
  if (hour < 18) return "Selamat sore"
  return "Selamat malam"
}

const inputClass = "h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#111827] outline-none focus:border-[#B91C1C]"
const primaryButtonClass = "inline-flex h-10 items-center justify-center rounded-md bg-[#B91C1C] px-4 text-sm font-semibold text-white transition hover:bg-[#991B1B]"
const secondaryButtonClass = "inline-flex h-10 items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#111827] transition hover:bg-[#F8FAFC]"
