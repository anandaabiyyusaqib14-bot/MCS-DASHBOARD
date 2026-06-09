"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock3,
  FileCheck,
  GitBranch,
  MapPin,
  Megaphone,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type {
  AnnouncementRecord,
  DivisionHandoffRecord,
  EventDaySummary,
  IssueRecord,
  MediaRecord,
  NotificationRecord,
  Permission,
  VenueStatusRecord,
} from "@/server/mcs/types"

type Tone = "neutral" | "info" | "success" | "warning" | "danger"
type NotificationCategory = "Semua" | "Kendala" | "Koordinasi" | "Persetujuan" | "Jadwal" | "Tempat"

const notificationCategories: NotificationCategory[] = ["Semua", "Kendala", "Koordinasi", "Persetujuan", "Jadwal", "Tempat"]

export function NotificationCenterScreen({
  notifications,
  permissions,
}: {
  notifications: NotificationRecord[]
  permissions: Permission[]
}) {
  const router = useRouter()
  const [category, setCategory] = useState<NotificationCategory>("Semua")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLowerCase()

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesCategory = category === "Semua" || getNotificationCategory(notification) === category
      const matchesRead = !showUnreadOnly || notification.status === "unread"
      const searchable = `${notification.title} ${notification.body} ${notification.type}`.toLowerCase()
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery)

      return matchesCategory && matchesRead && matchesQuery
    })
  }, [category, normalizedQuery, notifications, showUnreadOnly])

  async function markRead(notification: NotificationRecord) {
    if (!permissions.includes("notifications.update") || notification.status === "read") return

    await fetch(`/api/mcs/notifications/${notification.id}/read`, { method: "PATCH" })
    router.refresh()
  }

  const unreadCount = notifications.filter((notification) => notification.status === "unread").length
  const urgentCount = notifications.filter((notification) => getNotificationPriority(notification) === "Penting").length

  return (
    <div className="grid gap-5">
      <OperationsHero
        eyebrow="Pusat Notifikasi"
        icon={<Bell className="size-5" aria-hidden="true" />}
        subtitle="Feed penuh untuk kendala, koordinasi divisi, persetujuan, jadwal, tempat, prioritas penting, dan status belum dibaca."
        title="Pusat Notifikasi"
      />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricTile label="Total Notifikasi" value={notifications.length || "Belum Ada"} />
        <MetricTile label="Belum Dibaca" value={unreadCount || "Tidak Ada"} tone={unreadCount ? "warning" : "success"} />
        <MetricTile label="Prioritas Penting" value={urgentCount || "Tidak Ada"} tone={urgentCount ? "danger" : "success"} />
        <MetricTile label="Filter Aktif" value={category} />
      </section>

      <Panel
        icon={<Search className="size-4" aria-hidden="true" />}
        title="Filter Feed"
        description="Operator bisa menyaring sinyal berdasarkan jenis, teks, dan status belum dibaca."
      >
        <div className="grid gap-3">
          <Input
            value={query}
            placeholder="Cari judul, isi notifikasi, atau tipe"
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {notificationCategories.map((item) => (
              <FilterButton key={item} active={category === item} onClick={() => setCategory(item)}>
                {item}
              </FilterButton>
            ))}
            <FilterButton active={showUnreadOnly} onClick={() => setShowUnreadOnly((current) => !current)}>
              Belum Dibaca
            </FilterButton>
          </div>
        </div>
      </Panel>

      <Panel
        icon={<Bell className="size-4" aria-hidden="true" />}
        title="Feed Notifikasi"
        description="Klik item untuk masuk ke resource terkait, atau tandai sudah dibaca."
      >
        {filteredNotifications.length ? (
          <div className="grid gap-2">
            {filteredNotifications.map((notification) => {
              const priority = getNotificationPriority(notification)

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "grid gap-3 rounded-xl border p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
                    notification.status === "unread"
                      ? "border-[#FDE68A] bg-[#FFFBEB]"
                      : "border-[#E5E7EB] bg-[#F8F9FB]",
                  )}
                >
                  <Link href={getNotificationHref(notification)} className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge label={getNotificationCategory(notification)} tone={getNotificationTone(notification)} />
                      <StatusBadge label={priority} tone={getPriorityTone(priority)} />
                      <span className="text-xs font-semibold text-[#64748B]">{formatShortDateTime(notification.createdAt)}</span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-[#111827]">{notification.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-[#64748B]">{notification.body}</p>
                  </Link>
                  {permissions.includes("notifications.update") ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={notification.status === "read"}
                      onClick={() => markRead(notification)}
                    >
                      {notification.status === "read" ? "Sudah Dibaca" : "Tandai Dibaca"}
                    </Button>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : (
          <ActionableEmptyState
            actionLabel="Buat Kendala atau Koordinasi"
            description="Notifikasi akan muncul setelah ada update resmi kepanitiaan."
            owner="Semua Divisi"
            title="Belum Ada Notifikasi Sesuai Filter"
          />
        )}
      </Panel>
    </div>
  )
}

export function ApprovalCenterScreen({
  announcements,
  issues,
  media,
  permissions,
}: {
  announcements: AnnouncementRecord[]
  issues: IssueRecord[]
  media: MediaRecord[]
  permissions: Permission[]
}) {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const pendingAnnouncements = announcements.filter((item) => item.status === "pending_approval")
  const pendingMedia = media.filter((item) => item.approvalStatus === "pending")
  const closableIssues = issues.filter((item) => item.status === "Selesai")
  const pendingTotal = pendingAnnouncements.length + pendingMedia.length + closableIssues.length

  async function patch(path: string, body: Record<string, unknown>, successMessage: string) {
    try {
      const response = await fetch(path, {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })

      if (!response.ok) throw new Error("Persetujuan belum berhasil diproses.")

      setStatus(successMessage)
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Persetujuan belum berhasil diproses.")
    }
  }

  return (
    <div className="grid gap-5">
      <OperationsHero
        eyebrow="Pusat Persetujuan"
        icon={<FileCheck className="size-5" aria-hidden="true" />}
        subtitle="Satu layar untuk meninjau pengumuman, media, kendala selesai, dan permintaan kepanitiaan yang sudah tersedia."
        title="Pusat Persetujuan"
      />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricTile label="Total Tertunda" value={pendingTotal || "Tidak Ada"} tone={pendingTotal ? "warning" : "success"} />
        <MetricTile label="Pengumuman" value={pendingAnnouncements.length || "Tidak Ada"} />
        <MetricTile label="Media" value={pendingMedia.length || "Tidak Ada"} />
        <MetricTile label="Kendala Selesai" value={closableIssues.length || "Tidak Ada"} />
      </section>

      {status ? (
        <div className="rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-2 text-sm font-semibold text-[#1D4ED8]">
          {status}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel
          icon={<Megaphone className="size-4" aria-hidden="true" />}
          title="Persetujuan Pengumuman"
          description="Pengumuman internal atau publik yang menunggu keputusan pimpinan."
        >
          {pendingAnnouncements.length ? (
            <ApprovalList
              items={pendingAnnouncements.map((item) => ({
                action: permissions.includes("announcements.approve")
                  ? () => patch(`/api/mcs/announcements/${item.id}/approve`, { publish: true }, "Pengumuman disetujui dan dipublikasikan.")
                  : undefined,
                actionLabel: "Setujui & Publikasikan",
                meta: `${item.priority} / ${formatShortDateTime(item.createdAt)}`,
                title: item.title,
                value: item.visibility === "public" ? "Publik" : "Internal",
              }))}
            />
          ) : (
            <ActionableEmptyState
              actionLabel="Buat Pengumuman"
              description="Belum ada pengumuman yang menunggu persetujuan."
              owner="Humas / Pimpinan"
              title="Tidak Ada Persetujuan Pengumuman"
            />
          )}
        </Panel>

        <Panel
          icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
          title="Persetujuan Media"
          description="Media unggahan Dokumentasi yang menunggu persetujuan publikasi."
        >
          {pendingMedia.length ? (
            <ApprovalList
              items={pendingMedia.map((item) => ({
                action: permissions.includes("media.approve")
                  ? () => patch(`/api/mcs/media/${item.id}`, { approvalStatus: "approved" }, "Media disetujui.")
                  : undefined,
                actionLabel: "Setujui Media",
                meta: `${item.type} / ${formatShortDateTime(item.createdAt)}`,
                title: item.title,
                value: item.visibility === "public" ? "Publik" : "Internal",
              }))}
            />
          ) : (
            <ActionableEmptyState
              actionLabel="Unggah Media"
              description="Belum ada media yang menunggu persetujuan."
              owner="Dokumentasi / Pimpinan"
              title="Tidak Ada Persetujuan Media"
            />
          )}
        </Panel>

        <Panel
          icon={<AlertTriangle className="size-4" aria-hidden="true" />}
          title="Kendala Selesai"
          description="Kendala yang sudah selesai dan menunggu pengarsipan pimpinan."
        >
          {closableIssues.length ? (
            <ApprovalList
              items={closableIssues.map((item) => ({
                action: permissions.includes("issues.close")
                  ? () => patch(`/api/mcs/issues/${item.id}`, { status: "Ditutup" }, "Kendala diarsipkan.")
                  : undefined,
                actionLabel: "Arsipkan Kendala",
                meta: `${item.issueCode} / ${item.severity}`,
                title: item.title,
                value: item.assignedToName ?? item.assignedDivisionName ?? "PIC belum ditentukan",
              }))}
            />
          ) : (
            <ActionableEmptyState
              actionLabel="Selesaikan Kendala"
              description="Kendala selesai akan muncul setelah PIC menandai kendala selesai."
              owner="PIC Kendala / Pimpinan"
              title="Belum Ada Kendala Selesai"
            />
          )}
        </Panel>

        <Panel
          icon={<Clock3 className="size-4" aria-hidden="true" />}
          title="Perubahan Jadwal & Laporan"
          description="Ruang persetujuan siap dipakai saat permintaan perubahan jadwal atau laporan sudah tersedia."
        >
          <ActionableEmptyState
            actionLabel="Ajukan dari Modul Terkait"
            description="Belum ada permintaan perubahan jadwal atau laporan yang menunggu persetujuan."
            owner="Acara / Sekretaris"
            title="Belum Ada Request"
          />
        </Panel>
      </section>
    </div>
  )
}

export function OperationsReportScreen({
  eventDay,
  handoffs,
  issues,
  venues,
}: {
  eventDay: EventDaySummary
  handoffs: DivisionHandoffRecord[]
  issues: IssueRecord[]
  venues: VenueStatusRecord[]
}) {
  const activeIssues = issues.filter((issue) => issue.status !== "Ditutup")
  const closedIssues = issues.filter((issue) => issue.status === "Ditutup")
  const blockedHandoffs = handoffs.filter((handoff) => handoff.status === "Terblokir")
  const lateHandoffs = handoffs.filter((handoff) => isPastDate(handoff.deadline) && handoff.status !== "Selesai")
  const blockedVenues = venues.filter((venue) => venue.status === "Terblokir")
  const topCategory = getTopIssueCategory(issues)
  const responseTime = getAverageIssueResolutionHours(issues)

  return (
    <div className="grid gap-5">
      <OperationsHero
        eyebrow="Laporan Kepanitiaan"
        icon={<BarChart3 className="size-5" aria-hidden="true" />}
        subtitle="Rekap kendala, koordinasi terlambat, waktu penyelesaian, status tempat, dan bahan laporan akhir."
        title="Laporan Kepanitiaan"
      />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricTile label="Kendala Aktif" value={activeIssues.length || "Tidak Ada"} tone={activeIssues.length ? "warning" : "success"} />
        <MetricTile label="Kendala Ditutup" value={closedIssues.length || "Belum Ada"} />
        <MetricTile label="Koordinasi Terlambat" value={lateHandoffs.length || "Tidak Ada"} tone={lateHandoffs.length ? "danger" : "success"} />
        <MetricTile label="Tempat Tertunda" value={blockedVenues.length || "Tidak Ada"} tone={blockedVenues.length ? "danger" : "success"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <Panel
          icon={<AlertTriangle className="size-4" aria-hidden="true" />}
          title="Rekap Kendala"
          description="Ringkasan kategori, prioritas, PIC, dan status tindak lanjut."
        >
          {issues.length ? (
            <div className="grid gap-3">
              <MetricLine label="Kategori Terbanyak" value={topCategory ?? "Belum Ada Data"} />
              <MetricLine label="Waktu Penyelesaian Rata-rata" value={responseTime ?? "Belum Ada Data"} />
              <MetricLine label="Prioritas Tinggi Aktif" value={String(activeIssues.filter((issue) => issue.severity === "Tinggi" || issue.severity === "Kritis").length)} />
              <CompactList
                emptyDescription="Kendala aktif akan muncul setelah panitia mencatat kendala resmi."
                items={activeIssues.slice(0, 6).map((issue) => ({
                  meta: `${issue.issueCode} / ${issue.severity}`,
                  title: issue.title,
                  value: issue.assignedToName ?? issue.assignedDivisionName ?? "PIC belum ditentukan",
                }))}
              />
            </div>
          ) : (
            <ActionableEmptyState
              actionLabel="Tambah Kendala"
              description="Rekap kendala baru bisa dihitung setelah kendala resmi dicatat."
              owner="Semua Divisi"
              title="Belum Ada Data Kendala"
            />
          )}
        </Panel>

        <Panel
          icon={<GitBranch className="size-4" aria-hidden="true" />}
          title="Rekap Koordinasi"
          description="Koordinasi terlambat dan catatan yang masih tertunda."
        >
          {handoffs.length ? (
            <div className="grid gap-3">
              <MetricLine label="Tertunda" value={String(blockedHandoffs.length)} />
              <MetricLine label="Terlambat" value={String(lateHandoffs.length)} />
              <MetricLine label="Selesai" value={String(handoffs.filter((handoff) => handoff.status === "Selesai").length)} />
              <CompactList
                emptyDescription="Belum ada koordinasi yang terlambat atau tertunda."
                items={[...lateHandoffs, ...blockedHandoffs].slice(0, 5).map((handoff) => ({
                  meta: `${handoff.sourceDivisionName} -> ${handoff.targetDivisionName}`,
                  title: handoff.activity,
                  value: handoff.ownerName,
                }))}
              />
            </div>
          ) : (
            <ActionableEmptyState
              actionLabel="Buat Koordinasi"
              description="Rekap koordinasi baru muncul setelah alur antar divisi digunakan."
              owner="Divisi Terkait"
              title="Belum Ada Data Koordinasi"
            />
          )}
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel
          icon={<MapPin className="size-4" aria-hidden="true" />}
          title="Kesiapan Tempat"
          description="Status tempat dari update resmi panitia."
        >
          <CompactList
            emptyDescription="Tempat muncul setelah jadwal resmi memiliki lokasi."
            items={venues.map((venue) => ({
              meta: formatStatusLabel(venue.status),
              title: venue.venue,
              value: venue.ownerName ?? "PIC belum diisi",
            }))}
          />
        </Panel>

        <Panel
          icon={<FileCheck className="size-4" aria-hidden="true" />}
          title="Bahan Laporan Akhir"
          description="Bahan ringkasan akhir yang siap diisi setelah kegiatan berjalan."
        >
          <div className="grid gap-3">
            <MetricLine label="Kendala Tertutup" value={String(closedIssues.length)} />
            <MetricLine label="Batas Waktu Terdekat" value={eventDay.upcomingDeadlines[0]?.title ?? "Belum Ada"} />
            <MetricLine label="Persetujuan Tertunda" value={String(eventDay.pendingApprovals.length)} />
            <ActionableEmptyState
              actionLabel="Lengkapi Kendala, Koordinasi, Tempat"
              description="Laporan akhir akan matang setelah data kepanitiaan dipakai sepanjang kegiatan."
              owner="Pimpinan / Sekretaris"
              title="Belum Siap untuk Laporan Akhir"
            />
          </div>
        </Panel>
      </section>
    </div>
  )
}

function OperationsHero({
  eyebrow,
  icon,
  subtitle,
  title,
}: {
  eyebrow: string
  icon: ReactNode
  subtitle: string
  title: string
}) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-[#B91C1C]">{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#B91C1C]">{eyebrow}</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-normal text-[#111827]">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#64748B]">{subtitle}</p>
        </div>
      </div>
    </section>
  )
}

function Panel({
  children,
  description,
  icon,
  title,
}: {
  children: ReactNode
  description: string
  icon: ReactNode
  title: string
}) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 grid size-8 place-items-center rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] text-[#B91C1C]">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function MetricTile({ label, tone = "neutral", value }: { label: string; tone?: "neutral" | "success" | "danger" | "warning"; value: number | string }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
      <p
        className={cn(
          "mt-2 text-xl font-semibold",
          tone === "danger" ? "text-[#B91C1C]" : tone === "success" ? "text-[#166534]" : tone === "warning" ? "text-[#92400E]" : "text-[#111827]",
        )}
      >
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={cn("inline-flex h-7 w-fit shrink-0 items-center rounded-full border px-2.5 text-xs font-semibold", getToneClassName(tone))}>
      {label}
    </span>
  )
}

function FilterButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "h-9 rounded-[10px] border px-3 text-sm font-semibold transition",
        active ? "border-[#B91C1C] bg-[#FEF2F2] text-[#B91C1C]" : "border-[#E5E7EB] bg-white text-[#64748B] hover:bg-[#F8F9FB]",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function ApprovalList({
  items,
}: {
  items: Array<{
    action?: () => void
    actionLabel: string
    meta: string
    title: string
    value: string
  }>
}) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={`${item.title}-${item.meta}`} className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{item.title}</p>
            <p className="mt-1 text-xs font-medium text-[#64748B]">{item.meta}</p>
            <p className="mt-1 text-xs font-semibold text-[#0F172A]">{item.value}</p>
          </div>
          {item.action ? (
            <Button type="button" size="sm" onClick={item.action}>
              {item.actionLabel}
            </Button>
          ) : (
            <StatusBadge label="Read Only" tone="neutral" />
          )}
        </div>
      ))}
    </div>
  )
}

function CompactList({
  emptyDescription,
  items,
}: {
  emptyDescription: string
  items: Array<{ meta: string; title: string; value: string }>
}) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8F9FB] p-4 text-sm font-semibold text-[#64748B]">
        {emptyDescription}
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={`${item.title}-${item.meta}`} className="grid gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-3 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{item.title}</p>
            <p className="mt-1 text-xs font-medium text-[#64748B]">{item.meta}</p>
          </div>
          <p className="text-sm font-medium text-[#64748B] sm:text-right">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm">
      <span className="text-[#64748B]">{label}</span>
      <span className="truncate font-semibold text-[#111827]">{value}</span>
    </div>
  )
}

function ActionableEmptyState({
  actionLabel,
  description,
  owner,
  title,
}: {
  actionLabel: string
  description: string
  owner: string
  title: string
}) {
  return (
    <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8F9FB] px-4 py-8 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-[#111827]">{title}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p>
        <div className="mt-3 grid gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#0F172A]">
          <span>Penanggung Jawab: {owner}</span>
          <span>Tindak Lanjut: {actionLabel}</span>
        </div>
      </div>
    </div>
  )
}

function getNotificationCategory(notification: NotificationRecord): NotificationCategory {
  if (notification.type.startsWith("issue_")) return "Kendala"
  if (notification.type.startsWith("handoff_")) return "Koordinasi"
  if (notification.type === "approval_requested" || notification.type === "media_uploaded" || notification.type === "announcement") return "Persetujuan"
  if (notification.type === "schedule_update" || notification.type === "score_update") return "Jadwal"
  if (notification.type === "venue_updated") return "Tempat"
  return "Semua"
}

function getNotificationPriority(notification: NotificationRecord) {
  if (notification.type === "issue_escalated" || notification.type === "handoff_blocked") return "Penting"
  if (notification.type === "issue_created" || notification.type === "issue_assigned" || notification.type === "handoff_requested" || notification.type === "venue_updated") return "Penting"
  return "Info"
}

function getNotificationTone(notification: NotificationRecord): Tone {
  const category = getNotificationCategory(notification)
  if (category === "Kendala") return "danger"
  if (category === "Koordinasi") return "warning"
  if (category === "Persetujuan") return "info"
  if (category === "Tempat") return "warning"
  return "neutral"
}

function getPriorityTone(priority: string): Tone {
  if (priority === "Penting") return "warning"
  return "neutral"
}

function getNotificationHref(notification: NotificationRecord) {
  if (notification.resource === "issues") return "/dashboard/issues"
  if (notification.resource === "handoffs") return "/dashboard/handoffs"
  if (notification.resource === "venues") return "/dashboard/venues"
  if (notification.resource === "announcements") return "/dashboard/announcements"
  if (notification.resource === "media") return "/dashboard/media"
  if (notification.resource === "schedules") return "/dashboard/schedules"
  return "/dashboard/notifications"
}

function getTopIssueCategory(issues: IssueRecord[]) {
  if (!issues.length) return undefined

  const counts = new Map<string, number>()
  issues.forEach((issue) => counts.set(issue.category, (counts.get(issue.category) ?? 0) + 1))
  const [category, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? []

  return category && count ? `${category} (${count})` : undefined
}

function getAverageIssueResolutionHours(issues: IssueRecord[]) {
  const durations = issues.flatMap((issue) => {
    const end = issue.resolvedAt ?? issue.closedAt
    if (!end) return []

    const created = Date.parse(issue.createdAt)
    const finished = Date.parse(end)
    if (!Number.isFinite(created) || !Number.isFinite(finished) || finished < created) return []

    return [Math.round((finished - created) / 36_000) / 100]
  })

  if (!durations.length) return undefined

  const average = durations.reduce((total, value) => total + value, 0) / durations.length
  return `${average.toFixed(1)} jam`
}

function isPastDate(value: string) {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return false

  return parsed < Date.now()
}

function getToneClassName(tone: Tone) {
  if (tone === "danger") return "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
  if (tone === "success") return "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]"
  if (tone === "info") return "border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB]"
  if (tone === "warning") return "border-[#FEF3C7] bg-[#FFFBEB] text-[#92400E]"
  return "border-[#E5E7EB] bg-[#F8F9FB] text-[#64748B]"
}

function formatStatusLabel(label: string) {
  if (label === "Terblokir") return "Tertunda"
  if (label === "Ditutup") return "Diarsipkan"
  return label
}

function formatShortDateTime(value: string) {
  return `${new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))} WIB`
}
