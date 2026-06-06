"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, type FormEvent, type ReactNode, type SelectHTMLAttributes } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  CalendarPlus,
  ClipboardList,
  FileText,
  GitBranch,
  Loader2,
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
import type { Permission } from "@/server/mcs/types"

type QuickActionId = "announcement" | "schedule" | "task" | "handoff" | "report" | "venueIssue"

type DivisionOption = {
  coordinator: string
  id: string
  name: string
}

type ReportSnapshot = {
  activeIssueCount: number
  eventEnd: string
  eventStart: string
  mediaStatus: string
  onDutyPanitia: number | string
  participantStatus: string
  pendingAnnouncementCount: number
  pendingTaskCount: number
  todayScheduleCount: number
}

type SuperAdminQuickActionsProps = {
  divisions: DivisionOption[]
  permissions: Permission[]
  reportSnapshot: ReportSnapshot
}

type ActionConfig = {
  description: string
  icon: LucideIcon
  id: QuickActionId
  label: string
  requiredPermissions: Permission[]
}

type SubmissionState = {
  message: string
  tone: "success" | "danger"
} | null

const actionConfigs: ActionConfig[] = [
  {
    description: "Tulis pengumuman internal untuk panitia.",
    icon: Megaphone,
    id: "announcement",
    label: "Buat Pengumuman",
    requiredPermissions: ["announcements.create"],
  },
  {
    description: "Tambah jadwal resmi ke timeline event.",
    icon: CalendarPlus,
    id: "schedule",
    label: "Tambah Jadwal",
    requiredPermissions: ["schedules.create"],
  },
  {
    description: "Buat tugas baru untuk divisi atau PIC.",
    icon: ClipboardList,
    id: "task",
    label: "Assign Tugas",
    requiredPermissions: ["tasks.create"],
  },
  {
    description: "Serahkan aktivitas ke divisi berikutnya.",
    icon: GitBranch,
    id: "handoff",
    label: "Buat Handoff",
    requiredPermissions: ["handoffs.create"],
  },
  {
    description: "Buka ringkasan laporan operasional saat ini.",
    icon: FileText,
    id: "report",
    label: "Buka Laporan",
    requiredPermissions: ["reports.read"],
  },
  {
    description: "Catat blocker operasional dengan owner dan deadline.",
    icon: AlertTriangle,
    id: "venueIssue",
    label: "Catat Kendala",
    requiredPermissions: ["issues.create"],
  },
]

export function SuperAdminQuickActions({ divisions, permissions, reportSnapshot }: SuperAdminQuickActionsProps) {
  const router = useRouter()
  const [activeAction, setActiveAction] = useState<QuickActionId | null>(null)
  const [status, setStatus] = useState<SubmissionState>(null)
  const [submittingAction, setSubmittingAction] = useState<QuickActionId | null>(null)

  const activeConfig = actionConfigs.find((action) => action.id === activeAction)
  const defaultDivisionId = divisions[0]?.id ?? ""
  const defaultVenueOwnerId = divisions.find((division) => division.id === "perlengkapan")?.id ?? defaultDivisionId

  const reportItems = useMemo(
    () => [
      { label: "Jadwal Hari Ini", value: reportSnapshot.todayScheduleCount || "Belum Dipublikasikan" },
      { label: "Tugas Pending", value: reportSnapshot.pendingTaskCount },
      { label: "Kendala Aktif", value: reportSnapshot.activeIssueCount },
      { label: "Approval Pengumuman", value: reportSnapshot.pendingAnnouncementCount },
      { label: "Panitia On Duty", value: reportSnapshot.onDutyPanitia },
      { label: "Peserta Terverifikasi", value: reportSnapshot.participantStatus },
      { label: "Media Terunggah", value: reportSnapshot.mediaStatus },
    ],
    [reportSnapshot],
  )

  function openAction(action: QuickActionId) {
    setStatus(null)
    setActiveAction(action)
  }

  async function submitJson(action: QuickActionId, url: string, body: Record<string, unknown>, successMessage: string) {
    setSubmittingAction(action)
    setStatus(null)

    try {
      const response = await fetch(url, {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string } }

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Aksi belum berhasil diproses.")
      }

      setStatus({ message: successMessage, tone: "success" })
      router.refresh()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Aksi belum berhasil diproses."

      setStatus({ message, tone: "danger" })
      return false
    } finally {
      setSubmittingAction(null)
    }
  }

  async function handleAnnouncementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    const submitted = await submitJson(
      "announcement",
      "/api/mcs/announcements",
      {
        audience: ["super_admin", "ketua_pelaksana", "wakil_ketua", "acara", "pj_lomba"],
        body: getRequiredFormValue(data, "body"),
        priority: data.get("priority") || "normal",
        title: getRequiredFormValue(data, "title"),
        visibility: "internal",
      },
      "Pengumuman masuk ke alur approval/publikasi.",
    )
    if (submitted) form.reset()
  }

  async function handleScheduleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const date = getRequiredFormValue(data, "date")

    const submitted = await submitJson(
      "schedule",
      "/api/mcs/schedules",
      {
        date,
        dayName: "Event Day",
        duration: data.get("duration") || "TBD",
        label: date,
        pic: getRequiredFormValue(data, "pic"),
        status: "scheduled",
        time: getRequiredFormValue(data, "time"),
        title: getRequiredFormValue(data, "title"),
        type: data.get("type") || "operation",
        venue: getRequiredFormValue(data, "venue"),
      },
      "Jadwal baru sudah ditambahkan.",
    )
    if (submitted) form.reset()
  }

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const divisionId = getRequiredFormValue(data, "divisionId")

    const submitted = await submitJson(
      "task",
      "/api/mcs/tasks",
      {
        assigneeName: data.get("assigneeName") || "PIC belum ditentukan",
        deadline: getRequiredFormValue(data, "deadline"),
        description: data.get("description") || undefined,
        divisionId,
        priority: data.get("priority") || "Medium",
        status: "Scheduled",
        title: getRequiredFormValue(data, "title"),
      },
      "Tugas baru sudah masuk ke board operasional.",
    )
    if (submitted) form.reset()
  }

  async function handleHandoffSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    const submitted = await submitJson(
      "handoff",
      "/api/mcs/handoffs",
      {
        activity: getRequiredFormValue(data, "activity"),
        deadline: getRequiredFormValue(data, "deadline"),
        notes: data.get("notes") || undefined,
        ownerName: getRequiredFormValue(data, "ownerName"),
        sourceDivisionId: getRequiredFormValue(data, "sourceDivisionId"),
        targetDivisionId: getRequiredFormValue(data, "targetDivisionId"),
      },
      "Handoff sudah dikirim ke divisi target.",
    )
    if (submitted) form.reset()
  }

  async function handleVenueIssueSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const venue = getRequiredFormValue(data, "venue")
    const issue = getRequiredFormValue(data, "issue")

    const submitted = await submitJson(
      "venueIssue",
      "/api/mcs/issues",
      {
        assignedDivisionId: getRequiredFormValue(data, "divisionId"),
        assignedToName: data.get("owner") || "PIC venue",
        category: "Venue",
        deadline: getRequiredFormValue(data, "deadline"),
        description: `${venue} / ${data.get("detail") || "Perlu tindak lanjut PIC."}`,
        severity: "Tinggi",
        status: "Ditugaskan",
        title: `Kendala venue: ${issue}`,
        venue,
      },
      "Kendala venue sudah masuk ke pusat kendala aktif.",
    )
    if (submitted) form.reset()
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {actionConfigs.map((action) => {
          const Icon = action.icon
          const allowed = action.requiredPermissions.every((permission) => permissions.includes(permission))
          const className =
            "flex min-h-14 items-start gap-3 rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/20"

          if (!allowed) {
            return (
              <span key={action.id} aria-disabled="true" className={cn(className, "border-[#E5E7EB] bg-[#F8F9FB] text-[#94A3B8]")}>
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{action.label}</span>
                  <span className="mt-1 block text-xs font-medium leading-5">{action.description}</span>
                </span>
              </span>
            )
          }

          return (
            <button
              key={action.id}
              type="button"
              className={cn(className, "border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F8F9FB]")}
              onClick={() => openAction(action.id)}
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-[#B91C1C]" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{action.label}</span>
                <span className="mt-1 block text-xs font-medium leading-5 text-[#64748B]">{action.description}</span>
              </span>
            </button>
          )
        })}
      </div>

      <Dialog
        open={activeAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveAction(null)
            setStatus(null)
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto border border-[#E5E7EB] bg-white text-[#111827] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#111827]">{activeConfig?.label ?? "Aksi Cepat"}</DialogTitle>
            <DialogDescription className="text-sm font-medium leading-6 text-[#64748B]">
              {activeConfig?.description ?? "Pilih aksi operasional yang tersedia."}
            </DialogDescription>
          </DialogHeader>

          {status ? (
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
          ) : null}

          {activeAction === "announcement" ? (
            <form className="grid gap-4" onSubmit={handleAnnouncementSubmit}>
              <FormField label="Judul">
                <Input name="title" required placeholder="Contoh: Briefing panitia sebelum sesi pembukaan" />
              </FormField>
              <FormField label="Isi Pengumuman">
                <Textarea name="body" required placeholder="Tulis update yang perlu dibaca panitia." />
              </FormField>
              <FormField label="Prioritas">
                <NativeSelect name="priority" defaultValue="normal">
                  <option value="normal">Normal</option>
                  <option value="important">Penting</option>
                  <option value="urgent">Urgent</option>
                </NativeSelect>
              </FormField>
              <ModalActions submitting={submittingAction === "announcement"} submitLabel="Kirim Pengumuman" onClose={() => setActiveAction(null)} />
            </form>
          ) : null}

          {activeAction === "schedule" ? (
            <form className="grid gap-4" onSubmit={handleScheduleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Tanggal">
                  <Input name="date" type="date" required defaultValue={reportSnapshot.eventStart} min={reportSnapshot.eventStart} max={reportSnapshot.eventEnd} />
                </FormField>
                <FormField label="Jam">
                  <Input name="time" required placeholder="08.00" />
                </FormField>
              </div>
              <FormField label="Aktivitas">
                <Input name="title" required placeholder="Contoh: Technical meeting futsal" />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Venue">
                  <Input name="venue" required placeholder="Lapangan A" />
                </FormField>
                <FormField label="PIC">
                  <Input name="pic" required placeholder="Acara / PJ Lomba" />
                </FormField>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Durasi">
                  <Input name="duration" placeholder="60 menit" />
                </FormField>
                <FormField label="Tipe">
                  <NativeSelect name="type" defaultValue="operation">
                    <option value="operation">Operasional</option>
                    <option value="match">Match</option>
                    <option value="ceremony">Ceremony</option>
                    <option value="break">Break</option>
                  </NativeSelect>
                </FormField>
              </div>
              <ModalActions submitting={submittingAction === "schedule"} submitLabel="Tambah Jadwal" onClose={() => setActiveAction(null)} />
            </form>
          ) : null}

          {activeAction === "task" ? (
            <form className="grid gap-4" onSubmit={handleTaskSubmit}>
              <FormField label="Tugas">
                <Input name="title" required placeholder="Contoh: Finalisasi kebutuhan sound system" />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Divisi">
                  <DivisionSelect defaultValue={defaultDivisionId} divisions={divisions} name="divisionId" />
                </FormField>
                <FormField label="PIC">
                  <Input name="assigneeName" placeholder="Nama PIC" />
                </FormField>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Deadline">
                  <Input name="deadline" required placeholder="22 Juni 2026, 08.00 WIB" />
                </FormField>
                <FormField label="Prioritas">
                  <NativeSelect name="priority" defaultValue="Medium">
                    <option value="High">Tinggi</option>
                    <option value="Medium">Sedang</option>
                    <option value="Low">Rendah</option>
                  </NativeSelect>
                </FormField>
              </div>
              <FormField label="Catatan">
                <Textarea name="description" placeholder="Tambahkan detail singkat jika ada." />
              </FormField>
              <ModalActions submitting={submittingAction === "task"} submitLabel="Assign Tugas" onClose={() => setActiveAction(null)} />
            </form>
          ) : null}

          {activeAction === "handoff" ? (
            <form className="grid gap-4" onSubmit={handleHandoffSubmit}>
              <FormField label="Aktivitas">
                <Input name="activity" required placeholder="Contoh: Opening ceremony siap masuk dokumentasi" />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Dari Divisi">
                  <DivisionSelect defaultValue={defaultDivisionId} divisions={divisions} name="sourceDivisionId" />
                </FormField>
                <FormField label="Ke Divisi">
                  <DivisionSelect defaultValue={defaultVenueOwnerId} divisions={divisions} name="targetDivisionId" />
                </FormField>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Owner">
                  <Input name="ownerName" required placeholder="Nama PIC target" />
                </FormField>
                <FormField label="Deadline">
                  <Input name="deadline" required placeholder="Hari ini, sebelum sesi berikutnya" />
                </FormField>
              </div>
              <FormField label="Catatan">
                <Textarea name="notes" placeholder="Tuliskan dependency atau blocker jika ada." />
              </FormField>
              <ModalActions submitting={submittingAction === "handoff"} submitLabel="Buat Handoff" onClose={() => setActiveAction(null)} />
            </form>
          ) : null}

          {activeAction === "report" ? (
            <div className="grid gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {reportItems.map((item) => (
                  <div key={item.label} className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2.5">
                    <p className="text-xs font-semibold text-[#64748B]">{item.label}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-[#111827]">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#64748B]">
                Laporan ini hanya membaca data resmi yang sudah masuk. Peserta dan media akan berubah dari Belum Dipublikasikan setelah modul terkait diisi.
              </p>
              <DialogFooter className="mx-0 mb-0 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB]">
                <Button type="button" variant="outline" onClick={() => router.refresh()}>
                  Refresh Data
                </Button>
                <Button type="button" onClick={() => setActiveAction(null)}>
                  Tutup
                </Button>
              </DialogFooter>
            </div>
          ) : null}

          {activeAction === "venueIssue" ? (
            <form className="grid gap-4" onSubmit={handleVenueIssueSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Venue">
                  <Input name="venue" required placeholder="Lapangan A" />
                </FormField>
                <FormField label="Kendala">
                  <Input name="issue" required placeholder="Contoh: sound belum siap" />
                </FormField>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Owner Divisi">
                  <DivisionSelect defaultValue={defaultVenueOwnerId} divisions={divisions} name="divisionId" />
                </FormField>
                <FormField label="PIC">
                  <Input name="owner" placeholder="Nama PIC follow-up" />
                </FormField>
              </div>
              <FormField label="Deadline Tindak Lanjut">
                <Input name="deadline" required placeholder="Hari ini, 30 menit sebelum match" />
              </FormField>
              <FormField label="Detail">
                <Textarea name="detail" placeholder="Tuliskan konteks singkat untuk owner." />
              </FormField>
              <ModalActions submitting={submittingAction === "venueIssue"} submitLabel="Catat Kendala" onClose={() => setActiveAction(null)} />
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
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

function NativeSelect({
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-8 w-full rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-sm font-medium text-[#111827] outline-none transition focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/15",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

function DivisionSelect({
  defaultValue,
  divisions,
  name,
}: {
  defaultValue: string
  divisions: DivisionOption[]
  name: string
}) {
  return (
    <NativeSelect name={name} required defaultValue={defaultValue}>
      {divisions.length === 0 ? <option value="">Divisi belum tersedia</option> : null}
      {divisions.map((division) => (
        <option key={division.id} value={division.id}>
          {division.name} - {division.coordinator}
        </option>
      ))}
    </NativeSelect>
  )
}

function ModalActions({
  onClose,
  submitLabel,
  submitting,
}: {
  onClose: () => void
  submitLabel: string
  submitting: boolean
}) {
  return (
    <DialogFooter className="mx-0 mb-0 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB]">
      <Button type="button" variant="outline" onClick={onClose}>
        Batal
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
        {submitting ? "Memproses" : submitLabel}
      </Button>
    </DialogFooter>
  )
}

function getRequiredFormValue(data: FormData, key: string) {
  const value = data.get(key)

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} wajib diisi.`)
  }

  return value.trim()
}
