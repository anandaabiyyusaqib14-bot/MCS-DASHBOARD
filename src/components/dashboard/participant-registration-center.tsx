"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import {
  competitions as officialCompetitions,
  event as mcsEvent,
  getNationByClassName,
  majors,
} from "@/data/mcs"
import { cn } from "@/lib/utils"
import type { Permission, UserDTO } from "@/server/mcs/types"
import type {
  CompetitionCenterItem,
  CompetitionParticipant,
  ParticipantAttendanceStatus,
  ParticipantStatus,
} from "@/data/competition-center"

type ParticipantRegistrationCenterProps = {
  permissions: Permission[]
  user: UserDTO
}

type ParticipantFormState = {
  attendanceStatus: ParticipantAttendanceStatus
  className: string
  competitionId: string
  gender: string
  major: string
  name: string
  notes: string
  status: ParticipantStatus
  teamName: string
  verificationNotes: string
}

type ImportPreviewRow = {
  className: string
  competitionId?: string
  competitionLabel: string
  gender: string
  major: string
  name: string
  valid: boolean
  reason?: string
}

type CompetitionLog = {
  id: string
  userName: string
  action: string
  resource: string
  resourceId?: string
  timestamp: string
}

type ModalMode = "create" | "view" | "edit" | "verify" | "delete" | "import" | null
type SortKey = "name" | "countryName" | "className" | "major" | "competitionId" | "status" | "attendanceStatus"

const ALL = "all"
const PAGE_SIZE = 8

const statusOptions: Array<{ label: string; value: ParticipantStatus }> = [
  { label: "Menunggu", value: "Pending" },
  { label: "Terverifikasi", value: "Verified" },
  { label: "Diskualifikasi", value: "Disqualified" },
]

const attendanceOptions: Array<{ label: ParticipantAttendanceStatus; value: ParticipantAttendanceStatus }> = [
  { label: "Belum Hadir", value: "Belum Hadir" },
  { label: "Hadir", value: "Hadir" },
  { label: "Tidak Hadir", value: "Tidak Hadir" },
]

const emptyForm: ParticipantFormState = {
  attendanceStatus: "Belum Hadir",
  className: "",
  competitionId: officialCompetitions[0]?.id ?? "futsal",
  gender: "",
  major: majors[0]?.name ?? "Bisnis Digital",
  name: "",
  notes: "",
  status: "Pending",
  teamName: "",
  verificationNotes: "",
}

export function ParticipantRegistrationCenter({ permissions, user }: ParticipantRegistrationCenterProps) {
  const [participants, setParticipants] = useState<CompetitionParticipant[]>([])
  const [competitions, setCompetitions] = useState<CompetitionCenterItem[]>([])
  const [logs, setLogs] = useState<CompetitionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState("")
  const [query, setQuery] = useState("")
  const [competitionFilter, setCompetitionFilter] = useState(ALL)
  const [majorFilter, setMajorFilter] = useState(ALL)
  const [classFilter, setClassFilter] = useState(ALL)
  const [verificationFilter, setVerificationFilter] = useState(ALL)
  const [attendanceFilter, setAttendanceFilter] = useState(ALL)
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<CompetitionParticipant | null>(null)
  const [form, setForm] = useState<ParticipantFormState>(emptyForm)
  const [importRows, setImportRows] = useState<ImportPreviewRow[]>([])
  const [importResult, setImportResult] = useState("")

  const canCreate = permissions.includes("participants.create")
  const canUpdate = permissions.includes("participants.update")
  const canVerify = permissions.includes("participants.verify")
  const canDelete = permissions.includes("participants.delete")
  const canChangeAttendance = canUpdate || canVerify

  useEffect(() => {
    void refreshData()
  }, [])

  useEffect(() => {
    if (!toast) return

    const timeout = window.setTimeout(() => setToast(""), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const competitionMap = useMemo(() => {
    const map = new Map<string, string>()
    officialCompetitions.forEach((competition) => map.set(competition.id, competition.shortName))
    competitions.forEach((competition) => map.set(competition.id, competition.name))
    return map
  }, [competitions])

  const competitionOptions = useMemo(
    () =>
      (competitions.length > 0 ? competitions : officialCompetitions.map((competition) => ({
        category: competition.kind === "sport" || competition.kind === "esport" ? "Sport Championship" as const : "Art & Media Stage" as const,
        competitionEnd: mcsEvent.endDate,
        competitionStart: mcsEvent.startDate,
        createdBy: "",
        createdDate: "",
        currentRound: "",
        description: "",
        id: competition.id,
        matchCount: null,
        maxParticipants: null,
        name: competition.shortName,
        participantCount: null,
        pic: competition.pj,
        registrationEnd: "",
        registrationStart: "",
        rules: [],
        status: "Draft" as const,
        type: "Custom Format" as const,
        updatedDate: "",
        venue: competition.venue,
      }))).map((competition) => ({ label: competition.name, value: competition.id })),
    [competitions],
  )

  const classOptions = uniqueOptions(participants.map((participant) => participant.className))
  const filteredParticipants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return participants
      .filter((participant) => {
        const searchable = `${getParticipantCountryName(participant)} ${participant.name} ${participant.className} ${participant.major} ${competitionMap.get(participant.competitionId) ?? participant.competitionId} ${participant.status} ${participant.attendanceStatus ?? "Belum Hadir"}`.toLowerCase()

        return (
          (!normalizedQuery || searchable.includes(normalizedQuery)) &&
          (competitionFilter === ALL || participant.competitionId === competitionFilter) &&
          (majorFilter === ALL || participant.major === majorFilter) &&
          (classFilter === ALL || participant.className === classFilter) &&
          (verificationFilter === ALL || participant.status === verificationFilter) &&
          (attendanceFilter === ALL || (participant.attendanceStatus ?? "Belum Hadir") === attendanceFilter)
        )
      })
      .sort((first, second) => compareParticipants(first, second, sortKey, sortDirection))
  }, [attendanceFilter, classFilter, competitionFilter, competitionMap, majorFilter, participants, query, sortDirection, sortKey, verificationFilter])

  const pageCount = Math.max(Math.ceil(filteredParticipants.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, pageCount)
  const visibleParticipants = filteredParticipants.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const verifiedCount = participants.filter((participant) => ["Verified", "Active", "Completed"].includes(participant.status)).length
  const pendingCount = participants.filter((participant) => participant.status === "Pending").length
  const disqualifiedCount = participants.filter((participant) => participant.status === "Disqualified" || participant.status === "Rejected").length

  async function refreshData() {
    setLoading(true)
    try {
      const [participantData, competitionData, logData] = await Promise.all([
        requestJson<CompetitionParticipant[]>("/api/mcs/competition-center/participants"),
        requestJson<CompetitionCenterItem[]>("/api/mcs/competition-center/competitions"),
        requestJson<CompetitionLog[]>("/api/mcs/competition-center/logs"),
      ])
      setParticipants(participantData)
      setCompetitions(competitionData)
      setLogs(logData.filter((item) => item.resource === "participants"))
    } catch (error) {
      setToast(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    if (!canCreate) {
      setToast("Akses tambah peserta tidak tersedia untuk role ini.")
      return
    }

    setSelectedParticipant(null)
    setForm({ ...emptyForm, competitionId: competitionOptions[0]?.value ?? emptyForm.competitionId })
    setModalMode("create")
  }

  function openParticipant(participant: CompetitionParticipant, mode: "view" | "edit" | "verify") {
    if (mode === "edit" && !canUpdate) {
      setToast("Role ini hanya dapat melihat data peserta.")
      setSelectedParticipant(participant)
      setForm(participantToForm(participant))
      setModalMode("view")
      return
    }

    if (mode === "verify" && !canVerify) {
      setToast("Akses verifikasi peserta tidak tersedia untuk role ini.")
      return
    }

    setSelectedParticipant(participant)
    setForm(participantToForm(participant))
    setModalMode(mode)
  }

  function openDelete(participant: CompetitionParticipant) {
    if (!canDelete) {
      setToast("Akses hapus peserta tidak tersedia untuk role ini.")
      return
    }

    setSelectedParticipant(participant)
    setModalMode("delete")
  }

  async function saveParticipant(nextStatus: ParticipantStatus) {
    if (!form.name.trim() || !form.className.trim() || !form.major.trim() || !form.competitionId.trim()) {
      setToast("Lengkapi field wajib sebelum menyimpan peserta.")
      return
    }

    const payload = { ...form, status: nextStatus }

    try {
      if (modalMode === "edit" && selectedParticipant) {
        await requestJson<CompetitionParticipant>(`/api/mcs/competition-center/participants/${selectedParticipant.id}`, {
          body: JSON.stringify(payload),
          method: "PATCH",
        })
        setToast("Data peserta berhasil diperbarui.")
      } else {
        await requestJson<CompetitionParticipant>("/api/mcs/competition-center/participants", {
          body: JSON.stringify(payload),
          method: "POST",
        })
        setToast(nextStatus === "Verified" ? "Peserta berhasil ditambahkan dan diverifikasi." : "Draft peserta berhasil disimpan.")
      }

      closeModal()
      await refreshData()
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  async function saveVerification() {
    if (!selectedParticipant) return

    try {
      await requestJson<CompetitionParticipant>(`/api/mcs/competition-center/participants/${selectedParticipant.id}`, {
        body: JSON.stringify({
          status: form.status,
          verificationNotes: form.verificationNotes,
        }),
        method: "PATCH",
      })
      setToast("Verifikasi peserta berhasil disimpan.")
      closeModal()
      await refreshData()
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  async function updateAttendance(participant: CompetitionParticipant, attendanceStatus: ParticipantAttendanceStatus) {
    if (!canChangeAttendance) {
      setToast("Role ini hanya dapat melihat status kehadiran.")
      return
    }

    try {
      await requestJson<CompetitionParticipant>(`/api/mcs/competition-center/participants/${participant.id}`, {
        body: JSON.stringify({ attendanceStatus }),
        method: "PATCH",
      })
      setToast("Status kehadiran peserta diperbarui.")
      await refreshData()
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  async function deleteParticipant() {
    if (!selectedParticipant) return

    try {
      await requestJson(`/api/mcs/competition-center/participants/${selectedParticipant.id}`, { method: "DELETE" })
      setToast("Peserta berhasil dihapus.")
      closeModal()
      await refreshData()
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  function closeModal() {
    setModalMode(null)
    setSelectedParticipant(null)
    setImportRows([])
    setImportResult("")
  }

  function updateSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(nextKey)
    setSortDirection("asc")
  }

  async function downloadTemplate() {
    try {
      const XLSX = await import("xlsx-js-style")
      const rows = [
        ["Nama Peserta", "Kelas", "Jurusan", "Lomba", "Jenis Kelamin"],
        ["Ahmad Rizki", "XI BD", "Bisnis Digital", "Futsal", "L"],
        ["Nabila Putri", "XI MP 2", "Manajemen Perkantoran", "Solo Vokal", "P"],
      ]
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, styledSheet(rows, XLSX), "Template Peserta")
      XLSX.writeFile(workbook, "Template_Peserta_MCS.xlsx")
      await recordAudit("participants.template_download", "Download Template")
      setToast("Template peserta berhasil diunduh.")
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  async function parseImportFile(file: File) {
    try {
      const XLSX = await import("xlsx-js-style")
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
      const mappedRows = rawRows.map((row) => mapImportRow(row, competitionOptions))

      setImportRows(mappedRows)
      setImportResult("")
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  async function importAllRows() {
    if (!canCreate) {
      setToast("Akses import peserta tidak tersedia untuk role ini.")
      return
    }

    let success = 0
    let failed = 0

    for (const row of importRows) {
      if (!row.valid || !row.competitionId) {
        failed += 1
        continue
      }

      try {
        await requestJson<CompetitionParticipant>("/api/mcs/competition-center/participants", {
          body: JSON.stringify({
            attendanceStatus: "Belum Hadir",
            className: row.className,
            competitionId: row.competitionId,
            gender: row.gender,
            major: row.major,
            name: row.name,
            status: "Pending",
          }),
          method: "POST",
        })
        success += 1
      } catch {
        failed += 1
      }
    }

    setImportResult(`${success} data berhasil, ${failed} data gagal.`)
    await recordAudit("participants.import", `Import Excel: ${success} berhasil, ${failed} gagal`)
    await refreshData()
  }

  async function exportPdf() {
    try {
      const { jsPDF } = await import("jspdf")
      const autoTableModule = await import("jspdf-autotable")
      const autoTable = autoTableModule.default ?? autoTableModule.autoTable
      const doc = new jsPDF({ unit: "pt", format: "a4" })
      const pageWidth = doc.internal.pageSize.getWidth()

      doc.setFillColor(8, 28, 58)
      doc.rect(0, 0, pageWidth, 104, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(18)
      doc.text("MELATI CHAMPIONSHIP SERIES 1", 40, 42)
      doc.setFontSize(13)
      doc.text("DATA PESERTA RESMI", 40, 66)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text("SMKN 20 JAKARTA", 40, 86)
      doc.setFillColor(249, 115, 22)
      doc.roundedRect(pageWidth - 146, 30, 106, 42, 10, 10, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text("MCS 1", pageWidth - 117, 57)

      doc.setTextColor(17, 24, 39)
      doc.setFontSize(10)
      const info = [
        `Tanggal Export: ${formatLongDateTime(new Date().toISOString())}`,
        `Operator: ${user.displayName}`,
        `Total Peserta: ${participants.length}`,
        `Jumlah Terverifikasi: ${verifiedCount}`,
      ]
      info.forEach((line, index) => doc.text(line, 40, 130 + index * 16))

      autoTable(doc, {
        body: [
          ["Total Peserta", participants.length],
          ["Terverifikasi", verifiedCount],
          ["Menunggu", pendingCount],
          ["Diskualifikasi", disqualifiedCount],
        ],
        head: [["Ringkasan Statistik", "Jumlah"]],
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        margin: { left: 40, right: 40, top: 205 },
        styles: { cellPadding: 8, fontSize: 9 },
      })

      autoTable(doc, {
        body: participants.map((participant, index) => [
          index + 1,
          `${getParticipantCountryFlag(participant)} ${getParticipantCountryName(participant)}`.trim(),
          participant.className,
          competitionMap.get(participant.competitionId) ?? participant.competitionId,
          formatVerificationStatus(participant.status),
        ]),
        didDrawPage: (data) => {
          const pageNumber = doc.getNumberOfPages()
          doc.setFontSize(9)
          doc.setTextColor(107, 114, 128)
          doc.text("Exported by MCS Event Management System", data.settings.margin.left, doc.internal.pageSize.getHeight() - 28)
          doc.text(`Melati Championship Series 1 / SMKN 20 Jakarta / Page ${pageNumber}`, pageWidth - 245, doc.internal.pageSize.getHeight() - 28)
        },
        head: [["No", "Negara", "Kelas Asli", "Lomba", "Status"]],
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        margin: { left: 40, right: 40, top: 40 },
        startY: 330,
        styles: { cellPadding: 7, fontSize: 8, lineColor: [229, 231, 235], lineWidth: 0.5 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
      })

      doc.save("Data_Peserta_Resmi_MCS_1.pdf")
      await recordAudit("participants.export", "Export PDF Premium")
      setToast("PDF Premium peserta berhasil dibuat.")
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  async function exportExcel() {
    try {
      const XLSX = await import("xlsx-js-style")
      const workbook = XLSX.utils.book_new()
      const summaryRows = [
        ["Ringkasan Data Peserta MCS 1", ""],
        ["Tanggal Export", formatLongDateTime(new Date().toISOString())],
        ["Operator", user.displayName],
        ["Total Peserta", participants.length],
        ["Terverifikasi", verifiedCount],
        ["Menunggu", pendingCount],
        ["Diskualifikasi", disqualifiedCount],
      ]
      const dataRows = [
        ["No", "Negara", "Kelas Asli", "Jurusan Internal", "Lomba", "Jenis Kelamin", "Tim/Kelompok", "Status Verifikasi", "Status Kehadiran", "Catatan"],
        ...participants.map((participant, index) => [
          index + 1,
          `${getParticipantCountryFlag(participant)} ${getParticipantCountryName(participant)}`.trim(),
          participant.className,
          participant.major,
          competitionMap.get(participant.competitionId) ?? participant.competitionId,
          participant.gender ?? "",
          participant.teamName ?? "",
          formatVerificationStatus(participant.status),
          participant.attendanceStatus ?? "Belum Hadir",
          participant.notes ?? "",
        ]),
      ]

      XLSX.utils.book_append_sheet(workbook, styledSheet(summaryRows, XLSX), "Ringkasan")
      XLSX.utils.book_append_sheet(workbook, styledSheet(dataRows, XLSX), "Data Peserta")
      XLSX.writeFile(workbook, "Data_Peserta_Premium_MCS_1.xlsx")
      await recordAudit("participants.export", "Export Excel Premium")
      setToast("Excel Premium peserta berhasil dibuat.")
    } catch (error) {
      setToast(getErrorMessage(error))
    }
  }

  async function recordAudit(action: string, detail: string) {
    await requestJson("/api/mcs/audit-logs", {
      body: JSON.stringify({ action, detail, resource: "participants" }),
      method: "POST",
    })
  }

  return (
    <div className="grid gap-5">
      {toast ? <Toast message={toast} /> : null}

      <section className="rounded-2xl border border-[#111827]/10 bg-[#FFF7ED] p-5 shadow-[0_18px_48px_rgba(17,24,39,0.08)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#F97316] text-white shadow-[0_12px_24px_rgba(249,115,22,0.24)]">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-heading text-2xl font-bold tracking-normal text-[#111827]">DATA PESERTA</h2>
              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[#6B7280]">
                Kelola peserta resmi, verifikasi, dan kehadiran lomba.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button icon={Plus} label="Tambah Peserta" onClick={openCreate} />
            <Button icon={Download} label="Download Template" variant="secondary" onClick={downloadTemplate} />
            <Button icon={Upload} label="Import Excel" variant="secondary" onClick={() => setModalMode("import")} />
            <Button icon={FileText} label="Export PDF" variant="secondary" onClick={exportPdf} />
            <Button icon={FileSpreadsheet} label="Export Excel" variant="secondary" onClick={exportExcel} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Peserta" value={participants.length} tone="navy" />
        <MetricCard label="Terverifikasi" value={verifiedCount} tone="success" />
        <MetricCard label="Menunggu Verifikasi" value={pendingCount} tone="warning" />
        <MetricCard label="Diskualifikasi" value={disqualifiedCount} tone="danger" />
      </section>

      <section className="grid gap-4 rounded-2xl border border-[#111827]/10 bg-white p-4 shadow-[0_14px_36px_rgba(17,24,39,0.06)] xl:grid-cols-[1.2fr_repeat(5,minmax(140px,1fr))]">
        <SearchField value={query} onChange={setQuery} />
        <SelectFilter label="Filter Lomba" options={competitionOptions} value={competitionFilter} onChange={setCompetitionFilter} />
        <SelectFilter label="Filter Jurusan" options={majors.map((major) => ({ label: major.name, value: major.name }))} value={majorFilter} onChange={setMajorFilter} />
        <SelectFilter label="Filter Kelas" options={classOptions} value={classFilter} onChange={setClassFilter} />
        <SelectFilter label="Status Verifikasi" options={statusOptions} value={verificationFilter} onChange={setVerificationFilter} />
        <SelectFilter label="Status Kehadiran" options={attendanceOptions} value={attendanceFilter} onChange={setAttendanceFilter} />
      </section>

      <Panel title="Tabel Peserta" description="Data peserta resmi untuk verifikasi dan absensi hari-H.">
        <div className="max-h-[620px] overflow-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
                <th className="border-b border-[#E5E7EB] px-4 py-3">No</th>
                {[
                  ["Negara", "countryName"],
                  ["Kelas Asli", "className"],
                  ["Lomba", "competitionId"],
                  ["Status Verifikasi", "status"],
                  ["Status Kehadiran", "attendanceStatus"],
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
              {visibleParticipants.map((participant, index) => (
                <tr key={participant.id} className={cn("align-top", index % 2 === 0 ? "bg-white" : "bg-[#FFFDF8]")}>
                  <td className="border-b border-[#F1F5F9] px-4 py-4">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">
                    <span className="mr-2 text-base" aria-hidden="true">{getParticipantCountryFlag(participant)}</span>
                    {getParticipantCountryName(participant)}
                  </td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#6B7280]">{participant.className}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#6B7280]">{competitionMap.get(participant.competitionId) ?? participant.competitionId}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4"><VerificationBadge status={participant.status} /></td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4">
                    <select
                      className="h-9 rounded-xl border border-[#111827]/10 bg-white px-2 text-xs font-bold text-[#111827] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
                      value={participant.attendanceStatus ?? "Belum Hadir"}
                      onChange={(event) => updateAttendance(participant, event.target.value as ParticipantAttendanceStatus)}
                    >
                      {attendanceOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <IconButton label="Lihat" icon={Eye} onClick={() => openParticipant(participant, "view")} />
                      <IconButton label="Edit" icon={Pencil} onClick={() => openParticipant(participant, "edit")} />
                      <IconButton label="Verifikasi" icon={ShieldCheck} onClick={() => openParticipant(participant, "verify")} />
                      <IconButton label="Hapus" icon={Trash2} danger onClick={() => openDelete(participant)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredParticipants.length === 0 ? <ParticipantEmptyState onCreate={openCreate} onTemplate={downloadTemplate} /> : null}
        <Pagination page={currentPage} pageCount={pageCount} total={filteredParticipants.length} onPageChange={setPage} />
        {loading ? <p className="px-5 pb-5 text-sm font-medium text-[#6B7280]">Memuat data peserta...</p> : null}
      </Panel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(320px,0.65fr)]">
        <Panel title="LOMBA RESMI" description="Daftar lomba aktif MCS 1.">
          <CompactChipGrid items={officialCompetitions.map((competition) => competition.shortName)} />
        </Panel>
        <Panel title="METADATA INTERNAL" description="Jurusan dan kelas tetap disimpan sebagai data internal; identitas publik peserta memakai negara.">
          <CompactChipGrid items={majors.map((major) => major.name)} />
        </Panel>
        <Panel title="Activity Log" description="Aktivitas peserta dari registrasi, verifikasi, import, dan edit.">
          <div className="grid gap-2">
            {logs.slice(0, 7).map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#111827]/10 bg-[#FFFDF8] p-3">
                <p className="text-sm font-bold text-[#111827]">{formatParticipantAction(item.action)}</p>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">{item.userName} / {formatLongDateTime(item.timestamp)}</p>
              </div>
            ))}
            {logs.length === 0 ? <p className="text-sm font-medium text-[#6B7280]">Aktivitas peserta akan muncul setelah data resmi diproses.</p> : null}
          </div>
        </Panel>
      </section>

      <ParticipantModal
        competitionOptions={competitionOptions}
        form={form}
        importResult={importResult}
        importRows={importRows}
        mode={modalMode}
        selectedParticipant={selectedParticipant}
        onClose={closeModal}
        onDelete={deleteParticipant}
        onFileSelected={parseImportFile}
        onFormChange={setForm}
        onImportAll={importAllRows}
        onSave={saveParticipant}
        onVerify={saveVerification}
      />
    </div>
  )
}

function ParticipantModal({
  competitionOptions,
  form,
  importResult,
  importRows,
  mode,
  onClose,
  onDelete,
  onFileSelected,
  onFormChange,
  onImportAll,
  onSave,
  onVerify,
  selectedParticipant,
}: {
  competitionOptions: Array<{ label: string; value: string }>
  form: ParticipantFormState
  importResult: string
  importRows: ImportPreviewRow[]
  mode: ModalMode
  selectedParticipant: CompetitionParticipant | null
  onClose: () => void
  onDelete: () => void
  onFileSelected: (file: File) => void
  onFormChange: (form: ParticipantFormState) => void
  onImportAll: () => void
  onSave: (status: ParticipantStatus) => void
  onVerify: () => void
}) {
  if (!mode) return null

  const readonly = mode === "view"
  const title =
    mode === "create"
      ? "Tambah Peserta"
      : mode === "edit"
        ? "Edit Peserta"
        : mode === "verify"
          ? "Verifikasi Peserta"
          : mode === "delete"
            ? "Hapus Peserta?"
            : mode === "import"
              ? "Import Excel"
              : "Detail Peserta"

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#111827]/30 px-4 py-6 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="max-h-[calc(100vh-48px)] w-full max-w-3xl overflow-hidden rounded-2xl border border-[#111827]/10 bg-white shadow-[0_28px_80px_rgba(17,24,39,0.22)]" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[#111827]/10 p-5">
          <div>
            <h3 className="font-heading text-xl font-bold text-[#111827]">{title}</h3>
            <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">
              {mode === "delete" ? "Data yang dihapus tidak dapat dikembalikan." : "Sistem registrasi, verifikasi, dan monitoring peserta resmi MCS."}
            </p>
          </div>
          <button type="button" className="grid size-9 place-items-center rounded-xl border border-[#111827]/10 text-[#6B7280] transition hover:bg-[#FFF7ED]" onClick={onClose} aria-label="Tutup modal">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-230px)] overflow-y-auto p-5">
          {mode === "delete" ? (
            <div className="rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] p-4">
              <p className="text-sm font-semibold text-[#991B1B]">{selectedParticipant?.name}</p>
              <p className="mt-1 text-sm font-medium text-[#B91C1C]">Data yang dihapus tidak dapat dikembalikan.</p>
            </div>
          ) : mode === "import" ? (
            <div className="grid gap-4">
              <label className="grid gap-2 rounded-2xl border border-dashed border-[#F97316]/45 bg-[#FFF7ED] p-5 text-center">
                <Upload className="mx-auto size-8 text-[#F97316]" aria-hidden="true" />
                <span className="text-sm font-bold text-[#111827]">Upload File Excel</span>
                <input type="file" accept=".xlsx,.xls" className="mx-auto text-sm" onChange={(event) => event.target.files?.[0] && onFileSelected(event.target.files[0])} />
              </label>
              {importRows.length > 0 ? (
                <div className="overflow-auto rounded-2xl border border-[#111827]/10">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-[#F97316] text-xs font-bold uppercase tracking-[0.08em] text-white">
                      <tr>
                        {["Negara", "Kelas Asli", "Jurusan Internal", "Lomba", "Status"].map((heading) => (
                          <th key={heading} className="px-3 py-3">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((row, index) => (
                        <tr key={`${row.name}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-[#FFFDF8]"}>
                          <td className="border-b border-[#F1F5F9] px-3 py-3">{getCountryNameFromClass(row.className)}</td>
                          <td className="border-b border-[#F1F5F9] px-3 py-3">{row.className}</td>
                          <td className="border-b border-[#F1F5F9] px-3 py-3">{row.major}</td>
                          <td className="border-b border-[#F1F5F9] px-3 py-3">{row.competitionLabel}</td>
                          <td className="border-b border-[#F1F5F9] px-3 py-3">{row.valid ? "Siap Import" : row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {importResult ? <p className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm font-bold text-[#15803D]">{importResult}</p> : null}
            </div>
          ) : mode === "verify" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Negara" value={getCountryNameFromClass(form.className)} disabled onChange={() => undefined} />
              <Input label="Kelas Asli" value={form.className} disabled onChange={() => undefined} />
              <Input label="Jurusan Internal" value={form.major} disabled onChange={() => undefined} />
              <Select label="Status" options={statusOptions} value={form.status} onChange={(status) => onFormChange({ ...form, status: status as ParticipantStatus })} />
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-sm font-bold text-[#111827]">Catatan Verifikasi</span>
                <textarea className="min-h-24 rounded-2xl border border-[#111827]/12 bg-white px-3 py-2 text-sm font-medium text-[#111827] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20" value={form.verificationNotes} onChange={(event) => onFormChange({ ...form, verificationNotes: event.target.value })} />
              </label>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nama Peserta Internal *" value={form.name} disabled={readonly} onChange={(name) => onFormChange({ ...form, name })} />
              <Input label="Kelas Asli *" value={form.className} disabled={readonly} onChange={(className) => onFormChange({ ...form, className })} />
              <Select label="Jurusan Internal *" options={majors.map((major) => ({ label: major.name, value: major.name }))} value={form.major} disabled={readonly} onChange={(major) => onFormChange({ ...form, major })} />
              <Select label="Lomba *" options={competitionOptions} value={form.competitionId} disabled={readonly} onChange={(competitionId) => onFormChange({ ...form, competitionId })} />
              <Select label="Jenis Kelamin" options={[{ label: "Pilih", value: "" }, { label: "L", value: "L" }, { label: "P", value: "P" }]} value={form.gender} disabled={readonly} onChange={(gender) => onFormChange({ ...form, gender })} />
              <Input label="Tim/Kelompok (opsional)" value={form.teamName} disabled={readonly} onChange={(teamName) => onFormChange({ ...form, teamName })} />
              <Select label="Status Kehadiran" options={attendanceOptions} value={form.attendanceStatus} disabled={readonly} onChange={(attendanceStatus) => onFormChange({ ...form, attendanceStatus: attendanceStatus as ParticipantAttendanceStatus })} />
              <Select label="Status Verifikasi" options={statusOptions} value={form.status} disabled={readonly} onChange={(status) => onFormChange({ ...form, status: status as ParticipantStatus })} />
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-sm font-bold text-[#111827]">Catatan</span>
                <textarea className="min-h-24 rounded-2xl border border-[#111827]/12 bg-white px-3 py-2 text-sm font-medium text-[#111827] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 disabled:bg-[#F9FAFB]" disabled={readonly} value={form.notes} onChange={(event) => onFormChange({ ...form, notes: event.target.value })} />
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#111827]/10 bg-[#FFF7ED] p-4 sm:flex-row sm:justify-end">
          {mode === "delete" ? (
            <>
              <Button icon={X} label="Batal" variant="secondary" onClick={onClose} />
              <Button icon={Trash2} label="Hapus" variant="danger" onClick={onDelete} />
            </>
          ) : mode === "import" ? (
            <>
              <Button icon={X} label="Batalkan" variant="secondary" onClick={onClose} />
              <Button icon={Upload} label="Import Semua" onClick={onImportAll} />
            </>
          ) : mode === "verify" ? (
            <>
              <Button icon={X} label="Batal" variant="secondary" onClick={onClose} />
              <Button icon={ShieldCheck} label="Simpan Verifikasi" onClick={onVerify} />
            </>
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
              <Button icon={FileText} label="Simpan Draft" variant="secondary" onClick={() => onSave("Pending")} />
              <Button icon={UserCheck} label="Simpan & Verifikasi" onClick={() => onSave("Verified")} />
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function Panel({
  children,
  description,
  title,
}: {
  children: ReactNode
  description?: string
  title: string
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#111827]/10 bg-white shadow-[0_14px_36px_rgba(17,24,39,0.06)]">
      <div className="border-b border-[#111827]/10 p-5">
        <h3 className="font-heading text-lg font-bold text-[#111827]">{title}</h3>
        {description ? <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p> : null}
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

function MetricCard({ label, tone, value }: { label: string; tone: "navy" | "success" | "warning" | "danger"; value: number }) {
  return (
    <article className="rounded-2xl border border-[#111827]/10 bg-white p-4 shadow-[0_14px_36px_rgba(17,24,39,0.06)]">
      <p className="text-sm font-semibold text-[#6B7280]">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-heading text-2xl font-bold text-[#111827]">{value}</p>
        <span className={cn("mb-1 size-2.5 rounded-full", tone === "success" ? "bg-[#16A34A]" : tone === "warning" ? "bg-[#F97316]" : tone === "danger" ? "bg-[#DC2626]" : "bg-[#081C3A]")} />
      </div>
    </article>
  )
}

function SearchField({ onChange, value }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">Search Peserta</span>
      <span className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" aria-hidden="true" />
        <input className="h-10 w-full rounded-2xl border border-[#111827]/10 bg-white pl-9 pr-3 text-sm font-medium outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Cari peserta" />
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
  disabled,
  label,
  onChange,
  value,
}: {
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <input className="h-10 rounded-2xl border border-[#111827]/12 bg-white px-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 disabled:bg-[#F9FAFB]" disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} />
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

function VerificationBadge({ status }: { status: ParticipantStatus }) {
  const className =
    status === "Verified"
      ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
      : status === "Disqualified"
        ? "border-[#FEE2E2] bg-[#FEF2F2] text-[#DC2626]"
        : "border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C]"

  return <span className={cn("inline-flex h-7 w-fit items-center rounded-xl border px-2.5 text-xs font-bold", className)}>{formatVerificationStatus(status)}</span>
}

function ParticipantEmptyState({ onCreate, onTemplate }: { onCreate: () => void; onTemplate: () => void }) {
  return (
    <div className="grid place-items-center px-4 py-12 text-center">
      <div className="max-w-md">
        <p className="font-heading text-xl font-bold text-[#111827]">Belum Ada Peserta Terdaftar</p>
        <p className="mt-2 text-sm font-medium leading-6 text-[#6B7280]">Mulai tambahkan peserta secara manual atau impor menggunakan template Excel resmi.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button icon={Plus} label="Tambah Peserta" onClick={onCreate} />
          <Button icon={Download} label="Download Template" variant="secondary" onClick={onTemplate} />
        </div>
      </div>
    </div>
  )
}

function CompactChipGrid({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-xl border border-[#111827]/10 bg-[#FFF7ED] px-3 py-2 text-xs font-bold text-[#111827]">{item}</span>
      ))}
    </div>
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
      <p className="text-sm font-medium text-[#6B7280]">{total} peserta / halaman {page} dari {pageCount}</p>
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

function participantToForm(participant: CompetitionParticipant): ParticipantFormState {
  return {
    attendanceStatus: participant.attendanceStatus ?? "Belum Hadir",
    className: participant.className,
    competitionId: participant.competitionId,
    gender: participant.gender ?? "",
    major: participant.major,
    name: participant.name,
    notes: participant.notes ?? "",
    status: participant.status === "Disqualified" ? "Disqualified" : participant.status === "Verified" ? "Verified" : "Pending",
    teamName: participant.teamName ?? "",
    verificationNotes: participant.verificationNotes ?? "",
  }
}

function mapImportRow(row: Record<string, unknown>, competitionOptions: Array<{ label: string; value: string }>): ImportPreviewRow {
  const name = getCell(row, ["Nama Peserta", "Nama", "Name"])
  const className = getCell(row, ["Kelas", "Class"])
  const major = getCell(row, ["Jurusan", "Major"])
  const competitionLabel = getCell(row, ["Lomba", "Competition"])
  const gender = getCell(row, ["Jenis Kelamin", "Gender"])
  const competitionId = findCompetitionId(competitionLabel, competitionOptions)
  const missing = [
    !name ? "Nama Peserta" : "",
    !className ? "Kelas" : "",
    !major ? "Jurusan" : "",
    !competitionLabel ? "Lomba" : "",
  ].filter(Boolean)

  if (missing.length > 0) {
    return { className, competitionLabel, gender, major, name, valid: false, reason: `${missing.join(", ")} wajib diisi` }
  }

  if (!competitionId) {
    return { className, competitionLabel, gender, major, name, valid: false, reason: "Lomba tidak resmi" }
  }

  return { className, competitionId, competitionLabel, gender, major, name, valid: true }
}

function getCell(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number") return String(value)
  }

  return ""
}

function findCompetitionId(label: string, competitionOptions: Array<{ label: string; value: string }>) {
  const normalized = normalize(label)
  const option = competitionOptions.find((item) => normalize(item.label) === normalized || normalize(item.value) === normalized)

  return option?.value
}

function compareParticipants(first: CompetitionParticipant, second: CompetitionParticipant, key: SortKey, direction: "asc" | "desc") {
  const multiplier = direction === "asc" ? 1 : -1
  const firstValue =
    key === "attendanceStatus"
      ? first.attendanceStatus ?? "Belum Hadir"
      : key === "countryName"
        ? getParticipantCountryName(first)
        : String(first[key])
  const secondValue =
    key === "attendanceStatus"
      ? second.attendanceStatus ?? "Belum Hadir"
      : key === "countryName"
        ? getParticipantCountryName(second)
        : String(second[key])

  return firstValue.localeCompare(secondValue) * multiplier
}

function getParticipantCountryName(participant: CompetitionParticipant) {
  return participant.countryName || getCountryNameFromClass(participant.className)
}

function getParticipantCountryFlag(participant: CompetitionParticipant) {
  return participant.countryFlag || getNationByClassName(participant.className)?.countryFlag || ""
}

function getCountryNameFromClass(className: string) {
  return getNationByClassName(className)?.countryName ?? className
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort().map((value) => ({ label: value, value }))
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

function formatVerificationStatus(status: ParticipantStatus) {
  if (status === "Verified" || status === "Active" || status === "Completed") return "Terverifikasi"
  if (status === "Disqualified" || status === "Rejected") return "Diskualifikasi"
  return "Menunggu"
}

function formatParticipantAction(action: string) {
  const labels: Record<string, string> = {
    "participant.created": "Tambah Peserta",
    "participant.deleted": "Hapus Peserta",
    "participant.updated": "Edit Peserta",
    "participant.verified": "Verifikasi Peserta",
  }

  return labels[action] ?? action
}

function formatLongDateTime(value: string) {
  return `${new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))} WIB`
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Aksi gagal diproses."
}
