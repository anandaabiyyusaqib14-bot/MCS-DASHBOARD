"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode, type SelectHTMLAttributes } from "react"
import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  FileText,
  GitBranch,
  ListChecks,
  Loader2,
  Megaphone,
  Paperclip,
  Send,
  Ticket,
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
import type { Permission, UserRole } from "@/server/mcs/types"

type QuickActionId = "announcement" | "schedule" | "task" | "issueTicket" | "coordinationRequest" | "reports"

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
  dialogTitle: string
  icon: LucideIcon
  id: QuickActionId
  label: string
  requiredPermissions: Permission[]
}

type SubmissionState = {
  message: string
  tone: "success" | "danger"
} | null

type AnnouncementPreview = {
  body: string
  date: string
  priority: string
  target: "all" | "specific"
  title: string
}

const defaultAnnouncementAudience: UserRole[] = [
  "ketua_pelaksana",
  "wakil_ketua",
  "sekretaris",
  "bendahara",
  "acara",
  "pj_lomba",
  "humas",
  "dokumentasi",
  "kebersihan",
  "perlengkapan",
  "keamanan",
  "kewirausahaan",
  "operator",
]

const divisionRoleIds: UserRole[] = [
  "acara",
  "pj_lomba",
  "humas",
  "dokumentasi",
  "kebersihan",
  "perlengkapan",
  "keamanan",
  "kewirausahaan",
]

const actionConfigs: ActionConfig[] = [
  {
    description: "Update resmi internal.",
    dialogTitle: "Buat Pengumuman",
    icon: Megaphone,
    id: "announcement",
    label: "Pengumuman",
    requiredPermissions: ["announcements.create"],
  },
  {
    description: "Tambah agenda resmi.",
    dialogTitle: "Tambah Jadwal",
    icon: CalendarPlus,
    id: "schedule",
    label: "Jadwal",
    requiredPermissions: ["schedules.create"],
  },
  {
    description: "Tugaskan pekerjaan.",
    dialogTitle: "Buat Tugas",
    icon: CheckCircle2,
    id: "task",
    label: "Tugas",
    requiredPermissions: ["tasks.create"],
  },
  {
    description: "Catat kendala aktif.",
    dialogTitle: "Buat Tiket Kendala",
    icon: Ticket,
    id: "issueTicket",
    label: "Kendala",
    requiredPermissions: ["issues.create"],
  },
  {
    description: "Minta respons divisi.",
    dialogTitle: "Request Koordinasi",
    icon: GitBranch,
    id: "coordinationRequest",
    label: "Koordinasi",
    requiredPermissions: ["handoffs.create"],
  },
  {
    description: "Ringkasan operasional saat ini.",
    dialogTitle: "Lihat Laporan",
    icon: BarChart3,
    id: "reports",
    label: "Laporan",
    requiredPermissions: ["reports.read"],
  },
]

const taskCategories = ["Acara", "Lomba", "Perlengkapan", "Dokumentasi", "Humas", "Keamanan", "Kewirausahaan", "Kebersihan"]
const issueCategories = ["Venue", "Peralatan", "Jadwal", "SDM", "Peserta", "Teknologi", "Keamanan", "Konsumsi", "Dokumentasi"]
const coordinationChecklist = ["Sound System", "Mic", "Meja", "Kursi", "Dokumentasi", "Banner", "Konsumsi", "Keamanan"]

export function SuperAdminQuickActions({ divisions, permissions, reportSnapshot }: SuperAdminQuickActionsProps) {
  const router = useRouter()
  const [activeAction, setActiveAction] = useState<QuickActionId | null>(null)
  const [status, setStatus] = useState<SubmissionState>(null)
  const [submittingAction, setSubmittingAction] = useState<QuickActionId | null>(null)
  const [announcementPreview, setAnnouncementPreview] = useState<AnnouncementPreview>({
    body: "",
    date: reportSnapshot.eventStart,
    priority: "normal",
    target: "all",
    title: "",
  })
  const [showAnnouncementAttachment, setShowAnnouncementAttachment] = useState(false)
  const [showTaskChecklist, setShowTaskChecklist] = useState(false)
  const [showCoordinationChecklist, setShowCoordinationChecklist] = useState(true)
  const [showIssueEvidence, setShowIssueEvidence] = useState(false)

  const activeConfig = actionConfigs.find((action) => action.id === activeAction)
  const defaultDivisionId = divisions[0]?.id ?? ""
  const defaultTargetDivisionId = divisions.find((division) => division.id === "perlengkapan")?.id ?? defaultDivisionId

  const reportItems = useMemo(
    () => [
      { label: "Jadwal Hari Ini", value: reportSnapshot.todayScheduleCount || "Belum Dipublikasikan" },
      { label: "Tugas Tertunda", value: reportSnapshot.pendingTaskCount },
      { label: "Tiket Kendala Aktif", value: reportSnapshot.activeIssueCount },
      { label: "Pengumuman Menunggu", value: reportSnapshot.pendingAnnouncementCount },
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

  function updateAnnouncementPreview(event: ChangeEvent<HTMLFormElement>) {
    const target = event.target

    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return
    }

    const { name, value } = target

    setAnnouncementPreview((preview) => ({
      ...preview,
      [name]: value,
    }))
  }

  async function handleAnnouncementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const intent = getSubmitIntent(event, "publish")
    const target = getOptionalFormValue(data, "target") === "specific" ? "specific" : "all"
    const targetDivisionId = getOptionalFormValue(data, "targetDivisionId")
    const targetRole = target === "specific" ? getDivisionRole(targetDivisionId) : undefined
    const attachment = data.get("attachment")
    const attachmentName = attachment instanceof File && attachment.name ? attachment.name : undefined
    const body = [
      getRequiredFormValue(data, "body"),
      attachmentName ? `Lampiran: ${attachmentName}` : undefined,
    ].filter(Boolean).join("\n\n")

    const submitted = await submitJson(
      "announcement",
      "/api/mcs/announcements",
      {
        audience: targetRole ? [targetRole] : defaultAnnouncementAudience,
        body,
        priority: getAnnouncementPriorityPayload(getOptionalFormValue(data, "priority")),
        publishNow: intent === "publish",
        status: intent === "draft" ? "draft" : undefined,
        title: getRequiredFormValue(data, "title"),
        visibility: "internal",
      },
      intent === "draft" ? "Draft pengumuman tersimpan dan tercatat." : "Pengumuman dikirim ke alur publikasi.",
    )

    if (submitted) {
      form.reset()
      setAnnouncementPreview({ body: "", date: reportSnapshot.eventStart, priority: "normal", target: "all", title: "" })
      setShowAnnouncementAttachment(false)
    }
  }

  async function handleScheduleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const date = getRequiredFormValue(data, "date")
    const startTime = getRequiredFormValue(data, "startTime")
    const endTime = getRequiredFormValue(data, "endTime")
    const category = getRequiredFormValue(data, "category")
    const notes = getOptionalFormValue(data, "notes")

    const submitted = await submitJson(
      "schedule",
      "/api/mcs/schedules",
      {
        date,
        dayName: "Event Day",
        duration: `${startTime} - ${endTime}`,
        label: date,
        pic: getRequiredFormValue(data, "pic"),
        status: "scheduled",
        time: startTime,
        title: getRequiredFormValue(data, "title"),
        type: getScheduleTypePayload(category),
        venue: getRequiredFormValue(data, "venue"),
        notes,
      },
      getOptionalFormValue(data, "status") === "published" ? "Jadwal dipublikasikan ke timeline operasional." : "Jadwal tersimpan di timeline operasional.",
    )

    if (submitted) form.reset()
  }

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const intent = getSubmitIntent(event, "assign")
    const checklist = data.getAll("checklist").filter((item): item is string => typeof item === "string")
    const category = getOptionalFormValue(data, "category")
    const description = [
      getOptionalFormValue(data, "description"),
      category ? `Kategori: ${category}` : undefined,
      checklist.length ? `Checklist: ${checklist.join(", ")}` : undefined,
    ].filter(Boolean).join("\n")

    const submitted = await submitJson(
      "task",
      "/api/mcs/tasks",
      {
        assigneeName: getOptionalFormValue(data, "assigneeName") || "PIC belum ditentukan",
        deadline: getRequiredFormValue(data, "deadline"),
        description: description || undefined,
        divisionId: getRequiredFormValue(data, "divisionId"),
        priority: getTaskPriorityPayload(getOptionalFormValue(data, "priority")),
        status: intent === "assign" ? "In Progress" : "Scheduled",
        title: getRequiredFormValue(data, "title"),
      },
      intent === "assign" ? "Tugas sudah ditugaskan dan tercatat." : "Tugas tersimpan untuk dipantau.",
    )

    if (submitted) {
      form.reset()
      setShowTaskChecklist(false)
    }
  }

  async function handleIssueTicketSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const intent = getSubmitIntent(event, "create")
    const evidence = data.get("evidence")
    const evidenceName = evidence instanceof File && evidence.name ? evidence.name : undefined
    const description = [
      getRequiredFormValue(data, "description"),
      evidenceName ? `Bukti foto: ${evidenceName}` : undefined,
    ].filter(Boolean).join("\n\n")

    const submitted = await submitJson(
      "issueTicket",
      "/api/mcs/issues",
      {
        assignedDivisionId: getRequiredFormValue(data, "divisionId"),
        assignedToName: getOptionalFormValue(data, "pic") || "PIC belum ditentukan",
        category: getIssueCategoryPayload(getOptionalFormValue(data, "category")),
        deadline: getRequiredFormValue(data, "deadline"),
        description,
        severity: getIssueSeverityPayload(getOptionalFormValue(data, "severity")),
        status: intent === "assign" ? "Assigned" : "Open",
        title: getRequiredFormValue(data, "title"),
        venue: getOptionalFormValue(data, "location"),
      },
      intent === "assign" ? "Tiket kendala dibuat dan PIC ditetapkan." : "Tiket kendala dibuat sebagai insiden terbuka.",
    )

    if (submitted) {
      form.reset()
      setShowIssueEvidence(false)
    }
  }

  async function handleCoordinationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const intent = getSubmitIntent(event, "send")
    const targetDivisionId = getRequiredFormValue(data, "targetDivisionId")
    const targetDivision = divisions.find((division) => division.id === targetDivisionId)
    const checklist = data.getAll("needs").filter((item): item is string => typeof item === "string")
    const notes = [
      `Prioritas: ${getOptionalFormValue(data, "priority") || "Sedang"}`,
      checklist.length ? `Kebutuhan: ${checklist.join(", ")}` : undefined,
      getOptionalFormValue(data, "notes"),
      intent === "draft" ? "Status input: draft request dari Quick Actions." : undefined,
    ].filter(Boolean).join("\n")

    const submitted = await submitJson(
      "coordinationRequest",
      "/api/mcs/handoffs",
      {
        activity: getRequiredFormValue(data, "title"),
        deadline: getRequiredFormValue(data, "neededBefore"),
        notes,
        ownerName: targetDivision?.coordinator ?? "PIC belum ditentukan",
        sourceDivisionId: getRequiredFormValue(data, "sourceDivisionId"),
        targetDivisionId,
      },
      intent === "draft" ? "Draft request koordinasi tercatat sebagai request menunggu." : "Request koordinasi dikirim ke divisi tujuan.",
    )

    if (submitted) {
      form.reset()
      setShowCoordinationChecklist(true)
    }
  }

  return (
    <>
      <div className="rounded-[16px] border border-[#111827]/10 bg-white px-3 py-2 shadow-[0_10px_28px_rgba(17,24,39,0.08)]">
        <div className="flex h-14 items-center gap-3">
          <p className="w-[72px] shrink-0 text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">Aksi Cepat</p>
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
          {actionConfigs.map((action) => (
            <QuickActionButton key={action.id} action={action} allowed={isAllowed(action, permissions)} onOpen={openAction} />
          ))}
          </div>
        </div>
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
        <DialogContent className="mcs-dialog-panel max-h-[92vh] overflow-y-auto rounded-[20px] p-6 sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-[#111827]">{activeConfig?.dialogTitle ?? "Aksi Cepat"}</DialogTitle>
            <DialogDescription className="text-sm font-medium leading-6 text-[#6B7280]">
              {activeConfig?.description ?? "Pilih workflow kepanitiaan yang tersedia."}
            </DialogDescription>
          </DialogHeader>

          {status ? <WorkflowStatus status={status} /> : null}

          {activeAction === "announcement" ? (
            <form className="grid gap-5" onSubmit={handleAnnouncementSubmit} onChange={updateAnnouncementPreview}>
              <div className="grid gap-4">
                <FormField label="Judul Pengumuman">
                  <Input name="title" required placeholder="Briefing panitia sebelum pembukaan" />
                </FormField>
                <FormField label="Isi Pengumuman">
                  <Textarea name="body" required placeholder="Tulis update resmi yang perlu diketahui panitia." />
                </FormField>
                <SegmentedOptions
                  label="Prioritas"
                  name="priority"
                  options={[
                    { label: "Rendah", value: "low" },
                    { label: "Normal", value: "normal" },
                    { label: "Penting", value: "important" },
                    { label: "Mendesak", value: "urgent" },
                  ]}
                  value={announcementPreview.priority}
                />
                <SegmentedOptions
                  label="Target"
                  name="target"
                  options={[
                    { label: "Semua Divisi", value: "all" },
                    { label: "Divisi Tertentu", value: "specific" },
                  ]}
                  value={announcementPreview.target}
                  onValueChange={(value) => setAnnouncementPreview((preview) => ({ ...preview, target: value as "all" | "specific" }))}
                />
                {announcementPreview.target === "specific" ? (
                  <FormField label="Divisi Tujuan">
                    <DivisionSelect defaultValue={defaultTargetDivisionId} divisions={divisions} name="targetDivisionId" />
                  </FormField>
                ) : null}
                <FormField label="Tanggal Tayang">
                  <Input name="date" type="date" defaultValue={reportSnapshot.eventStart} min={reportSnapshot.eventStart} max={reportSnapshot.eventEnd} />
                </FormField>
              </div>

              <ProgressiveSection
                icon={Paperclip}
                label="Lampiran"
                open={showAnnouncementAttachment}
                onToggle={() => setShowAnnouncementAttachment((value) => !value)}
              >
                <Input name="attachment" type="file" />
              </ProgressiveSection>

              <AnnouncementPreviewCard preview={announcementPreview} reportItems={reportItems.slice(0, 3)} />

              <ModalActions
                secondaryIntent="draft"
                secondaryLabel="Simpan Draft"
                submitIntent="publish"
                submitLabel="Publikasikan"
                submitting={submittingAction === "announcement"}
                onClose={() => setActiveAction(null)}
              />
            </form>
          ) : null}

          {activeAction === "schedule" ? (
            <form className="grid gap-5" onSubmit={handleScheduleSubmit}>
              <div className="grid gap-4">
                <FormField label="Nama Kegiatan">
                  <Input name="title" required placeholder="Technical Meeting Futsal" />
                </FormField>
                <div className="grid gap-3 sm:grid-cols-3">
                  <FormField label="Tanggal">
                    <Input name="date" type="date" required defaultValue={reportSnapshot.eventStart} min={reportSnapshot.eventStart} max={reportSnapshot.eventEnd} />
                  </FormField>
                  <FormField label="Jam Mulai">
                    <Input name="startTime" required placeholder="08.00" />
                  </FormField>
                  <FormField label="Jam Selesai">
                    <Input name="endTime" required placeholder="09.00" />
                  </FormField>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Lokasi">
                    <Input name="venue" required placeholder="Lapangan A" />
                  </FormField>
                  <FormField label="PIC">
                    <Input name="pic" required placeholder="Acara / PJ Lomba" />
                  </FormField>
                </div>
                <FormField label="Kategori">
                  <NativeSelect name="category" defaultValue="Lomba">
                    {["Lomba", "Briefing", "Technical Meeting", "Opening Ceremony", "Closing Ceremony", "Internal Committee"].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </NativeSelect>
                </FormField>
                <SegmentedOptions
                  label="Status"
                  name="status"
                  options={[
                    { label: "Draft", value: "draft" },
                    { label: "Dipublikasikan", value: "published" },
                  ]}
                  value="published"
                />
                <FormField label="Catatan">
                  <Textarea name="notes" placeholder="Catatan singkat untuk PIC atau divisi terkait." />
                </FormField>
              </div>
              <ModalActions
                secondaryIntent="save"
                secondaryLabel="Simpan"
                submitIntent="publish"
                submitLabel="Publikasikan"
                submitting={submittingAction === "schedule"}
                onClose={() => setActiveAction(null)}
              />
            </form>
          ) : null}

          {activeAction === "task" ? (
            <form className="grid gap-5" onSubmit={handleTaskSubmit}>
              <div className="grid gap-4">
                <FormField label="Judul Tugas">
                  <Input name="title" required placeholder="Finalisasi kebutuhan sound system" />
                </FormField>
                <FormField label="Deskripsi">
                  <Textarea name="description" placeholder="Tuliskan konteks tugas dan hasil yang diharapkan." />
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
                  <FormField label="Prioritas">
                    <NativeSelect name="priority" defaultValue="medium">
                      <option value="low">Rendah</option>
                      <option value="medium">Sedang</option>
                      <option value="high">Tinggi</option>
                      <option value="critical">Kritis</option>
                    </NativeSelect>
                  </FormField>
                  <FormField label="Deadline">
                    <Input name="deadline" required placeholder="22 Juni 2026, 08.00 WIB" />
                  </FormField>
                </div>
                <FormField label="Kategori">
                  <NativeSelect name="category" defaultValue="Acara">
                    {taskCategories.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </NativeSelect>
                </FormField>
              </div>
              <ProgressiveSection
                icon={ListChecks}
                label="Checklist"
                open={showTaskChecklist}
                onToggle={() => setShowTaskChecklist((value) => !value)}
              >
                <ChecklistGrid name="checklist" options={["Briefing PIC", "Cek lokasi", "Konfirmasi alat", "Update status", "Dokumentasikan hasil"]} />
              </ProgressiveSection>
              <ModalActions
                secondaryIntent="save"
                secondaryLabel="Simpan"
                submitIntent="assign"
                submitLabel="Tugaskan"
                submitting={submittingAction === "task"}
                onClose={() => setActiveAction(null)}
              />
            </form>
          ) : null}

          {activeAction === "issueTicket" ? (
            <form className="grid gap-5" onSubmit={handleIssueTicketSubmit}>
              <div className="grid gap-4">
                <FormField label="Judul Kendala">
                  <Input name="title" required placeholder="Sound Lapangan A belum siap" />
                </FormField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Kategori">
                    <NativeSelect name="category" defaultValue="Venue">
                      {issueCategories.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Severity">
                    <NativeSelect name="severity" defaultValue="Sedang">
                      <option value="Rendah">Rendah</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Tinggi">Tinggi</option>
                      <option value="Kritis">Kritis</option>
                    </NativeSelect>
                  </FormField>
                </div>
                <FormField label="Lokasi">
                  <Input name="location" placeholder="Lapangan A" />
                </FormField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Divisi Penanggung Jawab">
                    <DivisionSelect defaultValue={defaultTargetDivisionId} divisions={divisions} name="divisionId" />
                  </FormField>
                  <FormField label="PIC">
                    <Input name="pic" placeholder="Nama PIC penanganan" />
                  </FormField>
                </div>
                <FormField label="Deadline Penanganan">
                  <Input name="deadline" required placeholder="Hari ini, 30 menit sebelum match" />
                </FormField>
                <FormField label="Deskripsi">
                  <Textarea name="description" required placeholder="Tuliskan kondisi, dampak, dan kebutuhan tindak lanjut." />
                </FormField>
              </div>
              <ProgressiveSection
                icon={Paperclip}
                label="Bukti Foto"
                open={showIssueEvidence}
                onToggle={() => setShowIssueEvidence((value) => !value)}
              >
                <Input name="evidence" type="file" accept="image/*" />
              </ProgressiveSection>
              <ModalActions
                secondaryIntent="create"
                secondaryLabel="Buat Tiket"
                submitIntent="assign"
                submitLabel="Assign PIC"
                submitting={submittingAction === "issueTicket"}
                onClose={() => setActiveAction(null)}
              />
            </form>
          ) : null}

          {activeAction === "coordinationRequest" ? (
            <form className="grid gap-5" onSubmit={handleCoordinationSubmit}>
              <div className="grid gap-4">
                <FormField label="Judul Permintaan">
                  <Input name="title" required placeholder="Siapkan sound system untuk opening ceremony" />
                </FormField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Dari Divisi">
                    <DivisionSelect defaultValue={defaultDivisionId} divisions={divisions} name="sourceDivisionId" />
                  </FormField>
                  <FormField label="Ke Divisi">
                    <DivisionSelect defaultValue={defaultTargetDivisionId} divisions={divisions} name="targetDivisionId" />
                  </FormField>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Prioritas">
                    <NativeSelect name="priority" defaultValue="Sedang">
                      <option value="Rendah">Rendah</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Tinggi">Tinggi</option>
                    </NativeSelect>
                  </FormField>
                  <FormField label="Butuh Sebelum">
                    <Input name="neededBefore" required placeholder="22 Juni 2026, 07.30 WIB" />
                  </FormField>
                </div>
              </div>
              <ProgressiveSection
                icon={ListChecks}
                label="Checklist Kebutuhan"
                open={showCoordinationChecklist}
                onToggle={() => setShowCoordinationChecklist((value) => !value)}
              >
                <ChecklistGrid name="needs" options={coordinationChecklist} />
              </ProgressiveSection>
              <FormField label="Catatan">
                <Textarea name="notes" placeholder="Tambahkan konteks singkat untuk divisi tujuan." />
              </FormField>
              <WorkflowLegend
                items={[
                  ["Pending", "Request menunggu respon divisi tujuan"],
                  ["Accepted", "Divisi tujuan menerima handoff"],
                  ["Rejected", "Request perlu revisi atau diblokir"],
                  ["Completed", "Koordinasi selesai dieksekusi"],
                ]}
              />
              <ModalActions
                secondaryIntent="draft"
                secondaryLabel="Simpan Draft"
                submitIntent="send"
                submitLabel="Kirim Permintaan"
                submitting={submittingAction === "coordinationRequest"}
                onClose={() => setActiveAction(null)}
              />
            </form>
          ) : null}

          {activeAction === "reports" ? (
            <div className="grid gap-4">
              <div className="grid gap-2 sm:grid-cols-3">
                {reportItems.map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#111827]/10 bg-[#FFF7ED] px-3 py-3">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#6B7280]">{item.label}</p>
                    <p className="mt-2 truncate font-heading text-lg font-bold text-[#111827]">{item.value}</p>
                  </div>
                ))}
              </div>
              <DialogFooter className="mcs-dialog-footer mx-0 mb-0 rounded-[16px]">
                <Button type="button" onClick={() => setActiveAction(null)}>
                  Tutup
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function QuickActionButton({
  action,
  allowed,
  onOpen,
}: {
  action: ActionConfig
  allowed: boolean
  onOpen: (action: QuickActionId) => void
}) {
  const Icon = action.icon
  const className =
    "group flex h-14 w-[62px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/25"

  if (!allowed) {
    return (
      <span aria-disabled="true" className={cn(className, "border-[#111827]/10 bg-[#F3EEE2] text-[#9CA3AF]")}>
        <Icon className="size-5" aria-hidden="true" />
        <span className="text-[0.62rem] font-bold leading-none">{action.label}</span>
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-label={action.dialogTitle}
      className={cn(className, "border-transparent bg-transparent text-[#111827] hover:border-[#F97316]/35 hover:bg-[#FFF7ED]")}
      onClick={() => onOpen(action.id)}
    >
      <span className="grid size-8 place-items-center rounded-lg border border-[#111827]/10 bg-[#FFF7ED] text-[#F97316] transition group-hover:border-[#F97316]/40 group-hover:bg-white">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="max-w-full truncate text-[0.62rem] font-bold leading-none text-[#111827]">{action.label}</span>
    </button>
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
        "h-10 w-full rounded-lg border border-[#111827]/12 bg-white px-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20",
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

function SegmentedOptions({
  label,
  name,
  options,
  value,
  onValueChange,
}: {
  label: string
  name: string
  options: Array<{ label: string; value: string }>
  value: string
  onValueChange?: (value: string) => void
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-[#111827]">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              className="peer sr-only"
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === value}
              onChange={() => onValueChange?.(option.value)}
            />
            <span className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-[#111827]/12 bg-white px-3 text-sm font-semibold text-[#6B7280] transition peer-checked:border-[#F97316] peer-checked:bg-[#FFF7ED] peer-checked:text-[#C2410C]">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ProgressiveSection({
  children,
  icon: Icon,
  label,
  open,
  onToggle,
}: {
  children: ReactNode
  icon: LucideIcon
  label: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <section className="rounded-lg border border-[#111827]/10 bg-[#FFF7ED] p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left text-sm font-bold text-[#111827]"
        onClick={onToggle}
      >
        <span className="inline-flex items-center gap-2">
          <Icon className="size-4 text-[#F97316]" aria-hidden="true" />
          {label}
        </span>
        <ChevronDown className={cn("size-4 transition", open ? "rotate-180" : "")} aria-hidden="true" />
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </section>
  )
}

function ChecklistGrid({ name, options }: { name: string; options: string[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 rounded-lg border border-[#111827]/10 bg-white px-3 py-2 text-sm font-semibold text-[#111827]">
          <input className="size-4 accent-[#F97316]" type="checkbox" name={name} value={option} />
          {option}
        </label>
      ))}
    </div>
  )
}

function AnnouncementPreviewCard({
  preview,
  reportItems,
}: {
  preview: AnnouncementPreview
  reportItems: Array<{ label: string; value: number | string }>
}) {
  return (
    <section className="rounded-[16px] border border-[#111827]/10 bg-[#FFFDF8] p-4 shadow-[2px_2px_0_rgba(17,24,39,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#F97316]">Preview</p>
        <span className="rounded-md border border-[#111827]/10 bg-[#FFF7ED] px-2 py-1 text-xs font-bold text-[#6B7280]">
          {preview.target === "specific" ? "Divisi Tertentu" : "Semua Divisi"}
        </span>
      </div>
      <h4 className="mt-3 text-base font-bold text-[#111827]">{preview.title || "Judul pengumuman"}</h4>
      <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-[#6B7280]">{preview.body || "Isi pengumuman akan tampil di sini sebelum dipublikasikan."}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {reportItems.map((item) => (
          <div key={item.label} className="rounded-lg border border-[#111827]/10 bg-[#FFF7ED] px-3 py-2">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#6B7280]">{item.label}</p>
            <p className="mt-1 truncate text-sm font-bold text-[#111827]">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function WorkflowLegend({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-2 rounded-lg border border-[#111827]/10 bg-[#FFF7ED] p-3 sm:grid-cols-2">
      {items.map(([label, description]) => (
        <div key={label} className="rounded-lg bg-white px-3 py-2">
          <p className="text-xs font-bold text-[#111827]">{label}</p>
          <p className="mt-1 text-xs font-medium leading-5 text-[#6B7280]">{description}</p>
        </div>
      ))}
    </div>
  )
}

function WorkflowStatus({ status }: { status: Exclude<SubmissionState, null> }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-sm font-semibold",
        status.tone === "success"
          ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]"
          : "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
      )}
    >
      {status.message}
    </div>
  )
}

function ModalActions({
  onClose,
  secondaryIntent,
  secondaryLabel,
  submitIntent,
  submitLabel,
  submitting,
}: {
  onClose: () => void
  secondaryIntent: string
  secondaryLabel: string
  submitIntent: string
  submitLabel: string
  submitting: boolean
}) {
  return (
    <DialogFooter className="mcs-dialog-footer mx-0 mb-0 rounded-[16px]">
      <Button type="button" variant="outline" onClick={onClose}>
        Batal
      </Button>
      <Button type="submit" variant="outline" name="intent" value={secondaryIntent} disabled={submitting}>
        <FileText aria-hidden="true" />
        {secondaryLabel}
      </Button>
      <Button type="submit" name="intent" value={submitIntent} disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        {submitting ? "Memproses" : submitLabel}
      </Button>
    </DialogFooter>
  )
}

function isAllowed(action: ActionConfig, permissions: Permission[]) {
  return action.requiredPermissions.every((permission) => permissions.includes(permission))
}

function getSubmitIntent(event: FormEvent<HTMLFormElement>, fallback: string) {
  const submitter = (event.nativeEvent as SubmitEvent).submitter

  return submitter instanceof HTMLButtonElement && submitter.value ? submitter.value : fallback
}

function getRequiredFormValue(data: FormData, key: string) {
  const value = data.get(key)

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} wajib diisi.`)
  }

  return value.trim()
}

function getOptionalFormValue(data: FormData, key: string) {
  const value = data.get(key)

  return typeof value === "string" ? value.trim() : ""
}

function getDivisionRole(value: string): UserRole | undefined {
  return divisionRoleIds.includes(value as UserRole) ? value as UserRole : undefined
}

function getAnnouncementPriorityPayload(value: string) {
  if (value === "important") return "important"
  if (value === "urgent") return "urgent"
  return "normal"
}

function getScheduleTypePayload(value: string) {
  if (value === "Lomba") return "match"
  if (value === "Opening Ceremony" || value === "Closing Ceremony") return "ceremony"
  return "operation"
}

function getTaskPriorityPayload(value: string) {
  if (value === "low") return "Low"
  if (value === "high" || value === "critical") return "High"
  return "Medium"
}

function getIssueSeverityPayload(value: string) {
  if (value === "Rendah" || value === "Tinggi" || value === "Kritis") return value
  return "Sedang"
}

function getIssueCategoryPayload(value: string) {
  if (value === "Peralatan") return "Perlengkapan"
  if (value === "Dokumentasi") return "Media"
  if (value === "Venue" || value === "Jadwal" || value === "Peserta" || value === "Keamanan") return value
  return "Lainnya"
}
