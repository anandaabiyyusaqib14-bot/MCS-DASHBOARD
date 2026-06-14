"use client"

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Archive,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Edit3,
  Eye,
  FileArchive,
  FileCheck,
  FileText,
  FolderPlus,
  Handshake,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Wallet,
  X,
} from "lucide-react"

import {
  brandAssets,
  event,
  scheduleDays,
  sponsorProspects,
} from "@/data/mcs"
import { cn } from "@/lib/utils"
import type { DashboardSummary, UserDTO } from "@/server/mcs/types"

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "navy" | "gold"
type ModalKey = "transaction" | "sponsor" | "report" | "document" | "folder" | "preview" | "edit-document" | null
type FinanceFormat = "PDF" | "Excel" | "CSV"
type TransactionType = "Pemasukan" | "Pengeluaran"
type SponsorStatus = "Pending" | "Diterima" | "Dicairkan"
type ApprovalStatus = "Pending" | "Approved" | "Rejected"
type DocumentStatus = "Draft" | "Final"
type ArchiveCategory = "Dokumen" | "Proposal" | "Laporan" | "Sponsor" | "Keuangan" | "Media"

type TransactionRecord = {
  id: string
  type: TransactionType
  category: string
  amount: number
  description: string
  date: string
  evidence: string
  pic: string
}

type SponsorFund = {
  id: string
  sponsor: string
  amount: number
  date: string
  status: SponsorStatus
  note: string
  pic: string
}

type DocumentRecord = {
  id: string
  name: string
  category: string
  version: string
  uploader: string
  date: string
  status: DocumentStatus
  fileName: string
  archived?: boolean
}

type ApprovalRecord = {
  id: string
  type: string
  title: string
  requester: string
  date: string
  status: ApprovalStatus
}

type ReportRecord = {
  id: string
  type: string
  owner: string
  date: string
  format: FinanceFormat
  status: "Ready" | "Data Not Published Yet"
}

type AuditRecord = {
  id: string
  time: string
  action: string
  actor: string
  category: string
  timestamp: number
}

type ArchiveRecord = {
  id: string
  category: ArchiveCategory
  title: string
  archivedBy: string
  archivedDate: string
  sourceId: string
  restoreStatus: "Available" | "Restored"
}

type NotificationRecord = {
  id: string
  title: string
  detail: string
  timestamp: number
  tone: Tone
}

const toneClasses: Record<Tone, string> = {
  danger: "border-[#FEE2E2] bg-[#FEF2F2] text-[#DC2626]",
  gold: "border-[#FEF3C7] bg-[#FFFBEB] text-[#92400E]",
  info: "border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB]",
  navy: "border-[#0F172A] bg-[#0F172A] text-white",
  neutral: "border-[#E5E7EB] bg-white text-[#6B7280]",
  success: "border-[#DCFCE7] bg-[#F0FDF4] text-[#16A34A]",
  warning: "border-[#FEF3C7] bg-[#FFFBEB] text-[#D97706]",
}

const transactionCategories = ["Sponsor", "Konsumsi", "Perlengkapan", "Hadiah", "Operasional", "Dokumentasi", "Lainnya"]
const documentCategories = ["Proposal", "Surat", "Rundown", "Laporan", "Sponsor", "Keuangan"]
const reportTypes = ["Laporan Panitia", "Laporan Sponsor", "Laporan Keuangan", "Laporan Media", "Laporan Kehadiran", "Laporan Event"]
const permissionRoles = ["Super Admin", "PJ Divisi", "Panitia", "Dokumentasi", "Humas"]
const permissionColumns = ["Buat", "Edit", "Approve", "Delete", "Export"]
const storageKey = "mcs-administration-control-center-v2"

const initialApprovals: ApprovalRecord[] = []

export function AdministrationControlCenter({ summary, user }: { summary: DashboardSummary; user: UserDTO }) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [sponsorFunds, setSponsorFunds] = useState<SponsorFund[]>(() => initialSponsorFunds())
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [approvals, setApprovals] = useState<ApprovalRecord[]>(initialApprovals)
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [archives, setArchives] = useState<ArchiveRecord[]>([])
  const [auditLog, setAuditLog] = useState<AuditRecord[]>(() => initialAudit(summary, user))
  const [notifications, setNotifications] = useState<NotificationRecord[]>(() => initialNotifications())
  const [folders, setFolders] = useState<string[]>([])
  const [modal, setModal] = useState<ModalKey>(null)
  const [toast, setToast] = useState("")
  const [exportOpen, setExportOpen] = useState(false)
  const [auditFilter, setAuditFilter] = useState("Semua")
  const [globalQuery, setGlobalQuery] = useState("")
  const [previewReport, setPreviewReport] = useState<ReportRecord | null>(null)
  const [editingDocument, setEditingDocument] = useState<DocumentRecord | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        setHydrated(true)
        return
      }
      try {
        const parsed = JSON.parse(raw) as Partial<{
          approvals: ApprovalRecord[]
          archives: ArchiveRecord[]
          auditLog: AuditRecord[]
          documents: DocumentRecord[]
          folders: string[]
          notifications: NotificationRecord[]
          reports: ReportRecord[]
          sponsorFunds: SponsorFund[]
          transactions: TransactionRecord[]
        }>
        setTransactions(parsed.transactions ?? [])
        setSponsorFunds(parsed.sponsorFunds ?? initialSponsorFunds())
        setDocuments(parsed.documents ?? [])
        setApprovals(parsed.approvals ?? initialApprovals)
        setReports(parsed.reports ?? [])
        setArchives(parsed.archives ?? [])
        setAuditLog(parsed.auditLog ?? initialAudit(summary, user))
        setNotifications(parsed.notifications ?? initialNotifications())
        setFolders(parsed.folders ?? [])
        setHydrated(true)
      } catch {
        setToast("Data lokal administrasi tidak dapat dibaca, state baru digunakan.")
        setHydrated(true)
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [summary, user])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ approvals, archives, auditLog, documents, folders, notifications, reports, sponsorFunds, transactions }),
    )
  }, [approvals, archives, auditLog, documents, folders, hydrated, notifications, reports, sponsorFunds, transactions])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const finance = useMemo(() => {
    const income = transactions.filter((item) => item.type === "Pemasukan").reduce((sum, item) => sum + item.amount, 0)
    const expense = transactions.filter((item) => item.type === "Pengeluaran").reduce((sum, item) => sum + item.amount, 0)
    const sponsorReceived = sponsorFunds.filter((item) => item.status === "Diterima" || item.status === "Dicairkan").reduce((sum, item) => sum + item.amount, 0)
    return { income, expense, sponsorReceived, balance: income + sponsorReceived - expense }
  }, [sponsorFunds, transactions])

  const activeDocuments = documents.filter((item) => !item.archived)
  const archivedDocuments = documents.filter((item) => item.archived)
  const pendingApprovals = approvals.filter((item) => item.status === "Pending")
  const filteredAudit = auditLog.filter((item) => matchesAuditFilter(item, auditFilter))
  const globalResults = useMemo(
    () => searchEverything(globalQuery, { activeDocuments, approvals, reports, sponsorFunds, transactions, user }),
    [activeDocuments, approvals, globalQuery, reports, sponsorFunds, transactions, user],
  )

  const addAudit = (action: string, category: string) => {
    const now = new Date()
    setAuditLog((items) => [
      {
        id: `audit-${now.getTime()}`,
        time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        action,
        actor: user.displayName,
        category,
        timestamp: now.getTime(),
      },
      ...items,
    ])
  }

  const addNotification = (title: string, detail: string, tone: Tone = "info") => {
    setNotifications((items) => [{ id: `notif-${Date.now()}`, title, detail, timestamp: Date.now(), tone }, ...items])
  }

  const onTransactionSubmit = (formData: FormData) => {
    const type = String(formData.get("type") || "Pemasukan") as TransactionType
    const category = String(formData.get("category") || "Lainnya")
    const amount = Number(formData.get("amount") || 0)
    const description = String(formData.get("description") || "Transaksi MCS 1")
    const date = String(formData.get("date") || todayInput())
    const pic = String(formData.get("pic") || user.displayName)
    const evidenceFile = formData.get("evidence")
    const evidence = evidenceFile instanceof File && evidenceFile.name ? evidenceFile.name : "No Data Available"
    if (amount <= 0) {
      setToast("Nominal transaksi harus lebih dari 0.")
      return
    }
    const record = { id: `TRX-${Date.now()}`, type, category, amount, description, date, evidence, pic }
    setTransactions((items) => [record, ...items])
    addAudit(`${type} ${category} dicatat`, "Keuangan")
    addNotification("Pengeluaran baru", `${category} sebesar ${formatRupiah(amount)} dicatat oleh ${pic}.`, type === "Pengeluaran" ? "warning" : "success")
    setModal(null)
    setToast("Transaksi tersimpan dan statistik keuangan diperbarui.")
  }

  const onSponsorSubmit = (formData: FormData) => {
    const amount = Number(formData.get("amount") || 0)
    if (amount <= 0) {
      setToast("Nominal dana sponsor harus lebih dari 0.")
      return
    }
    const record: SponsorFund = {
      id: `SPF-${Date.now()}`,
      sponsor: String(formData.get("sponsor") || "Sponsor MCS 1"),
      amount,
      date: String(formData.get("date") || todayInput()),
      status: String(formData.get("status") || "Pending") as SponsorStatus,
      note: String(formData.get("note") || "No Data Available"),
      pic: user.displayName,
    }
    setSponsorFunds((items) => [record, ...items])
    addAudit(`Dana sponsor ${record.sponsor} disimpan`, "Sponsor")
    addNotification("Dana sponsor masuk", `${record.sponsor} tercatat ${formatRupiah(record.amount)} dengan status ${record.status}.`, "success")
    setModal(null)
    setToast("Dana sponsor tersimpan.")
  }

  const onReportSubmit = (formData: FormData) => {
    const format = String(formData.get("format") || "PDF") as FinanceFormat
    const report: ReportRecord = {
      id: `RPT-${Date.now()}`,
      type: String(formData.get("type") || "Laporan Keuangan"),
      owner: user.displayName,
      date: `${String(formData.get("startDate") || todayInput())} - ${String(formData.get("endDate") || todayInput())}`,
      format,
      status: "Ready",
    }
    setReports((items) => [report, ...items])
    addAudit(`${report.type} dibuat`, "Laporan")
    addNotification("Laporan selesai dibuat", `${report.type} format ${format} siap diunduh.`, "success")
    setModal(null)
    void exportFinance(format, { transactions, sponsorFunds, auditLog, finance, reportTitle: report.type })
    setToast("Laporan dibuat dan file mulai diunduh.")
  }

  const onDocumentSubmit = (formData: FormData) => {
    const file = formData.get("file")
    const fileName = file instanceof File && file.name ? file.name : "No Data Available"
    const record: DocumentRecord = {
      id: `DOC-${Date.now()}`,
      name: String(formData.get("name") || "Dokumen MCS 1"),
      category: String(formData.get("category") || "Proposal"),
      version: String(formData.get("version") || "v1"),
      uploader: user.displayName,
      date: todayInput(),
      status: String(formData.get("status") || "Draft") as DocumentStatus,
      fileName,
    }
    setDocuments((items) => [record, ...items])
    setApprovals((items) => [
      { id: `APR-${Date.now()}`, type: "Dokumen", title: record.name, requester: user.displayName, date: record.date, status: "Pending" },
      ...items,
    ])
    addAudit(`Dokumen ${record.name} diupload`, "Dokumen")
    addNotification("Dokumen diperbarui", `${record.name} versi ${record.version} diupload.`, "info")
    setModal(null)
    setToast("Dokumen diupload dan masuk pusat persetujuan.")
  }

  const onFolderSubmit = (formData: FormData) => {
    const name = String(formData.get("name") || "").trim()
    if (!name) {
      setToast("Nama folder wajib diisi.")
      return
    }
    setFolders((items) => Array.from(new Set([name, ...items])))
    addAudit(`Folder ${name} dibuat`, "Arsip")
    setModal(null)
    setToast("Folder ditambahkan.")
  }

  const archiveDocument = (document: DocumentRecord) => {
    setDocuments((items) => items.map((item) => item.id === document.id ? { ...item, archived: true } : item))
    setArchives((items) => [
      {
        id: `ARC-${Date.now()}`,
        category: document.category as ArchiveCategory,
        title: document.name,
        archivedBy: user.displayName,
        archivedDate: todayInput(),
        sourceId: document.id,
        restoreStatus: "Available",
      },
      ...items,
    ])
    addAudit(`Dokumen ${document.name} diarsipkan`, "Arsip")
    setToast("Dokumen masuk Arsip Digital.")
  }

  const restoreArchive = (archive: ArchiveRecord) => {
    setArchives((items) => items.map((item) => item.id === archive.id ? { ...item, restoreStatus: "Restored" } : item))
    setDocuments((items) => items.map((item) => item.id === archive.sourceId ? { ...item, archived: false } : item))
    addAudit(`Arsip ${archive.title} direstore`, "Arsip")
    setToast("Arsip direstore.")
  }

  return (
    <div className="grid gap-5">
      <section className="mcs-surface overflow-visible rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F97316] text-white shadow-[3px_3px_0_rgba(17,24,39,0.16)]">
              <FileCheck className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#F97316]">Melati Championship Series 1</p>
              <h2 className="mt-1 font-heading text-2xl font-bold tracking-normal text-[#111827]">Super Admin Control Center</h2>
              <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-[#6B7280]">
                Pusat dokumen, persetujuan, keuangan, sponsor, audit, arsip, export, laporan akhir, dan monitoring sistem untuk {event.name}.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <HeaderButton icon={Wallet} label="Tambah Transaksi" onClick={() => setModal("transaction")} />
            <HeaderButton icon={Handshake} label="Kelola Dana Sponsor" onClick={() => setModal("sponsor")} />
            <HeaderButton icon={FileCheck} label="Buat Laporan Keuangan" onClick={() => setModal("report")} />
            <div className="relative">
              <HeaderButton icon={Download} label="Ekspor Data Keuangan" onClick={() => setExportOpen((value) => !value)} suffix={<ChevronDown className="size-4" />} />
              {exportOpen ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-44 rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-[0_18px_40px_rgba(17,24,39,0.16)]">
                  {(["PDF", "Excel", "CSV"] as FinanceFormat[]).map((format) => (
                    <button
                      key={format}
                      type="button"
                      className="flex h-9 w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-[#111827] hover:bg-[#FFF7ED]"
                      onClick={() => {
                        setExportOpen(false)
                        void exportFinance(format, { transactions, sponsorFunds, auditLog, finance, reportTitle: "Laporan Keuangan MCS 1" })
                      }}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <StatStrip
        items={[
          { label: "Dokumen Aktif", value: activeDocuments.length || "No Data Available", tone: activeDocuments.length ? "info" : "neutral" },
          { label: "Persetujuan Menunggu", value: pendingApprovals.length, tone: pendingApprovals.length ? "warning" : "success" },
          { label: "Total Laporan", value: reports.length || "No Data Available", tone: reports.length ? "success" : "neutral" },
          { label: "Saldo Keuangan", value: formatRupiah(finance.balance), tone: finance.balance >= 0 ? "gold" : "danger" },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Panel icon={ShieldCheck} title="Permission Matrix" description="Role dan izin utama untuk operasional Super Admin Event.">
          <PermissionMatrix />
        </Panel>
        <Panel icon={Bell} title="Notification Center" description="Sinyal penting dari persetujuan, keuangan, dokumen, sponsor, dan laporan.">
          <NotificationCenter notifications={notifications} pendingApprovals={pendingApprovals.length} />
        </Panel>
      </section>

      <Panel icon={FileText} title="Manajemen Dokumen" description="Dokumen administrasi resmi dengan aksi view, download, edit, dan archive.">
        <div className="mb-4 flex flex-wrap gap-2">
          <HeaderButton icon={Upload} label="Upload Dokumen" onClick={() => setModal("document")} />
          <HeaderButton icon={FolderPlus} label="Tambah Folder" onClick={() => setModal("folder")} />
          <HeaderButton icon={Download} label="Export Dokumen" onClick={() => exportDocuments(activeDocuments)} />
        </div>
        <FolderChips folders={folders} />
        <DocumentTable
          documents={activeDocuments}
          onArchive={archiveDocument}
          onDownload={(document) => downloadTextFile(`${document.id}.txt`, getDocumentText(document))}
          onEdit={(document) => {
            setEditingDocument(document)
            setModal("edit-document")
          }}
          onView={(document) => {
            setPreviewReport({ id: document.id, type: document.name, owner: document.uploader, date: document.date, format: "PDF", status: "Ready" })
            setModal("preview")
          }}
        />
      </Panel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <Panel icon={Check} title="Pusat Persetujuan" description="Proposal sponsor, laporan, dokumen, permintaan dana, dan konten publikasi.">
          <ApprovalTable
            approvals={approvals}
            onDecision={(id, status) => {
              setApprovals((items) => items.map((item) => item.id === id ? { ...item, status } : item))
              const approval = approvals.find((item) => item.id === id)
              addAudit(`${approval?.title ?? "Persetujuan"} ${status.toLowerCase()}`, "Persetujuan")
              addNotification("Persetujuan proposal", `${approval?.title ?? "Item"} berstatus ${status}.`, status === "Approved" ? "success" : "danger")
            }}
          />
        </Panel>
        <Panel icon={CalendarDays} title="Run Down Control" description="Ringkasan dan timeline perubahan rundown resmi MCS 1.">
          <RundownControl summary={summary} />
        </Panel>
      </section>

      <Panel icon={FileCheck} title="Manajemen Laporan" description="Pusat laporan panitia, sponsor, keuangan, media, kehadiran, dan event.">
        <ReportCenter
          reports={reports}
          onDelete={(id) => {
            const report = reports.find((item) => item.id === id)
            setReports((items) => items.filter((item) => item.id !== id))
            addAudit(`${report?.type ?? "Laporan"} dihapus`, "Laporan")
          }}
          onDownload={(report) => void exportFinance(report.format, { transactions, sponsorFunds, auditLog, finance, reportTitle: report.type })}
          onGenerate={(type) => {
            const report: ReportRecord = { id: `RPT-${Date.now()}`, type, owner: user.displayName, date: todayInput(), format: "PDF", status: "Ready" }
            setReports((items) => [report, ...items])
            addAudit(`${type} dibuat`, "Laporan")
          }}
          onPreview={(report) => {
            setPreviewReport(report)
            setModal("preview")
          }}
        />
      </Panel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Panel icon={Wallet} title="Catatan Keuangan" description="Transaksi tersambung ke statistik, audit, laporan, dan export.">
          <FinanceSummary finance={finance} />
          <TransactionTable transactions={transactions} />
        </Panel>
        <Panel icon={Handshake} title="Keuangan Sponsor" description="Status dana sponsor masuk, pending, dicairkan, dan belum masuk.">
          <SponsorFunding finance={finance} sponsorFunds={sponsorFunds} />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <Panel icon={Archive} title="Arsip Digital" description="Cari, restore, download, dan delete permanen arsip administrasi.">
          <ArchivePanel
            archives={archives}
            archivedDocuments={archivedDocuments}
            onDelete={(id) => {
              setArchives((items) => items.filter((item) => item.id !== id))
              addAudit("Arsip dihapus permanen", "Arsip")
            }}
            onDownload={(archive) => downloadTextFile(`${archive.id}.txt`, `${archive.title}\n${archive.category}\n${archive.archivedDate}`)}
            onRestore={restoreArchive}
          />
        </Panel>
        <Panel icon={Activity} title="Audit Activity Log" description="Seluruh aktivitas dokumen, sponsor, keuangan, persetujuan, laporan, dan arsip.">
          <AuditLog filter={auditFilter} items={filteredAudit} onFilter={setAuditFilter} />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel icon={Search} title="Global Search" description="Cari dokumen, sponsor, peserta, panitia, keuangan, dan laporan secara realtime.">
          <GlobalSearch query={globalQuery} results={globalResults} onQuery={setGlobalQuery} />
        </Panel>
        <Panel icon={ShieldCheck} title="Security Dashboard" description="Validasi upload, audit, permission rules, login, dan role aktif.">
          <SecurityDashboard auditCount={auditLog.length} failedLogin={0} uploadCount={documents.length} />
        </Panel>
      </section>

      <FormModal open={modal === "transaction"} title="Tambah Transaksi" onClose={() => setModal(null)}>
        <RecordForm submitLabel="Simpan Transaksi" onSubmit={onTransactionSubmit}>
          <SelectField label="Jenis" name="type" options={["Pemasukan", "Pengeluaran"]} />
          <SelectField label="Kategori" name="category" options={transactionCategories} />
          <InputField label="Nominal" name="amount" type="number" required />
          <InputField label="Deskripsi" name="description" required />
          <InputField label="Tanggal" name="date" type="date" defaultValue={todayInput()} required />
          <InputField label="Bukti Upload" name="evidence" type="file" />
          <InputField label="PIC" name="pic" defaultValue={user.displayName} required />
        </RecordForm>
      </FormModal>

      <FormModal open={modal === "sponsor"} title="Kelola Dana Sponsor" onClose={() => setModal(null)}>
        <RecordForm submitLabel="Simpan Dana" onSubmit={onSponsorSubmit}>
          <InputField label="Sponsor" name="sponsor" list="sponsor-options" required />
          <datalist id="sponsor-options">{sponsorProspects.map((item) => <option key={item.id} value={item.name} />)}</datalist>
          <InputField label="Nominal" name="amount" type="number" required />
          <InputField label="Tanggal Masuk" name="date" type="date" defaultValue={todayInput()} required />
          <SelectField label="Status" name="status" options={["Pending", "Diterima", "Dicairkan"]} />
          <TextareaField label="Catatan" name="note" />
        </RecordForm>
      </FormModal>

      <FormModal open={modal === "report"} title="Buat Laporan Keuangan" onClose={() => setModal(null)}>
        <RecordForm submitLabel="Generate Laporan" onSubmit={onReportSubmit}>
          <SelectField label="Jenis Laporan" name="type" options={["Harian", "Mingguan", "Event", "Sponsor", "Final"]} />
          <InputField label="Rentang Tanggal Mulai" name="startDate" type="date" defaultValue={todayInput()} required />
          <InputField label="Rentang Tanggal Akhir" name="endDate" type="date" defaultValue={todayInput()} required />
          <SelectField label="Format" name="format" options={["PDF", "Excel"]} />
        </RecordForm>
      </FormModal>

      <FormModal open={modal === "document"} title="Upload Dokumen" onClose={() => setModal(null)}>
        <RecordForm submitLabel="Upload" onSubmit={onDocumentSubmit}>
          <InputField label="Nama Dokumen" name="name" required />
          <SelectField label="Kategori" name="category" options={documentCategories} />
          <InputField label="Versi" name="version" defaultValue="v1" required />
          <InputField label="Upload File" name="file" type="file" />
          <SelectField label="Status" name="status" options={["Draft", "Final"]} />
        </RecordForm>
      </FormModal>

      <FormModal open={modal === "folder"} title="Tambah Folder" onClose={() => setModal(null)}>
        <RecordForm submitLabel="Tambah Folder" onSubmit={onFolderSubmit}>
          <InputField label="Nama Folder" name="name" required />
        </RecordForm>
      </FormModal>

      <FormModal open={modal === "edit-document"} title="Edit Dokumen" onClose={() => setModal(null)}>
        <RecordForm
          submitLabel="Simpan Perubahan"
          onSubmit={(formData) => {
            if (!editingDocument) return
            const nextName = String(formData.get("name") || editingDocument.name)
            setDocuments((items) => items.map((item) => item.id === editingDocument.id ? { ...item, name: nextName, version: String(formData.get("version") || item.version), status: String(formData.get("status") || item.status) as DocumentStatus } : item))
            addAudit(`Dokumen ${nextName} diedit`, "Dokumen")
            setModal(null)
          }}
        >
          <InputField label="Nama Dokumen" name="name" defaultValue={editingDocument?.name} required />
          <InputField label="Versi" name="version" defaultValue={editingDocument?.version} required />
          <SelectField label="Status" name="status" options={["Draft", "Final"]} defaultValue={editingDocument?.status} />
        </RecordForm>
      </FormModal>

      <FormModal open={modal === "preview"} title="Preview Laporan" onClose={() => setModal(null)}>
        <div className="rounded-xl border border-[#E5E7EB] bg-[#FFF7ED] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#F97316]">{event.shortName}</p>
          <h3 className="mt-2 font-heading text-xl font-bold text-[#111827]">{previewReport?.type ?? "Laporan MCS 1"}</h3>
          <p className="mt-2 text-sm font-medium leading-6 text-[#6B7280]">Owner: {previewReport?.owner ?? user.displayName}</p>
          <p className="text-sm font-medium leading-6 text-[#6B7280]">Tanggal: {previewReport?.date ?? todayInput()}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <MiniStat label="Pemasukan" value={formatRupiah(finance.income + finance.sponsorReceived)} />
            <MiniStat label="Pengeluaran" value={formatRupiah(finance.expense)} />
            <MiniStat label="Saldo" value={formatRupiah(finance.balance)} />
          </div>
        </div>
      </FormModal>

      {toast ? <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-[#FED7AA] bg-white px-4 py-3 text-sm font-bold text-[#111827] shadow-[0_18px_40px_rgba(17,24,39,0.18)]">{toast}</div> : null}
    </div>
  )
}

function HeaderButton({ icon: Icon, label, onClick, suffix }: { icon: LucideIcon; label: string; onClick: () => void; suffix?: ReactNode }) {
  return (
    <button type="button" className="mcs-button-secondary inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition" onClick={onClick}>
      <Icon className="size-4 text-[#F97316]" aria-hidden="true" />
      <span>{label}</span>
      {suffix}
    </button>
  )
}

function Panel({ children, description, icon: Icon, title }: { children: ReactNode; description: string; icon: LucideIcon; title: string }) {
  return (
    <section className="mcs-surface min-w-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-[#E5E7EB] px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#FED7AA] bg-[#FFF7ED] text-[#F97316]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-heading text-base font-bold text-[#111827]">{title}</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function StatStrip({ items }: { items: Array<{ label: string; value: ReactNode; tone: Tone }> }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.label} className="mcs-neo-card rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-[#6B7280]">{item.label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="min-w-0 break-words font-heading text-xl font-bold leading-6 tracking-normal text-[#111827]">{item.value}</p>
            <span className={cn("mb-1 size-2.5 shrink-0 rounded-full", item.tone === "success" ? "bg-[#16A34A]" : item.tone === "warning" ? "bg-[#F59E0B]" : item.tone === "danger" ? "bg-[#DC2626]" : item.tone === "gold" ? "bg-[#D8B15A]" : "bg-[#0EA5E9]")} />
          </div>
        </article>
      ))}
    </section>
  )
}

function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return <span className={cn("inline-flex min-h-7 w-fit items-center rounded-lg border px-2.5 py-1 text-xs font-bold", toneClasses[tone])}>{label}</span>
}

function PermissionMatrix() {
  const allowed = (role: string, column: string) => {
    if (role === "Super Admin") return true
    if (role === "PJ Divisi") return ["Buat", "Edit", "Export"].includes(column)
    if (role === "Dokumentasi") return ["Buat", "Edit", "Export"].includes(column)
    if (role === "Humas") return ["Buat", "Edit", "Export"].includes(column)
    return ["Buat", "Edit"].includes(column)
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
        <thead><tr>{["Role", ...permissionColumns].map((heading) => <th key={heading} className="border-b border-[#E5E7EB] px-3 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">{heading}</th>)}</tr></thead>
        <tbody>
          {permissionRoles.map((role) => (
            <tr key={role}>
              <td className="border-b border-[#F1F5F9] px-3 py-3 font-bold text-[#111827]">{role}</td>
              {permissionColumns.map((column) => <td key={column} className="border-b border-[#F1F5F9] px-3 py-3"><StatusBadge label={allowed(role, column) ? "Allowed" : "Limited"} tone={allowed(role, column) ? "success" : "neutral"} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function NotificationCenter({ notifications, pendingApprovals }: { notifications: NotificationRecord[]; pendingApprovals: number }) {
  const items = notifications.length ? notifications : [{ id: "empty", title: "Data Not Published Yet", detail: "Notifikasi akan muncul setelah aksi administrasi dilakukan.", timestamp: Number.POSITIVE_INFINITY, tone: "neutral" as Tone }]
  return (
    <div className="grid gap-3">
      {pendingApprovals > 0 ? <NotificationItem item={{ id: "pending", title: "Persetujuan proposal", detail: `${pendingApprovals} item menunggu keputusan.`, timestamp: Number.POSITIVE_INFINITY, tone: "warning" }} /> : null}
      {items.slice(0, 5).map((item) => <NotificationItem key={item.id} item={item} />)}
    </div>
  )
}

function NotificationItem({ item }: { item: NotificationRecord }) {
  return (
    <article className="rounded-xl border border-[#E5E7EB] bg-[#FFFDF8] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-[#111827]">{item.title}</p>
          <p className="mt-1 text-sm font-medium leading-5 text-[#6B7280]">{item.detail}</p>
        </div>
        <StatusBadge label={relativeTime(item.timestamp)} tone={item.tone} />
      </div>
    </article>
  )
}

function FolderChips({ folders }: { folders: string[] }) {
  if (folders.length === 0) {
    return <p className="mb-4 rounded-xl border border-dashed border-[#E5E7EB] bg-[#FFFDF8] p-3 text-sm font-semibold text-[#94A3B8]">No Data Available</p>
  }

  return <div className="mb-4 flex flex-wrap gap-2">{folders.map((folder) => <StatusBadge key={folder} label={folder} tone="gold" />)}</div>
}

function DocumentTable({ documents, onArchive, onDownload, onEdit, onView }: { documents: DocumentRecord[]; onArchive: (document: DocumentRecord) => void; onDownload: (document: DocumentRecord) => void; onEdit: (document: DocumentRecord) => void; onView: (document: DocumentRecord) => void }) {
  if (documents.length === 0) return <EmptyState title="No Data Available" description="Dokumen administrasi resmi belum diunggah." />
  return (
    <ResponsiveTable headings={["ID", "Nama", "Kategori", "Versi", "Uploader", "Tanggal", "Status", "File", "Aksi"]}>
      {documents.map((document) => (
        <tr key={document.id}>
          <Cell strong>{document.id}</Cell><Cell>{document.name}</Cell><Cell>{document.category}</Cell><Cell>{document.version}</Cell><Cell>{document.uploader}</Cell><Cell>{document.date}</Cell>
          <Cell><StatusBadge label={document.status} tone={document.status === "Final" ? "success" : "warning"} /></Cell><Cell>{document.fileName}</Cell>
          <Cell><TableActions actions={[["View", Eye, () => onView(document)], ["Download", Download, () => onDownload(document)], ["Edit", Edit3, () => onEdit(document)], ["Archive", FileArchive, () => onArchive(document)]]} /></Cell>
        </tr>
      ))}
    </ResponsiveTable>
  )
}

function ApprovalTable({ approvals, onDecision }: { approvals: ApprovalRecord[]; onDecision: (id: string, status: ApprovalStatus) => void }) {
  return (
    <ResponsiveTable headings={["Jenis", "Judul", "Pemohon", "Tanggal", "Status", "Aksi"]}>
      {approvals.map((approval) => (
        <tr key={approval.id}>
          <Cell strong>{approval.type}</Cell><Cell>{approval.title}</Cell><Cell>{approval.requester}</Cell><Cell>{approval.date}</Cell>
          <Cell><StatusBadge label={approval.status} tone={approval.status === "Approved" ? "success" : approval.status === "Rejected" ? "danger" : "warning"} /></Cell>
          <Cell>
            <div className="flex flex-wrap gap-2">
              <IconButton label="Approve" icon={Check} onClick={() => onDecision(approval.id, "Approved")} />
              <IconButton label="Reject" icon={X} onClick={() => onDecision(approval.id, "Rejected")} />
            </div>
          </Cell>
        </tr>
      ))}
    </ResponsiveTable>
  )
}

function RundownControl({ summary }: { summary: DashboardSummary }) {
  const activities = summary.todaySchedule
  const completed = activities.filter((item) => item.status === "completed").length
  const running = activities.filter((item) => item.status === "live").length
  const changes = activities.slice(0, 3).map((item, index) => ({
    time: ["08:10", "09:20", "10:15"][index] ?? item.time,
    text: `${item.title} diperbarui untuk venue ${item.venue}`,
  }))
  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <MiniStat label="Total Aktivitas" value={activities.length || "No Data Available"} />
        <MiniStat label="Aktivitas Berjalan" value={running} />
        <MiniStat label="Aktivitas Selesai" value={completed} />
        <MiniStat label="Perubahan Hari Ini" value={changes.length} />
      </div>
      <div className="grid gap-2">
        {changes.length ? changes.map((item) => <TimelineItem key={`${item.time}-${item.text}`} time={item.time} text={item.text} />) : <EmptyState title="No Data Available" description="Timeline perubahan rundown belum tersedia." />}
      </div>
    </div>
  )
}

function ReportCenter({ reports, onDelete, onDownload, onGenerate, onPreview }: { reports: ReportRecord[]; onDelete: (id: string) => void; onDownload: (report: ReportRecord) => void; onGenerate: (type: string) => void; onPreview: (report: ReportRecord) => void }) {
  const rows = reports.length ? reports : reportTypes.map((type) => ({ id: type, type, owner: "Super Admin", date: "Data Not Published Yet", format: "PDF" as FinanceFormat, status: "Data Not Published Yet" as const }))
  return (
    <ResponsiveTable headings={["Jenis", "Dibuat Oleh", "Tanggal", "Format", "Status", "Aksi"]}>
      {rows.map((report) => (
        <tr key={report.id}>
          <Cell strong>{report.type}</Cell><Cell>{report.owner}</Cell><Cell>{report.date}</Cell><Cell>{report.format}</Cell>
          <Cell><StatusBadge label={report.status} tone={report.status === "Ready" ? "success" : "neutral"} /></Cell>
          <Cell><TableActions actions={[["Generate", FileCheck, () => onGenerate(report.type)], ["Preview", Eye, () => onPreview(report)], ["Download", Download, () => onDownload(report)], ["Delete", Trash2, () => onDelete(report.id)]]} /></Cell>
        </tr>
      ))}
    </ResponsiveTable>
  )
}

function FinanceSummary({ finance }: { finance: { income: number; expense: number; sponsorReceived: number; balance: number } }) {
  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <MiniStat label="Total Pemasukan" value={formatRupiah(finance.income + finance.sponsorReceived)} />
      <MiniStat label="Total Pengeluaran" value={formatRupiah(finance.expense)} />
      <MiniStat label="Saldo" value={formatRupiah(finance.balance)} />
      <MiniStat label="Dana Sponsor" value={formatRupiah(finance.sponsorReceived)} />
    </div>
  )
}

function TransactionTable({ transactions }: { transactions: TransactionRecord[] }) {
  if (transactions.length === 0) return <EmptyState title="No Data Available" description="Catatan transaksi akan muncul setelah Tambah Transaksi disimpan." />
  return (
    <ResponsiveTable headings={["ID", "Jenis", "Kategori", "Nominal", "Tanggal", "Deskripsi", "Bukti", "PIC"]}>
      {transactions.map((item) => <tr key={item.id}><Cell strong>{item.id}</Cell><Cell>{item.type}</Cell><Cell>{item.category}</Cell><Cell>{formatRupiah(item.amount)}</Cell><Cell>{item.date}</Cell><Cell>{item.description}</Cell><Cell>{item.evidence}</Cell><Cell>{item.pic}</Cell></tr>)}
    </ResponsiveTable>
  )
}

function SponsorFunding({ finance, sponsorFunds }: { finance: { sponsorReceived: number }; sponsorFunds: SponsorFund[] }) {
  const pending = sponsorFunds.filter((item) => item.status === "Pending")
  const disbursed = sponsorFunds.filter((item) => item.status === "Dicairkan")
  const unpaid = sponsorProspects.filter((prospect) => !sponsorFunds.some((fund) => fund.sponsor === prospect.name))
  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <MiniStat label="Total Sponsor Masuk" value={formatRupiah(finance.sponsorReceived)} />
        <MiniStat label="Sponsor Pending" value={pending.length} />
        <MiniStat label="Sponsor Dicairkan" value={disbursed.length} />
        <MiniStat label="Sponsor Belum Masuk" value={unpaid.length} />
      </div>
      <ResponsiveTable headings={["Sponsor", "Nominal", "Tanggal", "Status", "PIC"]}>
        {sponsorFunds.map((item) => <tr key={item.id}><Cell strong>{item.sponsor}</Cell><Cell>{formatRupiah(item.amount)}</Cell><Cell>{item.date}</Cell><Cell><StatusBadge label={item.status} tone={item.status === "Pending" ? "warning" : "success"} /></Cell><Cell>{item.pic}</Cell></tr>)}
      </ResponsiveTable>
    </div>
  )
}

function ArchivePanel({ archives, archivedDocuments, onDelete, onDownload, onRestore }: { archives: ArchiveRecord[]; archivedDocuments: DocumentRecord[]; onDelete: (id: string) => void; onDownload: (archive: ArchiveRecord) => void; onRestore: (archive: ArchiveRecord) => void }) {
  const [query, setQuery] = useState("")
  const rows = archives.filter((archive) => archive.title.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">{(["Dokumen", "Proposal", "Laporan", "Sponsor", "Keuangan", "Media"] as ArchiveCategory[]).map((item) => <StatusBadge key={item} label={item} tone="gold" />)}</div>
      <SearchInput value={query} onChange={setQuery} placeholder="Cari Arsip" />
      {rows.length ? (
        <ResponsiveTable headings={["Archive ID", "Kategori", "Judul", "Archived By", "Archived Date", "Restore Status", "Aksi"]}>
          {rows.map((archive) => <tr key={archive.id}><Cell strong>{archive.id}</Cell><Cell>{archive.category}</Cell><Cell>{archive.title}</Cell><Cell>{archive.archivedBy}</Cell><Cell>{archive.archivedDate}</Cell><Cell><StatusBadge label={archive.restoreStatus} tone={archive.restoreStatus === "Restored" ? "success" : "warning"} /></Cell><Cell><TableActions actions={[["Restore", RotateCcw, () => onRestore(archive)], ["Download", Download, () => onDownload(archive)], ["Delete Permanen", Trash2, () => onDelete(archive.id)]]} /></Cell></tr>)}
        </ResponsiveTable>
      ) : <EmptyState title="No Data Available" description={archivedDocuments.length ? "Tidak ada arsip sesuai pencarian." : "Arsip akan muncul setelah dokumen diarchive."} />}
    </div>
  )
}

function AuditLog({ filter, items, onFilter }: { filter: string; items: AuditRecord[]; onFilter: (value: string) => void }) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">{["Hari Ini", "7 Hari", "30 Hari", "Semua"].map((item) => <button key={item} type="button" className={cn("h-9 rounded-lg border px-3 text-sm font-bold", filter === item ? "border-[#F97316] bg-[#FFF7ED] text-[#F97316]" : "border-[#E5E7EB] bg-white text-[#6B7280]")} onClick={() => onFilter(item)}>{item}</button>)}</div>
      <div className="grid gap-2">
        {items.length ? items.map((item) => <TimelineItem key={item.id} time={item.time} text={`${item.action} - ${item.actor}`} />) : <EmptyState title="No Data Available" description="Audit activity log akan muncul setelah aksi dilakukan." />}
      </div>
    </div>
  )
}

function GlobalSearch({ onQuery, query, results }: { onQuery: (value: string) => void; query: string; results: Array<{ type: string; title: string; detail: string }> }) {
  return (
    <div className="grid gap-4">
      <SearchInput value={query} onChange={onQuery} placeholder="Cari dokumen, sponsor, peserta, panitia, keuangan, laporan" />
      <div className="grid gap-2">
        {results.length ? results.map((result) => <article key={`${result.type}-${result.title}`} className="rounded-xl border border-[#E5E7EB] bg-[#FFFDF8] p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-[#111827]">{result.title}</p><p className="mt-1 text-sm font-medium text-[#6B7280]">{result.detail}</p></div><StatusBadge label={result.type} tone="info" /></div></article>) : <EmptyState title={query ? "No Data Available" : "Data Not Published Yet"} description="Hasil realtime muncul setelah kata kunci cocok dengan data administrasi." />}
      </div>
    </div>
  )
}

function SecurityDashboard({ auditCount, failedLogin, uploadCount }: { auditCount: number; failedLogin: number; uploadCount: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <MiniStat label="Jumlah Login Hari Ini" value="No Data Available" />
      <MiniStat label="Role Aktif" value="Super Admin" />
      <MiniStat label="Permission Rules" value={`${permissionRoles.length} Role`} />
      <MiniStat label="Failed Login" value={failedLogin} />
      <MiniStat label="File Upload Validation" value={uploadCount ? "Active" : "Ready"} />
      <MiniStat label="Audit Enabled" value={`${auditCount} Event`} />
    </div>
  )
}

function ResponsiveTable({ children, headings }: { children: ReactNode; headings: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
        <thead><tr>{headings.map((heading) => <th key={heading} className="border-b border-[#E5E7EB] px-3 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[#64748B] first:pl-0 last:pr-0">{heading}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Cell({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return <td className={cn("border-b border-[#F1F5F9] px-3 py-3 align-top text-[#64748B] first:pl-0 last:pr-0", strong ? "font-bold text-[#111827]" : "")}>{children}</td>
}

function TableActions({ actions }: { actions: Array<[string, LucideIcon, () => void]> }) {
  return <div className="flex flex-wrap gap-2">{actions.map(([label, icon, onClick]) => <IconButton key={label} label={label} icon={icon} onClick={onClick} />)}</div>
}

function IconButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-xs font-bold text-[#111827] hover:bg-[#FFF7ED]" onClick={onClick}><Icon className="size-3.5 text-[#F97316]" aria-hidden="true" />{label}</button>
}

function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return <div className="min-w-0 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3"><p className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">{label}</p><p className="mt-2 break-words font-heading text-base font-bold text-[#111827]">{value}</p></div>
}

function TimelineItem({ text, time }: { text: string; time: string }) {
  return <article className="flex gap-3 rounded-xl border border-[#E5E7EB] bg-[#FFFDF8] p-3"><span className="font-heading text-sm font-bold text-[#F97316]">{time}</span><p className="text-sm font-semibold leading-6 text-[#111827]">{text}</p></article>
}

function EmptyState({ description, title }: { description: string; title: string }) {
  return <div className="grid min-h-32 place-items-center rounded-xl border border-dashed border-[#E5E7EB] bg-[#FFFDF8] p-6 text-center"><div><p className="font-heading text-base font-bold text-[#111827]">{title}</p><p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p></div></div>
}

function SearchInput({ onChange, placeholder, value }: { onChange: (value: string) => void; placeholder: string; value: string }) {
  return <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#F97316]" aria-hidden="true" /><input className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20" placeholder={placeholder} type="search" value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

function FormModal({ children, onClose, open, title }: { children: ReactNode; onClose: () => void; open: boolean; title: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#111827]/30 px-4 py-6 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section aria-modal="true" className="max-h-[calc(100vh-48px)] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(17,24,39,0.2)]" role="dialog" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] p-5">
          <h3 className="font-heading text-lg font-bold text-[#111827]">{title}</h3>
          <button type="button" className="grid size-9 place-items-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#FFF7ED]" aria-label="Close modal" onClick={onClose}><X className="size-4" /></button>
        </div>
        <div className="max-h-[calc(100vh-160px)] overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  )
}

function RecordForm({ children, onSubmit, submitLabel }: { children: ReactNode; onSubmit: (formData: FormData) => void; submitLabel: string }) {
  return <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)) }}>{children}<div className="sm:col-span-2"><button type="submit" className="mcs-button-primary inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-bold">{submitLabel}</button></div></form>
}

function InputField({ defaultValue, label, list, name, required, type = "text" }: { defaultValue?: string; label: string; list?: string; name: string; required?: boolean; type?: string }) {
  return <label className="grid gap-1.5"><span className="text-sm font-bold text-[#111827]">{label}</span><input className="h-10 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 file:mr-3 file:rounded-lg file:border-0 file:bg-[#FFF7ED] file:px-3 file:py-1 file:text-xs file:font-bold file:text-[#F97316]" defaultValue={defaultValue} list={list} name={name} required={required} type={type} /></label>
}

function SelectField({ defaultValue, label, name, options }: { defaultValue?: string; label: string; name: string; options: string[] }) {
  return <label className="grid gap-1.5"><span className="text-sm font-bold text-[#111827]">{label}</span><select className="h-10 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20" defaultValue={defaultValue} name={name}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
}

function TextareaField({ label, name }: { label: string; name: string }) {
  return <label className="grid gap-1.5 sm:col-span-2"><span className="text-sm font-bold text-[#111827]">{label}</span><textarea className="min-h-24 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-[#111827] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20" name={name} /></label>
}

function initialSponsorFunds(): SponsorFund[] {
  return []
}

function initialAudit(summary: DashboardSummary, user: UserDTO): AuditRecord[] {
  const mapped = summary.auditPreview.slice(0, 5).map((item) => ({ id: item.id, time: new Date(item.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }), action: item.action.replace(".", " "), actor: item.userName, category: item.resource, timestamp: new Date(item.timestamp).getTime() }))
  if (mapped.length) return mapped
  void user
  return []
}

function initialNotifications(): NotificationRecord[] {
  return []
}

function matchesAuditFilter(item: AuditRecord, filter: string) {
  const age = Date.now() - item.timestamp
  if (filter === "Hari Ini") return new Date(item.timestamp).toDateString() === new Date().toDateString()
  if (filter === "7 Hari") return age <= 7 * 24 * 60 * 60 * 1000
  if (filter === "30 Hari") return age <= 30 * 24 * 60 * 60 * 1000
  return true
}

function searchEverything(query: string, data: { activeDocuments: DocumentRecord[]; approvals: ApprovalRecord[]; reports: ReportRecord[]; sponsorFunds: SponsorFund[]; transactions: TransactionRecord[]; user: UserDTO }) {
  if (!query.trim()) return []
  const needle = query.toLowerCase()
  return [
    ...data.activeDocuments.map((item) => ({ type: "Dokumen", title: item.name, detail: `${item.category} - ${item.status}` })),
    ...data.sponsorFunds.map((item) => ({ type: "Sponsor", title: item.sponsor, detail: `${formatRupiah(item.amount)} - ${item.status}` })),
    ...data.transactions.map((item) => ({ type: "Keuangan", title: item.description, detail: `${item.category} - ${formatRupiah(item.amount)}` })),
    ...data.reports.map((item) => ({ type: "Laporan", title: item.type, detail: `${item.format} - ${item.status}` })),
    ...data.approvals.map((item) => ({ type: "Persetujuan", title: item.title, detail: `${item.type} - ${item.status}` })),
    { type: "Panitia", title: data.user.displayName, detail: data.user.role },
    ...scheduleDays.flatMap((day) => day.items.map((item) => ({ type: "Peserta", title: item.pic, detail: `${item.title} - ${day.label}` }))),
  ].filter((item) => `${item.type} ${item.title} ${item.detail}`.toLowerCase().includes(needle)).slice(0, 8)
}

async function exportFinance(format: FinanceFormat, data: { auditLog: AuditRecord[]; finance: { balance: number; expense: number; income: number; sponsorReceived: number }; reportTitle: string; sponsorFunds: SponsorFund[]; transactions: TransactionRecord[] }) {
  if (format === "CSV") {
    downloadTextFile("mcs-finance.csv", toCsv([["Jenis", "Kategori", "Nominal", "Tanggal", "Deskripsi", "PIC"], ...data.transactions.map((item) => [item.type, item.category, item.amount, item.date, item.description, item.pic])]))
    return
  }
  if (format === "Excel") {
    const XLSX = await import("xlsx-js-style")
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Ringkasan Keuangan"], ["Total Pemasukan", data.finance.income + data.finance.sponsorReceived], ["Total Pengeluaran", data.finance.expense], ["Saldo", data.finance.balance], ["Dana Sponsor", data.finance.sponsorReceived]]), "Ringkasan")
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.transactions), "Transaksi")
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.sponsorFunds), "Sponsor")
    XLSX.writeFile(workbook, "mcs-finance-report.xlsx")
    return
  }
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
  const autoTable = autoTableModule.default
  const doc = new jsPDF()
  doc.setFillColor(8, 28, 58)
  doc.rect(0, 0, 210, 297, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.text(data.reportTitle || "Laporan Keuangan MCS 1", 18, 58)
  doc.setFontSize(12)
  doc.text(event.theme, 18, 68)
  doc.text(`Tanggal Export: ${new Date().toLocaleDateString("id-ID")}`, 18, 78)
  doc.text("MCS 1", 18, 92)
  brandAssets.forEach((asset, index) => {
    doc.roundedRect(18 + index * 58, 108, 46, 22, 3, 3)
    doc.text(asset.name.replace("Logo ", ""), 21 + index * 58, 121, { maxWidth: 40 })
  })
  addFooter(doc)
  doc.addPage()
  doc.setTextColor(17, 24, 39)
  doc.setFontSize(18)
  doc.text("Ringkasan Keuangan", 14, 22)
  autoTable(doc, { startY: 30, head: [["Metrik", "Nilai"]], body: [["Total Pemasukan", formatRupiah(data.finance.income + data.finance.sponsorReceived)], ["Total Pengeluaran", formatRupiah(data.finance.expense)], ["Saldo", formatRupiah(data.finance.balance)], ["Dana Sponsor", formatRupiah(data.finance.sponsorReceived)]] })
  addFooter(doc)
  doc.addPage()
  doc.text("Daftar Transaksi", 14, 22)
  autoTable(doc, { startY: 30, head: [["ID", "Jenis", "Kategori", "Nominal", "Tanggal", "PIC"]], body: data.transactions.map((item) => [item.id, item.type, item.category, formatRupiah(item.amount), item.date, item.pic]) })
  addFooter(doc)
  doc.addPage()
  doc.text("Sponsor Funding", 14, 22)
  autoTable(doc, { startY: 30, head: [["Sponsor", "Nominal", "Tanggal", "Status", "PIC"]], body: data.sponsorFunds.map((item) => [item.sponsor, formatRupiah(item.amount), item.date, item.status, item.pic]) })
  addFooter(doc)
  doc.addPage()
  doc.text("Audit Log", 14, 22)
  autoTable(doc, { startY: 30, head: [["Waktu", "Aktivitas", "Aktor", "Kategori"]], body: data.auditLog.map((item) => [item.time, item.action, item.actor, item.category]) })
  addFooter(doc)
  doc.addPage()
  doc.text("Ringkasan Final", 14, 22)
  doc.setFontSize(11)
  doc.text(`Exported by MCS Dashboard untuk ${event.name}. Saldo akhir: ${formatRupiah(data.finance.balance)}.`, 14, 36, { maxWidth: 180 })
  addFooter(doc)
  doc.save("mcs-finance-report.pdf")
}

function addFooter(doc: { internal: { pageSize: { getHeight: () => number } }; setFontSize: (size: number) => void; setTextColor: (r: number, g: number, b: number) => void; text: (text: string, x: number, y: number) => void }) {
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text("Exported by MCS Dashboard", 14, doc.internal.pageSize.getHeight() - 10)
}

function exportDocuments(documents: DocumentRecord[]) {
  downloadTextFile("mcs-documents.csv", toCsv([["ID", "Nama", "Kategori", "Versi", "Uploader", "Tanggal", "Status", "File"], ...documents.map((item) => [item.id, item.name, item.category, item.version, item.uploader, item.date, item.status, item.fileName])]))
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function getDocumentText(document: DocumentRecord) {
  return `${event.name}\n${document.id}\n${document.name}\n${document.category}\n${document.version}\n${document.status}\n${document.fileName}`
}

function toCsv(rows: Array<Array<string | number>>) {
  return rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n")
}

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { currency: "IDR", maximumFractionDigits: 0, style: "currency" }).format(value)
}

function relativeTime(timestamp: number) {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000))
  if (minutes < 1) return "Baru"
  if (minutes < 60) return `${minutes} menit`
  return `${Math.round(minutes / 60)} jam`
}
