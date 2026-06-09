import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
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
  Settings,
  ShieldCheck,
  Trophy,
  Upload,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"

import {
  budgetLineItems,
  budgetSummary,
  committee,
  competitionJuknis,
  competitions,
  event,
  majors,
  scheduleDays,
  sponsorProspects,
  sponsorshipPipelineStatuses,
} from "@/data/mcs"
import { ExecutiveDashboardScreen } from "@/components/dashboard/executive-dashboard-screen"
import { cn } from "@/lib/utils"
import { roleLabels, type DashboardSummary, type UserDTO, type UserRole } from "@/server/mcs/types"

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
  neutral: "border-[#E5E7EB] bg-[#F8F9FB] text-[#64748B]",
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
    return <DocumentationDashboardScreen summary={summary} user={user} />
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
  const publishedAnnouncements = summary.announcements.filter((item) => item.status === "published").length
  const draftAnnouncements = summary.announcements.filter((item) => item.status === "draft").length
  const pendingApprovals = summary.announcements.filter((item) => item.status === "pending_approval").length
  const scheduledPublications = summary.announcements.filter(
    (item) => item.status === "approved" && item.visibility === "public",
  )
  const ongoingSponsors = sponsorProspects.filter((sponsor) => sponsor.proposalStatus === "On Going")

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={[
          { href: "/dashboard/announcements", icon: Megaphone, label: "Buat Pengumuman" },
          { href: "/dashboard/announcements", icon: Bell, label: "Buat Broadcast" },
          { href: "/dashboard/humas-sponsorship", icon: Upload, label: "Unggah Proposal" },
          { href: "/dashboard/humas-sponsorship", icon: Handshake, label: "Tambah Sponsor" },
          { href: "/dashboard/news", icon: Globe, label: "Tambah Mitra Media" },
        ]}
        icon={Handshake}
        subtitle={
          variant === "role-dashboard"
            ? "Pusat komunikasi, antrean publikasi, dan ruang kerja kemitraan MCS 1."
            : "Kelola alur publikasi, follow-up sponsor, proposal, dan relasi media."
        }
        title={variant === "role-dashboard" ? `Humas & Sponsorship, ${user.displayName}` : "Humas & Sponsorship"}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <InfoPanel
          icon={Megaphone}
          title="Antrean Publikasi"
          description="Draft, persetujuan, jadwal, dan konten terbit untuk komunikasi MCS."
        >
          <div className="mb-4">
            <StatMiniList
              items={[
                { label: "Pengumuman Terbit", value: publishedAnnouncements || NOT_PUBLISHED },
                { label: "Posting Terjadwal", value: scheduledPublications.length || "Belum Ada Publikasi Terjadwal" },
                { label: "Draft Publikasi", value: draftAnnouncements },
                { label: "Menunggu Persetujuan", value: pendingApprovals },
                { label: "Permintaan Media", value: NO_DATA },
              ]}
            />
          </div>
          <PublicationQueue summary={summary} />
        </InfoPanel>

        <InfoPanel icon={Handshake} title="Ikhtisar Sponsor" description="Ringkasan singkat kemitraan.">
          <StatMiniList
            items={[
              { label: "Total Sponsor", value: sponsorProspects.length },
              { label: "Sponsor Terkonfirmasi", value: sponsorProspects.filter((sponsor) => sponsor.proposalStatus === "Confirmed").length },
              { label: "Sponsor Berjalan", value: ongoingSponsors.length },
              { label: "Mitra Media", value: NO_DATA },
              { label: "Konten Terbit", value: publishedAnnouncements || NOT_PUBLISHED },
              { label: "Menunggu Persetujuan", value: pendingApprovals },
            ]}
          />
        </InfoPanel>
      </section>

      <InfoPanel
        icon={Handshake}
        title="Alur Sponsor"
        description="Alur prospek sampai sponsor terkonfirmasi. Kosong sampai catatan sponsor resmi diisi."
      >
        <SponsorPipelineBoard />
      </InfoPanel>

      <InfoPanel icon={Users} title="Daftar Sponsor" description="Brand, PIC, kontak, status proposal, follow-up, dan jenis kerja sama.">
        <SponsorListTable />
      </InfoPanel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={ClipboardList} title="Tugas Follow-Up" description="Tugas sponsor dan tindak lanjut berikutnya.">
          <EmptyState title="Belum Ada Tugas Follow-Up" description="Catatan follow-up sponsor belum dipublikasikan." />
        </InfoPanel>

        <InfoPanel icon={ClipboardList} title="Aksi Cepat" description="Aksi utama komunikasi Humas.">
          <ActionGrid
            actions={[
              { href: "/dashboard/announcements", icon: Megaphone, label: "Buat Pengumuman" },
              { href: "/dashboard/announcements", icon: Bell, label: "Buat Broadcast" },
              { href: "/dashboard/humas-sponsorship", icon: Upload, label: "Unggah Proposal" },
              { href: "/dashboard/humas-sponsorship", icon: Handshake, label: "Tambah Sponsor" },
              { href: "/dashboard/news", icon: Globe, label: "Tambah Mitra Media" },
            ]}
          />
        </InfoPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <InfoPanel icon={CalendarDays} title="Jadwal Media Sosial" description="Kalender Instagram, TikTok, website, dan broadcast.">
          <SocialScheduleTable publications={scheduledPublications} />
        </InfoPanel>

        <InfoPanel icon={Users} title="Mitra Media" description="Nama mitra, platform, status, PIC, dan kesepakatan publikasi.">
          <EmptyState title={NO_DATA} description="Catatan mitra media resmi belum dipublikasikan." />
        </InfoPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={FileText} title="Pantauan Proposal" description="Status proposal, update terakhir, dan batas waktu.">
          <SponsorProposalTracker />
        </InfoPanel>

        <InfoPanel icon={Activity} title="Aktivitas Terbaru" description="Update proposal, pengumuman, sponsor, broadcast, dan mitra media.">
          <HumasRecentActivities summary={summary} />
        </InfoPanel>
      </section>
    </div>
  )
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
    <div className="grid gap-5">
      <BusinessDashboardHeader
        generatedAt={generatedAt}
        notificationCount={summary.metrics.unreadNotifications}
        operator={user.displayName}
        title={title}
      />

      <FilterBar
        fields={["Product", "Category", "Date", "Stock Status", "Recorded By"]}
        searchPlaceholder="Cari produk, transaksi, pengeluaran, laporan"
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <InfoPanel
            icon={Wallet}
            title="Ringkasan Penjualan Hari Ini"
            description="Ringkasan penjualan, stok, dan target Kewirausahaan hari ini."
          >
            <EntrepreneurshipSalesOverview />
          </InfoPanel>

          <InfoPanel
            icon={ClipboardList}
            title="Sales Transactions"
            description="Transaction time, product, quantity, unit price, total, and recording officer."
          >
            <EntrepreneurshipTransactionsTable />
          </InfoPanel>

          <InfoPanel
            icon={Archive}
            title="Manajemen Produk"
            description="Product catalog, category, price, initial stock, remaining stock, and sales status."
          >
            <EntrepreneurshipProductTable />
          </InfoPanel>

          <InfoPanel
            icon={Activity}
            title="Inventory Monitoring"
            description="Stock movement overview for safe, low, critical, and out-of-stock conditions."
          >
            <EntrepreneurshipInventoryTable />
          </InfoPanel>

          <InfoPanel icon={BarChart3} title="Best Selling Products" description="Simple ranking without oversized charts or fake analytics.">
            <EntrepreneurshipBestSellers />
          </InfoPanel>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.7fr)]">
            <InfoPanel icon={Wallet} title="Ringkasan Kas" description="Modal awal, pemasukan, pengeluaran, dan estimasi laba.">
              <EntrepreneurshipCashSummary />
            </InfoPanel>

            <InfoPanel icon={CalendarDays} title="Laporan Harian" description="Laporan penjualan, stok, pemasukan, pengeluaran, dan laba dari hari 1 sampai hari 4.">
              <EntrepreneurshipDailyReports />
            </InfoPanel>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.7fr)]">
            <InfoPanel icon={Activity} title="Aktivitas Terbaru" description="Aktivitas produk, stok, penjualan, pengeluaran, target, dan laporan.">
              <EntrepreneurshipRecentActivities summary={summary} />
            </InfoPanel>

            <InfoPanel icon={Wallet} title="Aksi Cepat" description="Aksi utama Kewirausahaan.">
              <ActionGrid actions={getBusinessQuickActions(focus)} />
            </InfoPanel>
          </section>
        </div>

        <EntrepreneurshipSidePanel />
      </section>
    </div>
  )
}

function BusinessDashboardHeader({
  generatedAt,
  notificationCount,
  operator,
  title,
}: {
  generatedAt: Date
  notificationCount: number
  operator: string
  title: string
}) {
  const status = getBusinessEventStatus(generatedAt)

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#64748B]">{getBusinessGreeting(generatedAt)}, Entrepreneurship Team</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-[#111827]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#64748B]">
            {event.name} - {event.theme} - {event.organizer}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
          >
            <Globe className="size-4 text-[#64748B]" aria-hidden="true" />
            Public Website
          </Link>
          <Link
            href="/dashboard/announcements"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
          >
            <Bell className="size-4 text-[#64748B]" aria-hidden="true" />
            Notifications {notificationCount > 0 ? `(${notificationCount})` : ""}
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
          >
            <UserCheck className="size-4 text-[#64748B]" aria-hidden="true" />
            Profile
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <FactTile label="Event Date" value={event.dateRange} />
        <FactTile label="Current Date" value={formatBusinessDate(generatedAt)} />
        <FactTile label="Current Time" value={formatBusinessTime(generatedAt)} />
        <FactTile label="Current Event Day" value={status.dayLabel} />
        <FactTile label="Event Status" value={status.statusLabel} />
      </div>

      <p className="mt-3 text-xs font-medium text-[#64748B]">Operator: {operator}</p>
    </section>
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

export function DocumentationDashboardScreen({ summary, user }: { summary: DashboardSummary; user: UserDTO }) {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/media/upload", icon: Upload, label: "Unggah Foto" },
          { href: "/dashboard/media/upload", icon: Camera, label: "Unggah Video" },
          { href: "/dashboard/media/highlights", icon: ImageUp, label: "Buat Highlight" },
          { href: "/dashboard/media/gallery", icon: Globe, label: "Buka Galeri" },
        ]}
        icon={Camera}
        subtitle="Ruang kerja Dokumentasi untuk unggahan, status galeri, dan permintaan highlight."
        title={`Dokumentasi, ${user.displayName}`}
      />

      <StatStrip
        items={[
          { label: "Liputan Hari Ini", value: NO_DATA },
          { label: "Unggahan Tertunda", value: NO_DATA },
          { label: "Unggahan Terbaru", value: NO_DATA },
          { label: "Status Galeri", value: NOT_PUBLISHED },
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InfoPanel icon={Upload} title="Unggah Media" description="Foto, video, poster, dan dokumen.">
          <UploadDropzone title="Belum ada media dipilih" />
        </InfoPanel>
        <InfoPanel icon={FileCheck} title="Permintaan Highlight" description="Permintaan muncul setelah ada pengajuan resmi.">
          <EmptyState title={NO_DATA} description="Permintaan highlight belum dipublikasikan." />
        </InfoPanel>
      </section>

      <InfoPanel icon={Activity} title="Aktivitas Terbaru" description="Aktivitas Dokumentasi muncul setelah ada input resmi.">
        <RecentActivityList summary={summary} />
      </InfoPanel>
    </div>
  )
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
  const canManageFinance = user.role === "bendahara" || user.role === "super_admin"
  const canManageDocuments = user.role === "sekretaris" || user.role === "super_admin"
  const roleActionSet = canManageFinance
    ? [
        { href: "/dashboard/budgeting", icon: Wallet, label: "Tambah Transaksi" },
        { href: "/dashboard/budgeting", icon: Handshake, label: "Kelola Dana Sponsor" },
        { href: "/dashboard/financial-reports", icon: FileCheck, label: "Buat Laporan Keuangan" },
        { href: "/dashboard/financial-reports", icon: Download, label: "Ekspor Data Keuangan" },
      ]
    : [
        { href: "/dashboard/documents", icon: FileText, label: "Buat Dokumen" },
        { href: "/dashboard/announcements", icon: Megaphone, label: "Publikasikan Pengumuman" },
        { href: "/dashboard/schedules", icon: CalendarDays, label: "Update Rundown" },
        { href: "/dashboard/reports", icon: FileCheck, label: "Buat Laporan" },
      ]

  return (
    <div className="grid gap-5">
      <OperationsHeader
        actions={roleActionSet}
        icon={FileCheck}
        subtitle="Ruang kerja administrasi untuk dokumen, surat, laporan, arsip, persetujuan, dan catatan keuangan."
        title={`Administrasi, ${user.displayName}`}
      />

      <StatStrip
        items={[
          { label: "Dokumen", value: NO_DATA },
          { label: "Pengumuman", value: summary.announcements.length || NOT_PUBLISHED, tone: "info" },
          { label: "Laporan", value: "Belum Ada Laporan" },
          { label: "Catatan Keuangan", value: canManageFinance ? "Belum Ada Catatan Keuangan" : "Khusus Bendahara", tone: canManageFinance ? "neutral" : "warning" },
        ]}
      />

      <FilterBar
        fields={["Tanggal", "Status", "Kategori", "Penulis", "Divisi", "Jenis Dokumen"]}
        searchPlaceholder="Cari dokumen, pengumuman, laporan, arsip, sponsor"
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InfoPanel icon={ShieldCheck} title="Akses Peran" description="Permission administrasi sesuai role saat ini.">
          <StatusGrid
            items={[
              { label: "Buat Dokumen", status: canManageDocuments ? "Diizinkan" : "Terbatas", tone: canManageDocuments ? "success" : "neutral" },
              { label: "Publikasikan Pengumuman", status: canManageDocuments ? "Diizinkan" : "Terbatas", tone: canManageDocuments ? "success" : "neutral" },
              { label: "Kelola Anggaran", status: canManageFinance ? "Diizinkan" : "Terbatas", tone: canManageFinance ? "success" : "neutral" },
              { label: "Dana Sponsor", status: canManageFinance ? "Diizinkan" : "Terbatas", tone: canManageFinance ? "success" : "neutral" },
              { label: "Buat Laporan", status: "Diizinkan", tone: "success" },
              { label: "Ekspor Data", status: "Diizinkan", tone: "success" },
            ]}
          />
        </InfoPanel>

        <InfoPanel icon={Bell} title="Notifikasi" description="Notifikasi administrasi dan sinyal persetujuan.">
          <StatusGrid
            items={[
              { label: "Dokumen Disetujui", status: WAITING },
              { label: "Laporan Dibuat", status: WAITING },
              { label: "Anggaran Diperbarui", status: canManageFinance ? WAITING : "Khusus Bendahara", tone: canManageFinance ? "neutral" : "warning" },
              { label: "Pengumuman Terbit", status: summary.announcements.length ? "Tersedia" : NOT_PUBLISHED, tone: summary.announcements.length ? "success" : "neutral" },
            ]}
          />
        </InfoPanel>
      </section>

      <InfoPanel icon={FileText} title="Manajemen Dokumen" description="Proposal, surat resmi, notulen, laporan, Juknis, dan template sertifikat.">
        <EmptyDataTable
          columns={["ID Dokumen", "Nama Dokumen", "Kategori", "Dibuat Oleh", "Tanggal Dibuat", "Tanggal Update", "Status", "Versi", "Lampiran File"]}
          emptyTitle="Belum Ada Dokumen"
          emptyDescription="Dokumen administrasi resmi belum diunggah."
        />
      </InfoPanel>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={Megaphone} title="Manajemen Pengumuman" description="Pengumuman draft, terjadwal, terbit, dan arsip.">
          <AnnouncementTable summary={summary} />
        </InfoPanel>

        <InfoPanel icon={CalendarDays} title="Administrasi Rundown" description="Rundown utama event dengan persetujuan, publikasi, ekspor, dan catatan perubahan.">
          <ScheduleTable schedules={summary.todaySchedule.slice(0, 5)} emptyTitle="Belum Ada Rundown" />
        </InfoPanel>
      </section>

      <InfoPanel icon={FileCheck} title="Manajemen Laporan" description="Laporan kehadiran, panitia, lomba, sponsor, media, keuangan, dan laporan akhir event.">
        <EmptyDataTable
          columns={["ID Laporan", "Jenis Laporan", "Dibuat Oleh", "Tanggal Dibuat", "Format Ekspor", "Status"]}
          emptyTitle="Belum Ada Laporan"
          emptyDescription="Laporan administrasi akan muncul setelah laporan resmi dibuat."
        />
      </InfoPanel>

      {canManageFinance ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <InfoPanel icon={Wallet} title="Manajemen Keuangan" description="Pemasukan, pengeluaran, dana sponsor, biaya kegiatan, dan kuitansi.">
            <div className="grid gap-4">
              <FinancialSummaryGrid />
              <EmptyDataTable
                columns={["ID Transaksi", "Kategori", "Nominal", "Tanggal", "Deskripsi", "Status", "Lampiran", "Dibuat Oleh"]}
                emptyTitle="Belum Ada Catatan Keuangan"
                emptyDescription="Transaksi dan kuitansi resmi belum diisi."
              />
            </div>
          </InfoPanel>

          <InfoPanel icon={Handshake} title="Keuangan Sponsor" description="Nilai kontribusi sponsor, kesepakatan, dan status konfirmasi.">
            <SponsorshipIncomeTable />
          </InfoPanel>
        </section>
      ) : (
        <InfoPanel icon={Wallet} title="Manajemen Keuangan" description="Akses terbatas untuk Bendahara.">
          <EmptyState title="Khusus Bendahara" description="Catatan keuangan hanya terlihat oleh Bendahara dan Super Admin." />
        </InfoPanel>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <InfoPanel icon={Archive} title="Archive Management" description="Documents, reports, announcements, financial records, meeting notes, and sponsor files.">
          <EmptyDataTable
            columns={["Archive ID", "Item Type", "Title", "Archived By", "Archived Date", "Restore Status"]}
            emptyTitle="Archive Empty"
            emptyDescription="Archived administration records will appear here."
          />
        </InfoPanel>

        <InfoPanel icon={Activity} title="Activity Log System" description="Audited actions across documents, reports, announcements, finance, and archives.">
          <RecentActivityList summary={summary} />
        </InfoPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <InfoPanel icon={Search} title="Server-Side Search & Filters" description="Global search fields supported by the administration module.">
          <DocumentStatusList items={["Documents", "Announcements", "Reports", "Financial Records", "Archives", "Sponsors"]} />
        </InfoPanel>

        <InfoPanel icon={ShieldCheck} title="Validation & Security" description="RBAC, protected routes, audit logs, permission middleware, and activity tracking.">
          <DocumentStatusList
            items={[
              "Prevent duplicate documents",
              "Prevent invalid transactions",
              "Prevent negative budget values",
              "Prevent duplicate reports",
              "Validate file uploads",
              "Track audited activity",
            ]}
          />
        </InfoPanel>
      </section>
    </div>
  )
}

export function DashboardModuleScreen({
  moduleKey,
  summary,
  user,
}: {
  moduleKey: DashboardModuleKey
  summary: DashboardSummary
  user?: UserDTO
}) {
  switch (moduleKey) {
    case "administration":
      return <AdministrationDashboardScreen summary={summary} user={user ?? summaryUserFallback()} />
    case "schedule-management":
      return <ScheduleManagementScreen summary={summary} />
    case "participant-management":
      return <ParticipantManagementScreen />
    case "panitia-management":
      return <PanitiaManagementScreen summary={summary} />
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
      return <MediaCenterScreen moduleKey={moduleKey} />
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
      return <SettingsScreen />
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

function ScheduleManagementScreen({ summary }: { summary: DashboardSummary }) {
  const schedules = scheduleDays.flatMap((day) =>
    day.items.map((item, index) => ({
      ...item,
      date: day.date,
      dayName: day.dayName,
      id: `${day.id}-${index}`,
      label: day.label,
      status: "scheduled",
    })),
  )
  const venues = Array.from(new Set(schedules.map((item) => item.venue))).sort()

  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/schedules", icon: CalendarDays, label: "Tambah Jadwal" },
          { href: "/dashboard/schedules", icon: Globe, label: "Publikasikan Rundown" },
          { href: "/dashboard/reports", icon: FileText, label: "Ekspor Jadwal" },
        ]}
        icon={CalendarDays}
        subtitle="Kelola rundown, jadwal lomba, penggunaan tempat, dan linimasa kegiatan."
        title="Manajemen Jadwal"
      />

      <StatStrip
        items={[
          { label: "Kegiatan Hari Ini", value: summary.todaySchedule.length || NO_DATA, tone: "info" },
          { label: "Kegiatan Live", value: summary.todaySchedule.filter((item) => item.status === "live").length, tone: "success" },
          { label: "Match Berikutnya", value: schedules.filter((item) => item.type === "match").length, tone: "gold" },
          { label: "Tempat Aktif", value: venues.length, tone: "navy" },
        ]}
      />

      <FilterBar
        fields={[
          "Tanggal",
          "Kategori",
          "Tempat",
          "Status",
          "PIC",
        ]}
        searchPlaceholder="Cari kegiatan"
      />

      <InfoPanel icon={CalendarDays} title="Tampilan Timeline" description="Jadwal resmi MCS 1 dari data event utama.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                {["Tanggal", "Jam", "Kegiatan", "Kategori", "Tempat", "PIC", "Status"].map((heading) => (
                  <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="align-top">
                  <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0">{schedule.label}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{formatScheduleTime(schedule.time)}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 font-medium text-[#111827]">{schedule.title}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 capitalize text-[#64748B]">{schedule.type}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.venue}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{schedule.pic}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                    <StatusBadge label="Scheduled" tone="neutral" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoPanel>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={Monitor} title="Venue Status Panel" description="Current and next venue usage.">
          <div className="grid gap-3 sm:grid-cols-2">
            {venues.map((venue) => {
              const current = schedules.find((item) => item.venue === venue)

              return (
                <FactTile
                  key={venue}
                  label={venue}
                  value={current ? `${current.title} - ${formatScheduleTime(current.time)}` : NO_DATA}
                />
              )
            })}
          </div>
        </InfoPanel>

        <InfoPanel icon={Activity} title="Perubahan Terbaru" description="Perubahan jadwal muncul setelah ada update resmi.">
          <RecentActivityList summary={summary} />
        </InfoPanel>
      </section>
    </div>
  )
}

function ParticipantManagementScreen() {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/participants", icon: Users, label: "Tambah Peserta" },
          { href: "/dashboard/participants", icon: Upload, label: "Impor Data" },
          { href: "/dashboard/reports", icon: FileText, label: "Ekspor Peserta" },
        ]}
        icon={Users}
        subtitle="Kelola peserta, verifikasi, tim, dan kehadiran."
        title="Data Peserta"
      />

      <StatStrip
        items={[
          { label: "Total Peserta", value: NO_DATA },
          { label: "Peserta Terverifikasi", value: NO_DATA },
          { label: "Menunggu Verifikasi", value: NO_DATA },
          { label: "Diskualifikasi", value: NO_DATA },
        ]}
      />

      <FilterBar
        fields={["Lomba", "Jurusan", "Kelas", "Status Verifikasi", "Status Kehadiran"]}
        searchPlaceholder="Cari peserta"
      />

      <InfoPanel icon={Users} title="Tabel Peserta" description="Catatan peserta resmi belum dipublikasikan.">
        <EmptyState title={NO_DATA} description="Belum ada catatan resmi peserta, tim, atau kehadiran." />
      </InfoPanel>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={Trophy} title="Lomba Resmi" description="Cakupan lomba yang tersedia untuk pendaftaran peserta.">
          <SimpleList items={competitions.map((competition) => `${competition.shortName} - ${competition.category}`)} />
        </InfoPanel>
        <InfoPanel icon={Users} title="Jurusan Resmi" description="Jurusan SMKN 20 Jakarta yang diperbolehkan.">
          <SimpleList items={majors.map((major) => major.name)} />
        </InfoPanel>
      </section>
    </div>
  )
}

function PanitiaManagementScreen({ summary }: { summary: DashboardSummary }) {
  const groups = committee.flatMap((group) => group.names.map((name) => ({ name, role: group.role })))

  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/panitia-management", icon: Users, label: "Tambah Panitia" },
          { href: "/dashboard/panitia-management", icon: Upload, label: "Impor Data" },
          { href: "/dashboard/reports", icon: FileText, label: "Ekspor Data" },
        ]}
        icon={ShieldCheck}
        subtitle="Kelola anggota panitia, divisi, peran, kehadiran, dan tugas."
        title="Data Panitia"
      />

      <StatStrip
        items={[
          { label: "Data Panitia Resmi", value: groups.length, tone: "info" },
          { label: "Hadir Hari Ini", value: NO_DATA },
          { label: "Bertugas", value: NO_DATA },
          { label: "Tugas Tertunda", value: summary.upcomingTasks.length || NO_DATA, tone: "warning" },
        ]}
      />

      <InfoPanel icon={ShieldCheck} title="Ikhtisar Divisi" description="Struktur panitia resmi dari data MCS.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {committee.map((group) => (
            <FactTile key={group.role} label={group.role} value={`${group.names.length} terdaftar`} />
          ))}
        </div>
      </InfoPanel>

      <InfoPanel icon={Users} title="Tabel Panitia" description="Hanya nama panitia resmi dari data MCS yang ditampilkan.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                {["Name", "Division / Position", "Role", "Phone", "Attendance", "Status"].map((heading) => (
                  <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((member) => (
                <tr key={`${member.role}-${member.name}`}>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{member.name}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{member.role}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{member.role}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{NO_DATA}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{NO_DATA}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                    <StatusBadge label="Official" tone="success" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoPanel>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={ClipboardList} title="Task Assignment Section" description="Task records appear after official task input.">
          <TaskList summary={summary} />
        </InfoPanel>
        <InfoPanel icon={UserCheck} title="Attendance Section" description="Present, absent, late, and on-duty records.">
          <EmptyState title={NO_DATA} description="Attendance records have not been published yet." />
        </InfoPanel>
      </section>
    </div>
  )
}

function MediaCenterScreen({ moduleKey }: { moduleKey: DashboardModuleKey }) {
  const title = getModuleTitle(moduleKey)

  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/media/upload", icon: Upload, label: "Upload Media" },
          { href: "/dashboard/media/gallery", icon: ImageUp, label: "Create Gallery" },
          { href: "/dashboard/reports", icon: FileText, label: "Export Media" },
        ]}
        icon={Camera}
        subtitle="Manage event documentation, photos, videos, and gallery."
        title={title}
      />

      <StatStrip
        items={[
          { label: "Total Photos", value: NO_DATA },
          { label: "Total Videos", value: NO_DATA },
          { label: "Uploaded Today", value: NO_DATA },
          { label: "Pending Review", value: NO_DATA },
        ]}
      />

      <InfoPanel icon={Upload} title="Upload Area" description="Supported: photos, videos, posters, and documents.">
        <UploadDropzone title="No file selected" />
      </InfoPanel>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={ImageUp} title="Media Grid" description="Uploaded media appears after official uploads exist.">
          <EmptyState title={NO_DATA} description="Official media uploads have not been published yet." />
        </InfoPanel>
        <InfoPanel icon={Globe} title="Gallery Management" description="Public website visibility controls.">
          <DocumentStatusList items={["Publish to public website", "Hide from public website", "Delete media"]} />
        </InfoPanel>
      </section>
    </div>
  )
}

function AnnouncementCenterScreen({ summary }: { summary: DashboardSummary }) {
  const published = summary.announcements.filter((item) => item.status === "published")
  const draft = summary.announcements.filter((item) => item.status === "draft")
  const scheduled = summary.announcements.filter((item) => item.status === "approved")
  const urgent = summary.announcements.filter((item) => item.priority === "urgent")

  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/announcements", icon: Megaphone, label: "Create Announcement" },
          { href: "/dashboard/announcements", icon: Bell, label: "Create Broadcast" },
          { href: "/dashboard/reports", icon: FileText, label: "Export Announcements" },
        ]}
        icon={Megaphone}
        subtitle="Manage announcements, broadcasts, and public information."
        title="Announcement Center"
      />

      <StatStrip
        items={[
          { label: "Published", value: published.length || NOT_PUBLISHED, tone: "success" },
          { label: "Draft", value: draft.length, tone: "warning" },
          { label: "Scheduled", value: scheduled.length || NO_DATA, tone: "info" },
          { label: "Urgent", value: urgent.length, tone: urgent.length ? "danger" : "neutral" },
        ]}
      />

      <InfoPanel icon={Megaphone} title="Announcement Table" description="Official announcement records.">
        <AnnouncementTable summary={summary} />
      </InfoPanel>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={FileText} title="Create Announcement Fields" description="Title, content, priority, audience, status, date, and attachment.">
          <DocumentStatusList items={["Title", "Content", "Priority", "Audience", "Publish status", "Publish date", "Attachment"]} />
        </InfoPanel>
        <InfoPanel icon={Bell} title="Broadcast Section" description="Recent broadcasts, read status, and target audience.">
          <EmptyState title={NO_DATA} description="Broadcast records have not been published yet." />
        </InfoPanel>
      </section>
    </div>
  )
}

function JuknisManagementScreen({ moduleKey }: { moduleKey: DashboardModuleKey }) {
  const isDocuments = moduleKey === "documents"

  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[
          { href: "/dashboard/juknis", icon: Upload, label: "Upload Juknis" },
          { href: "/dashboard/juknis", icon: FileText, label: "Add Rule" },
          { href: "/dashboard/juknis", icon: Globe, label: "Publish Update" },
        ]}
        icon={FileText}
        subtitle={
          isDocuments
            ? "Document workspace for official MCS 1 internal files."
            : "Manage official competition guidelines and rulebooks."
        }
        title={isDocuments ? "Documents" : "Juknis Management"}
      />

      <InfoPanel icon={FileText} title="Juknis List" description="Official competition guidelines from canonical MCS data.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                {["Competition", "Format", "Team Format", "Version", "Publish Status"].map((heading) => (
                  <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {competitionJuknis.map((document) => (
                <tr key={document.id}>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{document.shortName}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{document.format}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{document.teamFormat}</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">Official</td>
                  <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                    <StatusBadge label={document.status} tone="success" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoPanel>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={ClipboardList} title="Juknis Detail" description="Overview, requirements, rules, technical guidelines, criteria, PJ Lomba, PDF file, version, and status.">
          <DocumentStatusList
            items={[
              "Overview",
              "Requirements",
              "Rules",
              "Technical Guidelines",
              "Judging Criteria",
              "PJ Lomba",
              "PDF File",
              "Version",
              "Publish Status",
            ]}
          />
        </InfoPanel>
        <InfoPanel icon={Activity} title="Version History" description="Version changes appear after official updates exist.">
          <EmptyState title={NO_DATA} description="Version history has not been published yet." />
        </InfoPanel>
      </section>
    </div>
  )
}

function AnalyticsScreen({ moduleKey, summary }: { moduleKey: DashboardModuleKey; summary: DashboardSummary }) {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[{ href: "/dashboard/reports", icon: FileText, label: "Ekspor Laporan" }]}
        icon={moduleKey === "reports" ? FileCheck : BarChart3}
        subtitle="Laporan kepanitiaan sederhana tanpa analitik yang dikarang."
        title={moduleKey === "reports" ? "Laporan" : "Analitik"}
      />

      <StatStrip
        items={[
          { label: "Ringkasan Lomba", value: competitions.length, tone: "navy" },
          { label: "Ringkasan Peserta", value: NO_DATA },
          { label: "Ringkasan Kehadiran", value: NO_DATA },
          { label: "Ringkasan Media", value: NO_DATA },
          { label: "Ringkasan Pengumuman", value: summary.announcements.length || NOT_PUBLISHED },
          { label: "Aktivitas Website", value: NO_DATA },
        ]}
      />

      <InfoPanel icon={BarChart3} title="Laporan Kepanitiaan" description="Chart sengaja tidak ditampilkan sampai data laporan nyata tersedia.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {["Ringkasan Lomba", "Ringkasan Peserta", "Ringkasan Kehadiran", "Ringkasan Media", "Ringkasan Pengumuman", "Aktivitas Website"].map((item) => (
            <FactTile key={item} label={item} value={item === "Ringkasan Lomba" ? `${competitions.length} lomba resmi` : NO_DATA} />
          ))}
        </div>
      </InfoPanel>
    </div>
  )
}

function SettingsScreen() {
  return (
    <div className="grid gap-6">
      <OperationsHeader
        actions={[{ href: "/dashboard/settings", icon: Settings, label: "Simpan Pengaturan" }]}
        icon={Settings}
        subtitle="Konfigurasi sistem untuk dashboard internal."
        title="Pengaturan"
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoPanel icon={Globe} title="Pengaturan Umum" description="Informasi event utama.">
          <SettingsRows
            rows={[
              ["Nama event", event.name],
              ["Theme", event.theme],
              ["Tanggal", event.dateRange],
              ["Informasi sekolah", event.school],
            ]}
          />
        </InfoPanel>
        <InfoPanel icon={Trophy} title="Pengaturan Brand" description="Input brand resmi MCS 1.">
          <SettingsRows
            rows={[
              ["Logo", "Logo resmi SMKN 20, OSIS, dan MPK"],
              ["Warna", "Navy, merah, emas, putih"],
              ["Media sosial", "Gunakan data kontak MCS utama"],
              ["Informasi kontak", "Gunakan data kontak MCS utama"],
            ]}
          />
        </InfoPanel>
        <InfoPanel icon={ShieldCheck} title="Manajemen Role" description="Pengguna, role, dan permission.">
          <DocumentStatusList items={["Pengguna", "Role", "Permission"]} />
        </InfoPanel>
        <InfoPanel icon={Bell} title="Pengaturan Notifikasi" description="Email, notifikasi dashboard, dan pengaturan broadcast.">
          <DocumentStatusList items={["Email", "Notifikasi dashboard", "Pengaturan broadcast"]} />
        </InfoPanel>
        <InfoPanel icon={UserCheck} title="Pengaturan Akun" description="Profil, password, dan logout.">
          <DocumentStatusList items={["Profil", "Password", "Logout"]} />
        </InfoPanel>
      </section>
    </div>
  )
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
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#0F172A] text-white">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-normal text-[#111827]">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#64748B]">{subtitle}</p>
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
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/20"
          >
            <Icon className="size-4 text-[#64748B]" aria-hidden="true" />
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
    <section className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-[#E5E7EB] px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F8F9FB] text-[#0F172A]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p>
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
        <article key={item.label} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-[#64748B]">{item.label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="min-w-0 text-xl font-semibold leading-6 tracking-normal text-[#111827]">{item.value}</p>
            <span className={cn("mb-1 size-2.5 shrink-0 rounded-full", getStatDotClass(item.tone ?? "neutral"))} />
          </div>
        </article>
      ))}
    </section>
  )
}

function FactTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
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
    <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8F9FB] px-4 py-10 text-center">
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-[#111827]">{displayTitle}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p>
        <p className="mt-3 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#0F172A]">
          Next Action: {nextAction ?? getEmptyStateAction(displayTitle)}
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return (
    <span className={cn("inline-flex h-7 w-fit items-center rounded-full border px-2.5 text-xs font-semibold", statusClasses[tone])}>
      {label}
    </span>
  )
}

function StatusGrid({ items }: { items: Array<{ label: string; status: string; tone?: StatusTone }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] p-3">
          <span className="text-sm font-medium text-[#111827]">{item.label}</span>
          <StatusBadge label={item.status} tone={item.tone ?? "neutral"} />
        </div>
      ))}
    </div>
  )
}

function FilterBar({ fields, searchPlaceholder }: { fields: string[]; searchPlaceholder: string }) {
  return (
    <section className="grid gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
      <label className="relative grid gap-1.5 xl:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">Search</span>
        <span className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
          <input
            className="h-10 w-full rounded-[10px] border border-[#E5E7EB] bg-white pl-9 pr-3 text-sm font-medium text-[#111827] outline-none placeholder:text-[#94A3B8] focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10"
            placeholder={searchPlaceholder}
            type="search"
          />
        </span>
      </label>
      {fields.map((field) => (
        <label key={field} className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{field}</span>
          <select className="h-10 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10">
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

function AnnouncementTable({ summary }: { summary: DashboardSummary }) {
  if (summary.announcements.length === 0) {
    return <EmptyState title={NOT_PUBLISHED} description="Official announcements have not been published yet." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Title", "Priority", "Audience", "Status", "Author", "Published Date"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summary.announcements.map((announcement) => (
            <tr key={announcement.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{announcement.title}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={formatStatus(announcement.priority)} tone={getPriorityTone(announcement.priority)} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{announcement.audience.map((role) => roleLabels[role]).join(", ")}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={formatStatus(announcement.status)} tone={getAnnouncementTone(announcement.status)} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{announcement.createdBy}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0 text-[#64748B]">{announcement.publishedAt ? formatDate(announcement.publishedAt) : NOT_PUBLISHED}</td>
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
        <article key={announcement.id} className="rounded-md border border-[#E5E7EB] p-4">
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
        <article key={task.id} className="grid gap-3 rounded-md border border-[#E5E7EB] p-4 md:grid-cols-[1fr_auto] md:items-center">
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
        <article key={item.id} className="flex gap-3 rounded-md border border-[#E5E7EB] p-3">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-[#0F172A]" />
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
    <div className="rounded-md border border-dashed border-[#CBD5E1] bg-[#F8F9FB] px-4 py-6 text-center">
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm font-medium leading-6 text-[#64748B]">{description}</p>
    </div>
  )
}

function EntrepreneurshipSalesOverview() {
  const items = [
    { label: "Pemasukan Hari Ini", value: "Belum Ada Pemasukan", tone: "neutral" as StatusTone },
    { label: "Total Transaksi", value: "Belum Ada Transaksi", tone: "neutral" as StatusTone },
    { label: "Produk Terjual", value: "Belum Ada Penjualan", tone: "neutral" as StatusTone },
    { label: "Sisa Inventaris", value: "Belum Ada Produk", tone: "neutral" as StatusTone },
    { label: "Progress Target", value: "Menunggu Aktivitas Penjualan", tone: "gold" as StatusTone },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {items.map((item) => (
        <article key={item.label} className="rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{item.label}</p>
            <span className={cn("mt-1 size-2 shrink-0 rounded-full", getStatDotClass(item.tone))} />
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#111827]">{item.value}</p>
        </article>
      ))}
    </div>
  )
}

function EntrepreneurshipTransactionsTable() {
  return (
    <div className="grid gap-4">
      <ActionGrid
        compact
        actions={[
          { href: "/dashboard/business", icon: Search, label: "Cari Transaksi" },
          { href: "/dashboard/business", icon: ClipboardList, label: "Filter Produk" },
          { href: "/dashboard/business", icon: CalendarDays, label: "Filter Tanggal" },
          { href: "/dashboard/reports", icon: Download, label: "Ekspor Transaksi" },
        ]}
      />
      <FinanceEmptyTable
        columns={["Waktu", "Produk", "Jumlah", "Harga Satuan", "Total", "Dicatat Oleh"]}
        emptyTitle="Belum Ada Transaksi"
        emptyDescription="Transaksi penjualan resmi belum dicatat."
      />
    </div>
  )
}

function EntrepreneurshipProductTable() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {["Tersedia", "Stok Rendah", "Stok Habis", "Diarsipkan"].map((status) => (
          <StatusBadge key={status} label={status} tone={getProductStatusTone(status)} />
        ))}
      </div>
      <FinanceEmptyTable
        columns={["Nama Produk", "Kategori", "Harga", "Stok Awal", "Sisa Stok", "Status"]}
        emptyTitle="Belum Ada Produk"
        emptyDescription="Data makanan, minuman, snack, merchandise, atau produk lain belum dipublikasikan."
      />
    </div>
  )
}

function EntrepreneurshipInventoryTable() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {["Aman", "Stok Rendah", "Kritis", "Stok Habis"].map((status) => (
          <StatusBadge key={status} label={status} tone={getInventoryStatusTone(status)} />
        ))}
      </div>
      <FinanceEmptyTable
        columns={["Produk", "Stok Awal", "Terjual", "Sisa", "Status"]}
        emptyTitle="Belum Ada Produk"
        emptyDescription="Pergerakan inventaris muncul setelah data produk dan penjualan resmi tersedia."
      />
    </div>
  )
}

function EntrepreneurshipBestSellers() {
  return (
    <div className="grid gap-2">
      {["#1", "#2", "#3", "#4", "#5"].map((rank) => (
        <div key={rank} className="flex items-center justify-between gap-3 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2.5">
          <span className="text-sm font-semibold text-[#111827]">{rank}</span>
          <span className="text-sm font-medium text-[#64748B]">Menunggu Aktivitas Penjualan</span>
        </div>
      ))}
    </div>
  )
}

function EntrepreneurshipCashSummary() {
  const items = [
    ["Modal Awal", "Belum Ada Pemasukan"],
    ["Pemasukan", "Belum Ada Pemasukan"],
    ["Pengeluaran", "Belum Ada Pengeluaran"],
    ["Estimasi Laba", "Belum Ada Pemasukan"],
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#111827]">{value}</p>
        </div>
      ))}
    </div>
  )
}

function EntrepreneurshipDailyReports() {
  const reports = [
    ["Hari 1", "22 Jun 2026"],
    ["Hari 2", "23 Jun 2026"],
    ["Hari 3", "24 Jun 2026"],
    ["Hari 4", "25 Jun 2026"],
  ]

  return (
    <div className="grid gap-3">
      {reports.map(([day, date]) => (
        <div key={day} className="grid gap-3 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[#111827]">{day}</p>
            <p className="mt-1 text-xs font-medium text-[#64748B]">{date}</p>
          </div>
          <StatusBadge label="Belum Ada Laporan" tone="neutral" />
        </div>
      ))}
    </div>
  )
}

function EntrepreneurshipRecentActivities({ summary }: { summary: DashboardSummary }) {
  const items = summary.auditPreview.filter((item) =>
    ["expense", "inventory", "product", "report", "sale", "sales", "stock", "target"].some((keyword) =>
      `${item.action} ${item.resource}`.toLowerCase().includes(keyword),
    ),
  )

  if (items.length === 0) {
    return <EmptyState title="Menunggu Aktivitas Penjualan" description="Produk, stok, penjualan, pengeluaran, target, dan laporan akan muncul setelah ada input resmi." />
  }

  return <ActivityRows items={items} />
}

function EntrepreneurshipSidePanel() {
  return (
    <aside className="grid content-start gap-5">
      <InfoPanel icon={Activity} title="Peringatan Stok Rendah" description="Produk yang perlu ditambah stoknya.">
        <CompactEmptyState title="Belum Ada Produk" description="Peringatan stok muncul setelah inventaris produk resmi diisi." />
      </InfoPanel>

      <InfoPanel icon={BarChart3} title="Produk Terlaris" description="Ringkasan produk dengan penjualan tertinggi.">
        <CompactEmptyState title="Menunggu Aktivitas Penjualan" description="Produk terlaris muncul setelah penjualan dicatat." />
      </InfoPanel>

      <InfoPanel icon={Wallet} title="Progress Target Penjualan" description="Perbandingan pemasukan dengan target.">
        <CompactEmptyState title="Menunggu Aktivitas Penjualan" description="Target penjualan belum dipublikasikan." />
      </InfoPanel>

      <InfoPanel icon={ClipboardList} title="Transaksi Terbaru" description="Catatan penjualan terakhir.">
        <CompactEmptyState title="Belum Ada Transaksi" description="Transaksi terbaru muncul setelah input penjualan resmi." />
      </InfoPanel>

      <InfoPanel icon={Wallet} title="Ringkasan Keuangan Hari Ini" description="Pemasukan, pengeluaran, dan estimasi laba.">
        <StatMiniList
          items={[
            { label: "Pemasukan", value: "Belum Ada Pemasukan" },
            { label: "Pengeluaran", value: "Belum Ada Pengeluaran" },
            { label: "Estimasi Laba", value: "Belum Ada Pemasukan" },
          ]}
        />
      </InfoPanel>
    </aside>
  )
}

function SponsorPipelineBoard() {
  if (sponsorProspects.length === 0) {
    return <PipelineBoard emptyTitle="Belum Ada Sponsor Aktif" statuses={sponsorshipPipelineStatuses} />
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {sponsorshipPipelineStatuses.map((status) => {
        const sponsors = sponsorProspects.filter((sponsor) => sponsor.pipelineStatus === status)

        return (
          <div key={status} className="min-h-36 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#111827]">{status}</p>
              <StatusBadge label={String(sponsors.length)} tone={sponsors.length ? "warning" : "neutral"} />
            </div>
            {sponsors.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2">
                    <p className="truncate text-sm font-semibold text-[#111827]">{sponsor.name}</p>
                    <p className="mt-1 text-xs font-medium text-[#64748B]">{sponsor.proposalStatus}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <CompactEmptyState title="Belum Ada Sponsor Aktif" description="Belum ada sponsor pada tahap ini." />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SponsorListTable() {
  if (sponsorProspects.length === 0) {
    return <EmptyState title="Belum Ada Sponsor Aktif" description="Data sponsor resmi belum dipublikasikan." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Brand Name", "PIC", "Contact", "Proposal Status", "Follow Up Date", "Partnership Type"].map((heading) => (
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
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{sponsor.pic}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{sponsor.contact}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={sponsor.proposalStatus} tone={getSponsorTone(sponsor.proposalStatus)} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{sponsor.followUpDate}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0 text-[#64748B]">{sponsor.partnershipType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SponsorProposalTracker() {
  if (sponsorProspects.length === 0) {
    return <EmptyState title={WAITING} description="No official proposal tracker records are available yet." />
  }

  return (
    <div className="grid gap-2">
      {sponsorProspects.map((sponsor) => (
        <div key={sponsor.id} className="flex items-center justify-between gap-3 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{sponsor.name}</p>
            <p className="mt-1 text-xs font-medium text-[#64748B]">Follow up: {sponsor.followUpDate}</p>
          </div>
          <StatusBadge label={sponsor.proposalStatus} tone={getSponsorTone(sponsor.proposalStatus)} />
        </div>
      ))}
    </div>
  )
}

function PublicationQueue({ summary }: { summary: DashboardSummary }) {
  if (summary.announcements.length === 0) {
    return <EmptyState title="No Publications Scheduled" description="Draft, approval, scheduled, and published content will appear here." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Title", "Type", "Platform", "Publish Time", "Status"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summary.announcements.map((publication) => (
            <tr key={publication.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">
                {publication.title}
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">Announcement</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">
                {publication.visibility === "public" ? "Public Website" : "Internal Dashboard"}
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">
                {publication.publishedAt ? formatDate(publication.publishedAt) : NOT_PUBLISHED}
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <StatusBadge label={formatStatus(publication.status)} tone={getAnnouncementTone(publication.status)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatMiniList({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2.5">
          <span className="text-sm font-medium text-[#64748B]">{item.label}</span>
          <span className="max-w-[55%] truncate text-right text-sm font-semibold text-[#111827]">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function SocialScheduleTable({ publications }: { publications: DashboardSummary["announcements"] }) {
  if (publications.length === 0) {
    return <EmptyState title="No Publications Scheduled" description="Instagram, TikTok, website, and broadcast schedules are waiting for updates." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Time", "Content", "Platform", "Status"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {publications.map((publication) => (
            <tr key={publication.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 text-[#64748B]">{NOT_PUBLISHED}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{publication.title}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">Website Publications</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <StatusBadge label={formatStatus(publication.status)} tone={getAnnouncementTone(publication.status)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HumasRecentActivities({ summary }: { summary: DashboardSummary }) {
  const activity = summary.auditPreview.filter((item) =>
    ["announcement", "proposal", "sponsor", "broadcast", "media", "publication", "partner"].some((keyword) =>
      `${item.action} ${item.resource}`.toLowerCase().includes(keyword),
    ),
  )

  if (activity.length === 0) {
    return <EmptyState title={WAITING} description="Aktivitas proposal, sponsor, broadcast, dan mitra media akan muncul di sini." />
  }

  return <ActivityRows items={activity} />
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
          <p className="mt-1 text-sm font-medium text-[#64748B]">{liveMatch.teamA} vs {liveMatch.teamB}</p>
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
        <article key={item.id} className="grid gap-2 rounded-md border border-[#E5E7EB] p-3 md:grid-cols-[minmax(0,1fr)_160px] md:items-center">
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

function PipelineBoard({ emptyTitle = NO_DATA, statuses }: { emptyTitle?: string; statuses: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {statuses.map((status) => (
        <div key={status} className="min-h-36 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#111827]">{status}</p>
            <StatusBadge label="0" tone="neutral" />
          </div>
          <div className="mt-4">
            <EmptyState title={emptyTitle} description="No official sponsor record." />
          </div>
        </div>
      ))}
    </div>
  )
}

function DocumentStatusList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item} className="flex items-center justify-between gap-3 rounded-md border border-[#E5E7EB] p-3">
          <span className="text-sm font-medium text-[#111827]">{item}</span>
          <StatusBadge label={NO_DATA} tone="neutral" />
        </div>
      ))}
    </div>
  )
}

function UploadDropzone({ title }: { title: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-md border border-dashed border-[#CBD5E1] bg-[#F8F9FB] px-4 py-10 text-center">
      <div className="max-w-sm">
        <Upload className="mx-auto size-8 text-[#64748B]" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-[#111827]">{title}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">Official files can be uploaded when the backend workflow is connected.</p>
      </div>
    </div>
  )
}

function SimpleList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item} className="rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2 text-sm font-medium text-[#111827]">
          {item}
        </div>
      ))}
    </div>
  )
}

function SettingsRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="grid gap-3">
      {rows.map(([label, value]) => (
        <FactTile key={label} label={label} value={value} />
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
        <article key={task.id} className="grid gap-3 rounded-md border border-[#E5E7EB] p-4 md:grid-cols-[1fr_auto] md:items-center">
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
  "Media Center",
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
    "media-archive": "Arsip Media",
    "media-center": "Pusat Media",
    "media-gallery": "Kelola Galeri",
    "media-highlights": "Video Highlight",
    "media-posts": "Posting Media",
    "media-upload": "Unggah Media",
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

function getBusinessQuickActions(focus: BusinessDashboardFocus): ActionLink[] {
  const actions: ActionLink[] = [
    { href: "/dashboard/business", icon: Archive, label: "Tambah Produk" },
    { href: "/dashboard/business", icon: Wallet, label: "Catat Penjualan" },
    { href: "/dashboard/business", icon: ClipboardList, label: "Update Stok" },
    { href: "/dashboard/business", icon: FileText, label: "Tambah Pengeluaran" },
    { href: "/dashboard/reports", icon: Download, label: "Buat Laporan" },
  ]

  if (focus === "finance") {
    return [
      actions[4],
      actions[3],
      actions[1],
      actions[2],
      actions[0],
    ]
  }

  return actions
}

function getBusinessEventStatus(date: Date) {
  const start = new Date(`${event.startDate}T00:00:00.000+07:00`)
  const end = new Date(`${event.endDate}T23:59:59.999+07:00`)

  if (date < start) {
    return {
      dayLabel: "Persiapan Pra-Event",
      statusLabel: "Pra-Event",
    }
  }

  if (date > end) {
    return {
      dayLabel: "Pasca-Event",
      statusLabel: "Selesai",
    }
  }

  const dayNumber = Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1

  return {
    dayLabel: `Hari Kegiatan ${dayNumber}`,
    statusLabel: "Kegiatan Berjalan",
  }
}

function getBusinessGreeting(date: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(date),
  )

  if (hour < 12) return "Selamat Pagi"
  if (hour < 17) return "Selamat Siang"
  return "Selamat Sore"
}

function formatBusinessDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(date)
}

function formatBusinessTime(date: Date) {
  return `${new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date)} WIB`
}

function getProductStatusTone(status: string): StatusTone {
  if (status === "Available" || status === "Tersedia") return "success"
  if (status === "Low Stock" || status === "Stok Rendah") return "warning"
  if (status === "Out Of Stock" || status === "Stok Habis") return "danger"
  return "neutral"
}

function getInventoryStatusTone(status: string): StatusTone {
  if (status === "Safe" || status === "Aman") return "success"
  if (status === "Low Stock" || status === "Stok Rendah") return "warning"
  if (status === "Critical" || status === "Kritis" || status === "Out Of Stock" || status === "Stok Habis") return "danger"
  return "neutral"
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

function getAnnouncementTone(status: string): StatusTone {
  if (status === "published") return "success"
  if (status === "pending_approval") return "warning"
  if (status === "archived") return "neutral"
  return "info"
}
