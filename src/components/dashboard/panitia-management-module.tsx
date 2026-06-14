"use client"

import Image from "next/image"
import { memo, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Download,
  Edit3,
  FileDown,
  FileSpreadsheet,
  FileText,
  Filter,
  IdCard,
  Import,
  ListChecks,
  Loader2,
  Mail,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { brandAssets, dashboardFootage, event } from "@/data/mcs"
import { officialCommitteeMembers } from "@/data/mcs-panitia"
import { cn } from "@/lib/utils"
import type { UserDTO } from "@/server/mcs/types"
import { useVirtualizer } from "@tanstack/react-virtual"

const STORAGE_KEY = "mcs-panitia-management-v2"
const EMPTY_COPY = "Data akan ditampilkan setelah aktivitas panitia tercatat dalam sistem MCS."
const ATTENDANCE_UNPUBLISHED = "Data Not Published Yet"
const ALL = "Semua"
const dialogInputClass = "!bg-white border-[#D6DCE5] !text-[#111827] placeholder:!text-[#9CA3AF] focus:border-[#F97316] focus-visible:border-[#F97316] focus-visible:ring-4 focus-visible:ring-[#F97316]/15"
const dialogTextareaClass = `${dialogInputClass} min-h-20`
const panitiaExportColumns = [
  { key: "fullName", label: "Nama Lengkap" },
  { key: "nisNip", label: "NIS/NIP" },
  { key: "division", label: "Divisi" },
  { key: "position", label: "Jabatan" },
  { key: "role", label: "Role" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
  { key: "attendance", label: "Kehadiran" },
  { key: "taskCount", label: "Jumlah Tugas" },
  { key: "committeeType", label: "Tipe Panitia" },
  { key: "internalId", label: "ID Internal" },
  { key: "joinedAt", label: "Tanggal Bergabung" },
]

const officialDivisions = [
  "Penanggung Jawab",
  "Ketua Pelaksana",
  "Wakil Pelaksana",
  "Sekretaris",
  "Bendahara",
  "Sie. Acara",
  "Sie. Humas",
  "Sie. Dokumentasi",
  "PJ Mobile Legends",
  "PJ Futsal Putra",
  "PJ Basket Putra",
  "PJ Voli Putra",
  "PJ Badminton Ganda Putra",
  "PJ Solo Vokal",
  "PJ Canvas Drawing",
  "PJ Best News Card",
  "PJ Best News Video",
  "Sie. Perlengkapan",
  "Sie. Konsumsi",
  "Sie. Keamanan",
  "Sie. Kesehatan",
  "Sie. Kebersihan",
] as const

const attendanceStatusOptions = ["Hadir", "Izin", "Sakit", "Alpha", "On Duty"] as const
const memberStatusOptions = ["Aktif", "Nonaktif"] as const
const genderOptions = ["Laki-laki", "Perempuan", "Tidak Diisi"] as const
const priorityOptions = ["Rendah", "Sedang", "Tinggi", "Critical"] as const
const taskStatusOptions = ["Belum Mulai", "Diproses", "Revisi", "Selesai", "Terlambat"] as const
type OfficialDivision = (typeof officialDivisions)[number]
type AttendanceStatus = (typeof attendanceStatusOptions)[number] | typeof ATTENDANCE_UNPUBLISHED
type MemberStatus = (typeof memberStatusOptions)[number]
type Gender = (typeof genderOptions)[number]
type TaskPriority = (typeof priorityOptions)[number]
type TaskStatus = (typeof taskStatusOptions)[number]
type CommitteeType = "supervisor" | "operational"
type ToastTone = "success" | "error" | "info" | "warning"
type ExportType = "pdf" | "xlsx" | "csv"

type CommitteeMember = {
  id: string
  fullName: string
  nisNip: string
  email: string
  division: OfficialDivision
  position: string
  role: string
  gender: Gender
  internalId: string
  status: MemberStatus
  committeeType: CommitteeType
  joinedAt: string
  attendance: {
    status: AttendanceStatus
    note: string
    checkIn: string
    checkOut: string
    updatedAt: string
  }
  taskIds: string[]
  createdAt: string
  updatedAt: string
}

type CommitteeTask = {
  id: string
  title: string
  picId: string
  division: OfficialDivision
  deadline: string
  priority: TaskPriority
  status: TaskStatus
  description: string
  createdAt: string
  updatedAt: string
}

type ActivityLogEntry = {
  id: string
  date: string
  user: string
  activity: string
  target: string
  tone: ToastTone
}

type StoredState = {
  members: CommitteeMember[]
  tasks: CommitteeTask[]
  logs: ActivityLogEntry[]
}

type CommitteeFormState = {
  fullName: string
  nisNip: string
  email: string
  division: OfficialDivision
  position: string
  role: string
  gender: Gender
  internalId: string
  status: MemberStatus
  committeeType: CommitteeType
}

type AttendanceFormState = {
  memberId: string
  status: (typeof attendanceStatusOptions)[number]
  note: string
  checkIn: string
  checkOut: string
}

type TaskFormState = {
  title: string
  picId: string
  deadline: string
  priority: TaskPriority
  description: string
}

type ImportPreviewRow = {
  id: string
  fullName: string
  division: string
  position: string
  role: string
  email: string
  committeeType: string
  errors: string[]
  duplicate: boolean
}

type ConfirmAction = {
  title: string
  description: string
  confirmLabel: string
  variant?: "danger" | "default"
  onConfirm: () => void
}

type ToastMessage = {
  id: string
  tone: ToastTone
  message: string
}

type DivisionStat = {
  division: OfficialDivision
  total: number
  active: number
  hadir: number
  onDuty: number
  absent: number
  tasksOpen: number
  attendanceRate: number
}

type OverviewStats = {
  totalPanitia: number
  totalDivisi: number
  activePanitia: number
  supervisorCount: number
  operationalCount: number
  hadir: number
  tidakHadir: number
  onDuty: number
  attendanceRate: number
  pendingTasks: number
}

export function PanitiaManagementModule({ user }: { user: UserDTO }) {
  const operatorName = user.displayName || "Super Admin"
  const [ready, setReady] = useState(false)
  const [members, setMembers] = useState<CommitteeMember[]>([])
  const [tasks, setTasks] = useState<CommitteeTask[]>([])
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const [query, setQuery] = useState("")
  const [divisionFilter, setDivisionFilter] = useState(ALL)
  const [roleFilter, setRoleFilter] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [attendanceFilter, setAttendanceFilter] = useState(ALL)
  const [joinedFilter, setJoinedFilter] = useState("")

  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [memberForm, setMemberForm] = useState<CommitteeFormState>(() => createEmptyMemberForm())

  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFileName, setImportFileName] = useState("")
  const [importPreview, setImportPreview] = useState<ImportPreviewRow[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false)
  const [attendanceForm, setAttendanceForm] = useState<AttendanceFormState>(() => createEmptyAttendanceForm(""))

  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskForm, setTaskForm] = useState<TaskFormState>(() => createEmptyTaskForm(""))

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      const fallback = createInitialState(operatorName)

      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) {
          if (cancelled) return
          setMembers(fallback.members)
          setTasks(fallback.tasks)
          setLogs(fallback.logs)
          setReady(true)
          return
        }

        const parsed = JSON.parse(raw) as Partial<StoredState>
        if (cancelled) return
        setMembers(Array.isArray(parsed.members) ? normalizeStoredMembers(parsed.members) : fallback.members)
        setTasks(Array.isArray(parsed.tasks) ? parsed.tasks : fallback.tasks)
        setLogs(Array.isArray(parsed.logs) ? parsed.logs : fallback.logs)
        setReady(true)
      } catch {
        if (cancelled) return
        setMembers(fallback.members)
        setTasks(fallback.tasks)
        setLogs(fallback.logs)
        setReady(true)
      }
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [operatorName])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ members, tasks, logs } satisfies StoredState))
  }, [logs, members, ready, tasks])

  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members])
  const activeOperationalMembers = useMemo(() => members.filter((member) => member.status === "Aktif" && member.committeeType === "operational"), [members])
  const operationalMembers = useMemo(() => members.filter((member) => member.committeeType === "operational"), [members])
  const roleOptions = useMemo(() => [ALL, ...unique(members.map((member) => member.role).filter(Boolean))], [members])
  const divisionStats = useMemo(() => createDivisionStats(members, tasks), [members, tasks])
  const selectedMember = selectedMemberId ? memberMap.get(selectedMemberId) ?? null : null

  const overview = useMemo(() => {
    const operationalList = members.filter((m) => m.committeeType === "operational")
    const hadir = operationalList.filter((m) => m.attendance.status === "Hadir").length
    const onDuty = operationalList.filter((m) => m.attendance.status === "On Duty").length
    const tidakHadir = operationalList.filter((m) => ["Izin", "Sakit", "Alpha"].includes(m.attendance.status)).length
    const attendanceRate = Math.round(((hadir + onDuty) / Math.max(operationalList.length, 1)) * 100)

    return {
      totalPanitia: members.length,
      totalDivisi: divisionStats.filter((division) => division.total > 0 && division.division !== "Penanggung Jawab").length,
      activePanitia: members.filter((member) => member.status === "Aktif").length,
      supervisorCount: members.filter((m) => m.committeeType === "supervisor").length,
      operationalCount: operationalList.length,
      hadir,
      tidakHadir,
      onDuty,
      attendanceRate,
      pendingTasks: tasks.filter((task) => task.status !== "Selesai").length,
    }
  }, [divisionStats, members, tasks])

  const filteredMembers = useMemo(() => {
    const normalizedQuery = normalizeText(query)

    return members.filter((member) => {
      const searchable = normalizeText([
        member.fullName,
        member.nisNip,
        member.email,
        member.division,
        member.position,
        member.role,
        member.internalId,
      ].join(" "))

      return (
        searchable.includes(normalizedQuery) &&
        (divisionFilter === ALL || member.division === divisionFilter) &&
        (roleFilter === ALL || member.role === roleFilter) &&
        (statusFilter === ALL || member.status === statusFilter) &&
        (attendanceFilter === ALL || member.attendance.status === attendanceFilter) &&
        (!joinedFilter || member.joinedAt === joinedFilter)
      )
    })
  }, [attendanceFilter, divisionFilter, joinedFilter, members, query, roleFilter, statusFilter])

  const importStats = useMemo(() => {
    const valid = importPreview.filter((row) => row.errors.length === 0 && !row.duplicate).length
    const errors = importPreview.filter((row) => row.errors.length > 0).length
    const duplicates = importPreview.filter((row) => row.duplicate).length

    return {
      total: importPreview.length,
      valid,
      errors,
      duplicates,
    }
  }, [importPreview])

  function pushToast(message: string, tone: ToastTone = "success") {
    const toast = { id: createId("toast"), tone, message } satisfies ToastMessage
    setToasts((current) => [toast, ...current].slice(0, 4))
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id))
    }, 3600)
  }

  function appendLog(activity: string, target: string, tone: ToastTone = "info") {
    setLogs((current) => [createActivity(operatorName, activity, target, tone), ...current].slice(0, 120))
  }

  function openAddMemberDialog() {
    setEditingMemberId(null)
    setMemberForm({ ...createEmptyMemberForm(), internalId: createInternalId("panitia") })
    setMemberDialogOpen(true)
  }

  function openEditMemberDialog(member: CommitteeMember) {
    setEditingMemberId(member.id)
    setMemberForm({
      fullName: member.fullName,
      nisNip: member.nisNip,
      email: member.email,
      division: member.division,
      position: member.position,
      role: member.role,
      gender: member.gender,
      internalId: member.internalId,
      status: member.status,
      committeeType: normalizeCommitteeType(member.committeeType) || "operational",
    })
    setMemberDialogOpen(true)
  }

  function saveMember(mode: "publish" | "draft" = "publish") {
    const fullName = memberForm.fullName.trim()
    const email = memberForm.email.trim()
    const internalId = memberForm.internalId.trim() || createInternalId(fullName)
    const role = memberForm.role.trim()
    const committeeType = normalizeCommitteeType(memberForm.committeeType)

    if (!fullName) {
      pushToast("Nama Lengkap wajib diisi.", "error")
      return
    }

    if (!role) {
      pushToast("Role wajib diisi.", "error")
      return
    }

    if (!committeeType) {
      pushToast("Committee Type wajib dipilih.", "error")
      return
    }

    if (email && !isValidEmail(email)) {
      pushToast("Format email tidak valid.", "error")
      return
    }

    const hasDuplicate = members.some((member) => {
      if (member.id === editingMemberId) return false

      return (
        normalizeText(member.fullName) === normalizeText(fullName) ||
        Boolean(email && normalizeText(member.email) === normalizeText(email)) ||
        Boolean(internalId && normalizeText(member.internalId) === normalizeText(internalId))
      )
    })

    if (hasDuplicate) {
      pushToast("Data panitia terdeteksi duplikat.", "error")
      return
    }

    const now = new Date().toISOString()
    const resolvedStatus = mode === "draft" ? "Nonaktif" : memberForm.status

    if (editingMemberId) {
      const assignedTaskIds = new Set(tasks.filter((task) => task.picId === editingMemberId).map((task) => task.id))

      setMembers((current) =>
        current.map((member) =>
          member.id === editingMemberId
            ? {
                ...member,
                fullName,
                nisNip: memberForm.nisNip.trim(),
                email,
                division: memberForm.division,
                position: memberForm.position.trim() || "Staff",
                role,
                gender: memberForm.gender,
                internalId,
                status: resolvedStatus,
                committeeType,
                attendance:
                  committeeType === "supervisor"
                    ? {
                        status: ATTENDANCE_UNPUBLISHED,
                        note: "",
                        checkIn: "",
                        checkOut: "",
                        updatedAt: now,
                      }
                    : member.attendance,
                taskIds:
                  committeeType === "supervisor"
                    ? []
                    : member.taskIds.filter((taskId) => !assignedTaskIds.has(taskId)),
                updatedAt: now,
              }
            : member,
        ),
      )
      setTasks((current) =>
        committeeType === "supervisor"
          ? current.filter((task) => task.picId !== editingMemberId)
          : current.map((task) =>
              task.picId === editingMemberId ? { ...task, division: memberForm.division, updatedAt: now } : task,
            ),
      )
      appendLog("Edit Panitia", fullName, "success")
      pushToast("Data panitia berhasil diperbarui")
    } else {
      const member: CommitteeMember = {
        id: createId("panitia"),
        fullName,
        nisNip: memberForm.nisNip.trim(),
        email,
        division: memberForm.division,
        position: memberForm.position.trim() || "Staff",
        role,
        gender: memberForm.gender,
        internalId,
        status: resolvedStatus,
        committeeType,
        joinedAt: getJakartaDateInputValue(),
        attendance: {
          status: ATTENDANCE_UNPUBLISHED,
          note: "",
          checkIn: "",
          checkOut: "",
          updatedAt: now,
        },
        taskIds: [],
        createdAt: now,
        updatedAt: now,
      }

      setMembers((current) => [member, ...current])
      appendLog(mode === "draft" ? "Simpan Draft Panitia" : "Tambah Panitia", fullName, "success")
      pushToast(mode === "draft" ? "Draft panitia berhasil disimpan" : "Panitia berhasil ditambahkan")
    }

    setMemberDialogOpen(false)
  }

  function openAttendanceDialog(memberId = selectedMemberId ?? activeOperationalMembers[0]?.id ?? "") {
    const member = memberId ? memberMap.get(memberId) : undefined
    setAttendanceForm({
      memberId,
      status:
        member && member.attendance.status !== ATTENDANCE_UNPUBLISHED
          ? member.attendance.status
          : "Hadir",
      note: member?.attendance.note ?? "",
      checkIn: member?.attendance.checkIn || getJakartaTimeInputValue(),
      checkOut: member?.attendance.checkOut ?? "",
    })
    setAttendanceDialogOpen(true)
  }

  function updateAttendance() {
    const member = memberMap.get(attendanceForm.memberId)
    if (!member) {
      pushToast("Pilih panitia sebelum update attendance.", "error")
      return
    }

    if (member.committeeType === "supervisor") {
      pushToast("Supervisor tidak dapat diaudit absensi.", "error")
      return
    }

    const now = new Date().toISOString()
    setMembers((current) =>
      current.map((item) =>
        item.id === member.id
          ? {
              ...item,
              attendance: {
                status: attendanceForm.status,
                note: attendanceForm.note.trim(),
                checkIn: attendanceForm.checkIn,
                checkOut: attendanceForm.checkOut,
                updatedAt: now,
              },
              updatedAt: now,
            }
          : item,
      ),
    )
    appendLog("Update Attendance", `${member.fullName} - ${attendanceForm.status}`, "success")
    pushToast("Attendance panitia berhasil diperbarui")
    setAttendanceDialogOpen(false)
  }

  function openTaskDialog(picId = selectedMemberId ?? activeOperationalMembers[0]?.id ?? "") {
    const member = picId ? memberMap.get(picId) : undefined
    if (member && member.committeeType === "supervisor") {
      pushToast("Supervisor tidak dapat menerima tugas.", "error")
      return
    }
    setTaskForm(createEmptyTaskForm(picId))
    setTaskDialogOpen(true)
  }

  function addTask() {
    const title = taskForm.title.trim()
    const pic = memberMap.get(taskForm.picId)

    if (!title) {
      pushToast("Nama Tugas wajib diisi.", "error")
      return
    }

    if (!pic) {
      pushToast("Pilih PIC sebelum menambah tugas.", "error")
      return
    }

    if (pic.committeeType === "supervisor") {
      pushToast("Supervisor tidak dapat diberikan tugas operasional.", "error")
      return
    }

    const now = new Date().toISOString()
    const task: CommitteeTask = {
      id: createId("task"),
      title,
      picId: pic.id,
      division: pic.division,
      deadline: taskForm.deadline,
      priority: taskForm.priority,
      status: "Belum Mulai",
      description: taskForm.description.trim(),
      createdAt: now,
      updatedAt: now,
    }

    setTasks((current) => [task, ...current])
    setMembers((current) =>
      current.map((member) =>
        member.id === pic.id ? { ...member, taskIds: unique([...member.taskIds, task.id]), updatedAt: now } : member,
      ),
    )
    appendLog("Assign Task", `${task.title} - ${pic.fullName}`, "success")
    pushToast("Tugas panitia berhasil ditambahkan")
    setTaskDialogOpen(false)
  }

  function updateTaskStatus(taskId: string, status: TaskStatus) {
    const task = tasks.find((item) => item.id === taskId)
    setTasks((current) =>
      current.map((item) => (item.id === taskId ? { ...item, status, updatedAt: new Date().toISOString() } : item)),
    )
    if (task) {
      appendLog("Perubahan Status Tugas", `${task.title} - ${status}`, "info")
      pushToast("Status tugas berhasil diperbarui", "info")
    }
  }

  function updateTaskPriority(taskId: string, priority: TaskPriority) {
    setTasks((current) =>
      current.map((item) => (item.id === taskId ? { ...item, priority, updatedAt: new Date().toISOString() } : item)),
    )
  }

  function openMemberDetail(memberId: string) {
    setSelectedMemberId(memberId)
    setDetailOpen(true)
  }

  function resetFilters() {
    setQuery("")
    setDivisionFilter(ALL)
    setRoleFilter(ALL)
    setStatusFilter(ALL)
    setAttendanceFilter(ALL)
    setJoinedFilter("")
  }

  function resetMemberData(member: CommitteeMember) {
    setConfirmAction({
      title: "Reset Data Panitia",
      description: `Reset attendance dan assignment aktif untuk ${member.fullName}?`,
      confirmLabel: "Reset Data",
      variant: "danger",
      onConfirm: () => {
        const now = new Date().toISOString()
        setMembers((current) =>
          current.map((item) =>
            item.id === member.id
              ? {
                  ...item,
                  attendance: {
                    status: ATTENDANCE_UNPUBLISHED,
                    note: "",
                    checkIn: "",
                    checkOut: "",
                    updatedAt: now,
                  },
                  taskIds: [],
                  updatedAt: now,
                }
              : item,
          ),
        )
        setTasks((current) => current.filter((task) => task.picId !== member.id))
        appendLog("Reset Data Panitia", member.fullName, "warning")
        pushToast("Data panitia berhasil direset", "info")
        setConfirmAction(null)
      },
    })
  }

  function deactivateMember(member: CommitteeMember) {
    setConfirmAction({
      title: "Nonaktifkan Panitia",
      description: `${member.fullName} akan ditandai Nonaktif, namun riwayat aktivitas tetap tersimpan.`,
      confirmLabel: "Nonaktifkan",
      variant: "danger",
      onConfirm: () => {
        setMembers((current) =>
          current.map((item) =>
            item.id === member.id ? { ...item, status: "Nonaktif", updatedAt: new Date().toISOString() } : item,
          ),
        )
        appendLog("Hapus Panitia", `${member.fullName} - Nonaktif`, "warning")
        pushToast("Status panitia berhasil dinonaktifkan", "info")
        setConfirmAction(null)
      },
    })
  }

  async function downloadTemplate() {
    setBusyAction("template")
    try {
      const XLSX = await import("xlsx-js-style")
      const rows = [
        ["Nama Lengkap", "Divisi", "Jabatan", "Role", "Email", "Committee Type"],
      ]
      const worksheet = XLSX.utils.aoa_to_sheet(rows)
      applyWorksheetStyle(worksheet, rows, 0)
      worksheet["!cols"] = fitColumns(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template Panitia")
      XLSX.writeFile(workbook, "MCS_PANITIA_TEMPLATE.xlsx")
      appendLog("Download Template", "Template Import Panitia", "info")
      pushToast("Template import berhasil diunduh", "success")
    } catch {
      pushToast("Template gagal diunduh.", "error")
    } finally {
      setBusyAction(null)
    }
  }

  async function parseImportFile(file: File) {
    setImportLoading(true)
    setImportFileName(file.name)

    try {
      const extension = file.name.split(".").pop()?.toLowerCase()
      let rows: Array<Record<string, string>> = []

      if (extension === "csv") {
        rows = parseCsv(await file.text())
      } else if (extension === "xlsx") {
        const XLSX = await import("xlsx-js-style")
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const sheet = sheetName ? workbook.Sheets[sheetName] : undefined
        rows = sheet ? XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" }) : []
      } else {
        pushToast("Format file harus XLSX atau CSV.", "error")
        return
      }

      const preview = createImportPreview(rows, members)
      setImportPreview(preview)
      appendLog("Preview Import Data", `${preview.length} baris dibaca`, "info")
      if (preview.length === 0) {
        pushToast("File tidak memiliki data panitia.", "error")
      } else {
        pushToast(`${preview.length} data ditemukan`, "info")
      }
    } catch {
      pushToast("File import tidak dapat dibaca.", "error")
    } finally {
      setImportLoading(false)
    }
  }

  function importData() {
    const validRows = importPreview.filter((row) => row.errors.length === 0 && !row.duplicate)

    if (validRows.length === 0) {
      pushToast("Tidak ada data valid untuk diimpor.", "error")
      return
    }

    const now = new Date().toISOString()
    const newMembers = validRows.map<CommitteeMember>((row) => ({
      id: createId("panitia"),
      fullName: row.fullName.trim(),
      nisNip: "",
      email: row.email.trim(),
      division: row.division as OfficialDivision,
      position: row.position.trim() || "Staff",
      role: row.role.trim() || "Staff",
      gender: "Tidak Diisi",
      internalId: createInternalId(row.fullName),
      status: "Aktif",
      committeeType: (row.committeeType === "supervisor" ? "supervisor" : "operational") as CommitteeType,
      joinedAt: getJakartaDateInputValue(),
      attendance: {
        status: ATTENDANCE_UNPUBLISHED,
        note: "",
        checkIn: "",
        checkOut: "",
        updatedAt: now,
      },
      taskIds: [],
      createdAt: now,
      updatedAt: now,
    }))

    setMembers((current) => [...newMembers, ...current])
    appendLog("Import Data", `${validRows.length} panitia diimpor`, "success")
    pushToast(`${validRows.length} panitia berhasil diimpor`)
    setImportPreview([])
    setImportFileName("")
    setImportDialogOpen(false)
  }

  async function exportData(type: ExportType) {
    setBusyAction(type)

    try {
      await downloadServerExport(type, {
        columns: panitiaExportColumns,
        filename: "MCS1_Data_Panitia_Official",
        rows: members.map((member) => ({
          attendance: member.attendance.status,
          committeeType: member.committeeType,
          division: member.division,
          email: member.email,
          fullName: member.fullName,
          internalId: member.internalId,
          joinedAt: member.joinedAt,
          nisNip: member.nisNip,
          position: member.position,
          role: member.role,
          status: member.status,
          taskCount: member.taskIds.length,
        })),
        title: `Data Panitia Resmi MCS 1 - ${operatorName}`,
      })
      appendLog("Export Data", `Export ${type.toUpperCase()}`, "success")
      pushToast(`Export ${type.toUpperCase()} berhasil dibuat`)
    } catch (err) {
      console.error(err)
      pushToast("Export data gagal diproses.", "error")
    } finally {
      setBusyAction(null)
    }
  }

  if (!ready) {
    return <PanitiaSkeleton />
  }

  return (
    <div className="grid gap-5">
      <PanitiaHero
        busyAction={busyAction}
        onAdd={openAddMemberDialog}
        onExport={exportData}
        onImport={() => setImportDialogOpen(true)}
      />

      <MetricGrid overview={overview} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)]">
        <AttendanceCenter overview={overview} onUpdate={() => openAttendanceDialog()} />
        <DivisionStructure stats={divisionStats} />
      </section>

      <StaffDirectory
        attendanceFilter={attendanceFilter}
        divisionFilter={divisionFilter}
        filteredMembers={filteredMembers}
        joinedFilter={joinedFilter}
        members={members}
        query={query}
        roleFilter={roleFilter}
        roleOptions={roleOptions}
        statusFilter={statusFilter}
        onAttendanceFilter={setAttendanceFilter}
        onDivisionFilter={setDivisionFilter}
        onJoinedFilter={setJoinedFilter}
        onOpenDetail={openMemberDetail}
        onQuery={setQuery}
        onResetFilter={resetFilters}
        onRoleFilter={setRoleFilter}
        onStatusFilter={setStatusFilter}
      />

      <SupervisorBoard members={members} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.52fr)]">
        <TaskAssignment
          memberMap={memberMap}
          tasks={tasks}
          onAddTask={() => openTaskDialog()}
          onPriorityChange={updateTaskPriority}
          onStatusChange={updateTaskStatus}
        />
        <ActivityLog logs={logs} />
      </section>

      {memberDialogOpen ? (
        <MemberDialog
          form={memberForm}
          mode={editingMemberId ? "edit" : "add"}
          open={memberDialogOpen}
          onFormChange={setMemberForm}
          onOpenChange={setMemberDialogOpen}
          onSaveDraft={() => saveMember("draft")}
          onSubmit={() => saveMember("publish")}
        />
      ) : null}

      {importDialogOpen ? (
        <ImportDialog
          fileInputRef={fileInputRef}
          fileName={importFileName}
          loading={importLoading}
          open={importDialogOpen}
          preview={importPreview}
          stats={importStats}
          templateLoading={busyAction === "template"}
          onDownloadTemplate={downloadTemplate}
          onFile={parseImportFile}
          onImport={importData}
          onOpenChange={setImportDialogOpen}
        />
      ) : null}

      {attendanceDialogOpen ? (
        <AttendanceDialog
          form={attendanceForm}
          members={operationalMembers}
          open={attendanceDialogOpen}
          onFormChange={setAttendanceForm}
          onOpenChange={setAttendanceDialogOpen}
          onSubmit={updateAttendance}
        />
      ) : null}

      {taskDialogOpen ? (
        <TaskDialog
          form={taskForm}
          members={activeOperationalMembers}
          open={taskDialogOpen}
          onFormChange={setTaskForm}
          onOpenChange={setTaskDialogOpen}
          onSubmit={addTask}
        />
      ) : null}

      {detailOpen ? (
        <MemberDetailSheet
          logs={logs}
          member={selectedMember}
          open={detailOpen}
          tasks={tasks}
          onAssignTask={(member) => openTaskDialog(member.id)}
          onDeactivate={deactivateMember}
          onEdit={openEditMemberDialog}
          onOpenChange={setDetailOpen}
          onReset={resetMemberData}
          onUpdateAttendance={(member) => openAttendanceDialog(member.id)}
        />
      ) : null}

      {confirmAction ? <ConfirmDialog action={confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)} /> : null}
      <ToastStack toasts={toasts} />
    </div>
  )
}

function PanitiaHero({
  busyAction,
  onAdd,
  onExport,
  onImport,
}: {
  busyAction: string | null
  onAdd: () => void
  onExport: (type: ExportType) => void
  onImport: () => void
}) {
  const footage = dashboardFootage.find((item) => item.id === "mcs-team-photo") ?? dashboardFootage[0]

  return (
    <section className="relative min-h-[260px] overflow-hidden rounded-lg border border-[#111827]/15 bg-[#081C3A] text-white shadow-[var(--mcs-dash-shadow)]">
      <Image
        src={footage.src}
        alt={footage.label}
        fill
        priority
        sizes="(min-width: 1280px) 980px, 100vw"
        className={cn("object-cover opacity-30", footage.crop)}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,28,58,0.96),rgba(8,28,58,0.82)_50%,rgba(8,28,58,0.54))]" />
      <div className="relative grid min-h-[260px] gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0 self-end">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              {brandAssets.map((asset) => (
                <span key={asset.name} className="relative grid size-9 place-items-center rounded-lg bg-white p-1 shadow-[2px_2px_0_rgba(249,115,22,0.26)]">
                  <Image src={asset.src} alt={asset.name} fill sizes="36px" className="object-contain p-1" />
                </span>
              ))}
            </div>
            <Badge className="rounded-md border border-white/20 bg-white/10 px-3 py-1 text-white">
              {event.shortName}
            </Badge>
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#F0D58C]">{event.theme}</p>
          <h1 className="mt-2 max-w-3xl font-heading text-3xl font-bold leading-tight tracking-normal text-white sm:text-5xl">
            Data Panitia Resmi
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/76">
            Kelola panitia, attendance, task assignment, import, export, dan activity log untuk operasional {event.shortName}.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[440px] lg:self-end">
          <Button className="h-11 rounded-lg bg-[#F97316] font-bold text-white hover:bg-[#EA580C] shadow-none hover:translate-y-0" onClick={onAdd}>
            <UserPlus data-icon="inline-start" />
            Tambah Panitia
          </Button>
          <Button variant="outline" className="h-11 rounded-lg border-white/60 bg-white font-bold text-[#111827] hover:bg-[#F3F4F6] hover:text-[#111827] shadow-sm" onClick={onImport}>
            <Upload data-icon="inline-start" />
            Impor Data
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="h-11 rounded-lg border-white/60 bg-white font-bold text-[#111827] hover:bg-[#F3F4F6] hover:text-[#111827] shadow-sm" />
              }
            >
              {busyAction === "pdf" || busyAction === "xlsx" || busyAction === "csv" ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Download data-icon="inline-start" />
              )}
              Ekspor Data
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onExport("pdf")}>
                <FileText />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("xlsx")}>
                <FileSpreadsheet />
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("csv")}>
                <FileDown />
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </section>
  )
}

function MetricGrid({ overview }: { overview: OverviewStats }) {
  const cards = [
    { label: "Total Panitia Operasional", value: overview.operationalCount, helper: "Sistem operasional", icon: Users, tone: "navy" },
    { label: "Supervisor & Pembina", value: overview.supervisorCount, helper: "Pengawas resmi", icon: ShieldCheck, tone: "gold" },
    { label: "Hadir Hari Ini", value: overview.hadir, helper: `${overview.attendanceRate}% Kehadiran`, icon: ClipboardCheck, tone: "green" },
    { label: "Tidak Hadir", value: overview.tidakHadir, helper: "Izin, sakit, alpha", icon: AlertTriangle, tone: "red" },
    { label: "Tugas Terbuka", value: overview.pendingTasks, helper: "Belum selesai", icon: ListChecks, tone: "orange" },
  ] satisfies Array<{
    label: string
    value: number
    helper: string
    icon: LucideIcon
    tone: "navy" | "gold" | "green" | "orange" | "red"
  }>

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <article key={card.label} className="rounded-lg border border-[#111827]/10 bg-white p-4 shadow-[var(--mcs-dash-shadow-soft)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{card.label}</p>
                <p className="mt-2 font-heading text-3xl font-bold leading-none text-[#111827]">{card.value}</p>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">{card.helper}</p>
              </div>
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", metricIconClass(card.tone))}>
                <Icon className="size-5" />
              </span>
            </div>
          </article>
        )
      })}
    </section>
  )
}

function AttendanceCenter({
  overview,
  onUpdate,
}: {
  overview: OverviewStats
  onUpdate: () => void
}) {
  const items = [
    { label: "Total Operational", value: overview.operationalCount, icon: Users },
    { label: "Present", value: overview.hadir, icon: CheckCircle2 },
    { label: "Absent", value: overview.tidakHadir, icon: AlertTriangle },
    { label: "On Duty", value: overview.onDuty, icon: ClipboardCheck },
  ]

  return (
    <Panel
      action={
        <Button className="h-9 rounded-lg bg-[#F97316] text-white hover:bg-[#EA580C] shadow-none hover:translate-y-0" onClick={onUpdate}>
          <ClipboardCheck data-icon="inline-start" />
          Update Attendance
        </Button>
      }
      description="Pantauan hadir, izin, sakit, alpha, dan on duty khusus panitia operasional."
      icon={ClipboardCheck}
      title="Attendance Center"
    >
      <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div className="grid place-items-center rounded-lg border border-[#111827]/10 bg-[#FFF7ED] p-4">
          <div
            className="grid size-36 place-items-center rounded-full"
            style={{ background: `conic-gradient(#F97316 0 ${overview.attendanceRate}%, #E5E7EB ${overview.attendanceRate}% 100%)` }}
          >
            <div className="grid size-28 place-items-center rounded-full bg-white text-center shadow-inner">
              <div>
                <p className="font-heading text-4xl font-bold leading-none text-[#111827]">{overview.attendanceRate}%</p>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">Kehadiran</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const Icon = item.icon

            return (
              <div key={item.label} className="grid grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-[#111827]/10 bg-[#FFFDF8] p-3">
                <span className="grid size-9 place-items-center rounded-lg bg-[#FFF7ED] text-[#F97316]">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-semibold text-[#111827]">{item.label}</span>
                <span className="font-heading text-2xl font-bold text-[#111827]">{item.value}</span>
              </div>
            )
          })}
        </div>
      </div>
    </Panel>
  )
}

function DivisionStructure({ stats }: { stats: DivisionStat[] }) {
  return (
    <Panel description="Struktur divisi otomatis mengikuti data panitia terbaru." icon={ShieldCheck} title="Struktur Divisi">
      <div className="grid max-h-[360px] gap-2 overflow-y-auto pr-1">
        {stats.map((item) => (
          <div key={item.division} className="rounded-lg border border-[#111827]/10 bg-[#FFFDF8] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#111827]">{item.division}</p>
                <p className="mt-1 text-xs font-medium text-[#6B7280]">{item.active} aktif dari {item.total} panitia</p>
              </div>
              <Badge className="rounded-md bg-[#FFF7ED] text-[#C2410C]">{item.tasksOpen} tugas</Badge>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Progress value={item.attendanceRate} className="h-2 bg-[#E5E7EB]" />
              <span className="w-10 text-right font-mono text-xs font-bold text-[#111827]">{item.attendanceRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function StaffDirectory({
  attendanceFilter,
  divisionFilter,
  filteredMembers,
  joinedFilter,
  members,
  query,
  roleFilter,
  roleOptions,
  statusFilter,
  onAttendanceFilter,
  onDivisionFilter,
  onJoinedFilter,
  onOpenDetail,
  onQuery,
  onResetFilter,
  onRoleFilter,
  onStatusFilter,
}: {
  attendanceFilter: string
  divisionFilter: string
  filteredMembers: CommitteeMember[]
  joinedFilter: string
  members: CommitteeMember[]
  query: string
  roleFilter: string
  roleOptions: string[]
  statusFilter: string
  onAttendanceFilter: (value: string) => void
  onDivisionFilter: (value: string) => void
  onJoinedFilter: (value: string) => void
  onOpenDetail: (memberId: string) => void
  onQuery: (value: string) => void
  onResetFilter: () => void
  onRoleFilter: (value: string) => void
  onStatusFilter: (value: string) => void
}) {
  const tableParentRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual is required for large committee tables.
  const rowVirtualizer = useVirtualizer({
    count: filteredMembers.length,
    estimateSize: () => 68,
    getScrollElement: () => tableParentRef.current,
    overscan: 8,
  })
  const virtualRows = rowVirtualizer.getVirtualItems()
  const topPadding = virtualRows[0]?.start ?? 0
  const bottomPadding = Math.max(
    rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end ?? 0),
    0,
  )

  return (
    <Panel
      action={<Badge className="rounded-md bg-[#FFF7ED] text-[#C2410C]">{filteredMembers.length} data</Badge>}
      description="Klik baris panitia untuk membuka profil, tugas, attendance, dan activity history."
      icon={Users}
      title="Tabel Panitia"
    >
      <div className="grid gap-3 border-b border-[#111827]/10 pb-4">
        <div className="grid gap-2 lg:grid-cols-[minmax(240px,1fr)_repeat(4,minmax(138px,0.45fr))_150px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={query}
              onChange={(item) => onQuery(item.target.value)}
              placeholder="Cari Nama Panitia"
              className="h-10 rounded-lg border-[#D6DCE5] bg-white pl-9 text-[#111827]"
            />
          </div>
          <SelectFilter label="Divisi" options={[ALL, ...officialDivisions]} value={divisionFilter} onChange={onDivisionFilter} />
          <SelectFilter label="Role" options={roleOptions} value={roleFilter} onChange={onRoleFilter} />
          <SelectFilter label="Status" options={[ALL, ...memberStatusOptions]} value={statusFilter} onChange={onStatusFilter} />
          <SelectFilter label="Attendance" options={[ALL, ...attendanceStatusOptions, ATTENDANCE_UNPUBLISHED]} value={attendanceFilter} onChange={onAttendanceFilter} />
          <label className="grid gap-1">
            <span className="sr-only">Tanggal Bergabung</span>
            <Input
              type="date"
              value={joinedFilter}
              onChange={(item) => onJoinedFilter(item.target.value)}
              className="h-10 rounded-lg border-[#D6DCE5] bg-white text-[#111827]"
            />
          </label>
          <Button variant="outline" className="h-10 rounded-lg border-[#D6DCE5] bg-white text-[#111827]" onClick={onResetFilter}>
            <RotateCcw data-icon="inline-start" />
            Reset Filter
          </Button>
        </div>
      </div>

      {members.length === 0 ? (
        <PremiumEmptyState />
      ) : filteredMembers.length === 0 ? (
        <PremiumEmptyState title="Filter tidak menemukan data panitia." />
      ) : (
        <>
          <div ref={tableParentRef} className="hidden max-h-[620px] overflow-auto md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-[#111827]/10 hover:bg-transparent">
                  {["Nama", "Divisi", "Jabatan", "Role", "Type", "Attendance", "Status", "Aksi"].map((heading) => (
                    <TableHead key={heading} className="px-4 text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
                      {heading}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPadding > 0 ? (
                  <TableRow aria-hidden="true">
                    <TableCell className="p-0" colSpan={8} style={{ height: topPadding }} />
                  </TableRow>
                ) : null}
                {virtualRows.map((virtualRow) => (
                  <PanitiaRow
                    key={filteredMembers[virtualRow.index]?.id ?? virtualRow.key}
                    member={filteredMembers[virtualRow.index]!}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
                {bottomPadding > 0 ? (
                  <TableRow aria-hidden="true">
                    <TableCell className="p-0" colSpan={8} style={{ height: bottomPadding }} />
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-2 md:hidden">
            {filteredMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onOpenDetail(member.id)}
                className="rounded-lg border border-[#111827]/10 bg-[#FFFDF8] p-3 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#111827]">{member.fullName}</p>
                    <p className="mt-1 text-xs font-medium text-[#6B7280]">{member.division} / {member.position}</p>
                  </div>
                  <StatusPill label={member.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill label={member.attendance.status} />
                  <Badge className="rounded-md bg-[#EFF6FF] text-[#2563EB]">{member.role}</Badge>
                  {member.committeeType === "supervisor" ? (
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2 py-0.5 text-[0.62rem] font-bold">
                      SUPERVISOR
                    </Badge>
                  ) : (
                    <Badge className="bg-green-50 text-green-700 border border-green-200 rounded-md px-2 py-0.5 text-[0.62rem] font-bold">
                      OPERATIONAL
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </Panel>
  )
}

const PanitiaRow = memo(function PanitiaRow({
  member,
  onOpenDetail,
}: {
  member: CommitteeMember
  onOpenDetail: (memberId: string) => void
}) {
  return (
    <TableRow
      className="cursor-pointer border-[#111827]/8 hover:bg-[#FFF7ED]"
      onClick={() => onOpenDetail(member.id)}
    >
      <TableCell className="px-4">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback className="bg-[#FFF7ED] text-xs font-bold text-[#C2410C]">{initials(member.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#111827]">{member.fullName}</p>
            <p className="truncate text-xs font-medium text-[#6B7280]">{member.internalId}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 text-sm font-semibold text-[#111827]">{member.division}</TableCell>
      <TableCell className="px-4 text-sm text-[#6B7280]">{member.position}</TableCell>
      <TableCell className="px-4 text-sm text-[#6B7280]">{member.role}</TableCell>
      <TableCell className="px-4">
        {member.committeeType === "supervisor" ? (
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2 py-0.5 text-[0.68rem] font-bold">
            SUPERVISOR
          </Badge>
        ) : (
          <Badge className="bg-green-50 text-green-700 border border-green-200 rounded-md px-2 py-0.5 text-[0.68rem] font-bold">
            OPERATIONAL
          </Badge>
        )}
      </TableCell>
      <TableCell className="px-4">
        <StatusPill label={member.attendance.status} />
      </TableCell>
      <TableCell className="px-4">
        <StatusPill label={member.status} />
      </TableCell>
      <TableCell className="px-4">
        <Button variant="ghost" size="icon-xs" className="text-[#6B7280] hover:bg-[#FFF7ED] hover:text-[#F97316]">
          <ChevronRight />
          <span className="sr-only">Buka detail panitia</span>
        </Button>
      </TableCell>
    </TableRow>
  )
})

function SupervisorBoard({ members }: { members: CommitteeMember[] }) {
  const supervisors = members.filter((m) => m.committeeType === "supervisor")

  return (
    <section className="rounded-lg border border-[#111827]/10 bg-white p-4 shadow-[var(--mcs-dash-shadow-soft)]">
      <div className="flex items-center gap-3 border-b border-[#111827]/10 pb-3 mb-4">
        <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-bold text-[#111827]">Pembina & Pengawas Resmi</h2>
          <p className="text-sm font-medium text-[#6B7280]">Daftar supervisor resmi penyelenggaraan MCS 1</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {supervisors.map((sv) => (
          <div key={sv.id} className="relative overflow-hidden rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading text-base font-bold text-[#111827]">{sv.fullName}</p>
                <p className="mt-1 text-sm font-medium text-[#6B7280]">{sv.position}</p>
              </div>
              <Badge className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-md px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider">
                SUPERVISOR
              </Badge>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-50 flex items-center justify-between text-xs text-blue-600 font-semibold">
              <span>Read Only</span>
              <span className="size-2 rounded-full bg-blue-500" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TaskAssignment({
  memberMap,
  tasks,
  onAddTask,
  onPriorityChange,
  onStatusChange,
}: {
  memberMap: Map<string, CommitteeMember>
  tasks: CommitteeTask[]
  onAddTask: () => void
  onPriorityChange: (taskId: string, priority: TaskPriority) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
}) {
  const operationalTasks = tasks.filter((task) => memberMap.get(task.picId)?.committeeType === "operational")

  return (
    <Panel
      action={
        <Button className="h-9 rounded-lg bg-[#F97316] text-white hover:bg-[#EA580C] shadow-none hover:translate-y-0" onClick={onAddTask}>
          <ClipboardList data-icon="inline-start" />
          Tambah Tugas
        </Button>
      }
      description="Assignment operasional dengan PIC, deadline, prioritas, dan status."
      icon={ListChecks}
      title="Task Assignment Management"
    >
      {operationalTasks.length === 0 ? (
        <PremiumEmptyState iconSet="tasks" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#111827]/10 hover:bg-transparent">
                {["Tugas", "PIC", "Deadline", "Prioritas", "Status"].map((heading) => (
                  <TableHead key={heading} className="px-4 text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
                    {heading}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {operationalTasks.map((task) => {
                const pic = memberMap.get(task.picId)

                return (
                  <TableRow key={task.id} className="border-[#111827]/8 hover:bg-[#FFF7ED]">
                    <TableCell className="px-4">
                      <div className="min-w-[220px]">
                        <p className="text-sm font-bold text-[#111827]">{task.title}</p>
                        <p className="mt-1 line-clamp-1 text-xs font-medium text-[#6B7280]">{task.description || EMPTY_COPY}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-sm font-semibold text-[#111827]">
                      {pic?.fullName ?? "PIC tidak tersedia"}
                    </TableCell>
                    <TableCell className="px-4 font-mono text-xs font-bold text-[#111827]">{formatDeadline(task.deadline)}</TableCell>
                    <TableCell className="px-4">
                      <select
                        value={task.priority}
                        onChange={(event) => onPriorityChange(task.id, event.target.value as TaskPriority)}
                        className="h-8 rounded-md border border-[#D6DCE5] bg-white px-2 text-xs font-bold text-[#111827] outline-none focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15"
                      >
                        {priorityOptions.map((priority) => (
                          <option key={priority} value={priority}>{priority}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="px-4">
                      <select
                        value={task.status}
                        onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}
                        className="h-8 rounded-md border border-[#D6DCE5] bg-white px-2 text-xs font-bold text-[#111827] outline-none focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15"
                      >
                        {taskStatusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Panel>
  )
}

function ActivityLog({ logs }: { logs: ActivityLogEntry[] }) {
  return (
    <Panel description="Semua aksi penting pada module panitia tercatat di sini." icon={Activity} title="Activity Log System">
      {logs.length === 0 ? (
        <PremiumEmptyState iconSet="activity" />
      ) : (
        <div className="grid max-h-[420px] gap-0 divide-y divide-[#111827]/10 overflow-y-auto pr-1">
          {logs.slice(0, 18).map((log) => (
            <div key={log.id} className="grid grid-cols-[78px_minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0">
              <div className="text-xs font-bold text-[#6B7280]">
                <p>{formatLogDate(log.date)}</p>
                <p className="font-mono">{formatLogTime(log.date)}</p>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={log.activity} />
                  <span className="text-xs font-semibold text-[#6B7280]">{log.user}</span>
                </div>
                <p className="mt-1 truncate text-sm font-bold text-[#111827]">{log.target}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

function MemberDialog({
  form,
  mode,
  open,
  onFormChange,
  onOpenChange,
  onSaveDraft,
  onSubmit,
}: {
  form: CommitteeFormState
  mode: "add" | "edit"
  open: boolean
  onFormChange: (form: CommitteeFormState) => void
  onOpenChange: (open: boolean) => void
  onSaveDraft: () => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mcs-dialog-panel max-h-[92vh] overflow-y-auto sm:max-w-3xl bg-white border border-[#E5E7EB] text-[#111827] p-0 rounded-[24px] overflow-hidden gap-0 shadow-[0_25px_60px_rgba(15,23,42,0.18)]">
        <DialogHeader className="bg-white border-b border-[#E5E7EB] p-5 flex flex-col gap-1.5">
          <DialogTitle className="text-[#111827] font-heading text-xl font-bold">{mode === "add" ? "Tambah Panitia Baru" : "Edit Panitia"}</DialogTitle>
          <DialogDescription className="text-[#6B7280] text-xs">Lengkapi profil panitia resmi untuk struktur operasional MCS.</DialogDescription>
        </DialogHeader>

        <div className="p-5 grid gap-4 sm:grid-cols-2">
          <Field label="Nama Lengkap" required>
            <Input className={dialogInputClass} value={form.fullName} onChange={(event) => onFormChange({ ...form, fullName: event.target.value })} />
          </Field>
          <Field label="NIS/NIP">
            <Input className={dialogInputClass} value={form.nisNip} onChange={(event) => onFormChange({ ...form, nisNip: event.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" className={dialogInputClass} value={form.email} onChange={(event) => onFormChange({ ...form, email: event.target.value })} />
          </Field>
          <Field label="Divisi">
            <NativeSelect options={officialDivisions} value={form.division} onChange={(value) => onFormChange({ ...form, division: value as OfficialDivision })} />
          </Field>
          <Field label="Jabatan">
            <Input className={dialogInputClass} value={form.position} onChange={(event) => onFormChange({ ...form, position: event.target.value })} />
          </Field>
          <Field label="Role">
            <Input className={dialogInputClass} value={form.role} onChange={(event) => onFormChange({ ...form, role: event.target.value })} />
          </Field>
          <Field label="Jenis Kelamin">
            <NativeSelect options={genderOptions} value={form.gender} onChange={(value) => onFormChange({ ...form, gender: value as Gender })} />
          </Field>
          <Field label="Nomor Identitas Internal">
            <Input className={`${dialogInputClass} font-mono`} value={form.internalId} readOnly aria-readonly="true" />
          </Field>
          <Field label="Status">
            <NativeSelect options={memberStatusOptions} value={form.status} onChange={(value) => onFormChange({ ...form, status: value as MemberStatus })} />
          </Field>
          <Field label="Tipe Kepanitiaan">
            <NativeSelect
              options={[
                { label: "Operational", value: "operational" },
                { label: "Supervisor", value: "supervisor" }
              ]}
              value={form.committeeType}
              onChange={(value) => onFormChange({ ...form, committeeType: value as CommitteeType })}
            />
          </Field>
        </div>

        <DialogFooter className="mcs-dialog-footer m-0 rounded-b-[24px] border-t border-[#E5E7EB] bg-[#F8FAFC] p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#334155] hover:translate-y-0 shadow-none" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="button" variant="outline" className="bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#334155] hover:translate-y-0 shadow-none" onClick={onSaveDraft}>
            <Save data-icon="inline-start" />
            Simpan Draft
          </Button>
          <Button type="button" className="bg-[#F97316] hover:bg-[#EA580C] text-white border-0 shadow-none hover:translate-y-0" onClick={onSubmit}>
            <UserPlus data-icon="inline-start" />
            {mode === "add" ? "Tambah Panitia" : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ImportDialog({
  fileInputRef,
  fileName,
  loading,
  open,
  preview,
  stats,
  templateLoading,
  onDownloadTemplate,
  onFile,
  onImport,
  onOpenChange,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>
  fileName: string
  loading: boolean
  open: boolean
  preview: ImportPreviewRow[]
  stats: { total: number; valid: number; errors: number; duplicates: number }
  templateLoading: boolean
  onDownloadTemplate: () => void
  onFile: (file: File) => void
  onImport: () => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mcs-dialog-panel max-h-[92vh] overflow-y-auto sm:max-w-4xl bg-white border border-[#E5E7EB] text-[#111827] p-0 rounded-[24px] overflow-hidden gap-0 shadow-[0_25px_60px_rgba(15,23,42,0.18)]">
        <DialogHeader className="bg-white border-b border-[#E5E7EB] p-5 flex flex-col gap-1.5">
          <DialogTitle className="text-[#111827] font-heading text-xl font-bold">Import Data Panitia</DialogTitle>
          <DialogDescription className="text-[#6B7280] text-xs">Gunakan template resmi, lalu upload file XLSX atau CSV untuk preview dan validasi.</DialogDescription>
        </DialogHeader>

        <div className="p-5 grid gap-4">
          <section className="rounded-lg border border-[#D6DCE5] bg-[#F8FAFC] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Download Template Excel</h3>
                <p className="mt-1 text-sm text-[#6B7280]">Kolom: Nama Lengkap, Divisi, Jabatan, Role, Email, Committee Type.</p>
              </div>
              <Button className="bg-[#F97316] hover:bg-[#EA580C] text-white border-0 shadow-none hover:translate-y-0" onClick={onDownloadTemplate} disabled={templateLoading}>
                {templateLoading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Download data-icon="inline-start" />}
                Download Template
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-[#D6DCE5] bg-[#F8FAFC] p-4">
            <h3 className="text-sm font-bold text-[#111827]">Upload File</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onFile(file)
              }}
            />
            <button
              type="button"
              className="mt-3 grid min-h-36 w-full place-items-center rounded-lg border border-dashed border-[#F97316]/45 bg-white p-5 text-center transition hover:border-[#F97316] hover:bg-[#F8FAFC] cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const file = event.dataTransfer.files[0]
                if (file) onFile(file)
              }}
            >
              <span className="grid gap-2 justify-items-center">
                {loading ? <Loader2 className="size-8 animate-spin text-[#F97316]" /> : <Upload className="size-8 text-[#F97316]" />}
                <span className="text-sm font-bold text-[#111827]">{fileName || "Drag & drop file XLSX / CSV di sini"}</span>
                <span className="text-xs font-medium text-[#6B7280]">Klik area ini untuk memilih file.</span>
              </span>
            </button>
          </section>

          <section className="rounded-lg border border-[#D6DCE5] bg-[#F8FAFC] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Preview Data</h3>
                <p className="mt-1 text-sm text-[#6B7280]">Validasi otomatis membaca error dan duplikat sebelum import.</p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <PreviewStat label="Total Data" value={stats.total} />
                <PreviewStat label="Data Valid" value={stats.valid} />
                <PreviewStat label="Data Error" value={stats.errors} />
                <PreviewStat label="Data Duplikat" value={stats.duplicates} />
              </div>
            </div>

            {preview.length > 0 ? (
              <div className="mt-4 max-h-56 overflow-auto rounded-lg border border-[#D6DCE5]">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-[#F8FAFC] text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280] border-b border-[#D6DCE5]">
                    <tr>
                      {["Nama Lengkap", "Divisi", "Jabatan", "Role", "Email", "Committee Type", "Status"].map((heading) => (
                        <th key={heading} className="px-3 py-2">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6DCE5] bg-white">
                    {preview.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2 font-semibold text-[#111827]">{row.fullName}</td>
                        <td className="px-3 py-2 text-[#6B7280]">{row.division}</td>
                        <td className="px-3 py-2 text-[#6B7280]">{row.position}</td>
                        <td className="px-3 py-2 text-[#6B7280]">{row.role}</td>
                        <td className="px-3 py-2 text-[#6B7280]">{row.email}</td>
                        <td className="px-3 py-2 text-[#6B7280]">{row.committeeType}</td>
                        <td className="px-3 py-2">
                          {row.errors.length > 0 ? (
                            <StatusPill label="Error" />
                          ) : row.duplicate ? (
                            <StatusPill label="Duplikat" />
                          ) : (
                            <StatusPill label="Valid" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <PremiumEmptyState iconSet="import" />
            )}
          </section>
        </div>

        <DialogFooter className="mcs-dialog-footer m-0 rounded-b-[24px] border-t border-[#E5E7EB] bg-[#F8FAFC] p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#334155] hover:translate-y-0 shadow-none" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="button" className="bg-[#F97316] hover:bg-[#EA580C] text-white border-0 shadow-none hover:translate-y-0" onClick={onImport} disabled={stats.valid === 0}>
            <Import data-icon="inline-start" />
            Import Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AttendanceDialog({
  form,
  members,
  open,
  onFormChange,
  onOpenChange,
  onSubmit,
}: {
  form: AttendanceFormState
  members: CommitteeMember[]
  open: boolean
  onFormChange: (form: AttendanceFormState) => void
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}) {
  const selectedMember = members.find((member) => member.id === form.memberId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mcs-dialog-panel max-h-[92vh] overflow-y-auto sm:max-w-2xl bg-white border border-[#E5E7EB] text-[#111827] p-0 rounded-[24px] overflow-hidden gap-0 shadow-[0_25px_60px_rgba(15,23,42,0.18)]">
        <DialogHeader className="bg-white border-b border-[#E5E7EB] p-5 flex flex-col gap-1.5">
          <DialogTitle className="text-[#111827] font-heading text-xl font-bold">Modal Attendance</DialogTitle>
          <DialogDescription className="text-[#6B7280] text-xs">Update status kehadiran, catatan, dan waktu check in / check out.</DialogDescription>
        </DialogHeader>
        <div className="p-5 grid gap-4 sm:grid-cols-2">
          <Field label="Nama">
            <NativeSelect options={members.map((member) => ({ label: member.fullName, value: member.id }))} value={form.memberId} onChange={(value) => onFormChange({ ...form, memberId: value })} />
          </Field>
          <Field label="Divisi">
            <Input className={dialogInputClass} value={selectedMember?.division ?? ""} readOnly />
          </Field>
          <Field label="Status Kehadiran">
            <NativeSelect options={attendanceStatusOptions} value={form.status} onChange={(value) => onFormChange({ ...form, status: value as AttendanceFormState["status"] })} />
          </Field>
          <Field label="Waktu Check In">
            <Input type="time" className={dialogInputClass} value={form.checkIn} onChange={(event) => onFormChange({ ...form, checkIn: event.target.value })} />
          </Field>
          <Field label="Waktu Check Out">
            <Input type="time" className={dialogInputClass} value={form.checkOut} onChange={(event) => onFormChange({ ...form, checkOut: event.target.value })} />
          </Field>
          <Field label="Catatan" className="sm:col-span-2">
            <Textarea className={dialogTextareaClass} value={form.note} onChange={(event) => onFormChange({ ...form, note: event.target.value })} />
          </Field>
        </div>
        <DialogFooter className="mcs-dialog-footer m-0 rounded-b-[24px] border-t border-[#E5E7EB] bg-[#F8FAFC] p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#334155] hover:translate-y-0 shadow-none" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="button" className="bg-[#F97316] hover:bg-[#EA580C] text-white border-0 shadow-none hover:translate-y-0" onClick={onSubmit}>
            <ClipboardCheck data-icon="inline-start" />
            Update Attendance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TaskDialog({
  form,
  members,
  open,
  onFormChange,
  onOpenChange,
  onSubmit,
}: {
  form: TaskFormState
  members: CommitteeMember[]
  open: boolean
  onFormChange: (form: TaskFormState) => void
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mcs-dialog-panel max-h-[92vh] overflow-y-auto sm:max-w-2xl bg-white border border-[#E5E7EB] text-[#111827] p-0 rounded-[24px] overflow-hidden gap-0 shadow-[0_25px_60px_rgba(15,23,42,0.18)]">
        <DialogHeader className="bg-white border-b border-[#E5E7EB] p-5 flex flex-col gap-1.5">
          <DialogTitle className="text-[#111827] font-heading text-xl font-bold">Modal Tambah Tugas</DialogTitle>
          <DialogDescription className="text-[#6B7280] text-xs">Assign tugas operasional ke PIC panitia aktif.</DialogDescription>
        </DialogHeader>
        <div className="p-5 grid gap-4 sm:grid-cols-2">
          <Field label="Nama Tugas" required>
            <Input className={dialogInputClass} value={form.title} onChange={(event) => onFormChange({ ...form, title: event.target.value })} />
          </Field>
          <Field label="PIC">
            <NativeSelect options={members.map((member) => ({ label: `${member.fullName} - ${member.division}`, value: member.id }))} value={form.picId} onChange={(value) => onFormChange({ ...form, picId: value })} />
          </Field>
          <Field label="Deadline">
            <Input type="datetime-local" className={dialogInputClass} value={form.deadline} onChange={(event) => onFormChange({ ...form, deadline: event.target.value })} />
          </Field>
          <Field label="Prioritas">
            <NativeSelect options={priorityOptions} value={form.priority} onChange={(value) => onFormChange({ ...form, priority: value as TaskPriority })} />
          </Field>
          <Field label="Deskripsi" className="sm:col-span-2">
            <Textarea className={dialogTextareaClass} value={form.description} onChange={(event) => onFormChange({ ...form, description: event.target.value })} />
          </Field>
        </div>
        <DialogFooter className="mcs-dialog-footer m-0 rounded-b-[24px] border-t border-[#E5E7EB] bg-[#F8FAFC] p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#334155] hover:translate-y-0 shadow-none" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="button" className="bg-[#F97316] hover:bg-[#EA580C] text-white border-0 shadow-none hover:translate-y-0" onClick={onSubmit}>
            <ClipboardList data-icon="inline-start" />
            Tambah Tugas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MemberDetailSheet({
  logs,
  member,
  open,
  tasks,
  onAssignTask,
  onDeactivate,
  onEdit,
  onOpenChange,
  onReset,
  onUpdateAttendance,
}: {
  logs: ActivityLogEntry[]
  member: CommitteeMember | null
  open: boolean
  tasks: CommitteeTask[]
  onAssignTask: (member: CommitteeMember) => void
  onDeactivate: (member: CommitteeMember) => void
  onEdit: (member: CommitteeMember) => void
  onOpenChange: (open: boolean) => void
  onReset: (member: CommitteeMember) => void
  onUpdateAttendance: (member: CommitteeMember) => void
}) {
  const assignedTasks = member ? tasks.filter((task) => task.picId === member.id || member.taskIds.includes(task.id)) : []
  const memberLogs = member
    ? logs.filter((log) => normalizeText(`${log.target} ${log.activity}`).includes(normalizeText(member.fullName))).slice(0, 8)
    : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[94vw] max-w-[520px] gap-0 overflow-y-auto border-[#111827]/10 bg-white p-0">
        {member ? (
          <>
            <SheetHeader className="border-b border-[#111827]/10 bg-[#FFF7ED] p-5 pr-12">
              <SheetTitle className="font-heading text-2xl font-bold text-[#111827]">Profil Panitia</SheetTitle>
              <SheetDescription>{member.fullName} / {member.division}</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 p-5">
              <div className="flex items-start gap-3">
                <Avatar size="lg">
                  <AvatarFallback className="bg-[#F97316] text-lg font-bold text-white">{initials(member.fullName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-[#111827]">{member.fullName}</h3>
                  <p className="mt-1 text-sm font-medium text-[#6B7280]">{member.position}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusPill label={member.status} />
                    {member.committeeType === "operational" && <StatusPill label={member.attendance.status} />}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 rounded-lg border border-[#111827]/10 bg-[#FFFDF8] p-4">
                <ProfileLine icon={ShieldCheck} label="Divisi" value={member.division} />
                <ProfileLine icon={IdCard} label="Jabatan" value={member.position} />
                <ProfileLine icon={UserCheck} label="Role" value={member.role} />
                <ProfileLine icon={Mail} label="Email" value={member.email || ATTENDANCE_UNPUBLISHED} />
                <ProfileLine icon={CalendarDays} label="Tanggal Bergabung" value={formatDate(member.joinedAt)} />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" className="justify-start" onClick={() => onEdit(member)}>
                  <Edit3 data-icon="inline-start" />
                  Edit Panitia
                </Button>
                {member.committeeType === "operational" && (
                  <Button variant="outline" className="justify-start" onClick={() => onAssignTask(member)}>
                    <ClipboardList data-icon="inline-start" />
                    Assign Tugas
                  </Button>
                )}
                {member.committeeType === "operational" && (
                  <Button variant="outline" className="justify-start" onClick={() => onUpdateAttendance(member)}>
                    <ClipboardCheck data-icon="inline-start" />
                    Update Attendance
                  </Button>
                )}
                <Button variant="outline" className="justify-start" onClick={() => onReset(member)}>
                  <RotateCcw data-icon="inline-start" />
                  Reset Data
                </Button>
                <Button
                  variant="destructive"
                  className="justify-start sm:col-span-2"
                  disabled={member.status === "Nonaktif"}
                  onClick={() => onDeactivate(member)}
                >
                  <Trash2 data-icon="inline-start" />
                  Nonaktifkan
                </Button>
              </div>

              {member.committeeType === "operational" && (
                <DetailBlock title="Attendance">
                  <div className="grid gap-2 text-sm">
                    <ProfileLine icon={ClipboardCheck} label="Status Kehadiran" value={member.attendance.status} />
                    <ProfileLine icon={CalendarDays} label="Check In" value={member.attendance.checkIn || ATTENDANCE_UNPUBLISHED} />
                    <ProfileLine icon={CalendarDays} label="Check Out" value={member.attendance.checkOut || ATTENDANCE_UNPUBLISHED} />
                    <p className="rounded-lg bg-[#FFF7ED] p-3 text-sm font-medium text-[#6B7280]">{member.attendance.note || EMPTY_COPY}</p>
                  </div>
                </DetailBlock>
              )}

              {member.committeeType === "operational" && (
                <DetailBlock title="Task Assignment">
                  {assignedTasks.length > 0 ? (
                    <div className="grid gap-2">
                      {assignedTasks.map((task) => (
                        <div key={task.id} className="rounded-lg border border-[#111827]/10 bg-[#FFFDF8] p-3">
                          <p className="text-sm font-bold text-[#111827]">{task.title}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <StatusPill label={task.priority} />
                            <StatusPill label={task.status} />
                            <Badge className="rounded-md bg-[#EFF6FF] text-[#2563EB]">{formatDeadline(task.deadline)}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <PremiumEmptyState iconSet="tasks" compact />
                  )}
                </DetailBlock>
              )}

              <DetailBlock title="Activity History">
                {memberLogs.length > 0 ? (
                  <div className="grid gap-2">
                    {memberLogs.map((log) => (
                      <div key={log.id} className="rounded-lg border border-[#111827]/10 bg-[#FFFDF8] p-3">
                        <div className="flex items-center justify-between gap-3 text-xs text-[#6B7280]">
                          <span>{formatLogDate(log.date)}</span>
                          <span>{formatLogTime(log.date)}</span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-[#111827]">{log.activity}</p>
                        <p className="text-xs font-medium text-[#6B7280]">{log.target}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <PremiumEmptyState iconSet="activity" compact />
                )}
              </DetailBlock>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function ConfirmDialog({ action, onOpenChange }: { action: ConfirmAction | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <DialogContent className="mcs-dialog-panel sm:max-w-md bg-white border border-[#E5E7EB] text-[#111827] p-0 rounded-[24px] overflow-hidden gap-0 shadow-[0_25px_60px_rgba(15,23,42,0.18)]">
        <DialogHeader className="bg-white border-b border-[#E5E7EB] p-5 flex flex-col gap-1.5">
          <DialogTitle className="text-[#111827] font-heading text-xl font-bold">{action?.title}</DialogTitle>
          <DialogDescription className="text-[#6B7280] text-xs">{action?.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mcs-dialog-footer m-0 rounded-b-[24px] border-t border-[#E5E7EB] bg-[#F8FAFC] p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#334155] hover:translate-y-0 shadow-none" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            type="button"
            className={cn(
              "border-0 shadow-none hover:translate-y-0 text-white",
              action?.variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-[#F97316] hover:bg-[#EA580C]"
            )}
            onClick={action?.onConfirm}
          >
            {action?.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ToastStack({ toasts }: { toasts: ToastMessage[] }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[80] grid w-[min(360px,calc(100vw-2rem))] gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-lg border bg-white p-3 text-sm font-semibold shadow-[var(--mcs-dash-shadow)]",
            toast.tone === "success" && "border-[#BBF7D0] text-[#166534]",
            toast.tone === "error" && "border-[#FECACA] text-[#B91C1C]",
            (toast.tone === "info" || toast.tone === "warning") && "border-[#FED7AA] text-[#C2410C]",
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}

function Panel({
  action,
  children,
  description,
  icon: Icon,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  description: string
  icon: LucideIcon
  title: string
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-[#111827]/10 bg-white shadow-[var(--mcs-dash-shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#111827]/10 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#FFF7ED] text-[#F97316]">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-bold text-[#111827]">{title}</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

function PremiumEmptyState({
  compact = false,
  iconSet = "default",
  title = EMPTY_COPY,
}: {
  compact?: boolean
  iconSet?: "default" | "tasks" | "activity" | "import"
  title?: string
}) {
  const icons = iconSet === "tasks" ? [ListChecks, ClipboardList, CheckCircle2] : iconSet === "activity" ? [Activity, ClipboardCheck, UserCheck] : [Users, ClipboardCheck, ListChecks]

  return (
    <div className={cn("grid place-items-center rounded-lg border border-dashed border-[#111827]/14 bg-[#FFFDF8] p-6 text-center", compact && "p-4")}>
      <div className="flex justify-center gap-2">
        {icons.map((Icon) => (
          <span key={Icon.displayName ?? Icon.name} className="grid size-10 place-items-center rounded-lg bg-[#FFF7ED] text-[#F97316]">
            <Icon className="size-5" />
          </span>
        ))}
      </div>
      <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-[#6B7280]">{title}</p>
    </div>
  )
}

function SelectFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-[#D6DCE5] bg-white pl-9 pr-8 text-sm font-semibold text-[#111827] outline-none focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <ChevronRight className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-[#6B7280]" />
    </label>
  )
}

function NativeSelect({
  options,
  value,
  onChange,
}: {
  options: readonly string[] | Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-lg border border-[#D6DCE5] bg-white px-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15"
    >
      {options.map((option) => {
        const normalized = typeof option === "string" ? { label: option, value: option } : option

        return (
          <option key={normalized.value} value={normalized.value}>{normalized.label}</option>
        )
      })}
    </select>
  )
}

function Field({
  children,
  className,
  label,
  required,
}: {
  children: ReactNode
  className?: string
  label: string
  required?: boolean
}) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
        {label} {required ? <span className="text-[#F97316]">*</span> : null}
      </span>
      {children}
    </label>
  )
}

function PreviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-20 rounded-lg border border-[#D6DCE5] bg-white px-3 py-2">
      <p className="font-heading text-xl font-bold leading-none text-[#111827]">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</p>
    </div>
  )
}

function DetailBlock({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-[#111827]/10 bg-white p-4">
      <h4 className="text-sm font-bold uppercase tracking-[0.08em] text-[#111827]">{title}</h4>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function ProfileLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[22px_120px_minmax(0,1fr)] items-center gap-2 text-sm">
      <Icon className="size-4 text-[#F97316]" />
      <span className="font-semibold text-[#6B7280]">{label}</span>
      <span className="truncate font-bold text-[#111827]">{value}</span>
    </div>
  )
}

function StatusPill({ label }: { label: string }) {
  return (
    <Badge className={cn("rounded-md px-2 py-0.5 text-[0.68rem] font-bold", statusClassName(label))}>
      {label}
    </Badge>
  )
}

function PanitiaSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="h-[260px] animate-pulse rounded-lg bg-[#E5E7EB]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg bg-[#E5E7EB]" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-lg bg-[#E5E7EB]" />
    </div>
  )
}

function createInitialState(operatorName: string): StoredState {
  const now = new Date().toISOString()
  const members = officialCommitteeMembers.map<CommitteeMember>((member) => ({
    id: createId("panitia"),
    fullName: member.name,
    nisNip: "",
    email: member.email,
    division: toOfficialDivision(member.division),
    position: member.position,
    role: member.role,
    gender: "Tidak Diisi",
    internalId: createInternalId(member.name),
    status: "Aktif",
    committeeType: member.committeeType,
    joinedAt: getJakartaDateInputValue(),
    attendance: {
      status: ATTENDANCE_UNPUBLISHED,
      note: "",
      checkIn: "",
      checkOut: "",
      updatedAt: now,
    },
    taskIds: [],
    createdAt: now,
    updatedAt: now,
  }))

  return {
    members,
    tasks: [],
    logs: [createActivity(operatorName, "Module Panitia Siap", `${members.length} data panitia resmi dimuat`, "info")],
  }
}

function createEmptyMemberForm(): CommitteeFormState {
  return {
    fullName: "",
    nisNip: "",
    email: "",
    division: "Sie. Acara",
    position: "",
    role: "Staff",
    gender: "Tidak Diisi",
    internalId: "",
    status: "Aktif",
    committeeType: "operational",
  }
}

function createEmptyAttendanceForm(memberId: string): AttendanceFormState {
  return {
    memberId,
    status: "Hadir",
    note: "",
    checkIn: getJakartaTimeInputValue(),
    checkOut: "",
  }
}

function createEmptyTaskForm(picId: string): TaskFormState {
  return {
    title: "",
    picId,
    deadline: `${getJakartaDateInputValue()}T15:00`,
    priority: "Sedang",
    description: "",
  }
}

function createDivisionStats(members: CommitteeMember[], tasks: CommitteeTask[]): DivisionStat[] {
  return officialDivisions.map((division) => {
    const scopedMembers = members.filter((member) => member.division === division && member.committeeType === "operational")
    const publishedAttendance = scopedMembers.filter((member) => member.attendance.status !== ATTENDANCE_UNPUBLISHED).length
    const hadir = scopedMembers.filter((member) => member.attendance.status === "Hadir").length
    const onDuty = scopedMembers.filter((member) => member.attendance.status === "On Duty").length
    const absent = scopedMembers.filter((member) => ["Izin", "Sakit", "Alpha"].includes(member.attendance.status)).length

    return {
      division,
      total: scopedMembers.length,
      active: scopedMembers.filter((member) => member.status === "Aktif").length,
      hadir,
      onDuty,
      absent,
      tasksOpen: tasks.filter((task) => task.division === division && task.status !== "Selesai").length,
      attendanceRate: publishedAttendance === 0 ? 0 : Math.round(((hadir + onDuty) / publishedAttendance) * 100),
    }
  }).filter((d) => d.division !== "Penanggung Jawab" || d.total > 0)
}

function createImportPreview(rows: Array<Record<string, string>>, members: CommitteeMember[]) {
  const existing = new Set(members.map((member) => normalizeText(member.fullName)))
  const existingEmails = new Set(members.map((member) => normalizeText(member.email)).filter(Boolean))
  const seen = new Set<string>()

  return rows.map<ImportPreviewRow>((row, index) => {
    const fullName = readImportCell(row, ["Nama Lengkap", "nama lengkap", "Nama", "name"])
    const rawDivision = readImportCell(row, ["Divisi", "division"])
    const division = normalizeImportDivision(rawDivision)
    const position = readImportCell(row, ["Jabatan", "position"])
    const role = readImportCell(row, ["Role", "role"])
    const email = readImportCell(row, ["Email", "email"])
    const committeeType = readImportCell(row, ["Committee Type", "committee type", "Tipe", "type"])
    const normalizedCommitteeType =
      division === "Penanggung Jawab" && normalizeText(committeeType) === "core committee"
        ? "supervisor"
        : normalizeCommitteeType(committeeType)
    const errors: string[] = []

    if (!fullName) errors.push("Nama Lengkap wajib diisi")
    if (!role) errors.push("Role wajib diisi")
    if (!normalizedCommitteeType) errors.push("Committee Type wajib diisi")
    if (!division) errors.push("Divisi tidak valid")
    if (email && !isValidEmail(email)) errors.push("Email tidak valid")

    const signature = normalizeText(fullName)
    const duplicate = Boolean(
      signature &&
      (existing.has(signature) || seen.has(signature) || (email && existingEmails.has(normalizeText(email)))),
    )
    if (signature) seen.add(signature)

    return {
      id: `preview-${index}`,
      fullName,
      division,
      position,
      role,
      email,
      committeeType: normalizedCommitteeType ?? committeeType,
      errors,
      duplicate,
    }
  })
}

function normalizeStoredMembers(members: Partial<CommitteeMember>[]): CommitteeMember[] {
  return members
    .filter((member): member is Partial<CommitteeMember> & { id: string } => Boolean(member.id))
    .map((member) => ({
      id: member.id,
      fullName: member.fullName ?? "",
      nisNip: member.nisNip ?? "",
      email: member.email ?? "",
      division: isOfficialDivision(member.division) ? member.division : "Sie. Acara",
      position: member.position ?? "Staff",
      role: member.role ?? "Staff",
      gender: isGender(member.gender) ? member.gender : "Tidak Diisi",
      internalId: member.internalId ?? createInternalId(member.fullName ?? "panitia"),
      status: isMemberStatus(member.status) ? member.status : "Aktif",
      committeeType: normalizeCommitteeType(member.committeeType) || "operational",
      joinedAt: member.joinedAt ?? getJakartaDateInputValue(),
      attendance: {
        status: isAttendanceStatus(member.attendance?.status) ? member.attendance.status : ATTENDANCE_UNPUBLISHED,
        note: member.attendance?.note ?? "",
        checkIn: member.attendance?.checkIn ?? "",
        checkOut: member.attendance?.checkOut ?? "",
        updatedAt: member.attendance?.updatedAt ?? new Date().toISOString(),
      },
      taskIds: Array.isArray(member.taskIds) ? member.taskIds : [],
      createdAt: member.createdAt ?? new Date().toISOString(),
      updatedAt: member.updatedAt ?? new Date().toISOString(),
    }))
}

function normalizeCommitteeType(value: unknown): CommitteeType | "" {
  const normalized = normalizeText(value)
  if (normalized === "supervisor") return "supervisor"
  if (normalized === "core committee") return "operational"
  if (normalized === "division committee") return "operational"
  if (normalized === "competition committee") return "operational"
  if (normalized === "operational committee") return "operational"
  if (normalized === "operational" || normalized === "operasional") return "operational"

  return ""
}

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return value === ATTENDANCE_UNPUBLISHED || attendanceStatusOptions.includes(value as (typeof attendanceStatusOptions)[number])
}

function isGender(value: unknown): value is Gender {
  return genderOptions.includes(value as Gender)
}

function isMemberStatus(value: unknown): value is MemberStatus {
  return memberStatusOptions.includes(value as MemberStatus)
}

function applyWorksheetStyle(worksheet: import("xlsx-js-style").WorkSheet, rows: unknown[][], headerRowIndex: number) {
  const range = worksheet["!ref"]
  if (!range) return
  const decoded = decodeWorksheetRange(range)

  for (let row = decoded.startRow; row <= decoded.endRow; row += 1) {
    for (let column = decoded.startColumn; column <= decoded.endColumn; column += 1) {
      const ref = encodeCell(row, column)
      const cell = worksheet[ref] as { s?: unknown } | undefined
      if (!cell) continue

      const isHeader = row === headerRowIndex
      cell.s = {
        alignment: { vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
        },
        fill: isHeader ? { fgColor: { rgb: "F97316" }, patternType: "solid" } : undefined,
        font: isHeader ? { bold: true, color: { rgb: "FFFFFF" } } : { color: { rgb: "111827" } },
      }
    }
  }

  rows.slice(0, headerRowIndex).forEach((_, index) => {
    const firstCell = worksheet[encodeCell(index, 0)] as { s?: unknown } | undefined
    if (firstCell) {
      firstCell.s = {
        fill: { fgColor: { rgb: "081C3A" }, patternType: "solid" },
        font: { bold: true, color: { rgb: "FFFFFF" } },
      }
    }
  })
}

function fitColumns(rows: unknown[][]) {
  const columnCount = Math.max(...rows.map((row) => row.length), 1)

  return Array.from({ length: columnCount }).map((_, column) => {
    const width = rows.reduce((max, row) => Math.max(max, String(row[column] ?? "").length), 10)

    return { wch: Math.min(Math.max(width + 2, 12), 42) }
  })
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  const [headerLine, ...dataLines] = lines
  if (!headerLine) return []

  const headers = parseCsvLine(headerLine)

  return dataLines.map((line) => {
    const values = parseCsvLine(line)

    return headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = values[index] ?? ""
      return record
    }, {})
  })
}

function parseCsvLine(line: string) {
  const values: string[] = []
  let current = ""
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === "\"" && quoted && nextChar === "\"") {
      current += "\""
      index += 1
      continue
    }

    if (char === "\"") {
      quoted = !quoted
      continue
    }

    if (char === "," && !quoted) {
      values.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function readImportCell(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null) return String(value).trim()
  }

  const normalizedKeys = new Map(Object.keys(row).map((key) => [normalizeText(key), key]))
  for (const key of keys) {
    const actualKey = normalizedKeys.get(normalizeText(key))
    if (actualKey) return String(row[actualKey] ?? "").trim()
  }

  return ""
}

function toOfficialDivision(value: string): OfficialDivision {
  const normalizedImportDivision = normalizeImportDivision(value)
  if (normalizedImportDivision) return normalizedImportDivision
  if (isOfficialDivision(value)) return value
  const normalized = value.replace(/^Sie\.\s*/i, "").trim().toLowerCase()
  const match = officialDivisions.find((division) => division.toLowerCase().includes(normalized))

  return match ?? "Sie. Acara"
}

function normalizeImportDivision(value: unknown): OfficialDivision | "" {
  if (isOfficialDivision(value)) return value

  const normalized = normalizeText(value)
  const aliases: Record<string, OfficialDivision> = {
    "kepanitiaan inti": "Ketua Pelaksana",
    kesekretariatan: "Sekretaris",
    sekretariat: "Sekretaris",
    keuangan: "Bendahara",
    "sie acara": "Sie. Acara",
    "sie humas": "Sie. Humas",
    "sie dokumentasi": "Sie. Dokumentasi",
    "sie kebersihan": "Sie. Kebersihan",
    "pj mobile legends": "PJ Mobile Legends",
    "pj futsal putra": "PJ Futsal Putra",
    "pj basket putra": "PJ Basket Putra",
    "pj voli putra": "PJ Voli Putra",
    "pj badminton ganda putra": "PJ Badminton Ganda Putra",
    "pj solo vokal": "PJ Solo Vokal",
    "pj canvas drawing": "PJ Canvas Drawing",
    "pj best news card": "PJ Best News Card",
    "pj best news video": "PJ Best News Video",
  }

  return aliases[normalized] ?? ""
}

function isOfficialDivision(value: unknown): value is OfficialDivision {
  return officialDivisions.includes(value as OfficialDivision)
}

function statusClassName(label: string) {
  if (label === "Aktif" || label === "Hadir" || label === "On Duty" || label === "Selesai" || label === "Valid") {
    return "bg-[#F0FDF4] text-[#166534]"
  }

  if (label === "Nonaktif" || label === "Alpha" || label === "Terlambat" || label === "Critical" || label === "Error") {
    return "bg-[#FEF2F2] text-[#B91C1C]"
  }

  if (label === "Izin" || label === "Sakit" || label === "Tinggi" || label === "Sedang" || label === "Diproses" || label === "Revisi" || label === "Duplikat") {
    return "bg-[#FFFBEB] text-[#92400E]"
  }

  if (label === ATTENDANCE_UNPUBLISHED) {
    return "bg-[#F3F4F6] text-[#4B5563]"
  }

  return "bg-[#EFF6FF] text-[#2563EB]"
}

function metricIconClass(tone: "navy" | "gold" | "green" | "orange" | "red") {
  const classes = {
    gold: "bg-[#FFFBEB] text-[#92400E]",
    green: "bg-[#F0FDF4] text-[#166534]",
    navy: "bg-[#081C3A] text-white",
    orange: "bg-[#FFF7ED] text-[#F97316]",
    red: "bg-[#FEF2F2] text-[#B91C1C]",
  }

  return classes[tone]
}

function createActivity(user: string, activity: string, target: string, tone: ToastTone): ActivityLogEntry {
  return {
    id: createId("activity"),
    date: new Date().toISOString(),
    user,
    activity,
    target,
    tone,
  }
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function createInternalId(name: string) {
  const suffix = normalizeText(name).replace(/\s+/g, "-").slice(0, 18) || "panitia"

  return `MCS-PAN-${suffix}-${Date.now().toString(36).slice(-4)}`.toUpperCase()
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ")
}

// Unique filter
function unique<T>(items: T[]) {
  return Array.from(new Set(items))
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function getJakartaDateInputValue(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).formatToParts(value)
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "01"

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`
}

function getJakartaTimeInputValue(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).formatToParts(value)
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "00"

  return `${getPart("hour")}:${getPart("minute")}`
}

function formatDate(value: string) {
  if (!value) return ATTENDANCE_UNPUBLISHED

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+07:00`))
}

function formatLogDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))
}

function formatLogTime(value: string) {
  return `${new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))} WIB`
}

function formatDeadline(value: string) {
  if (!value) return ATTENDANCE_UNPUBLISHED
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(parsed)
}

async function downloadServerExport(
  type: ExportType,
  payload: {
    columns: Array<{ key: string; label: string }>
    filename: string
    rows: Array<Record<string, unknown>>
    title: string
  },
) {
  const endpoint = type === "xlsx" ? "excel" : type
  const extension = type === "xlsx" ? "xlsx" : type
  const response = await fetch(`/api/export/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error("Export request failed")
  }

  const blob = await response.blob()
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = href
  anchor.download = `${payload.filename}.${extension}`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(href), 0)
}

function encodeCell(row: number, column: number) {
  let dividend = column + 1
  let columnName = ""

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26
    columnName = String.fromCharCode(65 + modulo) + columnName
    dividend = Math.floor((dividend - modulo) / 26)
  }

  return `${columnName}${row + 1}`
}

function decodeWorksheetRange(range: string) {
  const [start, end] = range.split(":")
  const startCell = decodeCell(start)
  const endCell = decodeCell(end ?? start)

  return {
    startColumn: startCell.column,
    startRow: startCell.row,
    endColumn: endCell.column,
    endRow: endCell.row,
  }
}

function decodeCell(ref: string) {
  const match = /^([A-Z]+)(\d+)$/.exec(ref)
  if (!match) return { column: 0, row: 0 }

  const column = match[1].split("").reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) - 1
  const row = Number(match[2]) - 1

  return { column, row }
}
