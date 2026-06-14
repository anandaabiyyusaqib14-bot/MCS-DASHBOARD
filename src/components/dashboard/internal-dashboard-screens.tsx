import Link from "next/link"
import dynamic from "next/dynamic"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  ClipboardList,
  Download,
  FileCheck,
  FileText,
  GitBranch,
  Globe,
  Handshake,
  ImageUp,
  Megaphone,
  Monitor,
  Radio,
  Search,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"

import {
  budgetLineItems,
  budgetSummary,
  competitionJuknis,
  competitions,
  event,
  getNationByClassName,
  getNationByCountryName,
  scheduleDays,
  sponsorProspects,
} from "@/data/mcs"
import { cn } from "@/lib/utils"
import { roleLabels, type DashboardSummary, type Permission, type UserDTO, type UserRole } from "@/server/mcs/types"

const ExecutiveDashboardScreen = dynamic(() =>
  import("@/components/dashboard/executive-dashboard-screen").then((module) => module.ExecutiveDashboardScreen),
)
const HumasSponsorshipCenter = dynamic(() =>
  import("@/components/dashboard/humas-sponsorship-center").then((module) => module.HumasSponsorshipCenter),
)
const EntrepreneurshipManagementModule = dynamic(() =>
  import("@/components/dashboard/entrepreneurship-management-module").then((module) => module.EntrepreneurshipManagementModule),
)
const JuknisManagementModule = dynamic(() =>
  import("@/components/dashboard/juknis-management-module").then((module) => module.JuknisManagementModule),
)
const PanitiaManagementModule = dynamic(() =>
  import("@/components/dashboard/panitia-management-module").then((module) => module.PanitiaManagementModule),
)
const PddCenterScreen = dynamic(() =>
  import("@/components/dashboard/pdd-center-screen").then((module) => module.PddCenterScreen),
)
const ParticipantRegistrationCenter = dynamic(() =>
  import("@/components/dashboard/participant-registration-center").then((module) => module.ParticipantRegistrationCenter),
)
const ScheduleManagementControlRoom = dynamic(() =>
  import("@/components/dashboard/schedule-management-control-room").then((module) => module.ScheduleManagementControlRoom),
)
const SettingsCenter = dynamic(() =>
  import("@/components/dashboard/settings-center").then((module) => module.SettingsCenter),
)
const AdministrationControlCenter = dynamic(() =>
  import("@/components/dashboard/administration-control-center").then((module) => module.AdministrationControlCenter),
)
const AnalyticsCenterScreen = dynamic(() =>
  import("@/components/dashboard/analytics-center-screen").then((module) => module.AnalyticsCenterScreen),
)
const AnnouncementCommandCenter = dynamic(() =>
  import("@/components/dashboard/announcement-command-center").then((module) => module.AnnouncementCommandCenter),
)

export type DashboardModuleKey =
  | "administration"
  | "announcement-center"
  | "analytics"
  | "bracket-management"
  | "budgeting"
  | "business-operations"
  | "cleanliness-operations"
  | "division-activities"
  | "division-status"
  | "documents"
  | "equipment-inventory"
  | "event-rundown"
  | "financial-reports"
  | "humas-sponsorship"
  | "juknis-management"
  | "live-match"
  | "match-results"
  | "media-archive"
  | "media-center"
  | "media-gallery"
  | "media-highlights"
  | "media-posts"
  | "media-upload"
  | "news-center"
  | "panitia-management"
  | "participant-management"
  | "publication-schedule"
  | "reports"
  | "schedule-management"
  | "security-operations"
  | "settings"
  | "tasks"
  | "technical-support"
  | "users"

type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "navy" | "gold"

type ActionLink = {
  href: string
  icon: LucideIcon
  label: string
}

type StatItem = {
  label: string
  value: number | string
  tone?: StatusTone
}

type RoleDashboardConfig = {
  actions: ActionLink[]
  icon: LucideIcon
  primaryPanelDescription: string
  primaryPanelTitle: string
  stats: (summary: DashboardSummary) => StatItem[]
  statusDescription: string
  statuses: (summary: DashboardSummary) => Array<{ label: string; status: string; tone?: StatusTone }>
  statusTitle: string
  subtitle: string
  timelineTitle: string
  title: string
  todoDescription: string
  todoTitle: string
}

type DivisionOperationsRole = Extract<
  UserRole,
  "acara" | "kebersihan" | "perlengkapan" | "keamanan" | "kewirausahaan"
>

type FieldOperationsRole = Extract<UserRole, "acara" | "kebersihan" | "perlengkapan" | "keamanan">

type OperationsScheduleRow = {
  date: string
  dayName: string
  id: string
  label: string
  pic: string
  priority: "Low" | "Medium" | "High" | "Critical"
  status: "Upcoming" | "In Progress" | "Completed" | "Delayed" | "Cancelled"
  time: string
  title: string
  type: string
  venue: string
}

type BusinessDashboardFocus = "all" | "finance" | "kewirausahaan"

type DivisionDashboardSpec = {
  actions: ActionLink[]
  checklistItems: string[]
  dataPanelDescription: string
  dataPanelTitle: string
  divisionId: string
  emptyDescription: string
  emptyTitle: string
  icon: LucideIcon
  scheduleTitle: string
  statusDescription: string
  statusItems: (division: DashboardSummary["committeeStatus"][number] | undefined) => Array<{
    label: string
    status: string
    tone?: StatusTone
  }>
  subtitle: string
  tableColumns: string[]
  title: string
}

const NO_DATA = "Belum Ada Data"
const WAITING = "Menunggu Update"
const NOT_PUBLISHED = "Belum Dipublikasikan"
const MATCH_UNAVAILABLE = "Data match belum tersedia."

const statusClasses: Record<StatusTone, string> = {
  danger: "border-[#FEE2E2] bg-[#FEF2F2] text-[#DC2626]",
  gold: "border-[#FEF3C7] bg-[#FFFBEB] text-[#92400E]",
  info: "border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB]",
  navy: "border-[#0F172A] bg-[#0F172A] text-white",
  neutral: "border-[#E5E7EB] bg-[#FFFDF8] text-[#6B7280]",
  success: "border-[#DCFCE7] bg-[#F0FDF4] text-[#16A34A]",
  warning: "border-[#FEF3C7] bg-[#FFFBEB] text-[#D97706]",
}

export function RoleDashboardScreen({
  role,
  summary,
  user,
}: {
  role: UserRole
  summary: DashboardSummary
  user: UserDTO
}) {
  if (role === "ketua_pelaksana" || role === "wakil_ketua") {
    return <ExecutiveDashboardScreen role={role} summary={summary} user={user} />
  }

  if (role === "bendahara") {
    return <BendaharaDashboardScreen summary={summary} user={user} />
  }

  if (role === "humas") {
    return <HumasSponsorshipScreen summary={summary} user={user} variant="role-dashboard" />
  }

  if (role === "kewirausahaan") {
    return <BusinessDashboardSystemScreen focus="kewirausahaan" summary={summary} user={user} />
  }

  if (role === "pj_lomba") {
    return <PjLombaDashboardScreen summary={summary} user={user} />
  }

  if (role === "dokumentasi") {
    return <DocumentationDashboardScreen />
  }

  if (isFieldOperationsRole(role)) {
    return <OperationsDashboardSystemScreen divisionId={role} summary={summary} user={user} />
  }

  if (isDivisionOperationsRole(role)) {
    return <DivisionOperationsDashboardScreen role={role} summary={summary} user={user} />
  }

  const config = getRoleDashboardConfig(role)
  const currentActivity = getCurrentActivity(summary)
  const nextActivity = summary.todaySchedule[0]

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={config.actions}
        icon={config.icon}
        subtitle={config.subtitle}
        title={`${config.title}, ${user.displayName}`}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InfoPanel
          icon={Activity}
          title={config.primaryPanelTitle}
          description={config.primaryPanelDescription}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FactTile label="Kegiatan Saat Ini" value={currentActivity.title} />
            <FactTile label="Tempat" value={currentActivity.venue} />
            <FactTile label="PIC" value={currentActivity.pic} />
            <FactTile label="Status" value={currentActivity.status} />
          </div>
        </InfoPanel>

        <EventInfoPanel />
      </section>

      <StatStrip items={config.stats(summary)} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <InfoPanel
          icon={CalendarDays}
          title={config.timelineTitle}
          description="Jadwal resmi MCS 1 untuk tampilan ini."
        >
          <ScheduleTable schedules={summary.todaySchedule.slice(0, 6)} emptyTitle="Belum Ada Jadwal" />
        </InfoPanel>

        <div className="grid gap-6">
          <InfoPanel icon={ClipboardList} title={config.todoTitle} description={config.todoDescription}>
            <TaskList summary={summary} />
          </InfoPanel>

          <InfoPanel icon={Megaphone} title="Pengumuman Penting" description="Catatan internal dari pusat kepanitiaan.">
            <AnnouncementList summary={summary} />
          </InfoPanel>
        </div>
      </section>

      <InfoPanel icon={ShieldCheck} title={config.statusTitle} description={config.statusDescription}>
        <StatusGrid items={config.statuses(summary)} />
      </InfoPanel>

      <InfoPanel icon={Activity} title="Aktivitas Terbaru" description="Aktivitas sistem muncul setelah ada catatan resmi.">
        <RecentActivityList summary={summary} />
      </InfoPanel>

      {nextActivity ? (
        <p className="text-sm font-medium text-[#64748B]">
          Kegiatan berikutnya: <span className="font-semibold text-[#111827]">{nextActivity.title}</span> pukul{" "}
          <span className="font-semibold text-[#111827]">{formatScheduleTime(nextActivity.time)}</span>.
        </p>
      ) : null}
    </div>
  )
}

function BendaharaDashboardScreen({ summary, user }: { summary: DashboardSummary; user: UserDTO }) {
  const financeTasks = summary.upcomingTasks.filter((task) =>
    isFinanceRelated(`${task.title} ${task.description ?? ""} ${task.division}`),
  )
  const financeActivity = summary.auditPreview.filter((item) =>
    isFinanceRelated(`${item.action} ${item.resource}`),
  )

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={[
          { href: "/dashboard/budgeting", icon: Wallet, label: "Tambah Pengeluaran" },
          { href: "/dashboard/budgeting", icon: Handshake, label: "Catat Pemasukan" },
          { href: "/dashboard/budgeting", icon: FileCheck, label: "Verifikasi Pembayaran" },
          { href: "/dashboard/financial-reports", icon: FileText, label: "Buat Laporan" },
          { href: "/dashboard/financial-reports", icon: Download, label: "Ekspor Data" },
        ]}
        icon={Wallet}
        subtitle="Pusat keuangan untuk anggaran, pembayaran, pemasukan sponsor, dan laporan MCS 1."
        title={`Bendahara, ${user.displayName}`}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <InfoPanel icon={Wallet} title="Ringkasan Keuangan" description="Kondisi keuangan MCS 1 saat ini.">
          <FinancialSummaryGrid />
        </InfoPanel>

        <InfoPanel icon={FileCheck} title="Ikhtisar Keuangan" description="Ringkasan kesiapan transaksi.">
          <StatMiniList
            items={[
              { label: "Total Transaksi", value: NO_DATA },
              { label: "Menunggu Verifikasi", value: NO_DATA },
              { label: "Pembayaran Selesai", value: NO_DATA },
              { label: "Kontribusi Sponsor", value: `${sponsorProspects.length} berjalan` },
            ]}
          />
        </InfoPanel>
      </section>

      <InfoPanel icon={ClipboardList} title="Pembayaran Tertunda" description="Item pembayaran, divisi, nominal, batas waktu, dan status.">
        <div className="grid gap-3">
          <PaymentStatusLegend />
          <FinanceEmptyTable
            columns={["Item Pembayaran", "Divisi", "Nominal", "Batas Waktu", "Status"]}
            emptyTitle="Belum Ada Pembayaran Tertunda"
            emptyDescription="Kewajiban pembayaran akan muncul setelah catatan keuangan resmi diisi."
          />
        </div>
      </InfoPanel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={Handshake} title="Pemasukan Sponsor" description="Catatan kontribusi sponsor dan tanggal diterima.">
          <SponsorshipIncomeTable />
        </InfoPanel>

        <InfoPanel icon={ClipboardList} title="Aksi Cepat" description="Aksi utama keuangan untuk bendahara.">
          <ActionGrid
            actions={[
              { href: "/dashboard/budgeting", icon: Wallet, label: "Tambah Pengeluaran" },
              { href: "/dashboard/budgeting", icon: Handshake, label: "Catat Pemasukan" },
              { href: "/dashboard/budgeting", icon: FileCheck, label: "Verifikasi Pembayaran" },
              { href: "/dashboard/financial-reports", icon: FileText, label: "Buat Laporan" },
              { href: "/dashboard/financial-reports", icon: Download, label: "Ekspor Data" },
            ]}
          />
        </InfoPanel>
      </section>

      <InfoPanel icon={Wallet} title="Pengeluaran Terbaru" description="Item pengeluaran, divisi, nominal, tanggal, dan status persetujuan.">
        <FinanceEmptyTable
          columns={["Item Pengeluaran", "Divisi", "Nominal", "Tanggal", "Status Persetujuan"]}
          emptyTitle="Belum Ada Catatan Keuangan"
          emptyDescription="Catatan pengeluaran panitia belum dipublikasikan."
        />
      </InfoPanel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={BarChart3} title="Budget Allocation" description="Division allocation workspace for event finance.">
          <BudgetAllocationTable />
        </InfoPanel>

        <InfoPanel icon={Activity} title="Aktivitas Keuangan" description="Update pengeluaran, pemasukan, pembayaran, anggaran, dan laporan.">
          <FinancialActivityList items={financeActivity} />
        </InfoPanel>
      </section>

      <InfoPanel icon={CalendarDays} title="Batas Waktu Terdekat" description="Tugas keuangan, tenggat, prioritas, dan divisi penanggung jawab.">
        <FinancialDeadlineTable tasks={financeTasks} />
      </InfoPanel>
    </div>
  )
}

export function HumasSponsorshipScreen({
  summary,
  user,
  variant = "module",
}: {
  summary: DashboardSummary
  user: UserDTO
  variant?: "module" | "role-dashboard"
}) {
  return <HumasSponsorshipCenter summary={summary} user={user} variant={variant} />
}

function BusinessDashboardSystemScreen({
  focus = "all",
  moduleTitle,
  summary,
  user,
}: {
  focus?: BusinessDashboardFocus
  moduleTitle?: string
  summary: DashboardSummary
  user: UserDTO
}) {
  const generatedAt = new Date()
  const title = moduleTitle ?? getBusinessDashboardTitle(focus, user)

  return (
    <EntrepreneurshipManagementModule
      eventName={event.name}
      eventOrganizer={event.organizer}
      eventTheme={event.theme}
      generatedAt={generatedAt.toISOString()}
      notificationCount={summary.metrics.unreadNotifications}
      operator={user.displayName}
      title={title}
    />
  )
}

function PjLombaDashboardScreen({ summary, user }: { summary: DashboardSummary; user: UserDTO }) {
  const assignedCompetitions = competitions.filter((competition) =>
    user.assignedCompetitionIds.length > 0 ? user.assignedCompetitionIds.includes(competition.id) : true,
  )
  const primaryCompetition = assignedCompetitions[0]
  const liveMatch = summary.liveMatches[0]
  const todayMatches = summary.todaySchedule.filter((schedule) => schedule.type === "match")
  const competitionAnnouncements = summary.announcements.filter((announcement) => {
    const haystack = `${announcement.title} ${announcement.body}`.toLowerCase()

    return (
      announcement.audience.includes("pj_lomba") ||
      assignedCompetitions.some((competition) => haystack.includes(competition.shortName.toLowerCase()))
    )
  })
  const competitionActivity = summary.auditPreview.filter((item) =>
    ["score", "match", "bracket", "participant", "schedule", "competition"].some((keyword) =>
      `${item.action} ${item.resource}`.toLowerCase().includes(keyword),
    ),
  )

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={[
          { href: "/dashboard/match-results", icon: ClipboardList, label: "Input Hasil" },
          { href: "/dashboard/match-results", icon: Radio, label: "Update Skor" },
          { href: "/dashboard/participants", icon: UserCheck, label: "Verifikasi Peserta" },
          { href: "/dashboard/bracket", icon: GitBranch, label: "Kelola Bracket" },
          { href: "/dashboard/schedules", icon: CalendarDays, label: "Buka Jadwal" },
        ]}
        icon={Trophy}
        subtitle="Pusat PJ Lomba untuk pelaksanaan match, verifikasi peserta, bracket, dan update skor."
        title={`PJ Lomba, ${user.displayName}`}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <InfoPanel icon={Radio} title="Status Pertandingan Live" description="Status lomba paling penting untuk dipantau cepat.">
          <LiveMatchStatusPanel liveMatch={liveMatch} />
        </InfoPanel>

        <InfoPanel icon={Trophy} title="Info Lomba" description="Konteks lomba yang sedang ditugaskan.">
          <div className="grid gap-3">
            <FactTile label="Nama Lomba" value={primaryCompetition?.shortName ?? "Belum Ada Lomba Aktif"} />
            <FactTile label="Kategori" value={primaryCompetition?.category ?? NO_DATA} />
            <FactTile label="Tempat" value={primaryCompetition?.venue ?? NO_DATA} />
            <FactTile label="PIC" value={primaryCompetition?.pj.join(" & ") || WAITING} />
            <FactTile label="Tanggal Lomba" value={event.dateRange} />
          </div>
        </InfoPanel>
      </section>

      <InfoPanel icon={CalendarDays} title="Jadwal Match Hari Ini" description="Jadwal match resmi MCS 1 untuk pantauan PJ Lomba.">
        <MatchScheduleTable schedules={todayMatches} />
      </InfoPanel>

      <InfoPanel icon={ClipboardList} title="Aksi Cepat" description="Akses cepat untuk pelaksanaan lomba.">
        <ActionGrid
          actions={[
            { href: "/dashboard/match-results", icon: ClipboardList, label: "Input Hasil" },
            { href: "/dashboard/match-results", icon: Radio, label: "Update Skor" },
            { href: "/dashboard/participants", icon: UserCheck, label: "Verifikasi Peserta" },
            { href: "/dashboard/bracket", icon: GitBranch, label: "Kelola Bracket" },
            { href: "/dashboard/schedules", icon: CalendarDays, label: "Buka Jadwal" },
          ]}
        />
      </InfoPanel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={GitBranch} title="Ikhtisar Bracket" description="Progress bracket muncul setelah bracket resmi dibuat.">
          <StatMiniList
            items={[
              { label: "Round Saat Ini", value: "Bracket belum dibuat" },
              { label: "Tim Tersisa", value: NO_DATA },
              { label: "Match Selesai", value: NO_DATA },
              { label: "Match Berikutnya", value: todayMatches.length || "Belum Ada Match Terjadwal" },
            ]}
          />
          <div className="mt-3">
            <ActionGrid actions={[{ href: "/dashboard/bracket", icon: GitBranch, label: "Buka Bracket Lengkap" }]} />
          </div>
        </InfoPanel>

        <InfoPanel icon={Users} title="Status Peserta" description="Ringkasan verifikasi peserta.">
          <StatMiniList
            items={[
              { label: "Terverifikasi", value: NO_DATA },
              { label: "Menunggu", value: NO_DATA },
              { label: "Tidak Hadir", value: NO_DATA },
              { label: "Diskualifikasi", value: NO_DATA },
            ]}
          />
        </InfoPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(340px,0.7fr)]">
        <InfoPanel icon={ClipboardList} title="Shortcut Input Hasil" description="Panel akses cepat untuk input skor.">
          <ResultInputShortcut />
        </InfoPanel>

        <InfoPanel icon={Megaphone} title="Pengumuman Lomba" description="Perubahan tempat, revisi jadwal, dan update aturan.">
          <CompetitionAnnouncementList announcements={competitionAnnouncements} />
        </InfoPanel>
      </section>

      <InfoPanel icon={Activity} title="Aktivitas Lomba Terbaru" description="Aktivitas skor, match, bracket, peserta, dan jadwal.">
        <CompetitionActivityList items={competitionActivity} />
      </InfoPanel>
    </div>
  )
}

export function DocumentationDashboardScreen() {
  return <PddCenterScreen />
}

function DivisionOperationsDashboardScreen({
  role,
  summary,
  user,
}: {
  role: DivisionOperationsRole
  summary: DashboardSummary
  user: UserDTO
}) {
  const spec = getDivisionDashboardSpec(role)
  const division = summary.committeeStatus.find((item) => item.id === spec.divisionId)
  const divisionTasks = summary.upcomingTasks.filter((task) =>
    task.divisionId === spec.divisionId || task.division.toLowerCase() === roleLabels[role].toLowerCase(),
  )
  const schedules = getDivisionScheduleView(role, summary)

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={spec.actions}
        icon={spec.icon}
        subtitle={spec.subtitle}
        title={`${spec.title}, ${user.displayName}`}
      />

      <StatStrip
        items={[
          { label: "Anggota Divisi", value: division?.members ?? NO_DATA, tone: "info" },
          { label: "Hadir Hari Ini", value: division?.present ?? NO_DATA, tone: "success" },
          { label: "Tugas Aktif", value: division?.activeTasks ?? (divisionTasks.length || NO_DATA), tone: "warning" },
          {
            label: "Status Divisi",
            value: division?.status ?? WAITING,
            tone: division ? getDivisionTone(division.status) : "neutral",
          },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <InfoPanel icon={spec.icon} title="Ruang Kerja Divisi" description="Ringkasan tanggung jawab dan kesiapan divisi.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FactTile label="Divisi" value={roleLabels[role]} />
            <FactTile label="Koordinator" value={division?.coordinator ?? WAITING} />
            <FactTile label="Fokus" value={division?.focus ?? WAITING} />
            <FactTile label="Progress" value={division ? `${division.completion}%` : NO_DATA} />
          </div>
        </InfoPanel>

        <EventInfoPanel />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InfoPanel icon={CalendarDays} title={spec.scheduleTitle} description="Jadwal resmi MCS 1 yang relevan untuk divisi ini.">
          <ScheduleTable schedules={schedules} emptyTitle="Belum Ada Jadwal" />
        </InfoPanel>

        <div className="grid gap-5">
          <InfoPanel icon={ClipboardList} title="Aksi Cepat" description="Aksi utama untuk divisi ini.">
            <ActionGrid actions={spec.actions} />
          </InfoPanel>

          <InfoPanel icon={ShieldCheck} title="Status Divisi" description={spec.statusDescription}>
            <StatusGrid items={spec.statusItems(division)} />
          </InfoPanel>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={ClipboardList} title="Tugas Divisi" description="Tugas untuk divisi ini atau akun terkait.">
          <DivisionTaskList tasks={divisionTasks} />
        </InfoPanel>

        <InfoPanel icon={FileCheck} title="Checklist" description="Checklist kesiapan yang perlu diisi divisi.">
          <DocumentStatusList items={spec.checklistItems} />
        </InfoPanel>
      </section>

      <InfoPanel icon={spec.icon} title={spec.dataPanelTitle} description={spec.dataPanelDescription}>
        <EmptyDataTable columns={spec.tableColumns} emptyTitle={spec.emptyTitle} emptyDescription={spec.emptyDescription} />
      </InfoPanel>

      <InfoPanel icon={Activity} title="Aktivitas Terbaru" description="Aktivitas divisi muncul setelah ada update resmi.">
        <RecentActivityList summary={summary} />
      </InfoPanel>
    </div>
  )
}

function OperationsDashboardSystemScreen({
  divisionId,
  moduleTitle,
  summary,
  user,
}: {
  divisionId?: FieldOperationsRole
  moduleTitle?: string
  summary: DashboardSummary
  user: UserDTO
}) {
  const divisionLabel = divisionId ? roleLabels[divisionId] : "Divisi Lapangan"
  const officialScheduleRows = getOfficialOperationsScheduleRows()
  const scopedRows = getOperationsRowsForDivision(officialScheduleRows, divisionId)
  const todayKey = getDateKeyInTimezone(new Date(), summary.event.timezone)
  const todayRows = scopedRows.filter((row) => row.date === todayKey)
  const upcomingRows = scopedRows.filter((row) => row.date >= todayKey).slice(0, 6)
  const actions = getOperationsActions(divisionId)

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={actions}
        icon={divisionId ? getOperationsDivisionIcon(divisionId) : Activity}
        subtitle={`Ruang kerja lapangan ${event.name} untuk ${divisionLabel}. Tugas, kendala, checklist, tempat, dan laporan tetap kosong sampai data resmi dipublikasikan.`}
        title={moduleTitle ?? `${divisionLabel}, ${user.displayName}`}
      />

      <StatStrip
        items={[
          { label: "Kegiatan Hari Ini", value: todayRows.length || "Belum Ada Jadwal", tone: todayRows.length ? "info" : "neutral" },
          { label: "Tugas Terbuka", value: "Belum Ada Tugas", tone: "neutral" },
          { label: "Kendala Tempat", value: "Belum Ada Kendala", tone: "success" },
          { label: "Checklist Tertunda", value: "Belum Ada Checklist", tone: "neutral" },
        ]}
      />

      <FilterBar
        fields={["Divisi", "Tempat", "Prioritas", "Status", "Tanggal", "PIC"]}
        searchPlaceholder="Cari tugas, kegiatan, tempat, kendala, laporan, checklist"
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InfoPanel icon={CalendarDays} title="Kegiatan Hari Ini" description="Kegiatan resmi untuk cakupan divisi yang dipilih.">
          <OperationsActivityTable rows={todayRows} emptyTitle="Belum Ada Jadwal" />
        </InfoPanel>

        <div className="grid gap-5">
          <InfoPanel icon={Monitor} title="Status Tempat" description="Kesiapan tempat dan kegiatan berjalan.">
            <OperationsVenueStatus rows={todayRows} upcomingRows={upcomingRows} />
          </InfoPanel>

          <InfoPanel icon={ShieldCheck} title="Catatan Kendala" description="Catatan kendala muncul setelah ada laporan resmi.">
            <EmptyDataTable
              columns={["ID Kendala", "Judul", "Kategori", "Prioritas", "Tempat", "Status"]}
              emptyTitle="Belum Ada Laporan Terbuka"
              emptyDescription="Belum ada kendala perlengkapan, tempat, keamanan, kebersihan, logistik, atau jadwal yang dilaporkan."
            />
          </InfoPanel>

          <InfoPanel icon={Bell} title="Notifikasi" description="Notifikasi muncul saat ada pemicu resmi.">
            <CompactEmptyState title="Belum Ada Notifikasi" description="Notifikasi tugas, kendala, kegiatan, tempat, checklist, dan prioritas penting akan muncul di sini." />
          </InfoPanel>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InfoPanel icon={ClipboardList} title="Manajemen Tugas" description="Buat, tugaskan, update, selesaikan, arsipkan, dan lampirkan bukti tugas resmi.">
          <EmptyDataTable
            columns={["ID Tugas", "Nama Tugas", "PIC", "Divisi", "Batas Waktu", "Prioritas", "Status", "Bukti"]}
            emptyTitle="Belum Ada Tugas"
            emptyDescription="Belum ada catatan tugas resmi untuk cakupan divisi ini."
          />
        </InfoPanel>

        <InfoPanel icon={FileCheck} title="Checklist Kesiapan" description="Catatan checklist kesiapan divisi.">
          <OperationsChecklist divisionId={divisionId} />
        </InfoPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <InfoPanel icon={Activity} title="Aktivitas Divisi" description="Area kerja yang didukung divisi lapangan.">
          <OperationsDivisionActivities divisionId={divisionId} />
        </InfoPanel>

        <InfoPanel icon={FileText} title="Laporan Kepanitiaan" description="Laporan tugas, tempat, kendala, checklist, divisi, dan laporan akhir.">
          <EmptyDataTable
            columns={["Jenis Laporan", "Divisi", "Dibuat Oleh", "Dibuat Pada", "Format", "Status"]}
            emptyTitle="Belum Ada Laporan"
            emptyDescription="Laporan PDF, Excel, dan CSV akan muncul setelah dibuat resmi."
          />
        </InfoPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <InfoPanel icon={CalendarDays} title="Kegiatan Berikutnya" description="Jadwal resmi berikutnya yang relevan untuk cakupan divisi ini.">
          <OperationsActivityTable rows={upcomingRows} emptyTitle="Belum Ada Jadwal" />
        </InfoPanel>

        <InfoPanel icon={Activity} title="Aktivitas Terbaru" description="Riwayat kepanitiaan muncul setelah ada update resmi.">
          <CompactEmptyState title={WAITING} description="Tugas selesai, tempat diperbarui, kendala dilaporkan, checklist dikirim, dan perubahan status akan muncul di sini." />
        </InfoPanel>
      </section>
    </div>
  )
}

function AdministrationDashboardScreen({ summary, user }: { summary: DashboardSummary; user: UserDTO }) {
  return <AdministrationControlCenter summary={summary} user={user} />
}

export function DashboardModuleScreen({
  moduleKey,
  permissions = [],
  summary,
  user,
}: {
  moduleKey: DashboardModuleKey
  permissions?: Permission[]
  summary: DashboardSummary
  user?: UserDTO
}) {
  switch (moduleKey) {
    case "administration":
      return <AdministrationDashboardScreen summary={summary} user={user ?? summaryUserFallback()} />
    case "schedule-management":
      return <ScheduleManagementControlRoom initialSchedules={summary.todaySchedule} permissions={permissions} user={user ?? summaryUserFallback()} />
    case "participant-management":
      return <ParticipantRegistrationCenter permissions={permissions} user={user ?? summaryUserFallback()} />
    case "panitia-management":
      return <PanitiaManagementScreen user={user ?? summaryUserFallback()} />
    case "event-rundown":
      return <OperationsDashboardSystemScreen divisionId="acara" moduleTitle="Rundown Kegiatan" summary={summary} user={user ?? summaryUserFallback()} />
    case "equipment-inventory":
      return <OperationsDashboardSystemScreen divisionId="perlengkapan" moduleTitle="Perlengkapan & Setup Tempat" summary={summary} user={user ?? summaryUserFallback()} />
    case "security-operations":
      return <OperationsDashboardSystemScreen divisionId="keamanan" moduleTitle="Keamanan" summary={summary} user={user ?? summaryUserFallback()} />
    case "cleanliness-operations":
      return <OperationsDashboardSystemScreen divisionId="kebersihan" moduleTitle="Kebersihan" summary={summary} user={user ?? summaryUserFallback()} />
    case "tasks":
    case "division-activities":
      return <OperationsDashboardSystemScreen moduleTitle={getModuleTitle(moduleKey)} summary={summary} user={user ?? summaryUserFallback()} />
    case "media-center":
    case "media-upload":
    case "media-gallery":
    case "media-highlights":
    case "media-archive":
      return <MediaCenterScreen />
    case "announcement-center":
      return <AnnouncementCenterScreen summary={summary} />
    case "humas-sponsorship":
      return <HumasSponsorshipScreen summary={summary} user={user ?? summaryUserFallback()} />
    case "business-operations": {
      const currentUser = user ?? summaryUserFallback()

      return (
        <BusinessDashboardSystemScreen
          focus={getBusinessFocusForUser(currentUser)}
          summary={summary}
          user={currentUser}
        />
      )
    }
    case "juknis-management":
    case "documents":
      return <JuknisManagementScreen moduleKey={moduleKey} />
    case "analytics":
    case "reports":
      return <AnalyticsScreen summary={summary} moduleKey={moduleKey} />
    case "settings":
      return <SettingsScreen user={user ?? summaryUserFallback()} />
    case "live-match":
      return <LiveMatchOperationsScreen />
    case "bracket-management":
      return <BracketManagementScreen />
    case "match-results":
      return <MatchResultInputScreen />
    default:
      return <GenericWorkspaceScreen moduleKey={moduleKey} />
  }
}

function PanitiaManagementScreen({ user }: { user: UserDTO }) {
  return <PanitiaManagementModule user={user} />
}

function MediaCenterScreen() {
  return <PddCenterScreen />
}

function AnnouncementCenterScreen({ summary }: { summary: DashboardSummary }) {
  void summary

  return <AnnouncementCommandCenter />
}

function JuknisManagementScreen({ moduleKey }: { moduleKey: DashboardModuleKey }) {
  const isDocuments = moduleKey === "documents"

  return <JuknisManagementModule title={isDocuments ? "Documents" : "Juknis Management"} />
}

function AnalyticsScreen({ moduleKey, summary }: { moduleKey: DashboardModuleKey; summary: DashboardSummary }) {
  if (moduleKey === "reports") {
    return <OperationalReportsScreen summary={summary} />
  }

  return <AnalyticsCenterScreen summary={summary} />
}

function OperationalReportsScreen({ summary }: { summary: DashboardSummary }) {
  const totalTasks = summary.upcomingTasks.length
  const overdueTasks = summary.upcomingTasks.filter((task) => isPastDeadline(task.deadline) && task.status !== "Completed").length
  const pendingHandoffs = summary.divisionHandoffs.filter((handoff) => handoff.status === "Menunggu").length
  const issueDivisionCounts = summary.activeIssues.reduce<Record<string, number>>((counts, issue) => {
    const key = issue.assignedDivisionName ?? "Belum Ditentukan"
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
  const topIssueDivision = Object.entries(issueDivisionCounts).sort((first, second) => second[1] - first[1])[0]
  const completedTasks = summary.upcomingTasks.filter((task) => task.status === "Completed").length
  const inProgressTasks = summary.upcomingTasks.filter((task) => task.status === "In Progress").length
  const blockedTasks = summary.upcomingTasks.filter((task) => task.status === "Blocked").length
  const taskTotalForChart = Math.max(totalTasks, 1)
  const severityRows = ["Kritis", "Tinggi", "Sedang", "Rendah"].map((severity) => ({
    label: severity,
    value: summary.activeIssues.filter((issue) => issue.severity === severity).length,
  }))

  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/reports", icon: Download, label: "Export PDF" },
          { href: "/dashboard/reports", icon: Download, label: "Export Excel" },
        ]}
        icon={FileCheck}
        subtitle="Ringkasan operasional untuk tugas, kendala, koordinasi, jadwal, dan aktivitas MCS 1."
        title="Laporan Operasional"
      />

      <StatStrip
        items={[
          { label: "Total Tugas", value: totalTasks || NO_DATA, tone: totalTasks ? "info" : "neutral" },
          { label: "Tugas Terlambat", value: overdueTasks, tone: overdueTasks ? "danger" : "success" },
          { label: "Tiket Kendala Aktif", value: summary.activeIssues.length, tone: summary.activeIssues.length ? "warning" : "success" },
          { label: "Koordinasi Menunggu Respon", value: pendingHandoffs, tone: pendingHandoffs ? "warning" : "success" },
          { label: "Jadwal Hari Ini", value: summary.todaySchedule.length || NO_DATA, tone: "gold" },
          { label: "Divisi Dengan Kendala Terbanyak", value: topIssueDivision ? `${topIssueDivision[0]} (${topIssueDivision[1]})` : NO_DATA, tone: topIssueDivision ? "danger" : "neutral" },
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={BarChart3} title="Grafik Penyelesaian Tugas" description="Distribusi status tugas yang sudah tercatat.">
          <ProgressRows
            rows={[
              { label: "Selesai", value: completedTasks, total: taskTotalForChart, tone: "success" },
              { label: "Berjalan", value: inProgressTasks, total: taskTotalForChart, tone: "info" },
              { label: "Tertahan", value: blockedTasks, total: taskTotalForChart, tone: "danger" },
              { label: "Terjadwal", value: Math.max(totalTasks - completedTasks - inProgressTasks - blockedTasks, 0), total: taskTotalForChart, tone: "warning" },
            ]}
          />
        </InfoPanel>

        <InfoPanel icon={AlertTriangle} title="Grafik Kendala" description="Distribusi severity tiket kendala aktif.">
          <ProgressRows
            rows={severityRows.map((row) => ({
              label: row.label,
              value: row.value,
              total: Math.max(summary.activeIssues.length, 1),
              tone: row.label === "Kritis" || row.label === "Tinggi" ? "danger" : row.label === "Sedang" ? "warning" : "info",
            }))}
          />
        </InfoPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InfoPanel icon={Activity} title="Aktivitas Terbaru" description="Jejak perubahan dari workflow operasional.">
          <RecentActivityList summary={summary} />
        </InfoPanel>

        <InfoPanel icon={Download} title="Export" description="Format laporan untuk arsip kepanitiaan.">
          <div className="grid gap-3">
            <button type="button" className="mcs-button-secondary inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold">
              <Download className="size-4 text-[#0EA5E9]" aria-hidden="true" />
              Export PDF
            </button>
            <button type="button" className="mcs-button-secondary inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold">
              <Download className="size-4 text-[#0EA5E9]" aria-hidden="true" />
              Export Excel
            </button>
            <p className="rounded-lg border border-[#111827]/10 bg-[#FFF7ED] px-3 py-2 text-xs font-semibold leading-5 text-[#6B7280]">
              Export memakai data resmi yang sudah masuk ke modul operasional.
            </p>
          </div>
        </InfoPanel>
      </section>
    </div>
  )
}

function ProgressRows({
  rows,
}: {
  rows: Array<{ label: string; total: number; tone: StatusTone; value: number }>
}) {
  return (
    <div className="grid gap-3">
      {rows.map((row) => {
        const percent = row.total > 0 ? Math.round((row.value / row.total) * 100) : 0

        return (
          <div key={row.label} className="mcs-list-row rounded-lg p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-[#111827]">{row.label}</span>
              <span className="font-bold text-[#6B7280]">{row.value}</span>
            </div>
            <div className="mcs-progress-track mt-3 h-2 rounded-full">
              <div className={cn("h-full rounded-full", getProgressToneClass(row.tone))} style={{ width: `${Math.min(percent, 100)}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function getProgressToneClass(tone: StatusTone) {
  if (tone === "success") return "bg-[#22C55E]"
  if (tone === "danger") return "bg-[#DC2626]"
  if (tone === "warning" || tone === "gold") return "bg-[#F97316]"
  if (tone === "info") return "bg-[#0EA5E9]"
  return "bg-[#111827]"
}

function isPastDeadline(value: string) {
  const timestamp = Date.parse(value)

  return Number.isFinite(timestamp) && timestamp < Date.now()
}

function SettingsScreen({ user }: { user: UserDTO }) {
  return <SettingsCenter user={user} />
}

function LiveMatchOperationsScreen() {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[{ href: "/dashboard/match-results", icon: Trophy, label: "Input Hasil" }]}
        icon={Radio}
        subtitle="Pantauan cepat untuk match aktif dan status skor."
        title="Pantauan Pertandingan"
      />
      <InfoPanel icon={Radio} title="Bagian Pertandingan Live" description="Hanya lomba aktif yang muncul di sini.">
        <EmptyState title={MATCH_UNAVAILABLE} description="Catatan pertandingan live resmi belum dipublikasikan." />
      </InfoPanel>
    </div>
  )
}

function BracketManagementScreen() {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/bracket", icon: GitBranch, label: "Buat Bracket" },
          { href: "/dashboard/bracket", icon: FileText, label: "Ekspor Bracket" },
        ]}
        icon={GitBranch}
        subtitle="Kelola bracket turnamen dengan layout yang rapi."
        title="Manajemen Bracket"
      />
      <InfoPanel icon={GitBranch} title="Header Bracket" description="Ikhtisar round, kartu match, progres pemenang, dan aksi bracket.">
        <EmptyState title="Bracket Belum Dibuat" description="Data bracket resmi belum dipublikasikan." />
      </InfoPanel>
    </div>
  )
}

function MatchResultInputScreen() {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[{ href: "/dashboard/match-results", icon: Trophy, label: "Kirim Hasil" }]}
        icon={Trophy}
        subtitle="Input hasil cepat untuk PJ Lomba."
        title="Input Hasil Match"
      />
      <InfoPanel icon={ClipboardList} title="Form Input Hasil" description="Lomba, match, peserta, skor, pemenang, status, catatan, dan pengiriman.">
        <DocumentStatusList
          items={[
            "Pilih Lomba",
            "Pilih Match",
            "Team A / Participant A",
            "Team B / Participant B",
            "Input Skor",
            "Pilih Pemenang",
            "Status Match",
            "Catatan",
          ]}
        />
      </InfoPanel>
    </div>
  )
}

function GenericWorkspaceScreen({ moduleKey }: { moduleKey: DashboardModuleKey }) {
  const config = getGenericWorkspaceConfig(moduleKey)

  return (
    <div className="grid gap-6">
      <OperationsHeader actions={config.actions} icon={config.icon} subtitle={config.subtitle} title={config.title} />
      <InfoPanel icon={config.icon} title={config.panelTitle} description={config.panelDescription}>
        <EmptyState title={NO_DATA} description={config.emptyDescription} />
      </InfoPanel>
    </div>
  )
}

function OperationsHeader({
  actions,
  icon: Icon,
  subtitle,
  title,
}: {
  actions: ActionLink[]
  icon: LucideIcon
  subtitle: string
  title: string
}) {
  return (
    <section className="mcs-soft-surface mcs-starburst overflow-hidden rounded-lg p-5 after:-right-5 after:top-4">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="relative z-10 flex min-w-0 gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-[#111827]/15 bg-[#F97316] text-white shadow-[3px_3px_0_rgba(17,24,39,0.16)]">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-2xl font-bold tracking-normal text-[#111827]">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#6B7280]">{subtitle}</p>
          </div>
        </div>

        <ActionGrid actions={actions} compact />
      </div>
    </section>
  )
}

function ActionGrid({ actions, compact = false }: { actions: ActionLink[]; compact?: boolean }) {
  return (
    <div className={cn("flex flex-wrap gap-2", compact ? "lg:justify-end" : "")}>
      {actions.slice(0, 6).map((action) => {
        const Icon = action.icon

        return (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className="mcs-button-secondary inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-none"
          >
            <Icon className="size-4 text-[#0EA5E9]" aria-hidden="true" />
            {action.label}
          </Link>
        )
      })}
    </div>
  )
}

function InfoPanel({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: ReactNode
  description: string
  icon: LucideIcon
  title: string
}) {
  return (
    <section className="mcs-surface min-w-0 overflow-hidden rounded-lg">
      <div className="flex items-start gap-3 border-b border-[#111827]/10 px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#111827]/10 bg-[#FFF7ED] text-[#F97316]">
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

function EventInfoPanel() {
  return (
    <InfoPanel icon={Globe} title="Event Information" description="Official MCS 1 event identity.">
      <div className="grid gap-3">
        <FactTile label="Event" value={event.shortName} />
        <FactTile label="Theme" value={event.theme} />
        <FactTile label="Date" value={event.dateRange} />
        <FactTile label="Organizer" value={event.organizer} />
      </div>
    </InfoPanel>
  )
}

function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {items.map((item) => (
        <article key={item.label} className="mcs-neo-card rounded-lg p-4">
          <p className="text-sm font-semibold text-[#6B7280]">{item.label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="min-w-0 font-heading text-xl font-bold leading-6 tracking-normal text-[#111827]">{item.value}</p>
            <span className={cn("mb-1 size-2.5 shrink-0 rounded-full", getStatDotClass(item.tone ?? "neutral"))} />
          </div>
        </article>
      ))}
    </section>
  )
}

function FactTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#111827]/10 bg-[#FFF7ED] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#111827]">{value}</p>
    </div>
  )
}

function EmptyState({
  description,
  nextAction,
  title,
}: {
  description: string
  nextAction?: string
  title: string
}) {
  const displayTitle = getEmptyStateTitle(title)

  return (
    <div className="mcs-inset-panel grid min-h-40 place-items-center rounded-lg border-dashed px-4 py-10 text-center">
      <div className="max-w-sm">
        <span className="mcs-empty-mark" aria-hidden="true">
          <span />
          <i />
        </span>
        <p className="text-sm font-semibold text-[#111827]">{displayTitle}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p>
        <p className="mt-3 rounded-lg border border-[#111827]/10 bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#111827]">
          Next Action: {nextAction ?? getEmptyStateAction(displayTitle)}
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return (
    <span className={cn("inline-flex h-7 w-fit items-center rounded-md border px-2.5 text-xs font-bold", statusClasses[tone])}>
      {label}
    </span>
  )
}

function StatusGrid({ items }: { items: Array<{ label: string; status: string; tone?: StatusTone }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-[#111827]/10 bg-[#FFFDF8] p-3">
          <span className="text-sm font-medium text-[#111827]">{item.label}</span>
          <StatusBadge label={item.status} tone={item.tone ?? "neutral"} />
        </div>
      ))}
    </div>
  )
}

function FilterBar({ fields, searchPlaceholder }: { fields: string[]; searchPlaceholder: string }) {
  return (
    <section className="mcs-surface grid gap-3 rounded-lg p-4 md:grid-cols-2 xl:grid-cols-6">
      <label className="relative grid gap-1.5 xl:col-span-2">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">Search</span>
        <span className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#0EA5E9]" aria-hidden="true" />
          <input
            className="h-10 w-full rounded-lg border border-[#111827]/12 bg-white pl-9 pr-3 text-sm font-medium text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
            placeholder={searchPlaceholder}
            type="search"
          />
        </span>
      </label>
      {fields.map((field) => (
        <label key={field} className="grid gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{field}</span>
          <select className="h-10 rounded-lg border border-[#111827]/12 bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20">
            <option>All</option>
          </select>
        </label>
      ))}
    </section>
  )
}

function ScheduleTable({
  emptyTitle,
  schedules,
}: {
  emptyTitle: string
  schedules: DashboardSummary["todaySchedule"]
}) {
  if (schedules.length === 0) {
    return <EmptyState title={emptyTitle} description="Official schedule data is not available for this view." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Time", "Activity", "Venue", "PIC", "Status"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{formatScheduleTime(schedule.time)}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#111827]">{schedule.title}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.venue}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.pic}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <StatusBadge label={formatStatus(schedule.status)} tone={getScheduleTone(schedule.status)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AnnouncementList({ summary }: { summary: DashboardSummary }) {
  if (summary.announcements.length === 0) {
    return <EmptyState title={NOT_PUBLISHED} description="No official announcement is visible for this role yet." />
  }

  return (
    <div className="grid gap-3">
      {summary.announcements.slice(0, 3).map((announcement) => (
        <article key={announcement.id} className="mcs-list-row rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <h4 className="min-w-0 text-sm font-semibold text-[#111827]">{announcement.title}</h4>
            <StatusBadge label={formatStatus(announcement.priority)} tone={getPriorityTone(announcement.priority)} />
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-[#64748B]">{announcement.body}</p>
        </article>
      ))}
    </div>
  )
}

function TaskList({ summary }: { summary: DashboardSummary }) {
  if (summary.upcomingTasks.length === 0) {
    return <EmptyState title={WAITING} description="Tugas resmi belum ditugaskan." />
  }

  return (
    <div className="grid gap-3">
      {summary.upcomingTasks.map((task) => (
        <article key={task.id} className="mcs-list-row grid gap-3 rounded-lg p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-[#111827]">{task.title}</h4>
            <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{task.division} - {task.assigneeName}</p>
          </div>
          <StatusBadge label={formatStatus(task.status)} tone={task.status === "Blocked" ? "danger" : task.status === "Completed" ? "success" : "warning"} />
        </article>
      ))}
    </div>
  )
}

function RecentActivityList({ summary }: { summary: DashboardSummary }) {
  if (summary.auditPreview.length === 0) {
    return <EmptyState title={WAITING} description="Aktivitas terbaru muncul setelah ada update resmi." />
  }

  return (
    <div className="grid gap-3">
      {summary.auditPreview.slice(0, 5).map((item) => (
        <article key={item.id} className="mcs-list-row flex gap-3 rounded-lg p-3">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-[#F97316]" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{formatStatus(item.action.replace(".", " "))}</p>
            <p className="mt-1 text-xs font-medium text-[#64748B]">{formatDate(item.timestamp)} - {item.userName}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

function FinancialSummaryGrid() {
  const items = [
    ["Total Anggaran", formatRupiahRange(budgetSummary.totalMinAmount, budgetSummary.totalMaxAmount)],
    ["Total Pemasukan", "Belum Ada Pemasukan Sponsor"],
    ["Total Pengeluaran", "Belum Ada Catatan Keuangan"],
    ["Sisa Anggaran", "Belum Ada Catatan Keuangan"],
  ]

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
          <p className="mt-2 truncate text-base font-semibold text-[#111827]">{value}</p>
        </div>
      ))}
    </div>
  )
}

function SponsorshipIncomeTable() {
  if (sponsorProspects.length === 0) {
    return (
      <FinanceEmptyTable
        columns={["Nama Sponsor", "Nominal", "Status", "Tanggal Diterima"]}
        emptyTitle="Belum Ada Pemasukan Sponsor"
        emptyDescription="Catatan pemasukan sponsor belum tersedia."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Nama Sponsor", "Nominal", "Status", "Tanggal Diterima"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sponsorProspects.map((sponsor) => (
            <tr key={sponsor.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{sponsor.name}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">
                {sponsor.receivedAmount ? formatRupiah(sponsor.receivedAmount) : "Belum Ada Pemasukan Sponsor"}
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={sponsor.proposalStatus} tone={getSponsorTone(sponsor.proposalStatus)} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0 text-[#64748B]">{sponsor.receivedDate ?? NO_DATA}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PaymentStatusLegend() {
  const statuses: Array<{ label: string; tone: StatusTone }> = [
    { label: "Tertunda", tone: "warning" },
    { label: "Lunas", tone: "success" },
    { label: "Terlambat", tone: "danger" },
    { label: "Dibatalkan", tone: "neutral" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <StatusBadge key={status.label} label={status.label} tone={status.tone} />
      ))}
    </div>
  )
}

function FinanceEmptyTable({
  columns,
  emptyDescription,
  emptyTitle,
}: {
  columns: string[]
  emptyDescription: string
  emptyTitle: string
}) {
  return <EmptyDataTable columns={columns} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
}

function EmptyDataTable({
  columns,
  emptyDescription,
  emptyTitle,
}: {
  columns: string[]
  emptyDescription: string
  emptyTitle: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {columns.map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} className="py-4">
              <CompactEmptyState title={emptyTitle} description={emptyDescription} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function BudgetAllocationTable() {
  const allocations = getBudgetAllocations()

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Divisi", "Anggaran", "Terpakai", "Sisa", "Status"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allocations.map((allocation) => (
            <tr key={allocation.division}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{allocation.division}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">
                {allocation.minAmount > 0 ? formatRupiahRange(allocation.minAmount, allocation.maxAmount) : NO_DATA}
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{NO_DATA}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{allocation.minAmount > 0 ? "Belum Ada Catatan Keuangan" : NO_DATA}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <StatusBadge label={allocation.minAmount > 0 ? "Direncanakan" : "Belum Ada Catatan Keuangan"} tone={allocation.minAmount > 0 ? "info" : "neutral"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FinancialActivityList({ items }: { items: DashboardSummary["auditPreview"] }) {
  if (items.length === 0) {
    return <CompactEmptyState title="Belum Ada Catatan Keuangan" description="Aktivitas pengeluaran, pemasukan, pembayaran, anggaran, dan laporan akan muncul di sini." />
  }

  return <ActivityRows items={items} />
}

function FinancialDeadlineTable({ tasks }: { tasks: DashboardSummary["upcomingTasks"] }) {
  if (tasks.length === 0) {
    return (
      <FinanceEmptyTable
        columns={["Tugas", "Batas Waktu", "Prioritas", "Divisi PIC"]}
        emptyTitle="Belum Ada Catatan Keuangan"
        emptyDescription="Deadline keuangan dan tugas verifikasi belum ditugaskan."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Tugas", "Batas Waktu", "Prioritas", "Divisi PIC"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{task.title}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{task.deadline}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={formatStatus(task.priority)} tone={task.priority === "High" ? "danger" : task.priority === "Medium" ? "warning" : "neutral"} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0 text-[#64748B]">{task.division}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompactEmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="mcs-inset-panel rounded-lg border-dashed px-4 py-6 text-center">
      <span className="mcs-empty-mark" aria-hidden="true">
        <span />
        <i />
      </span>
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm font-medium leading-6 text-[#6B7280]">{description}</p>
    </div>
  )
}

function StatMiniList({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item.label} className="mcs-list-row flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
          <span className="text-sm font-medium text-[#64748B]">{item.label}</span>
          <span className="max-w-[55%] truncate text-right text-sm font-semibold text-[#111827]">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function LiveMatchStatusPanel({ liveMatch }: { liveMatch?: DashboardSummary["liveMatches"][number] }) {
  if (!liveMatch) {
    return <EmptyState title="Belum Ada Lomba Aktif" description="Belum ada pertandingan live yang dipublikasikan untuk PJ Lomba." />
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 rounded-md border border-[#DCFCE7] bg-[#F0FDF4] p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#16A34A]" />
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#166534]">Live Match</p>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-[#111827]">{liveMatch.sport}</h3>
          <p className="mt-1 text-sm font-medium text-[#64748B]">{formatNationName(liveMatch.teamA)} vs {formatNationName(liveMatch.teamB)}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-2xl font-semibold text-[#111827]">{liveMatch.scoreA} - {liveMatch.scoreB}</p>
          <StatusBadge label={formatStatus(liveMatch.status)} tone="success" />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <FactTile label="Current Round" value={liveMatch.round} />
        <FactTile label="Venue" value={liveMatch.venue} />
        <FactTile label="PIC" value={WAITING} />
        <FactTile label="Time" value={liveMatch.time} />
      </div>
    </div>
  )
}

function formatNationName(value: string) {
  const nation = getNationByClassName(value) ?? getNationByCountryName(value)

  return nation ? `${nation.countryFlag} ${nation.countryName}` : value
}

function MatchScheduleTable({ schedules }: { schedules: DashboardSummary["todaySchedule"] }) {
  if (schedules.length === 0) {
    return <EmptyState title="No Match Scheduled" description="Official match schedule records are not available for this view." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Time", "Match", "Venue", "Round", "Status"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{formatScheduleTime(schedule.time)}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 font-medium text-[#111827]">{schedule.title}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.venue}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{getRoundLabel(schedule.title)}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <StatusBadge label={formatScheduleStatus(schedule.status)} tone={getScheduleTone(schedule.status)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ResultInputShortcut() {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {["Team A", "Team B", "Score", "Winner"].map((field) => (
          <label key={field} className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{field}</span>
            <input
              className="h-10 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 text-sm font-medium text-[#111827] outline-none"
              placeholder={NO_DATA}
            />
          </label>
        ))}
      </div>
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">Notes</span>
        <textarea
          className="min-h-20 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2 text-sm font-medium text-[#111827] outline-none"
          placeholder={WAITING}
        />
      </label>
      <ActionGrid actions={[{ href: "/dashboard/match-results", icon: ClipboardList, label: "Submit Result" }]} />
    </div>
  )
}

function CompetitionAnnouncementList({
  announcements,
}: {
  announcements: DashboardSummary["announcements"]
}) {
  if (announcements.length === 0) {
    return <EmptyState title={NOT_PUBLISHED} description="Competition announcements, venue changes, and rule updates are waiting for updates." />
  }

  return (
    <div className="grid gap-3">
      {announcements.slice(0, 4).map((announcement) => (
        <article key={announcement.id} className="rounded-md border border-[#E5E7EB] p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-sm font-semibold text-[#111827]">{announcement.title}</p>
            <StatusBadge label={formatStatus(announcement.priority)} tone={getPriorityTone(announcement.priority)} />
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-[#64748B]">{announcement.body}</p>
        </article>
      ))}
    </div>
  )
}

function CompetitionActivityList({ items }: { items: DashboardSummary["auditPreview"] }) {
  if (items.length === 0) {
    return <EmptyState title={WAITING} description="Score, match, bracket, participant, and schedule activity will appear here." />
  }

  return <ActivityRows items={items} />
}

function ActivityRows({ items }: { items: DashboardSummary["auditPreview"] }) {
  return (
    <div className="grid gap-3">
      {items.slice(0, 5).map((item) => (
        <article key={item.id} className="mcs-list-row grid gap-2 rounded-lg p-3 md:grid-cols-[minmax(0,1fr)_160px] md:items-center">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{formatStatus(item.action.replace(".", " "))}</p>
            <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{item.resource} - {item.userName}</p>
          </div>
          <p className="text-xs font-medium text-[#64748B] md:text-right">{formatDate(item.timestamp)}</p>
        </article>
      ))}
    </div>
  )
}

function DocumentStatusList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item} className="mcs-list-row flex items-center justify-between gap-3 rounded-lg p-3">
          <span className="text-sm font-medium text-[#111827]">{item}</span>
          <StatusBadge label={NO_DATA} tone="neutral" />
        </div>
      ))}
    </div>
  )
}

const divisionOperationsRoles: DivisionOperationsRole[] = [
  "acara",
  "kebersihan",
  "perlengkapan",
  "keamanan",
  "kewirausahaan",
]

function isDivisionOperationsRole(role: UserRole): role is DivisionOperationsRole {
  return divisionOperationsRoles.includes(role as DivisionOperationsRole)
}

function DivisionTaskList({ tasks }: { tasks: DashboardSummary["upcomingTasks"] }) {
  if (tasks.length === 0) {
    return <CompactEmptyState title={WAITING} description="Tugas divisi belum ditugaskan." />
  }

  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <article key={task.id} className="mcs-list-row grid gap-3 rounded-lg p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-[#111827]">{task.title}</h4>
            <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{task.deadline} - {task.assigneeName}</p>
          </div>
          <StatusBadge label={formatStatus(task.status)} tone={task.status === "Blocked" ? "danger" : task.status === "Completed" ? "success" : "warning"} />
        </article>
      ))}
    </div>
  )
}

function OperationsActivityTable({
  emptyTitle,
  rows,
}: {
  emptyTitle: string
  rows: OperationsScheduleRow[]
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description="Belum ada kegiatan resmi yang dijadwalkan untuk tampilan ini." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Nama Kegiatan", "Divisi", "Tempat", "PIC", "Mulai", "Selesai", "Status", "Prioritas"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0">
                <p className="font-semibold text-[#111827]">{row.title}</p>
                <p className="mt-1 text-xs font-medium text-[#64748B]">{row.label} - {row.dayName}</p>
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{getScheduleDivisionLabel(row)}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{row.venue}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{row.pic}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{formatScheduleTime(row.time)}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{NO_DATA}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge
                  label={formatStatus(row.status)}
                  tone={row.status === "Completed" ? "success" : row.status === "Delayed" ? "warning" : "gold"}
                />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <StatusBadge label={formatStatus(row.priority)} tone={row.priority === "Critical" ? "danger" : row.priority === "High" ? "warning" : "neutral"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OperationsVenueStatus({
  rows,
  upcomingRows,
}: {
  rows: OperationsScheduleRow[]
  upcomingRows: OperationsScheduleRow[]
}) {
  const activeRows = rows.length > 0 ? rows : upcomingRows

  return (
    <div className="grid gap-2">
      {officialOperationsVenues.map((venue) => {
        const current = activeRows.find((row) => row.venue === venue)

        return (
          <div key={venue} className="rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-[#111827]">{venue}</p>
              <StatusBadge label={current ? "Terpakai" : "Tersedia"} tone={current ? "info" : "neutral"} />
            </div>
            <p className="mt-2 line-clamp-2 text-xs font-medium text-[#64748B]">
              {current ? `${formatScheduleTime(current.time)} - ${current.title}` : "Belum ada kegiatan berjalan"}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function OperationsChecklist({ divisionId }: { divisionId?: FieldOperationsRole }) {
  const checklist = divisionId ? operationsDivisionDetails[divisionId].checklist : baseOperationsChecklist

  return (
    <div className="grid gap-2">
      {checklist.map((item) => (
        <div key={item} className="flex items-center justify-between gap-3 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3">
          <span className="text-sm font-semibold text-[#111827]">{item}</span>
          <StatusBadge label="Menunggu" tone="neutral" />
        </div>
      ))}
    </div>
  )
}

function OperationsDivisionActivities({ divisionId }: { divisionId?: FieldOperationsRole }) {
  const divisions = divisionId ? [divisionId] : fieldOperationsRoles

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {divisions.map((division) => {
        const detail = operationsDivisionDetails[division]

        return (
          <article key={division} className="rounded-lg border border-[#E5E7EB] bg-[#F8F9FB] p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white text-[#0F172A]">
                <detail.icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#111827]">{detail.label}</h3>
                <p className="mt-1 text-xs font-medium leading-5 text-[#64748B]">{detail.description}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.activities.map((activity) => (
                <span key={activity} className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1 text-xs font-semibold text-[#64748B]">
                  {activity}
                </span>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}

const fieldOperationsRoles: FieldOperationsRole[] = ["acara", "perlengkapan", "keamanan", "kebersihan"]

const officialOperationsVenues = [
  "Lapangan A",
  "Lapangan B",
  "Connecting Room",
  "R. Avis",
  "Ruang PDD",
  "Area Sekolah",
]

const baseOperationsChecklist = [
  "Activity readiness",
  "Venue status",
  "PIC confirmation",
  "Issue report queue",
  "Completion evidence",
]

const operationsDivisionDetails: Record<
  FieldOperationsRole,
  {
    activities: string[]
    checklist: string[]
    description: string
    icon: LucideIcon
    label: string
    keywords: string[]
  }
> = {
  acara: {
    activities: ["Master Rundown", "Stage Preparation", "Opening Ceremony", "Awarding Ceremony", "Closing Ceremony", "PIC Coordination"],
    checklist: ["Rundown lock", "MC and PIC briefing", "Ceremony cue sheet", "Venue handoff", "Closing report"],
    description: "Rundown, ceremony, stage, awarding, and PIC coordination.",
    icon: CalendarDays,
    keywords: ["acara", "ceremony", "opening", "closing", "mc", "ospk", "pengumuman", "awarding", "fun match"],
    label: "Acara",
  },
  perlengkapan: {
    activities: ["Equipment Distribution", "Inventory Tracking", "Venue Setup", "Equipment Recovery", "Logistics Support"],
    checklist: ["Inventory status", "Venue setup", "Equipment request queue", "Return status", "Logistics handoff"],
    description: "Equipment movement, venue setup, inventory, and logistics support.",
    icon: ClipboardList,
    keywords: ["perlengkapan", "equipment", "setup", "inventory", "logistics", "sound", "alat"],
    label: "Perlengkapan",
  },
  keamanan: {
    activities: ["Area Monitoring", "Security Patrol", "Incident Response", "Crowd Management", "Access Control"],
    checklist: ["Guard post readiness", "Crowd flow", "Access point status", "Incident queue", "Shift handoff"],
    description: "Gate control, crowd flow, area monitoring, and incident response.",
    icon: ShieldCheck,
    keywords: ["keamanan", "security", "gate", "crowd", "patrol", "access", "incident"],
    label: "Keamanan",
  },
  kebersihan: {
    activities: ["Operation Semut", "Area Cleaning", "Waste Management", "Venue Inspection", "Cleanliness Monitoring"],
    checklist: ["Operation Semut", "Waste point status", "Area cleaning", "Venue inspection", "Completion report"],
    description: "Venue cleanliness, waste points, area cleaning, and post-session sweep.",
    icon: Activity,
    keywords: ["kebersihan", "clean", "semut", "sampah", "cleaning", "piket"],
    label: "Kebersihan",
  },
}

function isFieldOperationsRole(role: UserRole): role is FieldOperationsRole {
  return fieldOperationsRoles.includes(role as FieldOperationsRole)
}

function getOfficialOperationsScheduleRows(): OperationsScheduleRow[] {
  return scheduleDays.flatMap((day) =>
    day.items.map((item, index) => ({
      date: day.date,
      dayName: day.dayName,
      id: `${day.id}-operations-${index}`,
      label: day.label,
      pic: item.pic,
      priority: getOperationsPriority(item.title, item.type),
      status: "Upcoming" as const,
      time: item.time,
      title: item.title,
      type: item.type,
      venue: item.venue,
    })),
  )
}

function getOperationsRowsForDivision(rows: OperationsScheduleRow[], divisionId?: FieldOperationsRole) {
  if (!divisionId) {
    return rows
  }

  const detail = operationsDivisionDetails[divisionId]

  return rows.filter((row) => {
    const haystack = `${row.title} ${row.pic} ${row.venue} ${row.type}`.toLowerCase()

    return detail.keywords.some((keyword) => haystack.includes(keyword))
  })
}

function getOperationsActions(divisionId?: FieldOperationsRole): ActionLink[] {
  const baseHref = divisionId ? getOperationsHref(divisionId) : "/dashboard/division-activities"

  return [
    { href: baseHref, icon: Activity, label: "Update Status" },
    { href: "/dashboard/tasks", icon: ClipboardList, label: "Add Notes" },
    { href: "/dashboard/tasks", icon: FileCheck, label: "Mark Complete" },
    { href: baseHref, icon: ShieldCheck, label: "Report Issue" },
    { href: "/dashboard/reports", icon: Download, label: "Generate Report" },
  ]
}

function getOperationsHref(divisionId: FieldOperationsRole) {
  if (divisionId === "acara") return "/dashboard/event-rundown"
  if (divisionId === "perlengkapan") return "/dashboard/inventory"
  if (divisionId === "keamanan") return "/dashboard/security"
  return "/dashboard/cleanliness"
}

function getOperationsDivisionIcon(divisionId: FieldOperationsRole) {
  return operationsDivisionDetails[divisionId].icon
}

function getScheduleDivisionLabel(row: OperationsScheduleRow) {
  const matched = fieldOperationsRoles.find((division) => getOperationsRowsForDivision([row], division).length > 0)

  return matched ? operationsDivisionDetails[matched].label : "Kepanitiaan"
}

function getOperationsPriority(title: string, type: string): OperationsScheduleRow["priority"] {
  const normalized = `${title} ${type}`.toLowerCase()

  if (normalized.includes("opening") || normalized.includes("closing") || normalized.includes("final")) return "High"
  if (normalized.includes("semut") || normalized.includes("operation")) return "Medium"
  return "Low"
}

function getDateKeyInTimezone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date)
  const values = new Map(parts.map((part) => [part.type, part.value]))

  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`
}

function getDivisionDashboardSpec(role: DivisionOperationsRole): DivisionDashboardSpec {
  const specs: Record<DivisionOperationsRole, DivisionDashboardSpec> = {
    acara: {
      actions: [
        { href: "/dashboard/event-rundown", icon: CalendarDays, label: "Update Rundown" },
        { href: "/dashboard/schedules", icon: Activity, label: "Kelola Kegiatan" },
        { href: "/dashboard/tasks", icon: ClipboardList, label: "Buat Tugas" },
      ],
      checklistItems: ["Nama Kegiatan", "Tempat", "PIC", "Tanggal", "Waktu", "Status", "Catatan"],
      dataPanelDescription: "Data PIC muncul setelah rundown resmi diperbarui.",
      dataPanelTitle: "Penugasan PIC",
      divisionId: "acara",
      emptyDescription: "Data penugasan PIC belum dipublikasikan.",
      emptyTitle: NO_DATA,
      icon: CalendarDays,
      scheduleTitle: "Master Rundown",
      statusDescription: "Kesiapan rundown, tempat, PIC, dan checklist kegiatan.",
      statusItems: (division) => [
        { label: "Master Rundown", status: WAITING },
        { label: "Kegiatan Hari Ini", status: division ? `${division.activeTasks} tugas aktif` : NO_DATA, tone: division ? "info" : "neutral" },
        { label: "Status Tempat", status: WAITING },
        { label: "Checklist Kegiatan", status: division?.status ?? WAITING, tone: division ? getDivisionTone(division.status) : "neutral" },
      ],
      subtitle: "Ruang kerja Acara untuk rundown, status tempat, penugasan PIC, kegiatan, dan checklist.",
      tableColumns: ["Kegiatan", "Tempat", "PIC", "Tanggal", "Waktu", "Status"],
      title: "Divisi Acara",
    },
    kebersihan: {
      actions: [
        { href: "/dashboard/cleanliness", icon: Activity, label: "Update Area" },
        { href: "/dashboard/reports", icon: FileCheck, label: "Kirim Laporan" },
        { href: "/dashboard/tasks", icon: ClipboardList, label: "Tandai Selesai" },
      ],
      checklistItems: ["Pembagian Area", "Jadwal Bersih", "Operasi Semut", "Kondisi Tempat", "Laporan Kendala", "Status Selesai"],
      dataPanelDescription: "Kondisi area dan laporan kebersihan muncul setelah ada pengajuan resmi.",
      dataPanelTitle: "Pembagian Area",
      divisionId: "kebersihan",
      emptyDescription: "Pembagian area, kondisi tempat, atau laporan kendala belum dipublikasikan.",
      emptyTitle: NO_DATA,
      icon: Activity,
      scheduleTitle: "Jadwal Kebersihan",
      statusDescription: "Kesiapan kebersihan tempat, titik sampah, dan pembersihan setelah sesi.",
      statusItems: (division) => [
        { label: "Pembagian Area", status: WAITING },
        { label: "Operasi Semut", status: WAITING },
        { label: "Kondisi Tempat", status: division?.status ?? WAITING, tone: division ? getDivisionTone(division.status) : "neutral" },
        { label: "Laporan Kendala", status: "Belum Ada Laporan" },
      ],
      subtitle: "Ruang kerja Kebersihan untuk pembagian area, Operasi Semut, kondisi tempat, laporan, dan checklist.",
      tableColumns: ["Area", "Jadwal", "Tim Bertugas", "Kondisi", "Status", "Laporan"],
      title: "Divisi Kebersihan",
    },
    perlengkapan: {
      actions: [
        { href: "/dashboard/inventory", icon: ClipboardList, label: "Tambah Inventaris" },
        { href: "/dashboard/tasks", icon: UserCheck, label: "Tugaskan Barang" },
        { href: "/dashboard/inventory", icon: FileCheck, label: "Update Status" },
      ],
      checklistItems: ["Status Inventaris", "Barang Dipinjam", "Setup Tempat", "Permintaan Barang", "Level Stok", "Status Pengembalian"],
      dataPanelDescription: "Data inventaris dan permintaan barang muncul setelah input resmi Perlengkapan.",
      dataPanelTitle: "Status Inventaris",
      divisionId: "perlengkapan",
      emptyDescription: "Inventaris, barang dipinjam, permintaan barang, atau stok belum tersedia.",
      emptyTitle: NO_DATA,
      icon: ClipboardList,
      scheduleTitle: "Jadwal Setup Tempat",
      statusDescription: "Kesiapan perlengkapan untuk setup lapangan, sound, alat, dan stok.",
      statusItems: (division) => [
        { label: "Status Inventaris", status: NO_DATA },
        { label: "Barang Dipinjam", status: NO_DATA },
        { label: "Setup Tempat", status: division?.status ?? WAITING, tone: division ? getDivisionTone(division.status) : "neutral" },
        { label: "Level Stok", status: NO_DATA },
      ],
      subtitle: "Ruang kerja Perlengkapan untuk status barang, pinjaman, setup tempat, permintaan, dan stok.",
      tableColumns: ["Barang", "Jumlah", "Peminjam", "Tempat", "Status", "Diupdate Oleh"],
      title: "Divisi Perlengkapan",
    },
    keamanan: {
      actions: [
        { href: "/dashboard/security", icon: ShieldCheck, label: "Buat Laporan" },
        { href: "/dashboard/security", icon: Activity, label: "Update Status" },
        { href: "/dashboard/schedules", icon: CalendarDays, label: "Kelola Shift" },
      ],
      checklistItems: ["Pos Jaga", "Pemantauan Area", "Laporan Keamanan", "Laporan Kendala", "Jadwal Shift", "Arus Penonton"],
      dataPanelDescription: "Laporan keamanan dan pos jaga muncul setelah ada pengajuan resmi.",
      dataPanelTitle: "Pos Jaga",
      divisionId: "keamanan",
      emptyDescription: "Pos jaga, shift, pemantauan area, atau laporan keamanan belum dipublikasikan.",
      emptyTitle: NO_DATA,
      icon: ShieldCheck,
      scheduleTitle: "Jadwal Shift",
      statusDescription: "Kesiapan keamanan untuk gerbang, batas lapangan, arus penonton, dan respons kendala.",
      statusItems: (division) => [
        { label: "Pos Jaga", status: WAITING },
        { label: "Pemantauan Area", status: division?.status ?? WAITING, tone: division ? getDivisionTone(division.status) : "neutral" },
        { label: "Laporan Keamanan", status: "Belum Ada Laporan" },
        { label: "Laporan Kendala", status: "Belum Ada Laporan" },
      ],
      subtitle: "Ruang kerja Keamanan untuk pos jaga, pemantauan area, kendala, laporan, dan shift.",
      tableColumns: ["Pos Jaga", "Area", "Shift", "PIC", "Status", "Laporan"],
      title: "Divisi Keamanan",
    },
    kewirausahaan: {
      actions: [
        { href: "/dashboard/business", icon: Archive, label: "Tambah Produk" },
        { href: "/dashboard/business", icon: Wallet, label: "Catat Penjualan" },
        { href: "/dashboard/business", icon: ClipboardList, label: "Update Stock" },
      ],
      checklistItems: ["Katalog Produk", "Transaksi Penjualan", "Pantauan Inventaris", "Catatan Pengeluaran", "Laporan Harian", "Audit Stok"],
      dataPanelDescription: "Produk, penjualan, inventaris, pengeluaran, dan laporan muncul setelah input resmi Kewirausahaan.",
      dataPanelTitle: "Katalog Produk",
      divisionId: "kewirausahaan",
      emptyDescription: "Produk, transaksi, inventaris, pengeluaran, atau laporan belum tersedia.",
      emptyTitle: NO_DATA,
      icon: Wallet,
      scheduleTitle: "Jadwal Kewirausahaan",
      statusDescription: "Kesiapan penjualan untuk produk, stok, transaksi, pengeluaran, pemasukan, dan laporan.",
      statusItems: (division) => [
        { label: "Katalog Produk", status: "Belum Ada Produk" },
        { label: "Transaksi Penjualan", status: "Belum Ada Transaksi" },
        { label: "Pantauan Inventaris", status: division?.status ?? WAITING, tone: division ? getDivisionTone(division.status) : "neutral" },
        { label: "Laporan Harian", status: "Belum Ada Laporan" },
      ],
      subtitle: "Ruang kerja Kewirausahaan untuk produk, penjualan, inventaris, pengeluaran, pemasukan, laba, dan laporan harian.",
      tableColumns: ["Produk", "Kategori", "Harga", "Stok", "Status", "Diupdate Oleh"],
      title: "Divisi Kewirausahaan",
    },
  }

  return specs[role]
}

function getDivisionScheduleView(role: DivisionOperationsRole, summary: DashboardSummary) {
  const spec = getDivisionDashboardSpec(role)
  const roleLabel = roleLabels[role].toLowerCase()
  const scopedSchedules = summary.todaySchedule.filter((schedule) => {
    const haystack = `${schedule.pic} ${schedule.title} ${schedule.venue}`.toLowerCase()

    return haystack.includes(roleLabel) || haystack.includes(spec.divisionId)
  })

  if (scopedSchedules.length > 0) {
    return scopedSchedules.slice(0, 6)
  }

  return summary.todaySchedule.slice(0, 6)
}

function getRoleDashboardConfig(role: Exclude<UserRole, DivisionOperationsRole>) {
  const sharedActions: ActionLink[] = [
    { href: "/dashboard/schedules", icon: CalendarDays, label: "Lihat Jadwal" },
    { href: "/dashboard/announcements", icon: Megaphone, label: "Pengumuman" },
  ]

  const configs: Record<Exclude<UserRole, DivisionOperationsRole>, RoleDashboardConfig> = {
    bendahara: {
      actions: [
        { href: "/dashboard/budgeting", icon: Wallet, label: "Anggaran" },
        { href: "/dashboard/financial-reports", icon: FileCheck, label: "Laporan Keuangan" },
        ...sharedActions,
      ],
      icon: Wallet,
      primaryPanelDescription: "Kesiapan alur keuangan dan antrean laporan resmi.",
      primaryPanelTitle: "Keuangan",
      stats: () => [
        { label: "Catatan Anggaran", value: NO_DATA },
        { label: "Laporan Keuangan", value: NO_DATA },
        { label: "Menunggu Review", value: NO_DATA },
        { label: "Pengumuman", value: NOT_PUBLISHED },
      ],
      statusDescription: "Status keuangan muncul setelah catatan resmi tersedia.",
      statuses: () => [
        { label: "Anggaran", status: NO_DATA },
        { label: "Laporan Keuangan", status: NO_DATA },
        { label: "Log Pembayaran", status: NO_DATA },
      ],
      statusTitle: "Status Keuangan",
      subtitle: "Dashboard bendahara untuk anggaran, laporan, dan catatan keuangan resmi.",
      timelineTitle: "Jadwal Terkait Keuangan",
      title: "Bendahara",
      todoDescription: "Tugas keuangan muncul setelah penugasan resmi.",
      todoTitle: "Tugas Keuangan",
    },
    dokumentasi: {
      actions: sharedActions,
      icon: Camera,
      primaryPanelDescription: "",
      primaryPanelTitle: "",
      stats: () => [],
      statusDescription: "",
      statuses: () => [],
      statusTitle: "",
      subtitle: "",
      timelineTitle: "",
      title: "",
      todoDescription: "",
      todoTitle: "",
    },
    humas: {
      actions: sharedActions,
      icon: Handshake,
      primaryPanelDescription: "",
      primaryPanelTitle: "",
      stats: () => [],
      statusDescription: "",
      statuses: () => [],
      statusTitle: "",
      subtitle: "",
      timelineTitle: "",
      title: "",
      todoDescription: "",
      todoTitle: "",
    },
    ketua_pelaksana: leadershipConfig("Ketua Pelaksana"),
    operator: {
      actions: [
        { href: "/dashboard/technical-support", icon: Monitor, label: "Dukungan Teknis" },
        { href: "/dashboard/tournament", icon: Trophy, label: "Manajemen Lomba" },
        ...sharedActions,
      ],
      icon: Monitor,
      primaryPanelDescription: "Dukungan teknis dan visibilitas meja skor selama kegiatan.",
      primaryPanelTitle: "Kontrol Operator",
      stats: (summary) => [
        { label: "Pertandingan Live", value: summary.metrics.liveMatches || MATCH_UNAVAILABLE, tone: "success" },
        { label: "Jadwal", value: summary.todaySchedule.length || NO_DATA, tone: "info" },
        { label: "Kendala Teknis", value: NO_DATA },
        { label: "Tugas Tertunda", value: summary.metrics.pendingTasks || NO_DATA, tone: "warning" },
      ],
      statusDescription: "Sinyal kesiapan teknis muncul setelah catatan resmi tersedia.",
      statuses: () => [
        { label: "Meja Skor", status: NO_DATA },
        { label: "Sistem Display", status: NO_DATA },
        { label: "Network", status: NO_DATA },
      ],
      statusTitle: "Status Teknis",
      subtitle: "Dashboard operator untuk dukungan teknis, update skor, dan jadwal.",
      timelineTitle: "Jadwal Operator",
      title: "Operator",
      todoDescription: "Tugas operator muncul setelah penugasan resmi.",
      todoTitle: "Tugas Operator",
    },
    pj_lomba: {
      actions: [
        { href: "/dashboard/tournament", icon: Trophy, label: "Lomba Saya" },
        { href: "/dashboard/match-results", icon: ClipboardList, label: "Input Hasil" },
        { href: "/dashboard/bracket", icon: GitBranch, label: "Bracket" },
        ...sharedActions,
      ],
      icon: Trophy,
      primaryPanelDescription: "Lomba, bracket, peserta, jadwal, dan hasil yang ditugaskan.",
      primaryPanelTitle: "Manajemen Lomba",
      stats: (summary) => [
        { label: "Lomba Ditugaskan", value: summary.activeCompetitions.length || NO_DATA, tone: "navy" },
        { label: "Jadwal", value: summary.todaySchedule.length || NO_DATA, tone: "info" },
        { label: "Pertandingan Live", value: summary.metrics.liveMatches || MATCH_UNAVAILABLE, tone: "success" },
        { label: "Peserta", value: NO_DATA },
      ],
      statusDescription: "Status lomba mengikuti data resmi yang aktif.",
      statuses: (summary) => [
        { label: "Bracket", status: "Bracket belum dibuat" },
        { label: "Hasil", status: MATCH_UNAVAILABLE },
        { label: "Peserta", status: NO_DATA },
        { label: "Lomba Aktif", status: summary.activeCompetitions.length ? "Tersedia" : "Belum Ada Lomba Aktif", tone: summary.activeCompetitions.length ? "success" : "neutral" },
      ],
      statusTitle: "Status Lomba",
      subtitle: "Dashboard PJ Lomba untuk pengelolaan lomba dan input hasil.",
      timelineTitle: "Jadwal Lomba",
      title: "PJ Lomba",
      todoDescription: "Tugas lomba dan tindak lanjut input hasil.",
      todoTitle: "Tugas Lomba",
    },
    sekretaris: {
      actions: [
        { href: "/dashboard/documents", icon: FileText, label: "Dokumen" },
        { href: "/dashboard/reports", icon: FileCheck, label: "Laporan" },
        ...sharedActions,
      ],
      icon: FileText,
      primaryPanelDescription: "Koordinasi dokumen, jadwal, dan laporan MCS 1.",
      primaryPanelTitle: "Sekretariat",
      stats: (summary) => [
        { label: "Dokumen", value: competitionJuknis.length, tone: "info" },
        { label: "Laporan", value: NO_DATA },
        { label: "Jadwal", value: summary.todaySchedule.length || NO_DATA, tone: "gold" },
        { label: "Pengumuman", value: summary.announcements.length || NOT_PUBLISHED },
      ],
      statusDescription: "Kesiapan sekretariat berdasarkan dokumen dan jadwal resmi.",
      statuses: () => [
        { label: "Dokumen", status: "Tersedia", tone: "success" },
        { label: "Laporan", status: NO_DATA },
        { label: "Update Jadwal", status: WAITING },
      ],
      statusTitle: "Status Sekretariat",
      subtitle: "Dashboard untuk dokumen, laporan, jadwal, dan koordinasi pengumuman.",
      timelineTitle: "Jadwal Sekretariat",
      title: "Sekretaris",
      todoDescription: "Tugas sekretariat muncul setelah penugasan resmi.",
      todoTitle: "Tugas Sekretariat",
    },
    super_admin: leadershipConfig("Super Admin"),
    wakil_ketua: leadershipConfig("Wakil Ketua"),
  }

  return configs[role]
}

function leadershipConfig(title: string): RoleDashboardConfig {
  return {
    actions: [
      { href: "/dashboard/tournament", icon: Trophy, label: "Pantau Lomba" },
      { href: "/dashboard/schedules", icon: CalendarDays, label: "Pantau Jadwal" },
      { href: "/dashboard/division-status", icon: Activity, label: "Status Divisi" },
      { href: "/dashboard/reports", icon: FileCheck, label: "Laporan" },
    ],
    icon: ShieldCheck,
    primaryPanelDescription: "Pantauan persetujuan, status divisi, dan kendala penting.",
    primaryPanelTitle: "Pantauan Pimpinan",
    stats: (summary: DashboardSummary) => [
      { label: "Lomba Aktif", value: summary.metrics.activeCompetitions || "Belum Ada Lomba Aktif", tone: "navy" },
      { label: "Persetujuan Tertunda", value: summary.metrics.pendingAnnouncements || NO_DATA, tone: "warning" },
      { label: "Tugas Tertunda", value: summary.metrics.pendingTasks || NO_DATA, tone: "warning" },
      { label: "Kegiatan Hari Ini", value: summary.todaySchedule.length || "Belum Ada Jadwal", tone: "info" },
    ],
    statusDescription: "Status pimpinan untuk area utama kepanitiaan.",
    statuses: (summary: DashboardSummary) => [
      { label: "Kegiatan Utama", status: getEventStatus(summary), tone: "info" },
      { label: "Lomba", status: summary.activeCompetitions.length ? "Sehat" : "Perlu Dipantau", tone: summary.activeCompetitions.length ? "success" : "warning" },
      { label: "Dokumentasi", status: WAITING },
      { label: "Humas", status: WAITING },
      { label: "Keamanan", status: WAITING },
      { label: "Kesiapan Tempat", status: WAITING },
    ],
    statusTitle: "Status Kepanitiaan",
    subtitle: "Tampilan pimpinan untuk persetujuan, pantauan, dan tindak lanjut penting.",
    timelineTitle: "Kegiatan Hari Ini",
    title,
    todoDescription: "Persetujuan dan tugas tindak lanjut muncul di sini.",
    todoTitle: "Persetujuan & Tindak Lanjut",
  }
}

function getGenericWorkspaceConfig(moduleKey: DashboardModuleKey): {
  actions: ActionLink[]
  emptyDescription: string
  icon: LucideIcon
  panelDescription: string
  panelTitle: string
  subtitle: string
  title: string
} {
  const title = getModuleTitle(moduleKey)
  const defaults = {
    actions: [{ href: "/dashboard", icon: Globe, label: "Kembali ke Dashboard" }],
    emptyDescription: "Catatan resmi untuk ruang kerja ini belum dipublikasikan.",
    icon: ClipboardList,
    panelDescription: "Ruang kerja ini siap diisi dengan data resmi.",
    panelTitle: `Ruang Kerja ${title}`,
    subtitle: "Ruang kerja kepanitiaan untuk dashboard internal MCS 1.",
    title,
  }

  const overrides: Partial<Record<DashboardModuleKey, Partial<typeof defaults>>> = {
    administration: {
      icon: FileCheck,
      panelTitle: "Administrasi",
      subtitle: "Ruang kerja administrasi untuk Sekretaris dan Bendahara.",
    },
    budgeting: {
      icon: Wallet,
      panelTitle: "Anggaran",
      subtitle: "Ruang kerja keuangan untuk catatan anggaran resmi.",
    },
    "business-operations": {
      icon: Wallet,
      panelTitle: "Kewirausahaan",
      subtitle: "Ruang kerja penjualan, stok, pemasukan, pengeluaran, laba, dan laporan harian.",
    },
    "cleanliness-operations": {
      icon: Activity,
      panelTitle: "Kebersihan",
      subtitle: "Ruang kerja kebersihan tempat, pembagian area, laporan kendala, dan checklist.",
    },
    "division-activities": {
      icon: Activity,
      panelTitle: "Aktivitas Divisi",
      subtitle: "Catatan aktivitas dan update divisi.",
    },
    "division-status": {
      icon: Activity,
      panelTitle: "Status Divisi",
      subtitle: "Pantauan pimpinan untuk kesiapan divisi.",
    },
    "equipment-inventory": {
      icon: ClipboardList,
      panelTitle: "Inventaris Perlengkapan",
      subtitle: "Ruang kerja inventaris, peminjaman alat, stok, permintaan, dan setup tempat.",
    },
    "event-rundown": {
      icon: CalendarDays,
      panelTitle: "Rundown Kegiatan",
      subtitle: "Ruang kerja rundown utama, kegiatan, tempat, PIC, dan perubahan jadwal.",
    },
    "financial-reports": {
      icon: FileCheck,
      panelTitle: "Laporan Keuangan",
      subtitle: "Ruang kerja laporan keuangan.",
    },
    "media-posts": {
      icon: ImageUp,
      panelTitle: "Posting Media",
      subtitle: "Ruang kerja publikasi media.",
    },
    "news-center": {
      icon: Megaphone,
      panelTitle: "Pusat Berita",
      subtitle: "Ruang kerja publikasi berita resmi MCS.",
    },
    "publication-schedule": {
      icon: CalendarDays,
      panelTitle: "Jadwal Publikasi",
      subtitle: "Ruang kerja perencanaan publikasi untuk Humas.",
    },
    "security-operations": {
      icon: ShieldCheck,
      panelTitle: "Keamanan",
      subtitle: "Ruang kerja pos jaga, pantauan area, laporan kendala, dan shift.",
    },
    tasks: {
      icon: ClipboardList,
      panelTitle: "Tugas Saya",
      subtitle: "Ruang kerja tugas resmi.",
    },
    "technical-support": {
      icon: Monitor,
      panelTitle: "Dukungan Teknis",
      subtitle: "Ruang kerja dukungan teknis.",
    },
    users: {
      icon: Users,
      panelTitle: "Pengguna",
      subtitle: "Ruang kerja manajemen pengguna.",
    },
  }

  return { ...defaults, ...(overrides[moduleKey] ?? {}) }
}

function getModuleTitle(moduleKey: DashboardModuleKey) {
  const titles: Record<DashboardModuleKey, string> = {
    administration: "Administrasi",
    "announcement-center": "Pusat Pengumuman",
    analytics: "Analitik",
    "bracket-management": "Manajemen Bracket",
    budgeting: "Anggaran",
    "business-operations": "Kewirausahaan",
    "cleanliness-operations": "Kebersihan",
    "division-activities": "Aktivitas Divisi",
    "division-status": "Status Divisi",
    documents: "Dokumen",
    "equipment-inventory": "Inventaris Perlengkapan",
    "event-rundown": "Rundown Kegiatan",
    "financial-reports": "Laporan Keuangan",
    "humas-sponsorship": "Humas & Sponsorship",
    "juknis-management": "Manajemen Juknis",
    "live-match": "Pantauan Pertandingan",
    "match-results": "Input Hasil",
    "media-archive": "Pusat PDD",
    "media-center": "Pusat PDD",
    "media-gallery": "Pusat PDD",
    "media-highlights": "Pusat PDD",
    "media-posts": "Posting Media",
    "media-upload": "Pusat PDD",
    "news-center": "Pusat Berita",
    "panitia-management": "Data Panitia",
    "participant-management": "Data Peserta",
    "publication-schedule": "Jadwal Publikasi",
    reports: "Laporan",
    "schedule-management": "Manajemen Jadwal",
    "security-operations": "Keamanan",
    settings: "Pengaturan",
    tasks: "Tugas Saya",
    "technical-support": "Dukungan Teknis",
    users: "Pengguna",
  }

  return titles[moduleKey]
}

function getCurrentActivity(summary: DashboardSummary) {
  const liveMatch = summary.liveMatches[0]

  if (liveMatch) {
    return {
      pic: WAITING,
      status: formatStatus(liveMatch.status),
      title: `${liveMatch.sport} ${liveMatch.round}`,
      venue: liveMatch.venue,
    }
  }

  const schedule = summary.todaySchedule[0]

  if (schedule) {
    return {
      pic: schedule.pic,
      status: formatStatus(schedule.status),
      title: schedule.title,
      venue: schedule.venue,
    }
  }

  return {
    pic: WAITING,
    status: WAITING,
    title: "Belum Ada Lomba Aktif",
    venue: WAITING,
  }
}

function getEventStatus(summary: DashboardSummary) {
  const today = new Date().toISOString().slice(0, 10)

  if (today < summary.event.startsAt) return "Pra-Event"
  if (today > summary.event.endsAt) return "Selesai"
  return "Live"
}

function summaryUserFallback(): UserDTO {
  return {
    assignedCompetitionIds: [],
    createdAt: "",
    displayName: "MCS 1",
    divisionIds: [],
    email: "",
    id: "mcs-dashboard",
    role: "humas",
    status: "active",
    tournamentIds: [event.shortName],
    updatedAt: "",
  }
}

function formatScheduleTime(time: string) {
  return `${time.replace(".", ":")} WIB`
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(new Date(value))
  } catch {
    return value
  }
}

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    Active: "Aktif",
    Blocked: "Tertunda",
    Cancelled: "Dibatalkan",
    Completed: "Selesai",
    Critical: "Kritis",
    Delayed: "Tertunda",
    Done: "Selesai",
    High: "Tinggi",
    "In Progress": "Diproses",
    Low: "Rendah",
    Medium: "Sedang",
    Pending: "Menunggu",
    Planned: "Direncanakan",
    Rejected: "Ditolak",
    Scheduled: "Terjadwal",
    Upcoming: "Akan Datang",
    Watch: "Perlu Dipantau",
  }

  if (labels[value]) return labels[value]

  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}

function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`
}

function formatRupiahRange(minAmount: number, maxAmount: number) {
  if (minAmount === maxAmount) {
    return formatRupiah(minAmount)
  }

  return `${formatRupiah(minAmount)}-${formatRupiah(maxAmount)}`
}

function formatScheduleStatus(status: string) {
  if (status === "scheduled") return "Upcoming"
  if (status === "live") return "Live"
  if (status === "completed") return "Completed"
  return formatStatus(status)
}

function getRoundLabel(title: string) {
  const roundNames = ["Final", "Semi Final", "Semifinal", "Quarter Final", "Quarterfinal", "Group Stage", "Penyisihan"]
  const lowerTitle = title.toLowerCase()
  const match = roundNames.find((round) => lowerTitle.includes(round.toLowerCase()))

  return match ?? WAITING
}

function getBusinessFocusForUser(user: UserDTO): BusinessDashboardFocus {
  if (user.role === "bendahara") return "finance"
  if (user.role === "kewirausahaan") return "kewirausahaan"
  return "all"
}

function getBusinessDashboardTitle(focus: BusinessDashboardFocus, user: UserDTO) {
  if (focus === "kewirausahaan") return `Kewirausahaan, ${user.displayName}`
  if (focus === "finance") return "Pusat Pendapatan Kewirausahaan"
  return "Kewirausahaan MCS 1"
}

function isFinanceRelated(value: string) {
  const lowerValue = value.toLowerCase()

  return [
    "bendahara",
    "budget",
    "expense",
    "finance",
    "financial",
    "income",
    "kas",
    "payment",
    "reimbursement",
    "report",
    "sponsor",
  ].some((keyword) => lowerValue.includes(keyword))
}

function getBudgetAllocations() {
  const divisions = ["Acara", "Humas", "Dokumentasi", "Perlengkapan", "Konsumsi", "Keamanan"]

  return divisions.map((division) => {
    const items = budgetLineItems.filter((item) => item.division === division)

    return {
      division,
      minAmount: items.reduce((total, item) => total + item.minAmount, 0),
      maxAmount: items.reduce((total, item) => total + item.maxAmount, 0),
    }
  })
}

function getSponsorTone(status: string): StatusTone {
  if (status === "Confirmed") return "success"
  if (status === "Rejected") return "danger"
  return "warning"
}

function getStatDotClass(tone: StatusTone) {
  if (tone === "success") return "bg-[#16A34A]"
  if (tone === "warning") return "bg-[#D97706]"
  if (tone === "danger") return "bg-[#DC2626]"
  if (tone === "gold") return "bg-[#D4A017]"
  if (tone === "info") return "bg-[#2563EB]"
  if (tone === "navy") return "bg-[#0F172A]"
  return "bg-[#CBD5E1]"
}

function getEmptyStateTitle(title: string) {
  if (title === NO_DATA) return "Data Belum Dipublikasikan"
  if (title === WAITING) return "Menunggu Update Resmi"
  if (title === NOT_PUBLISHED) return "Data Belum Dipublikasikan"
  return title
}

function getEmptyStateAction(title: string) {
  if (title.toLowerCase().includes("approval") || title.toLowerCase().includes("persetujuan")) {
    return "tinjau antrean persetujuan saat ada pengajuan masuk."
  }
  if (title.toLowerCase().includes("schedule") || title.toLowerCase().includes("activity")) {
    return "publikasikan atau perbarui rundown resmi."
  }
  if (title.toLowerCase().includes("financial") || title.toLowerCase().includes("revenue")) {
    return "catat update keuangan resmi sebelum membuat laporan."
  }
  if (title.toLowerCase().includes("sponsor")) return "tambahkan PIC follow-up sponsor dan batas waktunya."
  return "tambahkan data resmi dari modul penanggung jawab."
}

function getScheduleTone(status: string): StatusTone {
  if (status === "live") return "success"
  if (status === "delayed") return "warning"
  if (status === "cancelled") return "danger"
  if (status === "completed") return "success"
  return "neutral"
}

function getDivisionTone(status: string): StatusTone {
  if (status === "Stable") return "success"
  if (status === "Watch") return "warning"
  if (status === "Attention") return "danger"
  return "neutral"
}

function getPriorityTone(priority: string): StatusTone {
  if (priority === "urgent") return "danger"
  if (priority === "important") return "warning"
  return "neutral"
}
