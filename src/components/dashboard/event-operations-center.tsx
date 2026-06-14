"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  GitBranch,
  MapPin,
  Megaphone,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type {
  DivisionHandoffRecord,
  EventDaySummary,
  IssueHistoryRecord,
  IssueRecord,
  Permission,
  UserDTO,
  VenueStatus,
  VenueStatusRecord,
} from "@/server/mcs/types"

type DivisionOption = {
  coordinator: string
  id: string
  name: string
}

type OperationsCommonProps = {
  divisions: DivisionOption[]
  permissions: Permission[]
  user: UserDTO
}

type SubmissionState = {
  message: string
  tone: "success" | "danger"
} | null

type IssueDetailPayload = {
  history: IssueHistoryRecord[]
  issue: IssueRecord
}

const issueSeverityOptions = ["Rendah", "Sedang", "Tinggi"] as const
const issueCategoryOptions = [
  { label: "Tempat", value: "Venue" },
  { label: "Jadwal", value: "Jadwal" },
  { label: "Perlengkapan", value: "Perlengkapan" },
  { label: "Keamanan", value: "Keamanan" },
  { label: "Peserta", value: "Peserta" },
  { label: "Media", value: "Media" },
  { label: "Pengumuman", value: "Pengumuman" },
  { label: "Lainnya", value: "Lainnya" },
] as const
const venueStatusOptions = ["Menunggu Update", "Siap", "Perlu Dicek", "Terblokir", "Ditutup"] satisfies VenueStatus[]

export function IssuesCenterScreen({
  divisions,
  issues,
  permissions,
  user,
}: OperationsCommonProps & {
  issues: IssueRecord[]
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const createFromCommand = searchParams.get("action") === "create"
  const issueDialogOpen = formOpen || createFromCommand
  const activeIssues = issues.filter((issue) => issue.status !== "Ditutup")
  const highPriorityCount = activeIssues.filter((issue) => issue.severity === "Tinggi" || issue.severity === "Kritis").length

  return (
    <div className="grid gap-5">
      <OperationsHero
        action={permissions.includes("issues.create") ? { label: "Tambah Kendala", onClick: () => setFormOpen(true) } : undefined}
        eyebrow="Pencatatan Kendala"
        icon={<AlertTriangle className="size-5" aria-hidden="true" />}
        subtitle="Catatan kendala kepanitiaan, PIC, batas waktu, dan status tindak lanjut MCS 1."
        title="Kendala Aktif"
      />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricTile label="Kendala Aktif" value={String(activeIssues.length)} />
        <MetricTile label="Prioritas Tinggi" value={highPriorityCount || "Tidak Ada"} tone={highPriorityCount ? "danger" : "success"} />
        <MetricTile label="Diproses" value={activeIssues.filter((issue) => issue.status === "Diproses").length} />
        <MetricTile label="Menunggu PIC" value={activeIssues.filter((issue) => !issue.assignedDivisionId && !issue.assignedToUserId).length} />
      </section>

      <Panel
        icon={<AlertTriangle className="size-4" aria-hidden="true" />}
        title="Daftar Kendala"
        description="Prioritas tertinggi muncul lebih dulu. Setiap kendala perlu PIC dan batas waktu."
      >
        <IssuesTable issues={activeIssues} permissions={permissions} onOpenDetail={setSelectedIssueId} />
      </Panel>

      <IssueDialog
        divisions={divisions}
        open={issueDialogOpen}
        user={user}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open && createFromCommand) {
            router.replace("/dashboard/issues", { scroll: false })
          }
        }}
      />
      <IssueDetailDialog
        issueId={selectedIssueId}
        permissions={permissions}
        onOpenChange={(open) => {
          if (!open) setSelectedIssueId(null)
        }}
      />
    </div>
  )
}

export function HandoffsCenterScreen({
  divisions,
  handoffs,
  permissions,
  user,
}: OperationsCommonProps & {
  handoffs: DivisionHandoffRecord[]
}) {
  const [formOpen, setFormOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const createFromCommand = searchParams.get("action") === "create"
  const handoffDialogOpen = formOpen || createFromCommand
  const activeHandoffs = handoffs.filter((handoff) => handoff.status !== "Selesai")

  return (
    <div className="grid gap-5">
      <OperationsHero
        action={permissions.includes("handoffs.create") ? { label: "Buat Koordinasi", onClick: () => setFormOpen(true) } : undefined}
        eyebrow="Koordinasi Antar Divisi"
        icon={<GitBranch className="size-5" aria-hidden="true" />}
        subtitle="Catatan koordinasi dari divisi sumber ke divisi tujuan, lengkap dengan PIC, kendala, dan batas waktu."
        title="Koordinasi Divisi"
      />

      <section className="grid gap-4 md:grid-cols-4">
        <MetricTile label="Menunggu" value={activeHandoffs.filter((handoff) => handoff.status === "Menunggu").length} />
        <MetricTile label="Diterima" value={activeHandoffs.filter((handoff) => handoff.status === "Diterima").length} />
        <MetricTile label="Tertunda" value={activeHandoffs.filter((handoff) => handoff.status === "Terblokir").length} tone="danger" />
        <MetricTile label="Selesai" value={handoffs.filter((handoff) => handoff.status === "Selesai").length} tone="success" />
      </section>

      <Panel
        icon={<GitBranch className="size-4" aria-hidden="true" />}
        title="Alur Koordinasi"
        description="Alur sederhana koordinasi kegiatan dari rundown sampai publikasi."
      >
        <HandoffFlow handoffs={handoffs} />
      </Panel>

      <Panel
        icon={<GitBranch className="size-4" aria-hidden="true" />}
        title="Daftar Koordinasi"
        description="Divisi tujuan dapat menerima, menunda, atau menandai koordinasi selesai tanpa pindah halaman."
      >
        <HandoffsTable handoffs={handoffs} permissions={permissions} />
      </Panel>

      <HandoffDialog
        divisions={divisions}
        open={handoffDialogOpen}
        user={user}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open && createFromCommand) {
            router.replace("/dashboard/handoffs", { scroll: false })
          }
        }}
      />
    </div>
  )
}

export function EventDayModeScreen({
  eventDay,
  permissions,
}: {
  eventDay: EventDaySummary
  permissions: Permission[]
}) {
  return (
    <div className="grid gap-5">
      <OperationsHero
        eyebrow="Hari Kegiatan"
        icon={<Clock3 className="size-5" aria-hidden="true" />}
        subtitle="Ringkasan sederhana untuk melihat agenda sekarang, agenda berikutnya, kendala, persetujuan, tempat, dan batas waktu."
        title="Ringkasan Hari Kegiatan"
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <Panel
          icon={<Clock3 className="size-4" aria-hidden="true" />}
          title="Sekarang"
          description="Aktivitas yang sedang atau paling dekat berjalan."
        >
          <ActivityFocus activity={eventDay.currentActivity} emptyTitle="Belum Ada Aktivitas Berjalan" />
        </Panel>

        <Panel
          icon={<CalendarClock className="size-4" aria-hidden="true" />}
          title="Berikutnya"
          description="Aktivitas berikutnya yang harus disiapkan."
        >
          <ActivityFocus activity={eventDay.nextActivity} emptyTitle="Belum Ada Aktivitas Berikutnya" />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <Panel
          icon={<AlertTriangle className="size-4" aria-hidden="true" />}
          title="Butuh Tindak Lanjut"
          description="Kendala dan koordinasi divisi yang paling perlu perhatian."
        >
          <AttentionQueue eventDay={eventDay} permissions={permissions} />
        </Panel>

        <Panel
          icon={<MapPin className="size-4" aria-hidden="true" />}
          title="Status Tempat"
          description="Kesiapan tempat berdasarkan update resmi panitia."
        >
          <VenueStatusList venues={eventDay.venueStatuses} />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel
          icon={<Megaphone className="size-4" aria-hidden="true" />}
          title="Menunggu Persetujuan"
          description="Persetujuan yang bisa menghambat publikasi atau kegiatan."
        >
          {eventDay.pendingApprovals.length ? (
            <div className="grid gap-2">
              {eventDay.pendingApprovals.map((item) => (
                <CompactRow key={item.id} meta={item.priority} title={item.title} value="Menunggu Persetujuan" />
              ))}
            </div>
          ) : (
            <ActionableEmptyState
              actionLabel="Buka Pengumuman"
              description="Belum ada persetujuan yang menunggu keputusan."
              owner="Ketua Pelaksana / Wakil Ketua"
              title="Tidak Ada Persetujuan Tertunda"
            />
          )}
        </Panel>

        <Panel
          icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
          title="Batas Waktu Terdekat"
        description="Gabungan batas waktu kendala, koordinasi, dan tugas."
        >
          {eventDay.upcomingDeadlines.length ? (
            <div className="grid gap-2">
              {eventDay.upcomingDeadlines.map((item) => (
                <CompactRow key={`${item.type}-${item.id}`} meta={item.type} title={item.title} value={item.deadline} />
              ))}
            </div>
          ) : (
            <ActionableEmptyState
              actionLabel="Buat Tugas"
              description="Batas waktu akan muncul setelah kendala, koordinasi, atau tugas resmi dibuat."
              owner="Divisi Terkait"
              title="Belum Ada Batas Waktu"
            />
          )}
        </Panel>
      </section>
    </div>
  )
}

export function VenueOperationsScreen({
  divisions,
  permissions,
  venues,
}: {
  divisions: DivisionOption[]
  permissions: Permission[]
  venues: VenueStatusRecord[]
}) {
  const [selectedVenue, setSelectedVenue] = useState<VenueStatusRecord | null>(null)

  return (
    <div className="grid gap-5">
      <OperationsHero
        eyebrow="Status Tempat"
        icon={<MapPin className="size-5" aria-hidden="true" />}
        subtitle="Status tempat resmi agar PIC tahu area mana yang siap, perlu dicek, atau tertunda."
        title="Status Tempat"
      />
      <Panel
        icon={<MapPin className="size-4" aria-hidden="true" />}
        title="Daftar Tempat"
        description="Status awal tetap Menunggu Update sampai divisi melakukan pembaruan resmi."
      >
        <VenueStatusList
          venues={venues}
          onEdit={permissions.includes("venues.update") ? setSelectedVenue : undefined}
        />
      </Panel>
      <VenueUpdateDialog
        key={selectedVenue?.id ?? "closed"}
        divisions={divisions}
        venue={selectedVenue}
        onOpenChange={(open) => {
          if (!open) setSelectedVenue(null)
        }}
      />
    </div>
  )
}

function IssuesTable({
  issues,
  permissions,
  onOpenDetail,
}: {
  issues: IssueRecord[]
  permissions: Permission[]
  onOpenDetail: (issueId: string) => void
}) {
  const router = useRouter()

  async function updateStatus(issue: IssueRecord, status: IssueRecord["status"]) {
    await fetch(`/api/mcs/issues/${issue.id}`, {
      body: JSON.stringify({ status }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    router.refresh()
  }

  if (!issues.length) {
    return (
      <ActionableEmptyState
        actionLabel="Tambah Kendala"
        description="Kendala akan muncul setelah panitia mencatat kendala resmi."
        owner="Semua Divisi"
        title="Tidak Ada Kendala Aktif"
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="mcs-data-table min-w-[920px] text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Kendala", "Prioritas", "PIC", "Tempat", "Batas Waktu", "Status", "Aksi"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id} className="align-top">
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0">
                <p className="font-semibold text-[#111827]">{issue.issueCode}</p>
                <p className="mt-1 max-w-xs text-[#64748B]">{issue.title}</p>
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={issue.severity} tone={issue.severity === "Kritis" || issue.severity === "Tinggi" ? "danger" : "warning"} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">
                {issue.assignedToName ?? issue.assignedDivisionName ?? "PIC belum ditentukan"}
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{issue.venue ?? "Belum Diisi"}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{issue.deadline}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={issue.status} tone={getIssueStatusTone(issue.status)} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenDetail(issue.id)}>
                    Detail
                  </Button>
                  {permissions.includes("issues.update") && issue.status !== "Diproses" ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => updateStatus(issue, "Diproses")}>
                      Proses
                    </Button>
                  ) : null}
                  {permissions.includes("issues.resolve") && issue.status !== "Selesai" ? (
                    <Button type="button" size="sm" onClick={() => updateStatus(issue, "Selesai")}>
                      Selesai
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function IssueDetailDialog({
  issueId,
  permissions,
  onOpenChange,
}: {
  issueId: string | null
  permissions: Permission[]
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [detail, setDetail] = useState<IssueDetailPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<SubmissionState>(null)

  useEffect(() => {
    let active = true

    async function loadDetail() {
      if (!issueId) {
        setDetail(null)
        return
      }

      setLoading(true)
      setStatus(null)

      try {
        const response = await fetch(`/api/mcs/issues/${issueId}`, { cache: "no-store" })
        if (!response.ok) throw new Error("Detail kendala belum bisa dimuat.")
        const payload = (await response.json()) as { data?: IssueDetailPayload }
        if (active) setDetail(payload.data ?? null)
      } catch (error) {
        if (active) {
          setStatus({ message: error instanceof Error ? error.message : "Detail kendala belum bisa dimuat.", tone: "danger" })
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadDetail()

    return () => {
      active = false
    }
  }, [issueId])

  async function patchIssue(body: Record<string, unknown>, successMessage: string) {
    if (!issueId) return

    try {
      const response = await fetch(`/api/mcs/issues/${issueId}`, {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      if (!response.ok) throw new Error("Update kendala belum berhasil.")
      const payload = (await response.json()) as { data?: IssueRecord }
      setDetail((current) => current && payload.data ? { ...current, issue: payload.data } : current)
      setStatus({ message: successMessage, tone: "success" })
      router.refresh()
    } catch (error) {
      setStatus({ message: error instanceof Error ? error.message : "Update kendala belum berhasil.", tone: "danger" })
    }
  }

  async function escalateIssue() {
    if (!issueId) return

    try {
      const response = await fetch(`/api/mcs/issues/${issueId}/escalate`, {
        body: JSON.stringify({ notes: "Diminta review dari detail kendala." }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      if (!response.ok) throw new Error("Permintaan review belum berhasil.")
      const payload = (await response.json()) as { data?: IssueRecord }
      setDetail((current) => current && payload.data ? { ...current, issue: payload.data } : current)
      setStatus({ message: "Kendala dikirim untuk review pimpinan.", tone: "success" })
      router.refresh()
    } catch (error) {
      setStatus({ message: error instanceof Error ? error.message : "Permintaan review belum berhasil.", tone: "danger" })
    }
  }

  async function uploadEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!issueId) return

    const form = event.currentTarget
    const data = new FormData(form)

    try {
      const response = await fetch(`/api/mcs/issues/${issueId}/evidence/upload`, {
        body: data,
        method: "POST",
      })
      if (!response.ok) throw new Error("Unggah bukti belum berhasil.")
      const refreshed = await fetch(`/api/mcs/issues/${issueId}`, { cache: "no-store" })
      const payload = (await refreshed.json()) as { data?: IssueDetailPayload }
      setDetail(payload.data ?? null)
      setStatus({ message: "Bukti kendala sudah diunggah.", tone: "success" })
      form.reset()
      router.refresh()
    } catch (error) {
      setStatus({ message: error instanceof Error ? error.message : "Unggah bukti belum berhasil.", tone: "danger" })
    }
  }

  const issue = detail?.issue

  return (
    <Dialog open={Boolean(issueId)} onOpenChange={onOpenChange}>
      <DialogContent className="mcs-dialog-panel max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{issue ? `${issue.issueCode} - ${issue.title}` : "Detail Kendala"}</DialogTitle>
        <DialogDescription>Riwayat, bukti, review pimpinan, dan catatan resolusi kendala.</DialogDescription>
        </DialogHeader>
        <WorkflowStatus status={status} />

        {loading ? (
          <div className="mcs-inset-panel rounded-lg border-dashed p-6 text-center text-sm font-semibold text-[#6B7280]">
            Memuat detail kendala...
          </div>
        ) : issue ? (
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              <MetricTile label="Prioritas" value={issue.severity} tone={issue.severity === "Kritis" || issue.severity === "Tinggi" ? "danger" : "neutral"} />
              <MetricTile label="Status" value={issue.status} />
              <MetricTile label="PIC" value={issue.assignedToName ?? issue.assignedDivisionName ?? "PIC belum ditentukan"} />
              <MetricTile label="Batas Waktu" value={issue.deadline} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.75fr)]">
              <Panel
                icon={<AlertTriangle className="size-4" aria-hidden="true" />}
                title="Catatan Kendala"
                description="Detail kondisi, venue, dan resolusi."
              >
                <div className="grid gap-3 text-sm">
                  <MetricLine label="Kategori" value={issue.category} />
                  <MetricLine label="Tempat" value={issue.venue ?? "Belum Diisi"} />
                  <p className="mcs-list-row rounded-lg p-3 font-medium leading-6 text-[#6B7280]">{issue.description}</p>
                  <form
                    className="grid gap-3"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const data = new FormData(event.currentTarget)
                      void patchIssue({ resolutionNotes: getFormValue(data, "resolutionNotes"), status: "Selesai" }, "Kendala ditandai selesai.")
                    }}
                  >
                    <Textarea name="resolutionNotes" placeholder="Catatan resolusi sebelum ditandai selesai." />
                    <div className="flex flex-wrap gap-2">
                      {permissions.includes("issues.escalate") ? (
                        <Button type="button" variant="outline" onClick={escalateIssue}>Minta Review</Button>
                      ) : null}
                      {permissions.includes("issues.update") && issue.status !== "Diproses" ? (
                        <Button type="button" variant="outline" onClick={() => patchIssue({ status: "Diproses" }, "Kendala masuk status diproses.")}>Proses</Button>
                      ) : null}
                      {permissions.includes("issues.resolve") && issue.status !== "Selesai" ? (
                        <Button type="submit">Tandai Selesai</Button>
                      ) : null}
                      {permissions.includes("issues.close") && issue.status === "Selesai" ? (
                        <Button type="button" onClick={() => patchIssue({ status: "Ditutup" }, "Kendala sudah diarsipkan.")}>Arsipkan</Button>
                      ) : null}
                      {permissions.includes("issues.update") && issue.status === "Ditutup" ? (
                        <Button type="button" variant="outline" onClick={() => patchIssue({ status: "Diproses" }, "Kendala dibuka kembali.")}>Buka Lagi</Button>
                      ) : null}
                    </div>
                  </form>
                </div>
              </Panel>

              <Panel
                icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
                title="Bukti"
                description="Foto, video, dokumen, atau catatan lapangan."
              >
                <form className="grid gap-3" onSubmit={uploadEvidence}>
                  <Input name="title" placeholder="Judul bukti" />
                  <Input name="file" type="file" required />
                  <Textarea name="notes" placeholder="Catatan bukti jika perlu." />
                  <Button type="submit" disabled={!permissions.includes("issues.update")}>Unggah Bukti</Button>
                </form>
                <div className="mt-4 grid gap-2">
                  {issue.evidence.length ? issue.evidence.map((item) => (
                    <a
                      key={item.id}
                      href={item.url ?? "#"}
                      className="mcs-list-row rounded-lg p-3 text-sm font-semibold text-[#111827] transition hover:bg-white"
                      target={item.url ? "_blank" : undefined}
                      rel={item.url ? "noreferrer" : undefined}
                    >
                      {item.title}
                      <span className="mt-1 block text-xs font-medium text-[#64748B]">{item.notes ?? item.type}</span>
                    </a>
                  )) : (
                    <p className="mcs-inset-panel rounded-lg border-dashed p-3 text-sm font-semibold text-[#6B7280]">
                      Belum ada bukti terunggah.
                    </p>
                  )}
                </div>
              </Panel>
            </div>

            <Panel
              icon={<Clock3 className="size-4" aria-hidden="true" />}
              title="Timeline"
              description="Riwayat tindakan dan perubahan status."
            >
              {detail.history.length ? (
                <div className="grid gap-2">
                  {detail.history.map((item) => (
                    <CompactRow
                      key={item.id}
                      meta={`${item.actorName} / ${formatShortDateTime(item.createdAt)}`}
                      title={formatWorkflowAction(item.action)}
                      value={item.toStatus ?? item.notes ?? "Update"}
                    />
                  ))}
                </div>
              ) : (
                <ActionableEmptyState
                  actionLabel="Update Kendala"
                  description="Timeline akan muncul setelah ada perubahan status atau evidence."
                  owner="PIC Kendala"
                  title="Belum Ada Riwayat"
                />
              )}
            </Panel>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function VenueUpdateDialog({
  divisions,
  venue,
  onOpenChange,
}: {
  divisions: DivisionOption[]
  venue: VenueStatusRecord | null
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [status, setStatus] = useState<SubmissionState>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!venue) return

    const form = event.currentTarget
    const data = new FormData(form)
    setSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch(`/api/mcs/venues/${venue.id}`, {
        body: JSON.stringify({
          blockerIssueId: getFormValue(data, "blockerIssueId"),
          ownerDivisionId: getFormValue(data, "ownerDivisionId"),
          ownerName: getFormValue(data, "ownerName"),
          status: getFormValue(data, "status"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })

      if (!response.ok) throw new Error("Status venue belum berhasil diperbarui.")

      setStatus({ message: "Status venue sudah diperbarui.", tone: "success" })
      router.refresh()
    } catch (error) {
      setStatus({ message: error instanceof Error ? error.message : "Status venue belum berhasil diperbarui.", tone: "danger" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={Boolean(venue)} onOpenChange={onOpenChange}>
      <DialogContent className="mcs-dialog-panel max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{venue ? `Update ${venue.venue}` : "Update Tempat"}</DialogTitle>
          <DialogDescription>Ubah kesiapan tempat, PIC, dan kendala terkait dari satu form.</DialogDescription>
        </DialogHeader>
        <WorkflowStatus status={status} />
        {venue ? (
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Status">
                <NativeSelect name="status" defaultValue={venue.status}>
                  {venueStatusOptions.map((option) => (
                    <option key={option} value={option}>{formatStatusLabel(option)}</option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="Divisi PIC">
                <NativeSelect name="ownerDivisionId" defaultValue={venue.ownerDivisionId ?? divisions[0]?.id ?? ""}>
                  <option value="">Belum Ditentukan</option>
                  {divisions.map((division) => (
                    <option key={division.id} value={division.id}>{division.name}</option>
                  ))}
                </NativeSelect>
              </FormField>
            </div>
            <FormField label="PIC Tempat">
              <Input name="ownerName" defaultValue={venue.ownerName ?? ""} placeholder="Nama PIC yang bertanggung jawab" />
            </FormField>
            <FormField label="ID Kendala Blocker">
              <Input name="blockerIssueId" defaultValue={venue.blockerIssueId ?? ""} placeholder="Isi jika tempat tertunda oleh kendala tertentu" />
            </FormField>
            <DialogFooter className="mcs-dialog-footer mx-0 mb-0 rounded-lg">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Menyimpan..." : "Update Tempat"}</Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function HandoffFlow({ handoffs }: { handoffs: DivisionHandoffRecord[] }) {
  const lanes = [
    { from: "Acara", sourceId: "acara", targetId: "perlengkapan", to: "Perlengkapan" },
    { from: "Perlengkapan", sourceId: "perlengkapan", targetId: "keamanan", to: "Keamanan" },
    { from: "Keamanan", sourceId: "keamanan", targetId: "dokumentasi", to: "Dokumentasi" },
    { from: "Dokumentasi", sourceId: "dokumentasi", targetId: "humas", to: "Humas" },
  ]

  return (
    <div className="grid gap-3 lg:grid-cols-4">
      {lanes.map((lane) => {
        const handoff = handoffs.find(
          (item) => item.sourceDivisionId === lane.sourceId && item.targetDivisionId === lane.targetId && item.status !== "Selesai",
        )
        const status = handoff?.status ?? "Belum Dibuat"
        const tone = handoff ? getHandoffStatusTone(handoff.status) : "neutral"

        return (
          <div key={`${lane.sourceId}-${lane.targetId}`} className="mcs-list-row rounded-lg p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#111827]">{lane.from}</p>
              <GitBranch className="size-4 text-[#94A3B8]" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#111827]">{lane.to}</p>
            </div>
            <div className="mt-4 grid gap-2">
              <StatusBadge label={status} tone={tone} />
              <p className="line-clamp-2 text-xs font-medium leading-5 text-[#64748B]">
                {handoff?.activity ?? "Buat catatan koordinasi saat aktivitas siap diteruskan ke divisi berikutnya."}
              </p>
              <p className="text-xs font-semibold text-[#64748B]">
                PIC: {handoff?.ownerName ?? "Belum ditentukan"}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HandoffsTable({ handoffs, permissions }: { handoffs: DivisionHandoffRecord[]; permissions: Permission[] }) {
  const router = useRouter()

  async function transition(id: string, action: "accept" | "block" | "complete") {
    await fetch(`/api/mcs/handoffs/${id}/${action}`, {
      body: JSON.stringify({ notes: action === "block" ? "Koordinasi perlu tindak lanjut PIC." : undefined }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    router.refresh()
  }

  if (!handoffs.length) {
    return (
      <ActionableEmptyState
        actionLabel="Buat Koordinasi"
        description="Koordinasi akan muncul setelah satu divisi menyerahkan aktivitas ke divisi lain."
        owner="Divisi Sumber dan Divisi Target"
        title="Belum Ada Koordinasi"
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="mcs-data-table min-w-[900px] text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {["Aktivitas", "Dari", "Ke", "PIC", "Batas Waktu", "Status", "Aksi"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {handoffs.map((handoff) => (
            <tr key={handoff.id} className="align-top">
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-semibold text-[#111827]">{handoff.activity}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{handoff.sourceDivisionName}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{handoff.targetDivisionName}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{handoff.ownerName}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{handoff.deadline}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusBadge label={handoff.status} tone={getHandoffStatusTone(handoff.status)} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <div className="flex flex-wrap gap-2">
                  {permissions.includes("handoffs.accept") && handoff.status === "Menunggu" ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => transition(handoff.id, "accept")}>
                      Terima
                    </Button>
                  ) : null}
                  {permissions.includes("handoffs.block") && handoff.status !== "Terblokir" && handoff.status !== "Selesai" ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => transition(handoff.id, "block")}>
                      Tunda
                    </Button>
                  ) : null}
                  {permissions.includes("handoffs.complete") && handoff.status !== "Selesai" ? (
                    <Button type="button" size="sm" onClick={() => transition(handoff.id, "complete")}>
                      Selesai
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function IssueDialog({
  divisions,
  open,
  user,
  onOpenChange,
}: {
  divisions: DivisionOption[]
  open: boolean
  user: UserDTO
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [status, setStatus] = useState<SubmissionState>(null)
  const [submitting, setSubmitting] = useState(false)
  const defaultDivisionId = divisions[0]?.id ?? user.divisionIds[0] ?? ""

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch("/api/mcs/issues", {
        body: JSON.stringify({
          assignedDivisionId: getFormValue(data, "assignedDivisionId"),
          category: getFormValue(data, "category"),
          deadline: getFormValue(data, "deadline"),
          description: getFormValue(data, "description"),
          severity: getFormValue(data, "severity"),
          title: getFormValue(data, "title"),
          venue: getFormValue(data, "venue"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })

      if (!response.ok) throw new Error("Kendala belum berhasil dicatat.")

      setStatus({ message: "Kendala sudah masuk ke catatan kepanitiaan.", tone: "success" })
      form.reset()
      router.refresh()
    } catch (error) {
      setStatus({ message: error instanceof Error ? error.message : "Kendala belum berhasil dicatat.", tone: "danger" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mcs-dialog-panel max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Kendala</DialogTitle>
          <DialogDescription>Catat kendala kepanitiaan dengan PIC dan batas waktu tindak lanjut.</DialogDescription>
        </DialogHeader>
        <WorkflowStatus status={status} />
        <form className="grid gap-4" onSubmit={submit}>
          <FormField label="Judul Kendala">
            <Input name="title" required placeholder="Judul kendala resmi" />
          </FormField>
          <FormField label="Deskripsi">
            <Textarea name="description" required placeholder="Tuliskan kondisi singkat dan dampaknya." />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Kategori">
              <NativeSelect name="category" defaultValue="Venue">
                {issueCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Prioritas">
              <NativeSelect name="severity" defaultValue="Sedang">
                {issueSeverityOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </NativeSelect>
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Tempat">
              <Input name="venue" placeholder="Tempat terkait" />
            </FormField>
            <FormField label="Batas Waktu">
              <Input name="deadline" required placeholder="Batas waktu tindak lanjut" />
            </FormField>
          </div>
          <FormField label="Divisi PIC">
            <NativeSelect name="assignedDivisionId" defaultValue={defaultDivisionId}>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>{division.name}</option>
              ))}
            </NativeSelect>
          </FormField>
          <DialogFooter className="mcs-dialog-footer mx-0 mb-0 rounded-lg">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Menyimpan..." : "Catat Kendala"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HandoffDialog({
  divisions,
  open,
  user,
  onOpenChange,
}: {
  divisions: DivisionOption[]
  open: boolean
  user: UserDTO
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [status, setStatus] = useState<SubmissionState>(null)
  const [submitting, setSubmitting] = useState(false)
  const sourceDivisionId = user.divisionIds.find((divisionId) => divisions.some((division) => division.id === divisionId)) ?? divisions[0]?.id ?? ""
  const targetDivisionId = divisions.find((division) => division.id !== sourceDivisionId)?.id ?? divisions[0]?.id ?? ""

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch("/api/mcs/handoffs", {
        body: JSON.stringify({
          activity: getFormValue(data, "activity"),
          deadline: getFormValue(data, "deadline"),
          notes: getFormValue(data, "notes"),
          ownerName: getFormValue(data, "ownerName"),
          sourceDivisionId: getFormValue(data, "sourceDivisionId"),
          targetDivisionId: getFormValue(data, "targetDivisionId"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })

      if (!response.ok) throw new Error("Koordinasi belum berhasil dibuat.")

      setStatus({ message: "Koordinasi sudah dikirim ke divisi tujuan.", tone: "success" })
      form.reset()
      router.refresh()
    } catch (error) {
      setStatus({ message: error instanceof Error ? error.message : "Koordinasi belum berhasil dibuat.", tone: "danger" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mcs-dialog-panel max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Koordinasi Divisi</DialogTitle>
          <DialogDescription>Serahkan aktivitas dari satu divisi ke divisi berikutnya dengan PIC dan batas waktu.</DialogDescription>
        </DialogHeader>
        <WorkflowStatus status={status} />
        <form className="grid gap-4" onSubmit={submit}>
          <FormField label="Aktivitas">
            <Input name="activity" required placeholder="Aktivitas yang perlu dikoordinasikan" />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Dari Divisi">
              <NativeSelect name="sourceDivisionId" defaultValue={sourceDivisionId}>
                {divisions.map((division) => (
                  <option key={division.id} value={division.id}>{division.name}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Ke Divisi">
              <NativeSelect name="targetDivisionId" defaultValue={targetDivisionId}>
                {divisions.map((division) => (
                  <option key={division.id} value={division.id}>{division.name}</option>
                ))}
              </NativeSelect>
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="PIC">
              <Input name="ownerName" required placeholder="Nama PIC target" />
            </FormField>
            <FormField label="Batas Waktu">
              <Input name="deadline" required placeholder="Batas waktu koordinasi" />
            </FormField>
          </div>
          <FormField label="Catatan">
            <Textarea name="notes" placeholder="Tuliskan catatan koordinasi atau kendala jika ada." />
          </FormField>
          <DialogFooter className="mcs-dialog-footer mx-0 mb-0 rounded-lg">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Mengirim..." : "Buat Koordinasi"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AttentionQueue({ eventDay, permissions }: { eventDay: EventDaySummary; permissions: Permission[] }) {
  const items = [
    ...eventDay.activeIssues.map((issue) => ({
      id: `issue-${issue.id}`,
      meta: issue.severity,
      title: `${issue.issueCode} - ${issue.title}`,
      value: issue.assignedToName ?? issue.assignedDivisionName ?? "PIC belum ditentukan",
    })),
    ...eventDay.blockedHandoffs.map((handoff) => ({
      id: `handoff-${handoff.id}`,
      meta: handoff.status,
      title: handoff.activity,
      value: handoff.ownerName,
    })),
  ]

  if (!items.length) {
    return (
      <ActionableEmptyState
        actionLabel={permissions.includes("issues.create") ? "Tambah Kendala" : "Pantau Kegiatan"}
        description="Belum ada kendala atau koordinasi yang membutuhkan tindak lanjut."
        owner="Semua Divisi"
        title="Tidak Ada Blocker Aktif"
      />
    )
  }

  return (
    <div className="grid gap-2">
      {items.slice(0, 8).map((item) => (
        <CompactRow key={item.id} meta={item.meta} title={item.title} value={item.value} />
      ))}
    </div>
  )
}

function ActivityFocus({ activity, emptyTitle }: { activity: EventDaySummary["currentActivity"]; emptyTitle: string }) {
  if (!activity) {
    return (
      <ActionableEmptyState
        actionLabel="Tambah Jadwal"
        description="Aktivitas akan muncul setelah jadwal resmi diisi."
        owner="Acara / Sekretaris"
        title={emptyTitle}
      />
    )
  }

  const title = "title" in activity ? activity.title : `${activity.sport} - ${activity.round}`
  const venue = activity.venue
  const status = activity.status
  const pic = "pic" in activity ? activity.pic : activity.updatedBy ?? "PIC belum ditentukan"

  return (
    <div className="mcs-list-row grid gap-4 rounded-lg p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-[#111827]">{title}</p>
          <p className="mt-1 text-sm font-medium text-[#64748B]">{venue}</p>
        </div>
        <StatusBadge label={String(status)} tone="info" />
      </div>
      <div className="grid gap-2 text-sm">
        <MetricLine label="PIC" value={pic} />
        <MetricLine label="Waktu" value={"clock" in activity ? activity.clock : activity.time} />
      </div>
    </div>
  )
}

function VenueStatusList({ onEdit, venues }: { onEdit?: (venue: VenueStatusRecord) => void; venues: VenueStatusRecord[] }) {
  if (!venues.length) {
    return (
      <ActionableEmptyState
        actionLabel="Isi Jadwal"
        description="Tempat akan muncul setelah jadwal resmi memiliki lokasi."
        owner="Acara"
        title="Belum Ada Tempat"
      />
    )
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {venues.map((venue) => (
        <div key={venue.id} className="mcs-list-row rounded-lg p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111827]">{venue.venue}</p>
              <p className="mt-1 truncate text-xs font-medium text-[#64748B]">{venue.ownerName ?? "PIC belum diisi"}</p>
            </div>
            <StatusBadge label={venue.status} tone={venue.status === "Terblokir" ? "danger" : venue.status === "Siap" ? "success" : "warning"} />
          </div>
          <div className="mt-3 grid gap-2 text-xs font-semibold text-[#64748B]">
            <span>Update terakhir: {formatShortDateTime(venue.lastUpdate)}</span>
            {venue.blockerIssueId ? <span>Kendala: {venue.blockerIssueId}</span> : null}
          </div>
          {onEdit ? (
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => onEdit(venue)}>
              Update
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function OperationsHero({
  action,
  eyebrow,
  icon,
  subtitle,
  title,
}: {
  action?: { label: string; onClick: () => void }
  eyebrow: string
  icon: ReactNode
  subtitle: string
  title: string
}) {
  return (
    <section className="mcs-soft-surface mcs-starburst overflow-hidden rounded-lg p-6 after:-right-5 after:top-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[#F97316]">
            {icon}
            <p className="text-xs font-bold uppercase tracking-[0.12em]">{eyebrow}</p>
          </div>
          <h1 className="mt-3 font-heading text-2xl font-bold tracking-normal text-[#111827]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#6B7280]">{subtitle}</p>
        </div>
        {action ? (
          <Button type="button" className="gap-2" onClick={action.onClick}>
            <Plus className="size-4" aria-hidden="true" />
            {action.label}
          </Button>
        ) : null}
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
    <section className="mcs-surface rounded-lg p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 grid size-8 place-items-center rounded-lg border border-[#111827]/10 bg-[#FFF7ED] text-[#F97316]">{icon}</span>
        <div className="min-w-0">
          <h2 className="font-heading text-base font-bold text-[#111827]">{title}</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function MetricTile({ label, tone = "neutral", value }: { label: string; tone?: "neutral" | "success" | "danger"; value: number | string }) {
  return (
    <div className="mcs-neo-card rounded-lg p-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</p>
      <p className={cn("mt-2 font-heading text-xl font-bold", tone === "danger" ? "text-[#B91C1C]" : tone === "success" ? "text-[#166534]" : "text-[#111827]")}>
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ label, tone }: { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }) {
  return (
    <span className={cn("inline-flex h-7 w-fit shrink-0 items-center rounded-md border px-2.5 text-xs font-bold", getToneClassName(tone))}>
      {formatStatusLabel(label)}
    </span>
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
    <div className="mcs-inset-panel grid min-h-36 place-items-center rounded-lg border-dashed px-4 py-8 text-center">
      <div className="max-w-md">
        <span className="mcs-empty-mark" aria-hidden="true">
          <span />
          <i />
        </span>
        <p className="text-sm font-semibold text-[#111827]">{title}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p>
        <div className="mt-3 grid gap-2 rounded-lg border border-[#111827]/10 bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#111827]">
          <span>Penanggung Jawab: {owner}</span>
          <span>Tindak Lanjut: {actionLabel}</span>
        </div>
      </div>
    </div>
  )
}

function CompactRow({ meta, title, value }: { meta: string; title: string; value: string }) {
  return (
    <div className="grid gap-2 rounded-lg border border-[#111827]/10 bg-[#FFF7ED] p-3 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#111827]">{title}</p>
        <p className="mt-1 text-xs font-medium text-[#6B7280]">{meta}</p>
      </div>
      <p className="text-sm font-medium text-[#6B7280] sm:text-right">{value}</p>
    </div>
  )
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#111827]/10 bg-white px-3 py-2">
      <span className="text-[#6B7280]">{label}</span>
      <span className="truncate font-semibold text-[#111827]">{value}</span>
    </div>
  )
}

function FormField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-[#111827]">
      <span>{label}</span>
      {children}
    </label>
  )
}

function NativeSelect({ children, defaultValue, name }: { children: ReactNode; defaultValue?: string; name: string }) {
  return (
    <select
      className="h-10 rounded-lg border border-[#111827]/12 bg-white px-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
      defaultValue={defaultValue}
      name={name}
    >
      {children}
    </select>
  )
}

function WorkflowStatus({ status }: { status: SubmissionState }) {
  if (!status) return null

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-sm font-semibold",
        status.tone === "success"
          ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]"
          : "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
      )}
    >
      {status.message}
    </div>
  )
}

function getFormValue(data: FormData, key: string) {
  const value = data.get(key)
  return typeof value === "string" ? value : ""
}

function getIssueStatusTone(status: IssueRecord["status"]) {
  if (status === "Selesai" || status === "Ditutup") return "success"
  if (status === "Diproses") return "info"
  if (status === "Ditugaskan") return "warning"
  return "danger"
}

function getHandoffStatusTone(status: DivisionHandoffRecord["status"]) {
  if (status === "Selesai") return "success"
  if (status === "Diterima") return "info"
  if (status === "Terblokir") return "danger"
  return "warning"
}

function getToneClassName(tone: "neutral" | "info" | "success" | "warning" | "danger") {
  if (tone === "danger") return "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
  if (tone === "success") return "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]"
  if (tone === "info") return "border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB]"
  if (tone === "warning") return "border-[#FEF3C7] bg-[#FFFBEB] text-[#92400E]"
  return "border-[#E5E7EB] bg-[#FFFDF8] text-[#6B7280]"
}

function formatStatusLabel(label: string) {
  if (label === "scheduled") return "Terjadwal"
  if (label === "live") return "Berjalan"
  if (label === "delayed") return "Tertunda"
  if (label === "completed") return "Selesai"
  if (label === "cancelled") return "Dibatalkan"
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

function formatWorkflowAction(action: string) {
  const labels: Record<string, string> = {
    "evidence.added": "Bukti ditambahkan",
    "handoff.accepted": "Koordinasi diterima",
    "handoff.blocked": "Koordinasi tertunda",
    "handoff.completed": "Koordinasi selesai",
    "handoff.created": "Koordinasi dibuat",
    "handoff.updated": "Koordinasi diperbarui",
    "issue.created": "Kendala dibuat",
    "issue.escalated": "Kendala diminta review",
    "issue.updated": "Kendala diperbarui",
    "status.updated": "Status diperbarui",
  }

  return labels[action] ?? action
}
