"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  Radio,
  Search,
  Trash2,
  UploadCloud,
  X,
  type LucideIcon,
} from "lucide-react"

import { event as mcsEvent } from "@/data/mcs"
import { cn } from "@/lib/utils"
import type { AuditLogRecord, Permission, ScheduleRecord, ScheduleStatus, UserDTO } from "@/server/mcs/types"

type ScheduleType = ScheduleRecord["type"]
type SortKey = "date" | "time" | "title" | "type" | "venue" | "pic" | "duration" | "status"
type ModalMode = "create" | "view" | "edit" | "publish" | "export" | "delete" | null

type ScheduleManagementControlRoomProps = {
  permissions: Permission[]
  initialSchedules: ScheduleRecord[]
  user: UserDTO
}

type ScheduleFormState = {
  date: string
  time: string
  title: string
  type: ScheduleType
  venue: string
  pic: string
  duration: string
  status: ScheduleStatus
  notes: string
}

const PAGE_SIZE = 8
const ALL = "all"

const categoryOptions: Array<{ label: string; value: ScheduleType }> = [
  { label: "Match", value: "match" },
  { label: "Ceremony", value: "ceremony" },
  { label: "Operation", value: "operation" },
  { label: "Briefing", value: "briefing" },
  { label: "Technical Meeting", value: "technical_meeting" },
  { label: "Awarding", value: "awarding" },
  { label: "Opening", value: "opening" },
  { label: "Closing", value: "closing" },
  { label: "Lainnya", value: "other" },
]

const statusOptions: Array<{ label: string; value: ScheduleStatus }> = [
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Live", value: "live" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
]

const emptyForm: ScheduleFormState = {
  date: mcsEvent.startDate,
  duration: "60 menit",
  notes: "",
  pic: "",
  status: "draft",
  time: "08:00",
  title: "",
  type: "match",
  venue: "",
}

export function ScheduleManagementControlRoom({
  permissions,
  initialSchedules,
  user,
}: ScheduleManagementControlRoomProps) {
  const [schedules, setSchedules] = useState<ScheduleRecord[]>(initialSchedules)
  const [activity, setActivity] = useState<AuditLogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleRecord | null>(null)
  const [form, setForm] = useState<ScheduleFormState>(emptyForm)
  const [toast, setToast] = useState("")
  const [query, setQuery] = useState("")
  const [dateFilter, setDateFilter] = useState(ALL)
  const [typeFilter, setTypeFilter] = useState(ALL)
  const [venueFilter, setVenueFilter] = useState(ALL)
  const [picFilter, setPicFilter] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)

  const canCreate = permissions.includes("schedules.create")
  const canUpdate = permissions.includes("schedules.update")
  const canDelete = permissions.includes("schedules.delete")
  const canUnpublish = user.role === "super_admin"

  useEffect(() => {
    void refreshData()
  }, [])

  useEffect(() => {
    if (!toast) return

    const timeout = window.setTimeout(() => setToast(""), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const sortedSchedules = useMemo(() => sortSchedules(schedules), [schedules])
  const now = new Date()
  const liveSchedules = sortedSchedules.filter((schedule) => getAutomaticStatus(schedule, now) === "live")
  const currentSchedule = liveSchedules[0]
  const nextMatch = sortedSchedules.find((schedule) => schedule.type === "match" && getScheduleStart(schedule).getTime() >= now.getTime())
  const activeVenues = new Set(sortedSchedules.filter((schedule) => schedule.status !== "cancelled").map((schedule) => schedule.venue)).size
  const dates = uniqueOptions(sortedSchedules.map((schedule) => schedule.date))
  const venues = uniqueOptions(sortedSchedules.map((schedule) => schedule.venue))
  const pics = uniqueOptions(sortedSchedules.map((schedule) => schedule.pic))
  const venueGroups = groupSchedulesBy(sortedSchedules, "venue")
  const picGroups = groupSchedulesBy(sortedSchedules, "pic")

  const conflictWarnings = useMemo(() => {
    if (!form.date || !form.time || !form.duration) return []

    return detectScheduleConflicts(form, schedules, selectedSchedule?.id)
  }, [form, schedules, selectedSchedule])

  const filteredSchedules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return sortedSchedules
      .filter((schedule) => {
        const searchable = `${schedule.title} ${schedule.type} ${schedule.venue} ${schedule.pic} ${schedule.date} ${schedule.status}`.toLowerCase()

        return (
          (!normalizedQuery || searchable.includes(normalizedQuery)) &&
          (dateFilter === ALL || schedule.date === dateFilter) &&
          (typeFilter === ALL || schedule.type === typeFilter) &&
          (venueFilter === ALL || schedule.venue === venueFilter) &&
          (picFilter === ALL || schedule.pic === picFilter) &&
          (statusFilter === ALL || schedule.status === statusFilter)
        )
      })
      .sort((first, second) => compareBySortKey(first, second, sortKey, sortDirection))
  }, [dateFilter, picFilter, query, sortedSchedules, sortDirection, sortKey, statusFilter, typeFilter, venueFilter])

  const pageCount = Math.max(Math.ceil(filteredSchedules.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, pageCount)
  const visibleSchedules = filteredSchedules.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  async function refreshData() {
    setLoading(true)
    try {
      const [scheduleData, auditData] = await Promise.all([
        requestJson<ScheduleRecord[]>("/api/mcs/schedules"),
        requestJson<AuditLogRecord[]>("/api/mcs/audit-logs"),
      ])
      setSchedules(scheduleData)
      setActivity(auditData.filter((item) => item.resource === "schedules"))
    } catch (error) {
      setToast(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal(status: ScheduleStatus = "draft") {
    if (!canCreate) {
      setToast("Akses tambah jadwal tidak tersedia untuk role ini.")
      return
    }

    setSelectedSchedule(null)
    setForm({ ...emptyForm, status })
    setModalMode("create")
  }

  function openSchedule(schedule: ScheduleRecord, mode: "view" | "edit" = "edit") {
    if (mode === "edit" && !canUpdate) {
      setToast("Role ini hanya dapat melihat jadwal.")
      setSelectedSchedule(schedule)
      setForm(scheduleToForm(schedule))
      setModalMode("view")
      return
    }

    setSelectedSchedule(schedule)
    setForm(scheduleToForm(schedule))
    setModalMode(mode)
  }

  function openDuplicate(schedule: ScheduleRecord) {
    if (!canCreate) {
      setToast("Akses duplikasi jadwal tidak tersedia untuk role ini.")
      return
    }

    setSelectedSchedule(schedule)
    setForm({
      ...scheduleToForm(schedule),
      status: "draft",
      title: `${schedule.title} Copy`,
    })
    setModalMode("create")
  }

  function openDelete(schedule: ScheduleRecord) {
    if (!canDelete) {
      setToast("Akses hapus jadwal hanya tersedia untuk Super Admin.")
      return
    }

    setSelectedSchedule(schedule)
    setModalMode("delete")
  }

  async function saveSchedule(nextStatus: ScheduleStatus) {
    if (!form.date || !form.time || !form.title.trim() || !form.venue.trim() || !form.pic.trim() || !form.duration.trim()) {
      setToast("Lengkapi field wajib sebelum menyimpan jadwal.")
      return
    }

    const payload = {
      ...form,
      dayName: formatDayName(form.date),
      label: formatShortDate(form.date),
      status: nextStatus,
    }

    try {
      if (modalMode === "edit" && selectedSchedule) {
        await requestJson<ScheduleRecord>(`/api/mcs/schedules/${selectedSchedule.id}`, {
          body: JSON.stringify(payload),
          method: "PATCH",
        })
        setToast("Perubahan jadwal berhasil disimpan.")
      } else {
        await requestJson<ScheduleRecord>("/api/mcs/schedules", {
          body: JSON.stringify({
            ...payload,
            auditAction: selectedSchedule ? "schedules.duplicate" : "schedules.create",
          }),
          method: "POST",
        })
        setToast(selectedSchedule ? "Jadwal berhasil diduplikasi." : nextStatus === "draft" ? "Draft jadwal berhasil disimpan." : "Jadwal berhasil dipublikasikan.")
      }

      closeModal()
      await refreshData()
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  async function deleteSchedule() {
    if (!selectedSchedule) return

    try {
      await requestJson(`/api/mcs/schedules/${selectedSchedule.id}`, { method: "DELETE" })
      setToast("Jadwal berhasil dihapus.")
      closeModal()
      await refreshData()
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  async function publishRundown() {
    if (!canUpdate) {
      setToast("Akses publikasi rundown tidak tersedia untuk role ini.")
      return
    }

    try {
      await requestJson("/api/mcs/schedules/publish", { method: "POST" })
      setToast("Rundown berhasil dipublikasikan")
      closeModal()
      await refreshData()
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  async function unpublishRundown() {
    if (!canUnpublish) {
      setToast("Tarik publikasi hanya tersedia untuk Super Admin.")
      return
    }

    try {
      await requestJson("/api/mcs/schedules/unpublish", { method: "POST" })
      setToast("Publikasi rundown berhasil ditarik.")
      await refreshData()
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  function closeModal() {
    setModalMode(null)
    setSelectedSchedule(null)
  }

  function updateSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(nextKey)
    setSortDirection("asc")
  }

  async function exportPdf() {
    try {
      const { jsPDF } = await import("jspdf")
      const autoTableModule = await import("jspdf-autotable")
      const autoTable = autoTableModule.default ?? autoTableModule.autoTable
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
      const pageWidth = doc.internal.pageSize.getWidth()
      const exportDate = formatLongDateTime(new Date().toISOString())

      doc.setFillColor(8, 28, 58)
      doc.rect(0, 0, pageWidth, 104, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(20)
      doc.text("MELATI CHAMPIONSHIP SERIES 1", 40, 42)
      doc.setFontSize(13)
      doc.text("JADWAL RESMI ACARA", 40, 66)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text("SMKN 20 JAKARTA / MCS 1 Event Management System", 40, 86)
      doc.setFillColor(249, 115, 22)
      doc.roundedRect(pageWidth - 150, 30, 106, 42, 10, 10, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text("MCS 1", pageWidth - 121, 57)

      doc.setTextColor(17, 24, 39)
      doc.setFontSize(10)
      const info = [
        `Tanggal Export: ${exportDate}`,
        `Operator: ${user.displayName}`,
        `Jumlah Kegiatan: ${schedules.length}`,
        `Jumlah Match: ${schedules.filter((schedule) => schedule.type === "match").length}`,
        `Jumlah Venue: ${activeVenues}`,
        `Jumlah PIC: ${new Set(schedules.map((schedule) => schedule.pic)).size}`,
      ]
      info.forEach((line, index) => doc.text(line, 40 + (index % 3) * 245, 130 + Math.floor(index / 3) * 18))

      autoTable(doc, {
        body: sortSchedules(schedules).map((schedule, index) => [
          index + 1,
          formatShortDate(schedule.date),
          formatTime(schedule.time),
          schedule.title,
          formatCategory(schedule.type),
          schedule.venue,
          schedule.pic,
          formatStatus(schedule.status),
        ]),
        didDrawPage: (data) => {
          const pageNumber = doc.getNumberOfPages()
          doc.setFontSize(9)
          doc.setTextColor(107, 114, 128)
          doc.text("Exported by MCS Event Management System", data.settings.margin.left, doc.internal.pageSize.getHeight() - 28)
          doc.text(`Melati Championship Series 1 / SMKN 20 Jakarta / Page ${pageNumber}`, pageWidth - 260, doc.internal.pageSize.getHeight() - 28)
        },
        head: [["No", "Tanggal", "Jam", "Kegiatan", "Kategori", "Tempat", "PIC", "Status"]],
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        margin: { left: 40, right: 40, top: 160 },
        styles: { cellPadding: 7, fontSize: 8, lineColor: [229, 231, 235], lineWidth: 0.5 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
      })

      doc.save("Jadwal_Resmi_MCS_1.pdf")
      await recordAudit("schedules.export", "PDF Premium")
      setToast("PDF Premium jadwal berhasil dibuat.")
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  async function exportExcel() {
    try {
      const XLSX = await import("xlsx-js-style")
      const workbook = XLSX.utils.book_new()
      const venueRows = buildVenueRows(schedules)
      const picRows = buildPicRows(schedules)
      const summarySheet = styledSheet([
        ["Ringkasan Jadwal MCS 1", ""],
        ["Tanggal Export", formatLongDateTime(new Date().toISOString())],
        ["Operator", user.displayName],
        ["Jumlah Kegiatan", schedules.length],
        ["Jumlah Match", schedules.filter((schedule) => schedule.type === "match").length],
        ["Jumlah Venue", activeVenues],
        ["Jumlah PIC", new Set(schedules.map((schedule) => schedule.pic)).size],
      ], XLSX)
      const timelineSheet = styledSheet([
        ["No", "Tanggal", "Jam", "Kegiatan", "Kategori", "Tempat", "PIC", "Durasi", "Status"],
        ...sortSchedules(schedules).map((schedule, index) => [
          index + 1,
          formatShortDate(schedule.date),
          formatTime(schedule.time),
          schedule.title,
          formatCategory(schedule.type),
          schedule.venue,
          schedule.pic,
          schedule.duration,
          formatStatus(schedule.status),
        ]),
      ], XLSX)
      const venueSheet = styledSheet([["Venue", "Tanggal", "Jam", "Kegiatan", "PIC", "Status"], ...venueRows], XLSX)
      const picSheet = styledSheet([["PIC", "Jumlah Tugas", "Venue", "Status"], ...picRows], XLSX)

      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan")
      XLSX.utils.book_append_sheet(workbook, timelineSheet, "Timeline Event")
      XLSX.utils.book_append_sheet(workbook, venueSheet, "Venue Schedule")
      XLSX.utils.book_append_sheet(workbook, picSheet, "PIC Assignment")
      XLSX.writeFile(workbook, "Jadwal_Premium_MCS_1.xlsx")
      await recordAudit("schedules.export", "Excel Premium")
      setToast("Excel Premium jadwal berhasil dibuat.")
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  async function recordAudit(action: string, detail: string) {
    await requestJson("/api/mcs/audit-logs", {
      body: JSON.stringify({ action, detail, resource: "schedules" }),
      method: "POST",
    })
    await refreshData()
  }

  return (
    <div className="grid gap-5">
      {toast ? <Toast message={toast} /> : null}

      <section className="rounded-2xl border border-[#111827]/10 bg-[#FFF7ED] p-5 shadow-[0_18px_48px_rgba(17,24,39,0.08)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#F97316] text-white shadow-[0_12px_24px_rgba(249,115,22,0.24)]">
                <CalendarDays className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-2xl font-bold tracking-normal text-[#111827]">Manajemen Jadwal</h2>
                <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[#6B7280]">
                  Kelola rundown, timeline kegiatan, jadwal lomba, venue, dan aktivitas operasional MCS.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button icon={Plus} label="Tambah Jadwal" onClick={() => openCreateModal("draft")} />
            <Button icon={UploadCloud} label="Publikasikan Rundown" variant="secondary" onClick={() => setModalMode("publish")} />
            <Button icon={Download} label="Ekspor Jadwal" variant="secondary" onClick={() => setModalMode("export")} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Kegiatan Hari Ini" value={countTodaySchedules(schedules)} tone="info" />
        <MetricCard label="Kegiatan Live" value={liveSchedules.length} tone="success" />
        <MetricCard label="Match Berikutnya" value={nextMatch ? nextMatch.title : 0} tone="gold" />
        <MetricCard label="Venue Aktif" value={activeVenues} tone="navy" />
      </section>

      <section className="grid gap-4 rounded-2xl border border-[#111827]/10 bg-white p-4 shadow-[0_14px_36px_rgba(17,24,39,0.06)] xl:grid-cols-[1.2fr_repeat(5,minmax(140px,1fr))]">
        <SearchField value={query} onChange={setQuery} />
        <SelectFilter label="Tanggal" options={dates} value={dateFilter} onChange={setDateFilter} />
        <SelectFilter label="Kategori" options={categoryOptions.map((item) => ({ label: item.label, value: item.value }))} value={typeFilter} onChange={setTypeFilter} />
        <SelectFilter label="Tempat" options={venues} value={venueFilter} onChange={setVenueFilter} />
        <SelectFilter label="PIC" options={pics} value={picFilter} onChange={setPicFilter} />
        <SelectFilter label="Status" options={statusOptions.map((item) => ({ label: item.label, value: item.value }))} value={statusFilter} onChange={setStatusFilter} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Live Event Mode" description="Status hari-H mengikuti rentang waktu kegiatan.">
          {currentSchedule ? (
            <div className="grid gap-4">
              <StatusLine status="Live" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">Sedang Berlangsung</p>
                <h3 className="mt-2 font-heading text-2xl font-bold text-[#111827]">{currentSchedule.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#6B7280]">{currentSchedule.venue} / PIC: {currentSchedule.pic}</p>
              </div>
              <div className="rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#C2410C]">Countdown selesai</p>
                <p className="mt-1 font-heading text-xl font-bold text-[#111827]">{getEndCountdown(currentSchedule, now)}</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <StatusLine status="Upcoming" />
              <p className="text-sm font-medium leading-6 text-[#6B7280]">
                Tidak ada kegiatan yang berada dalam rentang waktu saat ini. Kegiatan berikutnya akan muncul otomatis.
              </p>
            </div>
          )}
        </Panel>

        <Panel
          action={canUnpublish ? <Button icon={X} label="Tarik Publikasi" variant="danger" onClick={unpublishRundown} /> : null}
          title="Status Publikasi"
          description="Kontrol publikasi rundown resmi MCS 1."
        >
          <div className="grid gap-3">
            <Fact label="Draft" value={schedules.filter((schedule) => schedule.status === "draft").length} />
            <Fact label="Scheduled" value={schedules.filter((schedule) => schedule.status === "scheduled").length} />
            <Fact label="Published At" value={getLatestPublishLabel(schedules)} />
          </div>
        </Panel>
      </section>

      <Panel title="Timeline Table" description="Klik baris jadwal untuk membuka modal edit.">
        <div className="max-h-[620px] overflow-auto">
          <table className="w-full min-w-[1040px] border-separate border-spacing-0 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
                {[
                  ["Tanggal", "date"],
                  ["Jam", "time"],
                  ["Kegiatan", "title"],
                  ["Kategori", "type"],
                  ["Tempat", "venue"],
                  ["PIC", "pic"],
                  ["Durasi", "duration"],
                  ["Status", "status"],
                ].map(([label, key]) => (
                  <th key={key} className="border-b border-[#E5E7EB] px-4 py-3">
                    <button type="button" className="font-bold" onClick={() => updateSort(key as SortKey)}>
                      {label}
                    </button>
                  </th>
                ))}
                <th className="border-b border-[#E5E7EB] px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visibleSchedules.map((schedule, index) => (
                <tr
                  key={schedule.id}
                  className={cn("cursor-pointer align-top transition hover:bg-[#FFF7ED]", index % 2 === 0 ? "bg-white" : "bg-[#FFFDF8]")}
                  onClick={() => openSchedule(schedule, "edit")}
                >
                  <td className="border-b border-[#F1F5F9] px-4 py-4">{formatShortDate(schedule.date)}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{formatTime(schedule.time)}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{schedule.title}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#6B7280]">{formatCategory(schedule.type)}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#6B7280]">{schedule.venue}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#6B7280]">{schedule.pic}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#6B7280]">{schedule.duration}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4">
                    <ScheduleStatusBadge status={getAutomaticStatus(schedule, now)} />
                  </td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4">
                    <div className="flex flex-wrap gap-1.5" onClick={(event) => event.stopPropagation()}>
                      <IconButton label="Lihat" icon={Eye} onClick={() => openSchedule(schedule, "view")} />
                      <IconButton label="Edit" icon={Pencil} onClick={() => openSchedule(schedule, "edit")} />
                      <IconButton label="Duplikat" icon={Copy} onClick={() => openDuplicate(schedule)} />
                      <IconButton label="Hapus" icon={Trash2} danger onClick={() => openDelete(schedule)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSchedules.length === 0 ? (
          <EmptyScheduleState onCreate={() => openCreateModal("draft")} />
        ) : null}
        <Pagination page={currentPage} pageCount={pageCount} total={filteredSchedules.length} onPageChange={setPage} />
        {loading ? <p className="px-5 pb-5 text-sm font-medium text-[#6B7280]">Memuat jadwal...</p> : null}
      </Panel>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Venue Schedule View" description="Penggunaan venue dikelompokkan untuk kontrol lapangan dan ruang.">
          <div className="grid gap-3">
            {venueGroups.map((group) => (
              <GroupedSchedule key={group.label} label={group.label} schedules={group.items} />
            ))}
          </div>
        </Panel>

        <Panel title="PIC Assignment View" description="Jumlah tugas, venue, dan status PIC.">
          <div className="grid gap-2">
            {picGroups.map((group) => (
              <div key={group.label} className="grid gap-3 rounded-2xl border border-[#111827]/10 bg-[#FFFDF8] p-3 sm:grid-cols-[minmax(0,1fr)_110px_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#111827]">{group.label}</p>
                  <p className="mt-1 text-xs font-medium text-[#6B7280]">{group.items.length} tugas</p>
                </div>
                <p className="truncate text-sm font-semibold text-[#6B7280]">{uniqueOptions(group.items.map((item) => item.venue)).map((item) => item.label).join(", ")}</p>
                <ScheduleStatusBadge status={group.items.some((item) => getAutomaticStatus(item, now) === "live") ? "live" : "scheduled"} />
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="Activity Log" description="Catatan tambah, edit, duplikasi, hapus, publikasi, tarik publikasi, dan ekspor jadwal.">
        <div className="grid gap-2">
          {activity.slice(0, 8).map((item) => (
            <div key={item.id} className="grid gap-2 rounded-2xl border border-[#111827]/10 bg-[#FFFDF8] p-3 sm:grid-cols-[170px_minmax(0,1fr)_auto] sm:items-center">
              <span className="text-xs font-semibold text-[#6B7280]">{formatLongDateTime(item.timestamp)}</span>
              <span className="text-sm font-bold text-[#111827]">{formatAuditAction(item.action)}</span>
              <span className="text-xs font-semibold text-[#6B7280]">{item.userName}</span>
            </div>
          ))}
          {activity.length === 0 ? <p className="text-sm font-medium text-[#6B7280]">Aktivitas jadwal akan muncul setelah ada perubahan.</p> : null}
        </div>
      </Panel>

      <ScheduleModal
        conflictWarnings={conflictWarnings}
        form={form}
        mode={modalMode}
        selectedSchedule={selectedSchedule}
        onClose={closeModal}
        onDelete={deleteSchedule}
        onExportExcel={exportExcel}
        onExportPdf={exportPdf}
        onFormChange={setForm}
        onPublish={publishRundown}
        onSave={saveSchedule}
        schedules={sortedSchedules}
      />
    </div>
  )
}

function ScheduleModal({
  conflictWarnings,
  form,
  mode,
  onClose,
  onDelete,
  onExportExcel,
  onExportPdf,
  onFormChange,
  onPublish,
  onSave,
  schedules,
  selectedSchedule,
}: {
  conflictWarnings: string[]
  form: ScheduleFormState
  mode: ModalMode
  onClose: () => void
  onDelete: () => void
  onExportExcel: () => void
  onExportPdf: () => void
  onFormChange: (form: ScheduleFormState) => void
  onPublish: () => void
  onSave: (status: ScheduleStatus) => void
  schedules: ScheduleRecord[]
  selectedSchedule: ScheduleRecord | null
}) {
  if (!mode) return null

  const readonly = mode === "view"
  const title =
    mode === "create"
      ? selectedSchedule
        ? "Duplikasi Jadwal"
        : "Tambah Jadwal"
      : mode === "edit"
        ? "Edit Jadwal"
        : mode === "publish"
          ? "Publikasikan Rundown"
          : mode === "export"
            ? "Ekspor Jadwal"
            : mode === "delete"
              ? "Hapus Jadwal?"
              : "Detail Jadwal"

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#111827]/30 px-4 py-6 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="max-h-[calc(100vh-48px)] w-full max-w-3xl overflow-hidden rounded-2xl border border-[#111827]/10 bg-white shadow-[0_28px_80px_rgba(17,24,39,0.22)]" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[#111827]/10 p-5">
          <div>
            <h3 className="font-heading text-xl font-bold text-[#111827]">{title}</h3>
            <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">
              {mode === "delete" ? "Data yang dihapus tidak dapat dikembalikan." : "Rundown operasional resmi Melati Championship Series 1."}
            </p>
          </div>
          <button type="button" className="grid size-9 place-items-center rounded-xl border border-[#111827]/10 text-[#6B7280] transition hover:bg-[#FFF7ED]" onClick={onClose} aria-label="Tutup modal">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-230px)] overflow-y-auto p-5">
          {mode === "publish" ? (
            <PublishPreview schedules={schedules} />
          ) : mode === "export" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <ExportChoice icon={FileText} title="PDF Premium" description="Dokumen resmi event dengan header, statistik, timeline, footer, dan nomor halaman." onClick={onExportPdf} />
              <ExportChoice icon={FileSpreadsheet} title="Excel Premium" description="Workbook 4 sheet: Ringkasan, Timeline Event, Venue Schedule, dan PIC Assignment." onClick={onExportExcel} />
            </div>
          ) : mode === "delete" ? (
            <div className="rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] p-4">
              <p className="text-sm font-semibold text-[#991B1B]">{selectedSchedule?.title}</p>
              <p className="mt-1 text-sm font-medium text-[#B91C1C]">Data yang dihapus tidak dapat dikembalikan.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Tanggal *" type="date" value={form.date} disabled={readonly} onChange={(date) => onFormChange({ ...form, date })} />
              <Input label="Jam *" type="time" value={form.time.replace(".", ":")} disabled={readonly} onChange={(time) => onFormChange({ ...form, time })} />
              <Input className="sm:col-span-2" label="Nama Kegiatan *" value={form.title} disabled={readonly} onChange={(title) => onFormChange({ ...form, title })} />
              <Select label="Kategori *" options={categoryOptions} value={form.type} disabled={readonly} onChange={(type) => onFormChange({ ...form, type: type as ScheduleType })} />
              <Input label="Tempat *" value={form.venue} disabled={readonly} onChange={(venue) => onFormChange({ ...form, venue })} />
              <Input label="PIC *" value={form.pic} disabled={readonly} onChange={(pic) => onFormChange({ ...form, pic })} />
              <Input label="Durasi *" value={form.duration} disabled={readonly} onChange={(duration) => onFormChange({ ...form, duration })} />
              <Select label="Status" options={statusOptions} value={form.status} disabled={readonly} onChange={(status) => onFormChange({ ...form, status: status as ScheduleStatus })} />
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-sm font-bold text-[#111827]">Catatan</span>
                <textarea
                  className="min-h-24 rounded-2xl border border-[#111827]/12 bg-white px-3 py-2 text-sm font-medium text-[#111827] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 disabled:bg-[#F9FAFB]"
                  disabled={readonly}
                  value={form.notes}
                  onChange={(event) => onFormChange({ ...form, notes: event.target.value })}
                />
              </label>
              {conflictWarnings.length > 0 && !readonly ? (
                <div className="grid gap-2 rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] p-3 sm:col-span-2">
                  {conflictWarnings.map((warning) => (
                    <p key={warning} className="text-sm font-semibold text-[#C2410C]">{warning}</p>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#111827]/10 bg-[#FFF7ED] p-4 sm:flex-row sm:justify-end">
          {mode === "delete" ? (
            <>
              <Button icon={X} label="Batal" variant="secondary" onClick={onClose} />
              <Button icon={Trash2} label="Hapus" variant="danger" onClick={onDelete} />
            </>
          ) : mode === "publish" ? (
            <>
              <Button icon={X} label="Batal" variant="secondary" onClick={onClose} />
              <Button icon={UploadCloud} label="Publikasikan Rundown" onClick={onPublish} />
            </>
          ) : mode === "export" ? (
            <Button icon={X} label="Tutup" variant="secondary" onClick={onClose} />
          ) : readonly ? (
            <Button icon={X} label="Tutup" variant="secondary" onClick={onClose} />
          ) : mode === "edit" ? (
            <>
              <Button icon={X} label="Batal" variant="secondary" onClick={onClose} />
              <Button icon={CheckCircle2} label="Simpan Perubahan" onClick={() => onSave(form.status)} />
            </>
          ) : (
            <>
              <Button icon={X} label="Batal" variant="secondary" onClick={onClose} />
              <Button icon={FileText} label="Simpan Draft" variant="secondary" onClick={() => onSave("draft")} />
              <Button icon={UploadCloud} label="Simpan & Publikasikan" onClick={() => onSave("scheduled")} />
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function PublishPreview({ schedules }: { schedules: ScheduleRecord[] }) {
  const visible = schedules.slice(0, 10)

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Fact label="Jumlah Kegiatan" value={schedules.length} />
        <Fact label="Jumlah Match" value={schedules.filter((schedule) => schedule.type === "match").length} />
        <Fact label="Jumlah Venue" value={new Set(schedules.map((schedule) => schedule.venue)).size} />
        <Fact label="Jumlah PIC" value={new Set(schedules.map((schedule) => schedule.pic)).size} />
        <Fact label="Tanggal Event" value={mcsEvent.dateRange} />
      </section>
      <div className="grid gap-2">
        {visible.map((schedule) => (
          <div key={schedule.id} className="grid grid-cols-[90px_minmax(0,1fr)] gap-3 rounded-2xl border border-[#111827]/10 bg-[#FFFDF8] p-3">
            <span className="font-heading text-lg font-bold text-[#F97316]">{formatTime(schedule.time)}</span>
            <span>
              <span className="block text-sm font-bold text-[#111827]">{schedule.title}</span>
              <span className="text-xs font-semibold text-[#6B7280]">{formatShortDate(schedule.date)} / {schedule.venue}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyScheduleState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid place-items-center px-4 py-12 text-center">
      <div className="max-w-sm">
        <p className="font-heading text-xl font-bold text-[#111827]">Belum ada jadwal dibuat.</p>
        <p className="mt-2 text-sm font-medium leading-6 text-[#6B7280]">Mulai dengan menambahkan rundown kegiatan MCS.</p>
        <Button className="mt-4" icon={Plus} label="Tambah Jadwal" onClick={onCreate} />
      </div>
    </div>
  )
}

function Panel({
  action,
  children,
  description,
  title,
}: {
  action?: React.ReactNode
  children: ReactNode
  description?: string
  title: string
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#111827]/10 bg-white shadow-[0_14px_36px_rgba(17,24,39,0.06)]">
      <div className="flex flex-col gap-3 border-b border-[#111827]/10 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-heading text-lg font-bold text-[#111827]">{title}</h3>
          {description ? <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Button({
  className,
  icon: Icon,
  label,
  onClick,
  variant = "primary",
}: {
  className?: string
  icon: LucideIcon
  label: string
  onClick: () => void
  variant?: "primary" | "secondary" | "danger"
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/25",
        variant === "primary"
          ? "border-[#F97316] bg-[#F97316] text-white shadow-[0_10px_20px_rgba(249,115,22,0.22)] hover:bg-[#EA580C]"
          : variant === "danger"
            ? "border-[#FEE2E2] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]"
            : "border-[#111827]/10 bg-white text-[#111827] hover:bg-[#FFF7ED]",
        className,
      )}
      onClick={onClick}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}

function IconButton({
  danger,
  icon: Icon,
  label,
  onClick,
}: {
  danger?: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        "grid size-8 place-items-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/25",
        danger ? "border-[#FEE2E2] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]" : "border-[#111827]/10 bg-white text-[#111827] hover:bg-[#FFF7ED]",
      )}
      title={label}
      onClick={onClick}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </button>
  )
}

function MetricCard({ label, tone, value }: { label: string; tone: "info" | "success" | "gold" | "navy"; value: number | string }) {
  return (
    <article className="rounded-2xl border border-[#111827]/10 bg-white p-4 shadow-[0_14px_36px_rgba(17,24,39,0.06)]">
      <p className="text-sm font-semibold text-[#6B7280]">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="min-w-0 truncate font-heading text-2xl font-bold text-[#111827]">{value}</p>
        <span className={cn("mb-1 size-2.5 rounded-full", tone === "success" ? "bg-[#16A34A]" : tone === "gold" ? "bg-[#D8B15A]" : tone === "navy" ? "bg-[#081C3A]" : "bg-[#2563EB]")} />
      </div>
    </article>
  )
}

function SearchField({ onChange, value }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">Search</span>
      <span className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" aria-hidden="true" />
        <input className="h-10 w-full rounded-2xl border border-[#111827]/10 bg-white pl-9 pr-3 text-sm font-medium outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Cari kegiatan" />
      </span>
    </label>
  )
}

function SelectFilter({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  options: Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</span>
      <select className="h-10 rounded-2xl border border-[#111827]/10 bg-white px-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value={ALL}>Semua</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function Input({
  className,
  disabled,
  label,
  onChange,
  type = "text",
  value,
}: {
  className?: string
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  type?: string
  value: string
}) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <input className="h-10 rounded-2xl border border-[#111827]/12 bg-white px-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 disabled:bg-[#F9FAFB]" disabled={disabled} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function Select({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
  value: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <select className="h-10 rounded-2xl border border-[#111827]/12 bg-white px-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 disabled:bg-[#F9FAFB]" disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function Fact({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-[#111827]/10 bg-[#FFFDF8] p-3">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[#111827]">{value}</p>
    </div>
  )
}

function StatusLine({ status }: { status: "Upcoming" | "Live" | "Completed" }) {
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#FED7AA] bg-[#FFF7ED] px-3 py-1.5 text-sm font-bold text-[#C2410C]">
      <Radio className="size-4" aria-hidden="true" />
      {status}
    </div>
  )
}

function ScheduleStatusBadge({ status }: { status: ScheduleStatus }) {
  const label = formatStatus(status)
  const className =
    status === "live"
      ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
      : status === "completed"
        ? "border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB]"
        : status === "cancelled"
          ? "border-[#FEE2E2] bg-[#FEF2F2] text-[#DC2626]"
          : status === "draft"
            ? "border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]"
            : "border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C]"

  return <span className={cn("inline-flex h-7 w-fit items-center rounded-xl border px-2.5 text-xs font-bold", className)}>{label}</span>
}

function GroupedSchedule({ label, schedules }: { label: string; schedules: ScheduleRecord[] }) {
  return (
    <div className="rounded-2xl border border-[#111827]/10 bg-[#FFFDF8] p-3">
      <p className="font-heading text-lg font-bold text-[#111827]">{label}</p>
      <div className="mt-3 grid gap-2">
        {schedules.slice(0, 5).map((schedule) => (
          <div key={schedule.id} className="grid grid-cols-[70px_minmax(0,1fr)] gap-3">
            <span className="text-sm font-bold text-[#F97316]">{formatTime(schedule.time)}</span>
            <span className="truncate text-sm font-semibold text-[#111827]">{schedule.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExportChoice({
  description,
  icon: Icon,
  onClick,
  title,
}: {
  description: string
  icon: LucideIcon
  onClick: () => void
  title: string
}) {
  return (
    <button type="button" className="grid gap-3 rounded-2xl border border-[#111827]/10 bg-[#FFFDF8] p-4 text-left transition hover:border-[#F97316]/45 hover:bg-[#FFF7ED]" onClick={onClick}>
      <span className="grid size-10 place-items-center rounded-2xl bg-[#F97316] text-white">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="font-heading text-lg font-bold text-[#111827]">{title}</span>
      <span className="text-sm font-medium leading-6 text-[#6B7280]">{description}</span>
    </button>
  )
}

function Pagination({
  onPageChange,
  page,
  pageCount,
  total,
}: {
  onPageChange: (page: number) => void
  page: number
  pageCount: number
  total: number
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#111827]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-[#6B7280]">{total} kegiatan / halaman {page} dari {pageCount}</p>
      <div className="flex gap-2">
        <button type="button" className="rounded-xl border border-[#111827]/10 px-3 py-2 text-sm font-bold text-[#111827] disabled:opacity-50" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</button>
        <button type="button" className="rounded-xl border border-[#111827]/10 px-3 py-2 text-sm font-bold text-[#111827] disabled:opacity-50" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed right-4 top-4 z-[60] max-w-sm rounded-2xl border border-[#FED7AA] bg-white px-4 py-3 text-sm font-bold text-[#111827] shadow-[0_18px_48px_rgba(17,24,39,0.16)]">
      {message}
    </div>
  )
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: init?.body ? { "Content-Type": "application/json", ...(init.headers ?? {}) } : init?.headers,
    ...init,
  })
  const payload = (await response.json().catch(() => ({}))) as { data?: T; error?: { message?: string } }

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Request gagal diproses.")
  }

  return payload.data as T
}

function scheduleToForm(schedule: ScheduleRecord): ScheduleFormState {
  return {
    date: schedule.date,
    duration: schedule.duration,
    notes: schedule.notes ?? "",
    pic: schedule.pic,
    status: schedule.status,
    time: schedule.time.replace(".", ":"),
    title: schedule.title,
    type: schedule.type,
    venue: schedule.venue,
  }
}

function detectScheduleConflicts(form: ScheduleFormState, schedules: ScheduleRecord[], ignoreId?: string) {
  const warnings: string[] = []
  const nextStart = getMinutes(form.time)
  const nextEnd = nextStart + getDurationMinutes(form.duration)

  schedules
    .filter((schedule) => schedule.id !== ignoreId && schedule.date === form.date && schedule.status !== "cancelled")
    .forEach((schedule) => {
      const currentStart = getMinutes(schedule.time)
      const currentEnd = currentStart + getDurationMinutes(schedule.duration)
      const overlaps = nextStart < currentEnd && nextEnd > currentStart

      if (!overlaps) return

      if (schedule.venue.trim().toLowerCase() === form.venue.trim().toLowerCase()) {
        warnings.push(`${schedule.venue} sudah digunakan oleh ${schedule.title} pada jam ${formatTime(schedule.time)}.`)
      }

      if (schedule.pic.trim().toLowerCase() === form.pic.trim().toLowerCase()) {
        warnings.push(`${schedule.pic} sudah memiliki kegiatan lain pada waktu tersebut.`)
      }
    })

  return Array.from(new Set(warnings))
}

function compareBySortKey(first: ScheduleRecord, second: ScheduleRecord, key: SortKey, direction: "asc" | "desc") {
  const multiplier = direction === "asc" ? 1 : -1
  const firstValue = key === "time" ? `${first.date}-${first.time}` : String(first[key])
  const secondValue = key === "time" ? `${second.date}-${second.time}` : String(second[key])

  return firstValue.localeCompare(secondValue) * multiplier
}

function sortSchedules(items: ScheduleRecord[]) {
  return [...items].sort((first, second) => `${first.date}-${first.time}`.localeCompare(`${second.date}-${second.time}`))
}

function groupSchedulesBy(items: ScheduleRecord[], key: "venue" | "pic") {
  const groups = new Map<string, ScheduleRecord[]>()

  items.forEach((item) => {
    const label = item[key]
    groups.set(label, [...(groups.get(label) ?? []), item])
  })

  return [...groups.entries()].map(([label, groupedItems]) => ({ items: groupedItems, label }))
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort().map((value) => ({ label: value, value }))
}

function getScheduleStart(schedule: Pick<ScheduleRecord, "date" | "time">) {
  const [year, month, day] = schedule.date.split("-").map(Number)
  const [hour, minute] = schedule.time.replace(".", ":").split(":").map(Number)

  return new Date(year, month - 1, day, hour || 0, minute || 0)
}

function getAutomaticStatus(schedule: ScheduleRecord, now: Date): ScheduleStatus {
  if (schedule.status === "draft" || schedule.status === "cancelled" || schedule.status === "completed") return schedule.status
  if (schedule.status === "live") return "live"

  const start = getScheduleStart(schedule)
  const end = new Date(start.getTime() + getDurationMinutes(schedule.duration) * 60_000)

  if (now >= start && now <= end) return "live"
  if (now > end) return "completed"
  return "scheduled"
}

function getEndCountdown(schedule: ScheduleRecord, now: Date) {
  const end = new Date(getScheduleStart(schedule).getTime() + getDurationMinutes(schedule.duration) * 60_000)
  const minutes = Math.max(Math.ceil((end.getTime() - now.getTime()) / 60_000), 0)

  if (minutes >= 60) return `${Math.floor(minutes / 60)} jam ${minutes % 60} menit`
  return `${minutes} menit`
}

function getMinutes(time: string) {
  const [hour, minute] = time.replace(".", ":").split(":").map(Number)

  return (hour || 0) * 60 + (minute || 0)
}

function getDurationMinutes(duration: string) {
  const match = duration.match(/\d+/)

  return match ? Number(match[0]) : 60
}

function countTodaySchedules(schedules: ScheduleRecord[]) {
  const today = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(new Date())

  return schedules.filter((schedule) => schedule.date === today).length
}

function buildVenueRows(schedules: ScheduleRecord[]) {
  return sortSchedules(schedules).map((schedule) => [
    schedule.venue,
    formatShortDate(schedule.date),
    formatTime(schedule.time),
    schedule.title,
    schedule.pic,
    formatStatus(schedule.status),
  ])
}

function buildPicRows(schedules: ScheduleRecord[]) {
  return groupSchedulesBy(schedules, "pic").map((group) => [
    group.label,
    group.items.length,
    uniqueOptions(group.items.map((item) => item.venue)).map((item) => item.label).join(", "),
    group.items.some((item) => item.status === "live") ? "Aktif" : "Scheduled",
  ])
}

function styledSheet(rows: Array<Array<string | number>>, XLSX: typeof import("xlsx-js-style")) {
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1")

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const cell = sheet[XLSX.utils.encode_cell({ c: column, r: 0 })]
    if (cell) {
      cell.s = {
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "F97316" }, patternType: "solid" },
        font: { bold: true, color: { rgb: "FFFFFF" } },
      }
    }
  }

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ c: column, r: row })]
      if (cell) {
        cell.s = {
          ...(cell.s ?? {}),
          border: {
            bottom: { color: { rgb: "E5E7EB" }, style: "thin" },
            left: { color: { rgb: "E5E7EB" }, style: "thin" },
            right: { color: { rgb: "E5E7EB" }, style: "thin" },
            top: { color: { rgb: "E5E7EB" }, style: "thin" },
          },
        }
      }
    }
  }

  sheet["!cols"] = rows[0]?.map((_, column) => ({
    wch: Math.max(...rows.map((row) => String(row[column] ?? "").length), 12) + 2,
  }))
  sheet["!autofilter"] = { ref: sheet["!ref"] ?? "A1:A1" }
  sheet["!freeze"] = { xSplit: 0, ySplit: 1 }

  return sheet
}

function getLatestPublishLabel(schedules: ScheduleRecord[]) {
  const latest = schedules
    .map((schedule) => schedule.publishedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1)

  return latest ? formatLongDateTime(latest) : "Draft"
}

function formatCategory(value: ScheduleType) {
  return categoryOptions.find((option) => option.value === value)?.label ?? value
}

function formatStatus(value: ScheduleStatus) {
  const labels: Record<ScheduleStatus, string> = {
    cancelled: "Cancelled",
    completed: "Completed",
    delayed: "Delayed",
    draft: "Draft",
    live: "Live",
    scheduled: "Scheduled",
  }

  return labels[value]
}

function formatAuditAction(action: string) {
  const labels: Record<string, string> = {
    "schedules.create": "Tambah Jadwal",
    "schedules.delete": "Hapus Jadwal",
    "schedules.duplicate": "Duplikasi Jadwal",
    "schedules.export": "Ekspor Jadwal",
    "schedules.publish": "Publikasikan Rundown",
    "schedules.unpublish": "Tarik Publikasi",
    "schedules.update": "Edit Jadwal",
  }

  return labels[action] ?? action
}

function formatDayName(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
  }).format(new Date(`${value}T00:00:00+07:00`))
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`))
}

function formatTime(value: string) {
  return `${value.replace(".", ":")} WIB`
}

function formatLongDateTime(value: string) {
  return `${new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))} WIB`
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Aksi gagal diproses."
}
