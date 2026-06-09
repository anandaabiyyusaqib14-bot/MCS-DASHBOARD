"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Download,
  Filter,
  Home,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Menu,
  MoreVertical,
  Plus,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react"

import { BrandMark } from "@/components/brand/brand-mark"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { dashboardFootage, event } from "@/data/mcs"
import {
  activityItems,
  panitiaDivisions,
  panitiaTasks,
  staffMembers,
  type ActivityItem,
  type AttendanceStatus,
  type PanitiaDivision,
  type PanitiaTask,
  type TaskPriority,
  type TaskStatus,
} from "@/data/panitia"
import { cn } from "@/lib/utils"

const divisionIconMap: Record<string, LucideIcon> = {
  Acara: CalendarDays,
  Humas: Megaphone,
  Dokumentasi: Camera,
  Keamanan: ShieldCheck,
  Perlengkapan: ClipboardList,
  Kebersihan: CheckCircle2,
  Kewirausahaan: BarChart3,
  "PJ Lomba": Trophy,
}

const sidebarGroups = [
  {
    label: "Kepanitiaan",
    items: [
      { label: "Data Panitia", icon: Users, href: "/dashboard/panitia-management", active: true },
      { label: "Ringkasan", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Manajemen Lomba", icon: Trophy, href: "/dashboard/tournament" },
      { label: "Pertandingan Live", icon: Radio, href: "/dashboard/live-match", badge: "Live" },
      { label: "Jadwal", icon: CalendarDays, href: "#" },
    ],
  },
  {
    label: "Divisions",
    items: panitiaDivisions.map((division) => ({
      label: division.name,
      icon: divisionIconMap[division.name] ?? ShieldCheck,
      href: `#${division.id}`,
    })),
  },
  {
    label: "Kontrol",
    items: [
      { label: "Kehadiran", icon: ClipboardCheck, href: "#attendance" },
      { label: "Tugas", icon: ListChecks, href: "#tasks" },
      { label: "Aktivitas", icon: Activity, href: "#activity" },
      { label: "Pengaturan", icon: Settings, href: "#" },
    ],
  },
]

const mobileNavItems = [
  { label: "Ringkasan", icon: Home, href: "/dashboard" },
  { label: "Lomba", icon: Trophy, href: "/dashboard/tournament" },
  { label: "Live", icon: Radio, href: "/dashboard/live-match" },
  { label: "Panitia", icon: Users, href: "/dashboard/panitia-management", active: true },
]

const attendanceLabels: Record<AttendanceStatus, string> = {
  Present: "Hadir",
  Late: "Terlambat",
  Absent: "Tidak Hadir",
  Excused: "Izin",
}

const taskStatusLabels: Record<TaskStatus, string> = {
  "In Progress": "Diproses",
  Scheduled: "Terjadwal",
  Completed: "Selesai",
  Blocked: "Tertunda",
}

const attendanceOptions = ["All Attendance", "Present", "Late", "Absent", "Excused"]
const taskOptions = ["All Tasks", "In Progress", "Scheduled", "Completed", "Blocked"]
const roleOptions = ["All Roles", "Division Coordinator", "PJ Lomba", "Staff"]
const divisionOptions = ["All Divisions", ...panitiaDivisions.map((division) => division.name)]

const statusClasses: Record<AttendanceStatus, string> = {
  Present: "bg-[rgba(72,199,142,0.16)] text-[#8ce6b5]",
  Late: "bg-[rgba(245,158,11,0.16)] text-[#f9c46a]",
  Absent: "bg-[rgba(255,77,84,0.16)] text-[#ff9ca0]",
  Excused: "bg-white/10 text-white/62",
}

const taskStatusClasses: Record<TaskStatus, string> = {
  "In Progress": "bg-[rgba(225,180,81,0.16)] text-[color:var(--mcs-gold-soft)]",
  Scheduled: "bg-[rgba(100,181,246,0.15)] text-[#9fd4ff]",
  Completed: "bg-[rgba(72,199,142,0.16)] text-[#8ce6b5]",
  Blocked: "bg-[rgba(255,77,84,0.16)] text-[#ff9ca0]",
}

const priorityClasses: Record<TaskPriority, string> = {
  High: "bg-[rgba(195,38,45,0.18)] text-[#ff9ca0]",
  Medium: "bg-[rgba(225,180,81,0.16)] text-[color:var(--mcs-gold-soft)]",
  Low: "bg-white/10 text-white/56",
}

const activityToneClasses: Record<ActivityItem["tone"], string> = {
  success: "bg-[rgba(72,199,142,0.18)] text-[#8ce6b5]",
  warning: "bg-[rgba(245,158,11,0.18)] text-[#f9c46a]",
  danger: "bg-[rgba(255,77,84,0.18)] text-[#ff9ca0]",
  info: "bg-[rgba(100,181,246,0.16)] text-[#9fd4ff]",
}

export function PanitiaManagementScreen() {
  const [query, setQuery] = useState("")
  const [divisionFilter, setDivisionFilter] = useState("All Divisions")
  const [roleFilter, setRoleFilter] = useState("All Roles")
  const [attendanceFilter, setAttendanceFilter] = useState("All Attendance")
  const [taskFilter, setTaskFilter] = useState("All Tasks")
  const [tasks, setTasks] = useState<PanitiaTask[]>(panitiaTasks)
  const [feed, setFeed] = useState<ActivityItem[]>(activityItems)
  const [selectedDivisionId, setSelectedDivisionId] = useState(panitiaDivisions[0].id)
  const [detailOpen, setDetailOpen] = useState(false)

  const selectedDivision =
    panitiaDivisions.find((division) => division.id === selectedDivisionId) ?? panitiaDivisions[0]

  const overview = useMemo(() => {
    const totalPanitia = panitiaDivisions.reduce((total, division) => total + division.members, 0)
    const present = panitiaDivisions.reduce((total, division) => total + division.present, 0)
    const late = panitiaDivisions.reduce((total, division) => total + division.late, 0)
    const absent = panitiaDivisions.reduce((total, division) => total + division.absent, 0)
    const excused = panitiaDivisions.reduce((total, division) => total + division.excused, 0)
    const activeToday = present + late + excused
    const pendingTasks = tasks.filter((task) => task.status !== "Completed").length
    const attendanceRate = Math.round((present / Math.max(totalPanitia, 1)) * 100)

    return {
      totalPanitia,
      activeToday,
      present,
      late,
      absent,
      excused,
      activeDivisions: panitiaDivisions.length,
      pendingTasks,
      attendanceRate,
    }
  }, [tasks])

  const filteredStaff = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return staffMembers.filter((member) => {
      const matchesDivision = divisionFilter === "All Divisions" || member.division === divisionFilter
      const matchesRole = roleFilter === "All Roles" || member.role === roleFilter
      const matchesAttendance = attendanceFilter === "All Attendance" || member.attendance === attendanceFilter
      const matchesTask = taskFilter === "All Tasks" || member.taskStatus === taskFilter
      const searchable = [
        member.name,
        member.division,
        member.position,
        member.role,
        member.currentTask,
        member.contact,
      ]
        .join(" ")
        .toLowerCase()

      return matchesDivision && matchesRole && matchesAttendance && matchesTask && searchable.includes(normalized)
    })
  }, [attendanceFilter, divisionFilter, query, roleFilter, taskFilter])

  function openDivision(divisionId: string) {
    setSelectedDivisionId(divisionId)
    setDetailOpen(true)
  }

function assignTask() {
    const nextTask: PanitiaTask = {
      id: `task-${Date.now()}`,
      title: "Validasi kebutuhan lapangan final",
      pic: selectedDivision.coordinator,
      division: selectedDivision.name,
      deadline: "15:30",
      progress: 12,
      priority: "High",
      status: "Scheduled",
    }

    const nextActivity: ActivityItem = {
      id: `activity-${Date.now()}`,
      time: "Sekarang",
      title: `${selectedDivision.name} menerima tugas baru`,
      detail: "Super Admin menugaskan tindak lanjut kesiapan divisi.",
      division: selectedDivision.name,
      tone: "info",
    }

    setTasks((current) => [nextTask, ...current])
    setFeed((current) => [nextActivity, ...current].slice(0, 7))
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_22%_-8%,rgba(195,38,45,0.14),transparent_30%),linear-gradient(180deg,#050b14,#07111d_48%,#040810)] text-foreground">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[268px] border-r border-white/10 bg-[rgba(4,10,18,0.97)] lg:flex lg:flex-col">
          <PanitiaSidebar activeDivisionId={selectedDivisionId} onDivisionSelect={openDivision} />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[268px]">
          <PanitiaTopBar />

          <main className="flex-1 overflow-x-hidden p-3 pb-24 sm:p-4 lg:pb-5 xl:p-5">
            <div className="mx-auto grid w-full max-w-[1780px] min-w-0 gap-3">
              <CommandHeader onAssignTask={assignTask} />
              <PanitiaOverview overview={overview} />

              <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.62fr)_minmax(340px,0.66fr)]">
                <DivisionOverview divisions={panitiaDivisions} onOpenDivision={openDivision} />
                <AttendanceMonitoring overview={overview} />
                <OperationalFeed feed={feed} />
              </section>

              <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.16fr)_minmax(430px,0.84fr)]">
                <StaffDirectory
                  attendanceFilter={attendanceFilter}
                  divisionFilter={divisionFilter}
                  filteredStaff={filteredStaff}
                  query={query}
                  roleFilter={roleFilter}
                  taskFilter={taskFilter}
                  onAttendanceFilter={setAttendanceFilter}
                  onDivisionFilter={setDivisionFilter}
                  onOpenDivision={openDivision}
                  onQuery={setQuery}
                  onRoleFilter={setRoleFilter}
                  onTaskFilter={setTaskFilter}
                />
                <TaskManagement tasks={tasks} onAssignTask={assignTask} />
              </section>

              <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.42fr)]">
                <DivisionPerformance divisions={panitiaDivisions} onOpenDivision={openDivision} />
                <SuperAdminPanel onAssignTask={assignTask} />
              </section>
            </div>
          </main>
        </div>
      </div>

      <DivisionDetailSheet
        division={selectedDivision}
        members={staffMembers.filter((member) => member.division === selectedDivision.name)}
        open={detailOpen}
        tasks={tasks.filter((task) => task.division === selectedDivision.name)}
        onAssignTask={assignTask}
        onOpenChange={setDetailOpen}
      />

      <MobileBottomNav />
    </div>
  )
}

function PanitiaSidebar({
  activeDivisionId,
  onDivisionSelect,
}: {
  activeDivisionId: string
  onDivisionSelect: (divisionId: string) => void
}) {
  const totalPanitia = panitiaDivisions.reduce((total, division) => total + division.members, 0)
  const readiness = Math.round(
    panitiaDivisions.reduce((total, division) => total + division.completion, 0) / Math.max(panitiaDivisions.length, 1),
  )

  return (
    <>
      <div className="border-b border-white/10 px-4 py-5">
        <BrandMark />
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="font-sport text-xs font-black uppercase tracking-[0.18em] text-white/50">
            Data Panitia
          </p>
          <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[color:var(--mcs-gold-soft)]">
            Tampilan Super Admin
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        {sidebarGroups.map((group) => (
          <div key={group.label} className="grid gap-1">
            <p className="px-3 pb-1 font-sport text-[0.62rem] font-black uppercase tracking-[0.2em] text-white/38">
              {group.label === "Divisions" ? "Divisi" : group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon
              const division = panitiaDivisions.find((entry) => entry.name === item.label)
              const isDivisionActive = division?.id === activeDivisionId

              if (division) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onDivisionSelect(division.id)}
                    className={cn(
                      "grid h-10 grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-transparent px-3 text-left text-sm font-semibold text-white/64 transition hover:border-white/8 hover:bg-white/7 hover:text-white",
                      isDivisionActive &&
                        "border-white/10 bg-[rgba(195,38,45,0.16)] text-white shadow-[inset_3px_0_0_var(--mcs-red)]"
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="truncate">{item.label}</span>
                    <span className="font-mono text-[0.64rem] text-white/38">{division.members}</span>
                  </button>
                )
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "grid h-10 grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-transparent px-3 text-left text-sm font-semibold text-white/64 transition hover:border-white/8 hover:bg-white/7 hover:text-white",
                    item.active &&
                      "border-white/10 bg-[rgba(195,38,45,0.22)] text-white shadow-[inset_3px_0_0_var(--mcs-red)]"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="truncate">{item.label}</span>
                  {"badge" in item && item.badge ? (
                    <span className="rounded-sm bg-[rgba(195,38,45,0.18)] px-1.5 py-0.5 font-sport text-[0.56rem] font-black uppercase text-[#ff9ca0]">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-3xl leading-none text-[color:var(--mcs-gold-soft)]">{totalPanitia}</p>
              <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/50">
                Panitia Terdaftar
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-md bg-[rgba(72,199,142,0.14)] text-[#8ce6b5]">
              <UserCheck className="size-4" />
            </span>
          </div>
          <div className="mt-3 border-t border-white/10 pt-3">
            <div className="mb-2 flex items-center justify-between text-xs text-white/50">
              <span>Kesiapan Panitia</span>
              <span>{readiness}%</span>
            </div>
            <Progress value={readiness} className="h-2 bg-white/10" />
          </div>
        </div>
      </div>
    </>
  )
}

function PanitiaTopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07111d]/96 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-[1780px] items-center justify-between gap-3 px-3 py-2 sm:px-4 xl:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 lg:hidden"
                />
              }
            >
              <Menu />
              <span className="sr-only">Buka navigasi panitia</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-[292px] border-white/10 bg-[#050c15] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigasi panitia</SheetTitle>
                <SheetDescription>Navigasi manajemen kepanitiaan MCS 1</SheetDescription>
              </SheetHeader>
              <PanitiaSidebar activeDivisionId="acara" onDivisionSelect={() => undefined} />
            </SheetContent>
          </Sheet>

          <div className="hidden lg:block">
            <p className="font-display text-4xl leading-none text-white">Data Panitia</p>
            <p className="max-w-[360px] truncate font-sport text-xs font-bold uppercase tracking-[0.14em] text-white/55">
              {event.name} - Sistem Kepanitiaan
            </p>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <BrandMark compact />
            <div className="min-w-0">
              <p className="truncate font-sport text-base font-black text-white">Data Panitia</p>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--mcs-red)]">
                <span className="size-2 rounded-full bg-[color:var(--mcs-red)]" />
                Kegiatan
              </p>
            </div>
          </div>
        </div>

        <div className="hidden shrink-0 items-stretch border-x border-white/10 xl:flex">
          <div className="flex items-center gap-3 border-r border-white/10 px-5">
            <span className="size-2 rounded-full bg-[#48c78e]" />
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">Status</p>
              <p className="font-sport text-sm font-black uppercase text-[#8ce6b5]">Pantau</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5">
            <Clock3 className="size-4 text-[color:var(--mcs-gold-soft)]" />
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/50">Zona Waktu</p>
              <p className="font-mono text-sm font-black text-white">WIB</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="lg"
            className="hidden h-9 rounded-md border-white/12 bg-white/5 font-sport text-xs font-black uppercase text-white/78 hover:bg-white/10 hover:text-white md:inline-flex"
          >
            <Download data-icon="inline-start" />
            Ekspor
          </Button>
          <Button
            size="lg"
            className="hidden h-9 rounded-md bg-[color:var(--mcs-red)] font-sport text-xs font-black uppercase text-white hover:bg-[color:var(--mcs-red-dark)] sm:inline-flex"
          >
            <UserPlus data-icon="inline-start" />
            Tambah Panitia
          </Button>
          <Button variant="ghost" size="icon" className="relative text-white/72 hover:bg-white/10 hover:text-white">
            <Bell />
            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[color:var(--mcs-red)] text-[0.62rem] font-black text-white">
              5
            </span>
            <span className="sr-only">Notifikasi</span>
          </Button>
          <div className="hidden items-center gap-3 border-l border-white/10 pl-4 sm:flex">
            <Avatar size="sm">
              <AvatarFallback className="bg-[color:var(--mcs-gold)] text-[#07111d]">SA</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">Super Admin</p>
              <p className="truncate text-xs text-white/45">Akses Penuh</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function CommandHeader({ onAssignTask }: { onAssignTask: () => void }) {
  return (
    <section className="ops-panel relative min-h-[214px] overflow-hidden rounded-lg">
      <Image
        src={dashboardFootage[5].src}
        alt={dashboardFootage[5].label}
        fill
        priority
        sizes="(min-width: 1280px) 1000px, 100vw"
        className="object-cover opacity-26"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#050b14_0%,rgba(5,11,20,0.95)_28%,rgba(5,11,20,0.74)_62%,rgba(5,11,20,0.48)_100%)]" />
      <div className="absolute inset-0 field-line opacity-20" />
      <div className="relative grid min-h-[150px] content-between gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="h-8 rounded-[4px] bg-[rgba(195,38,45,0.22)] px-3 font-sport text-xs font-black uppercase text-[#ff9ca0]">
                Sistem Kepanitiaan
              </Badge>
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-white/46">{event.dateRange}</span>
            </div>
            <h1 className="mt-3 max-w-full font-display text-4xl leading-none text-white sm:text-6xl xl:text-7xl">
              <span className="block xl:inline">Manajemen</span>
              <span className="block xl:ml-3 xl:inline">Panitia</span>
            </h1>
            <p className="mt-2 max-w-[310px] text-sm font-medium leading-6 text-white/70 sm:max-w-2xl">
              Pantau kesiapan panitia, kehadiran, PIC tugas, dan koordinasi divisi untuk MCS 1.
            </p>
          </div>

          <div className="grid min-w-[260px] gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Button className="h-11 rounded-md bg-[color:var(--mcs-red)] font-sport font-black uppercase text-white hover:bg-[color:var(--mcs-red-dark)]">
              <UserPlus data-icon="inline-start" />
              Tambah Panitia
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-md border-[rgba(225,180,81,0.34)] bg-[rgba(225,180,81,0.08)] font-sport font-black uppercase text-[color:var(--mcs-gold-soft)] hover:bg-[rgba(225,180,81,0.14)]"
              onClick={onAssignTask}
            >
              <Plus data-icon="inline-start" />
              Buat Tugas
            </Button>
          </div>
        </div>

        <div className="grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-3">
          {[
            ["Fokus Saat Ini", "Ikuti rundown resmi"],
            ["Absensi QR", "Siapkan saat gate dibuka"],
            ["Briefing", "Menunggu jadwal divisi"],
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-white/10 bg-black/18 px-3 py-2">
              <div className="min-w-0">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white/40">{label}</p>
                <p className="truncate font-sport text-xs font-black uppercase text-white">{value}</p>
              </div>
              <ChevronRight className="size-4 text-white/35" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PanitiaOverview({
  overview,
}: {
  overview: {
    totalPanitia: number
    activeToday: number
    present: number
    absent: number
    activeDivisions: number
    pendingTasks: number
  }
}) {
  const cards = [
    { label: "Total Panitia", value: overview.totalPanitia, helper: "Anggota terdaftar", icon: Users, tone: "gold" },
    { label: "Aktif Hari Ini", value: overview.activeToday, helper: "Masuk daftar tugas", icon: UserCheck, tone: "green" },
    { label: "Hadir Hari Ini", value: overview.present, helper: "Terverifikasi QR", icon: ClipboardCheck, tone: "green" },
    { label: "Tidak Hadir", value: overview.absent, helper: "Perlu tindak lanjut", icon: AlertTriangle, tone: "red" },
    { label: "Divisi Aktif", value: overview.activeDivisions, helper: "Semua divisi", icon: ShieldCheck, tone: "gold" },
    { label: "Tugas Tertunda", value: overview.pendingTasks, helper: "Belum selesai", icon: ListChecks, tone: "red" },
  ]

  return (
    <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-white/10 bg-[#08121f] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-sport text-[0.66rem] font-black uppercase tracking-[0.12em] text-white/45">
                {card.label}
              </p>
              <p className="mt-2 font-display text-4xl leading-none text-white xl:text-5xl">{card.value}</p>
              <p
                className={cn(
                  "mt-1 text-xs font-semibold",
                  card.tone === "green" && "text-[#8ce6b5]",
                  card.tone === "gold" && "text-[color:var(--mcs-gold-soft)]",
                  card.tone === "red" && "text-[#ff9ca0]"
                )}
              >
                {card.helper}
              </p>
            </div>
            <span
              className={cn(
                "grid size-10 place-items-center rounded-md",
                card.tone === "green" && "bg-[rgba(72,199,142,0.12)] text-[#8ce6b5]",
                card.tone === "gold" && "bg-[rgba(225,180,81,0.12)] text-[color:var(--mcs-gold-soft)]",
                card.tone === "red" && "bg-[rgba(195,38,45,0.16)] text-[#ff9ca0]"
              )}
            >
              <card.icon className="size-5" />
            </span>
          </div>
        </div>
      ))}
    </section>
  )
}

function DivisionOverview({
  divisions,
  onOpenDivision,
}: {
  divisions: PanitiaDivision[]
  onOpenDivision: (divisionId: string) => void
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader icon={ShieldCheck} title="Progres Divisi" action="Buka laporan" />
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="px-4 text-[0.66rem] font-black uppercase tracking-[0.12em] text-white/42">Divisi</TableHead>
              <TableHead className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-white/42">Koordinator</TableHead>
              <TableHead className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-white/42">Anggota</TableHead>
              <TableHead className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-white/42">Kehadiran</TableHead>
              <TableHead className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-white/42">Tugas</TableHead>
              <TableHead className="pr-4 text-right text-[0.66rem] font-black uppercase tracking-[0.12em] text-white/42">Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {divisions.map((division) => {
              const attendance = Math.round((division.present / division.members) * 100)
              const Icon = divisionIconMap[division.name] ?? ShieldCheck

              return (
                <TableRow
                  key={division.id}
                  className="cursor-pointer border-white/8 hover:bg-white/[0.045]"
                  onClick={() => onOpenDivision(division.id)}
                >
                  <TableCell className="px-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-md bg-[rgba(225,180,81,0.12)] text-[color:var(--mcs-gold-soft)]">
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="font-sport text-sm font-black uppercase text-white">{division.name}</p>
                        <p className="text-xs text-white/42">{division.focus}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-white/72">{division.coordinator}</TableCell>
                  <TableCell className="font-mono text-sm text-white">{division.members}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm text-white">{attendance}%</span>
                    <span className="ml-2 text-xs text-white/40">({division.present}/{division.members})</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-white">{division.activeTasks}</TableCell>
                  <TableCell className="pr-4">
                    <div className="ml-auto flex max-w-[160px] items-center justify-end gap-3">
                      <Progress value={division.completion} className="h-2 w-24 bg-white/10" />
                      <span className="w-9 text-right font-mono text-xs text-white/62">{division.completion}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <div className="grid gap-2 p-3 md:hidden">
        {divisions.map((division) => (
          <button
            key={division.id}
            type="button"
            onClick={() => onOpenDivision(division.id)}
            className="rounded-md border border-white/10 bg-white/5 p-3 text-left"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-sport text-sm font-black uppercase text-white">{division.name}</p>
                <p className="text-xs text-white/45">{division.coordinator}</p>
              </div>
              <Badge className={divisionStatusClass(division.status)}>{formatDivisionStatusLabel(division.status)}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <MobileMetric label="Hadir" value={String(division.present)} />
              <MobileMetric label="Tugas" value={String(division.activeTasks)} />
              <MobileMetric label="Progress" value={`${division.completion}%`} />
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function AttendanceMonitoring({
  overview,
}: {
  overview: {
    present: number
    late: number
    absent: number
    excused: number
    attendanceRate: number
  }
}) {
  const attendanceTotal = overview.present + overview.late + overview.absent + overview.excused
  const lateEnd = overview.attendanceRate + Math.round((overview.late / Math.max(attendanceTotal, 1)) * 100)

  return (
    <section id="attendance" className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader icon={ClipboardCheck} title="Monitoring Kehadiran" action="QR Log" />
      <div className="grid gap-4 p-4">
        <div className="grid place-items-center">
          <div
            className="grid size-44 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#48c78e 0 ${overview.attendanceRate}%, #f59e0b ${overview.attendanceRate}% ${lateEnd}%, #c3262d ${lateEnd}% 100%)`,
            }}
          >
            <div className="grid size-32 place-items-center rounded-full border border-white/10 bg-[#08121f] text-center">
              <div>
                <p className="font-display text-5xl leading-none text-white">{overview.attendanceRate}%</p>
                <p className="font-sport text-[0.64rem] font-black uppercase text-white/46">Hadir</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <AttendanceTile label={attendanceLabels.Present} value={overview.present} status="Present" />
          <AttendanceTile label={attendanceLabels.Late} value={overview.late} status="Late" />
          <AttendanceTile label={attendanceLabels.Absent} value={overview.absent} status="Absent" />
          <AttendanceTile label={attendanceLabels.Excused} value={overview.excused} status="Excused" />
        </div>

        <div className="rounded-md border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-sport text-xs font-black uppercase text-white/55">Absensi QR</p>
              <p className="mt-1 text-sm font-bold text-white">Catatan check-in panitia</p>
            </div>
            <Badge className="bg-[rgba(72,199,142,0.16)] text-[#8ce6b5]">Live</Badge>
          </div>
          <div className="mt-3 grid gap-2">
            {staffMembers.slice(0, 5).map((member) => (
              <div key={member.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-xs">
                <span className="truncate font-semibold text-white/72">{member.name}</span>
                <span className="font-mono text-white/42">{member.checkIn}</span>
                <Badge className={cn("rounded-[4px] px-1.5 py-0.5 text-[0.62rem]", statusClasses[member.attendance])}>
                  {attendanceLabels[member.attendance]}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function OperationalFeed({ feed }: { feed: ActivityItem[] }) {
  return (
    <section id="activity" className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader icon={Activity} title="Aktivitas Terbaru" action="Semua aktivitas" />
      <div className="grid gap-0 divide-y divide-white/10 p-4">
        {feed.map((item) => (
          <div key={item.id} className="grid grid-cols-[48px_34px_minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0">
            <p className="font-mono text-xs font-bold text-white/56">{item.time}</p>
            <span className={cn("grid size-8 place-items-center rounded-md", activityToneClasses[item.tone])}>
              {item.tone === "warning" ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-white/52">{item.detail}</p>
              <p className="mt-1 font-sport text-[0.64rem] font-black uppercase text-[color:var(--mcs-gold-soft)]">
                {item.division}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function StaffDirectory({
  attendanceFilter,
  divisionFilter,
  filteredStaff,
  query,
  roleFilter,
  taskFilter,
  onAttendanceFilter,
  onDivisionFilter,
  onOpenDivision,
  onQuery,
  onRoleFilter,
  onTaskFilter,
}: {
  attendanceFilter: string
  divisionFilter: string
  filteredStaff: typeof staffMembers
  query: string
  roleFilter: string
  taskFilter: string
  onAttendanceFilter: (value: string) => void
  onDivisionFilter: (value: string) => void
  onOpenDivision: (divisionId: string) => void
  onQuery: (value: string) => void
  onRoleFilter: (value: string) => void
  onTaskFilter: (value: string) => void
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader icon={Users} title="Direktori Panitia" action={`${filteredStaff.length} data`} />
      <div className="grid gap-3 border-b border-white/10 p-3">
        <div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(130px,0.46fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/38" />
            <Input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Cari nama, divisi, peran, tugas..."
              className="h-10 rounded-md border-white/15 bg-[#071421] pl-9 text-sm text-white placeholder:text-white/35"
            />
          </div>
          <FilterControl icon={Filter} label="Divisi" options={divisionOptions} value={divisionFilter} onChange={onDivisionFilter} />
          <FilterControl icon={ShieldCheck} label="Peran" options={roleOptions} value={roleFilter} onChange={onRoleFilter} />
          <FilterControl icon={ClipboardCheck} label="Kehadiran" options={attendanceOptions} value={attendanceFilter} onChange={onAttendanceFilter} />
          <FilterControl icon={SlidersHorizontal} label="Tugas" options={taskOptions} value={taskFilter} onChange={onTaskFilter} />
        </div>
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              {["Nama", "Divisi", "Peran", "Status", "Tugas Saat Ini", "Kontak", "Aksi"].map((heading) => (
                <TableHead key={heading} className="px-4 text-[0.66rem] font-black uppercase tracking-[0.12em] text-white/42">
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.map((member) => {
              const division = panitiaDivisions.find((entry) => entry.name === member.division) ?? panitiaDivisions[0]

              return (
                <TableRow key={member.id} className="border-white/8 hover:bg-white/[0.045]">
                  <TableCell className="px-4">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-[rgba(225,180,81,0.15)] font-sport text-xs font-black text-[color:var(--mcs-gold-soft)]">
                          {initials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-white">{member.name}</p>
                        <p className="text-xs text-white/42">{member.position}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-sm font-semibold text-white/68">{member.division}</TableCell>
                  <TableCell className="px-4 text-xs text-white/52">{formatFilterOption(member.role)}</TableCell>
                  <TableCell className="px-4">
                    <Badge className={cn("rounded-[4px] text-[0.66rem]", statusClasses[member.attendance])}>
                      {attendanceLabels[member.attendance]}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="max-w-[230px]">
                      <p className="truncate text-sm font-semibold text-white/80">{member.currentTask}</p>
                      <p className="mt-1 text-xs text-white/42">{taskStatusLabels[member.taskStatus]}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-white/50">{member.contact}</TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        className="border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                        onClick={() => onOpenDivision(division.id)}
                      >
                        <ChevronRight />
                        <span className="sr-only">Buka divisi</span>
                      </Button>
                      <Button variant="ghost" size="icon-xs" className="text-white/46 hover:bg-white/10 hover:text-white">
                        <MoreVertical />
                        <span className="sr-only">Aksi lain</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-2 p-3 md:hidden">
        {filteredStaff.map((member) => {
          const division = panitiaDivisions.find((entry) => entry.name === member.division) ?? panitiaDivisions[0]

          return (
            <article key={member.id} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{member.name}</p>
                  <p className="text-xs text-white/45">{member.division} - {member.position}</p>
                </div>
                <Badge className={cn("rounded-[4px] text-[0.66rem]", statusClasses[member.attendance])}>
                  {attendanceLabels[member.attendance]}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-white/74">{member.currentTask}</p>
              <Button
                variant="outline"
                className="mt-3 h-9 w-full rounded-md border-white/15 bg-white/5 text-white/72"
                onClick={() => onOpenDivision(division.id)}
              >
                Buka Divisi
                <ChevronRight data-icon="inline-end" />
              </Button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function TaskManagement({ tasks, onAssignTask }: { tasks: PanitiaTask[]; onAssignTask: () => void }) {
  return (
    <section id="tasks" className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader icon={ListChecks} title="Manajemen Tugas" action="Alur kerja" />
      <div className="flex items-center justify-between gap-3 border-b border-white/10 p-3">
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-white/10 text-white/60">{tasks.length} total</Badge>
          <Badge className="bg-[rgba(225,180,81,0.15)] text-[color:var(--mcs-gold-soft)]">
            {tasks.filter((task) => task.status !== "Completed").length} terbuka
          </Badge>
        </div>
        <Button className="h-9 rounded-md bg-[color:var(--mcs-red)] font-sport text-xs font-black uppercase text-white hover:bg-[color:var(--mcs-red-dark)]" onClick={onAssignTask}>
          <Plus data-icon="inline-start" />
          Buat Tugas
        </Button>
      </div>

      <div className="grid gap-0 divide-y divide-white/10">
        {tasks.slice(0, 7).map((task) => (
          <div key={task.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_120px_88px] md:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("rounded-[4px] text-[0.62rem]", priorityClasses[task.priority])}>{formatPriorityLabel(task.priority)}</Badge>
                <p className="truncate font-sport text-sm font-black uppercase text-white">{task.title}</p>
              </div>
              <p className="mt-1 text-xs text-white/45">{task.division} - PIC {task.pic}</p>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs text-white/45">
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-2 bg-white/10" />
              </div>
            </div>
            <div className="grid gap-1">
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.1em] text-white/38">Batas Waktu</p>
              <p className="font-mono text-sm font-bold text-white">{task.deadline}</p>
            </div>
            <Badge className={cn("w-fit rounded-[4px] text-[0.66rem]", taskStatusClasses[task.status])}>
              {taskStatusLabels[task.status]}
            </Badge>
          </div>
        ))}
      </div>
    </section>
  )
}

function DivisionPerformance({
  divisions,
  onOpenDivision,
}: {
  divisions: PanitiaDivision[]
  onOpenDivision: (divisionId: string) => void
}) {
  const sorted = [...divisions].sort((a, b) => b.completion - a.completion)

  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader icon={BarChart3} title="Performa Divisi" action="Laporan performa" />
      <div className="grid gap-2 p-4 md:grid-cols-2 xl:grid-cols-4">
        {sorted.map((division) => (
          <button
            key={division.id}
            type="button"
            className="rounded-md border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
            onClick={() => onOpenDivision(division.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-sport text-sm font-black uppercase text-white">{division.name}</p>
              <Badge className={divisionStatusClass(division.status)}>{formatDivisionStatusLabel(division.status)}</Badge>
            </div>
            <div className="mt-4 grid gap-3">
              <ScoreLine label="Kehadiran" value={Math.round((division.present / division.members) * 100)} />
              <ScoreLine label="Penyelesaian Tugas" value={division.completion} />
              <ScoreLine label="Respons" value={division.responsiveness} />
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function SuperAdminPanel({ onAssignTask }: { onAssignTask: () => void }) {
  const actions = [
    { label: "Tambah Panitia", icon: UserPlus },
    { label: "Atur Peran", icon: ShieldCheck },
    { label: "Pindah Divisi", icon: Users },
    { label: "Buat Tugas", icon: Plus, onClick: onAssignTask },
    { label: "Cek Kehadiran", icon: ClipboardCheck },
    { label: "Laporan Harian", icon: BarChart3 },
  ]

  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl leading-none text-white">Kontrol Super Admin</h2>
          <p className="mt-1 text-xs text-white/48">Peran, kehadiran, tugas, dan kesiapan panitia</p>
        </div>
        <ShieldCheck className="size-5 text-[color:var(--mcs-gold-soft)]" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-14 flex-col gap-1 rounded-md border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={action.onClick}
          >
            <action.icon />
            <span className="text-[0.66rem] font-black uppercase">{action.label}</span>
          </Button>
        ))}
      </div>
    </section>
  )
}

function DivisionDetailSheet({
  division,
  members,
  open,
  tasks,
  onAssignTask,
  onOpenChange,
}: {
  division: PanitiaDivision
  members: typeof staffMembers
  open: boolean
  tasks: PanitiaTask[]
  onAssignTask: () => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[94vw] max-w-[480px] gap-0 border-white/10 bg-[#06111f] p-0 text-white">
        <SheetHeader className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(195,38,45,0.2),rgba(195,38,45,0.08))] p-5">
          <div className="flex items-start justify-between gap-4 pr-9">
            <div>
              <SheetTitle className="font-display text-5xl leading-none text-white">{division.name}</SheetTitle>
              <SheetDescription className="mt-2 text-sm text-white/62">
                Koordinator: {division.coordinator} - {division.members} anggota
              </SheetDescription>
            </div>
            <Badge className={divisionStatusClass(division.status)}>{division.status}</Badge>
          </div>
        </SheetHeader>

        <div className="grid gap-4 overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-2">
            <DetailMetric label="Hadir" value={division.present} tone="green" />
            <DetailMetric label="Tidak Hadir" value={division.absent} tone="red" />
            <DetailMetric label="Terlambat" value={division.late} tone="gold" />
            <DetailMetric label="Tugas" value={division.activeTasks} tone="white" />
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-white/55">
              <span>Progress divisi</span>
              <span>{division.completion}%</span>
            </div>
            <Progress value={division.completion} className="h-2 bg-white/10" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <ScoreBox label="Respons" value={`${division.responsiveness}%`} />
              <ScoreBox label="Kehadiran" value={`${Math.round((division.present / division.members) * 100)}%`} />
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <p className="font-sport text-xs font-black uppercase tracking-[0.12em] text-white/58">Anggota Divisi</p>
              <button className="text-xs font-bold text-[color:var(--mcs-gold-soft)]" type="button">
                Lihat semua
              </button>
            </div>
            <div className="grid divide-y divide-white/10">
              {members.map((member) => (
                <div key={member.id} className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-[rgba(225,180,81,0.15)] text-xs text-[color:var(--mcs-gold-soft)]">
                      {initials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{member.name}</p>
                    <p className="truncate text-xs text-white/45">{member.position}</p>
                  </div>
                  <Badge className={cn("rounded-[4px] text-[0.62rem]", statusClasses[member.attendance])}>
                    {attendanceLabels[member.attendance]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <p className="font-sport text-xs font-black uppercase tracking-[0.12em] text-white/58">Tugas Aktif</p>
              <Button size="xs" className="bg-[color:var(--mcs-red)] text-white hover:bg-[color:var(--mcs-red-dark)]" onClick={onAssignTask}>
                <Plus />
                Buat
              </Button>
            </div>
            <div className="grid divide-y divide-white/10">
              {tasks.length ? (
                tasks.map((task) => (
                  <div key={task.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{task.title}</p>
                      <p className="text-xs text-white/45">{task.pic} - {task.deadline}</p>
                    </div>
                    <Badge className={cn("rounded-[4px] text-[0.62rem]", taskStatusClasses[task.status])}>
                      {taskStatusLabels[task.status]}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="px-4 py-5 text-sm text-white/48">Tidak ada tugas aktif untuk divisi ini.</div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PanelHeader({
  action,
  icon: Icon,
  title,
}: {
  action?: string
  icon: LucideIcon
  title: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="size-4 text-[color:var(--mcs-gold-soft)]" />
        <h2 className="truncate font-display text-2xl leading-none text-white 2xl:text-3xl">{title}</h2>
      </div>
      {action ? (
        <button type="button" className="shrink-0 font-sport text-[0.68rem] font-black uppercase text-[color:var(--mcs-red)] transition hover:text-white">
          {action}
        </button>
      ) : null}
    </div>
  )
}

function FilterControl({
  icon: Icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: LucideIcon
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/36" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-md border border-white/15 bg-[#071421] pl-9 pr-8 text-sm font-semibold text-white outline-none focus:border-[color:var(--mcs-gold)]"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#071421] text-white">
            {formatFilterOption(option)}
          </option>
        ))}
      </select>
      <ChevronRight className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-white/36" />
    </label>
  )
}

function AttendanceTile({ label, status, value }: { label: string; status: AttendanceStatus; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      <p className="font-display text-4xl leading-none text-white">{value}</p>
      <p className={cn("mt-1 text-[0.65rem] font-bold uppercase", statusClasses[status])}>{label}</p>
    </div>
  )
}

function ScoreLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-white/52">
        <span>{label}</span>
        <span className="font-mono font-bold text-white">{value}%</span>
      </div>
      <Progress value={value} className="h-2 bg-white/10" />
    </div>
  )
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/18 px-2 py-2">
      <p className="font-display text-3xl leading-none text-white">{value}</p>
      <p className="mt-1 text-[0.6rem] font-bold uppercase text-white/42">{label}</p>
    </div>
  )
}

function DetailMetric({ label, tone, value }: { label: string; tone: "green" | "red" | "gold" | "white"; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3 text-center">
      <p
        className={cn(
          "font-display text-3xl leading-none",
          tone === "green" && "text-[#8ce6b5]",
          tone === "red" && "text-[#ff9ca0]",
          tone === "gold" && "text-[color:var(--mcs-gold-soft)]",
          tone === "white" && "text-white"
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[0.58rem] font-black uppercase text-white/42">{label}</p>
    </div>
  )
}

function ScoreBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-[#06111f] p-3 text-center">
      <p className="font-display text-4xl leading-none text-white">{value}</p>
      <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-white/42">{label}</p>
    </div>
  )
}

function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[#050c15]/96 px-2 pb-3 pt-2 backdrop-blur-md lg:hidden">
      {mobileNavItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 py-1 text-xs font-semibold text-white/58 transition hover:bg-white/7 hover:text-white",
            item.active && "bg-[rgba(195,38,45,0.1)] text-[color:var(--mcs-red)]"
          )}
        >
          <item.icon className="size-5" />
          <span>{item.label}</span>
        </Link>
      ))}
      <Sheet>
        <SheetTrigger
          render={
            <button
              type="button"
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 py-1 text-xs font-semibold text-white/58 transition hover:bg-white/7 hover:text-white"
            />
          }
        >
          <Menu className="size-5" />
          <span>Lainnya</span>
        </SheetTrigger>
        <SheetContent side="right" className="w-[86vw] max-w-[360px] border-white/10 bg-[#050c15] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigasi MCS</SheetTitle>
            <SheetDescription>Buka navigasi kepanitiaan</SheetDescription>
          </SheetHeader>
          <PanitiaSidebar activeDivisionId="acara" onDivisionSelect={() => undefined} />
        </SheetContent>
      </Sheet>
    </nav>
  )
}

function divisionStatusClass(status: PanitiaDivision["status"]) {
  if (status === "Stable") {
    return "bg-[rgba(72,199,142,0.16)] text-[#8ce6b5]"
  }

  if (status === "Watch") {
    return "bg-[rgba(225,180,81,0.16)] text-[color:var(--mcs-gold-soft)]"
  }

  return "bg-[rgba(255,77,84,0.16)] text-[#ff9ca0]"
}

function formatDivisionStatusLabel(status: PanitiaDivision["status"]) {
  const labels: Record<PanitiaDivision["status"], string> = {
    Attention: "Butuh Tindak Lanjut",
    Stable: "Stabil",
    Watch: "Perlu Dipantau",
  }

  return labels[status]
}

function formatFilterOption(option: string) {
  const labels: Record<string, string> = {
    "All Attendance": "Semua Kehadiran",
    "All Divisions": "Semua Divisi",
    "All Roles": "Semua Peran",
    "All Tasks": "Semua Tugas",
    "Division Coordinator": "Koordinator Divisi",
    Absent: attendanceLabels.Absent,
    Blocked: taskStatusLabels.Blocked,
    Completed: taskStatusLabels.Completed,
    Excused: attendanceLabels.Excused,
    "In Progress": taskStatusLabels["In Progress"],
    Late: attendanceLabels.Late,
    Present: attendanceLabels.Present,
    Scheduled: taskStatusLabels.Scheduled,
    Staff: "Anggota",
  }

  return labels[option] ?? option
}

function formatPriorityLabel(priority: TaskPriority) {
  const labels: Record<TaskPriority, string> = {
    High: "Tinggi",
    Low: "Rendah",
    Medium: "Sedang",
  }

  return labels[priority]
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
