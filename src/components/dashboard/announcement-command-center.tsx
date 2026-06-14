"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Activity,
  Bell,
  CalendarDays,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Megaphone,
  MessageCircle,
  Paperclip,
  Pencil,
  Plus,
  Radio,
  Search,
  Send,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { brandColors, contact, event } from "@/data/mcs"
import {
  announcements as officialAnnouncements,
  broadcasts as officialBroadcasts,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementCategory,
  type AnnouncementPriority,
  type AnnouncementStatus,
  type Broadcast,
  type BroadcastChannel,
} from "@/data/competition-center"
import { cn } from "@/lib/utils"

const categories: AnnouncementCategory[] = ["Umum", "Lomba", "Peserta", "Panitia", "Sponsor", "Media", "Jadwal", "Darurat"]
const audiences: AnnouncementAudience[] = ["Semua", "Peserta", "Panitia", "Pembina", "PJ Lomba", "PDD", "Humas", "Sponsor"]
const priorities: AnnouncementPriority[] = ["Low", "Normal", "High", "Urgent"]
const statuses: AnnouncementStatus[] = ["Draft", "Scheduled", "Published"]
const channels: BroadcastChannel[] = ["Dashboard", "WhatsApp", "Email", "Semua Channel"]

const audienceEstimates: Record<AnnouncementAudience, number> = {
  Humas: 8,
  Panitia: 55,
  PDD: 12,
  "PJ Lomba": 18,
  Pembina: 6,
  Peserta: 0,
  Semua: 0,
  Sponsor: 0,
}

type AnnouncementForm = Omit<Announcement, "id" | "createdAt" | "updatedAt" | "changeHistory">
type BroadcastForm = Pick<Broadcast, "title" | "target" | "channel" | "message">

const defaultAnnouncementForm: AnnouncementForm = {
  attachments: [],
  audience: "Semua",
  author: contact.whatsappOfficial.label,
  body: "",
  category: "Umum",
  priority: "Normal",
  publishDate: new Date().toISOString().slice(0, 10),
  publishTime: "08:00",
  status: "Draft",
  title: "",
}

const defaultBroadcastForm: BroadcastForm = {
  channel: "Dashboard",
  message: "",
  target: "Semua",
  title: "",
}

export function AnnouncementCommandCenter() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(officialAnnouncements)
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(officialBroadcasts)
  const [announcementModal, setAnnouncementModal] = useState(false)
  const [broadcastModal, setBroadcastModal] = useState(false)
  const [detail, setDetail] = useState<Announcement | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>(defaultAnnouncementForm)
  const [broadcastForm, setBroadcastForm] = useState<BroadcastForm>(defaultBroadcastForm)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | AnnouncementStatus>("All")
  const [categoryFilter, setCategoryFilter] = useState<"All" | AnnouncementCategory>("All")
  const [audienceFilter, setAudienceFilter] = useState<"All" | AnnouncementAudience>("All")
  const [priorityFilter, setPriorityFilter] = useState<"All" | AnnouncementPriority>("All")

  useEffect(() => {
    if (window.location.search.includes("action=create")) {
      openCreateAnnouncement()
    }
  }, [])

  const stats = useMemo(
    () => ({
      Draft: announcements.filter((item) => item.status === "Draft").length,
      Published: announcements.filter((item) => item.status === "Published").length,
      Scheduled: announcements.filter((item) => item.status === "Scheduled").length,
      Urgent: announcements.filter((item) => item.priority === "Urgent").length,
    }),
    [announcements]
  )

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase()

    return announcements.filter((item) => {
      const haystack = `${item.title} ${item.body} ${item.category} ${item.audience} ${item.priority} ${item.author}`.toLowerCase()

      return (
        (!query || haystack.includes(query)) &&
        (statusFilter === "All" || item.status === statusFilter) &&
        (categoryFilter === "All" || item.category === categoryFilter) &&
        (audienceFilter === "All" || item.audience === audienceFilter) &&
        (priorityFilter === "All" || item.priority === priorityFilter)
      )
    })
  }, [announcements, audienceFilter, categoryFilter, priorityFilter, search, statusFilter])

  const latestBroadcasts = broadcasts.slice(0, 4)
  const timeline = buildActivityTimeline(announcements, broadcasts)

  function openCreateAnnouncement() {
    setEditingId(null)
    setAnnouncementForm({ ...defaultAnnouncementForm, publishDate: new Date().toISOString().slice(0, 10) })
    setAnnouncementModal(true)
  }

  function openEditAnnouncement(item: Announcement) {
    setEditingId(item.id)
    setAnnouncementForm({
      attachments: item.attachments,
      audience: item.audience,
      author: item.author,
      body: item.body,
      category: item.category,
      priority: item.priority,
      publishDate: item.publishDate,
      publishTime: item.publishTime,
      status: item.status,
      title: item.title,
    })
    setAnnouncementModal(true)
  }

  function saveAnnouncement() {
    const now = new Date().toISOString()
    const title = announcementForm.title.trim()
    const body = announcementForm.body.trim()

    if (!title || !body) return

    if (editingId) {
      setAnnouncements((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...announcementForm,
                body,
                title,
                updatedAt: now,
                changeHistory: [`Diperbarui oleh ${announcementForm.author} pada ${formatDateTime(now)}.`, ...item.changeHistory],
              }
            : item
        )
      )
    } else {
      setAnnouncements((current) => [
        {
          ...announcementForm,
          body,
          createdAt: now,
          id: `announcement-${Date.now()}`,
          title,
          updatedAt: now,
          changeHistory: [`Dibuat oleh ${announcementForm.author} pada ${formatDateTime(now)}.`],
        },
        ...current,
      ])
    }

    setAnnouncementModal(false)
  }

  function publishAnnouncement(id: string) {
    const now = new Date().toISOString()
    setAnnouncements((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Published",
              updatedAt: now,
              changeHistory: [`Dipublikasikan pada ${formatDateTime(now)}.`, ...item.changeHistory],
            }
          : item
      )
    )
  }

  function deleteAnnouncement(id: string) {
    setAnnouncements((current) => current.filter((item) => item.id !== id))
  }

  function createBroadcast() {
    const now = new Date().toISOString()
    const title = broadcastForm.title.trim()
    const message = broadcastForm.message.trim()

    if (!title || !message) return

    setBroadcasts((current) => [
      {
        ...broadcastForm,
        deliveryRate: 100,
        id: `broadcast-${Date.now()}`,
        message,
        recipientEstimate: audienceEstimates[broadcastForm.target],
        sentAt: now,
        status: "Sent",
        title,
      },
      ...current,
    ])
    setBroadcastForm(defaultBroadcastForm)
    setBroadcastModal(false)
  }

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="grid gap-5 border-b border-[#E5E7EB] bg-[#0B1F3A] p-5 text-white lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E1B451]">{event.theme}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Command Center Komunikasi MCS</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-white/72">
              Pusat komunikasi resmi MCS 1 untuk pengumuman panitia, peserta, broadcast, notifikasi dashboard, informasi hari H, perubahan jadwal, lomba, sponsor, dan kondisi darurat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={openCreateAnnouncement} className="bg-[#C3262D] text-white hover:bg-[#A91F25]">
              <Plus data-icon="inline-start" />
              Create Announcement
            </Button>
            <Button variant="outline" onClick={() => setBroadcastModal(true)} className="border-white/20 bg-white text-[#0B1F3A] hover:bg-[#F8FAFC] hover:text-[#0B1F3A]">
              <Send data-icon="inline-start" />
              Create Broadcast
            </Button>
            <ExportMenu announcements={announcements} broadcasts={broadcasts} stats={stats} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Megaphone} label="Published" tone="success" value={stats.Published} />
        <StatCard icon={FileText} label="Draft" tone="warning" value={stats.Draft} />
        <StatCard icon={CalendarDays} label="Scheduled" tone="info" value={stats.Scheduled} />
        <StatCard icon={Radio} label="Urgent" tone="danger" value={stats.Urgent} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6">
          <Panel title="Announcement Table" description="Daftar pengumuman resmi dan status publikasinya." icon={Megaphone}>
            <FilterBar
              audienceFilter={audienceFilter}
              categoryFilter={categoryFilter}
              priorityFilter={priorityFilter}
              search={search}
              statusFilter={statusFilter}
              onAudienceFilter={setAudienceFilter}
              onCategoryFilter={setCategoryFilter}
              onPriorityFilter={setPriorityFilter}
              onSearch={setSearch}
              onStatusFilter={setStatusFilter}
            />
            <AnnouncementTable
              announcements={filteredAnnouncements}
              onDelete={deleteAnnouncement}
              onEdit={openEditAnnouncement}
              onPublish={publishAnnouncement}
              onView={setDetail}
            />
          </Panel>

          <Panel title="Broadcast Center" description="Broadcast terakhir beserta target, channel, status, dan delivery rate." icon={Send}>
            <BroadcastTable broadcasts={broadcasts} onCreate={() => setBroadcastModal(true)} />
          </Panel>

          <Panel title="Aktivitas Pengumuman Terbaru" description="Timeline dibuat otomatis dari pengumuman dan broadcast resmi." icon={Activity}>
            <ActivityTimeline items={timeline} onCreate={openCreateAnnouncement} />
          </Panel>
        </div>

        <aside className="grid content-start gap-6">
          <Panel title="Quick Guide" description="Workflow komunikasi resmi MCS 1." icon={FileText}>
            <div className="grid gap-3 text-sm font-medium leading-6 text-[#475569]">
              <GuideItem title="Cara membuat pengumuman" body="Klik Create Announcement, lengkapi judul, kategori, audience, prioritas, isi, jadwal publish, lampiran, dan status." />
              <GuideItem title="Kategori pengumuman" body="Gunakan Darurat untuk informasi kritis, Jadwal untuk perubahan waktu, Lomba untuk teknis kompetisi, Sponsor untuk publikasi mitra." />
              <GuideItem title="Target audience" body="Pilih target paling spesifik agar informasi sampai ke Peserta, Panitia, Pembina, PJ Lomba, PDD, Humas, atau Sponsor." />
              <GuideItem title="Broadcast workflow" body="Create Broadcast, pilih channel Dashboard, WhatsApp, Email, atau Semua Channel, cek preview pesan, lalu kirim." />
            </div>
          </Panel>

          <Panel title="Recent Broadcast Activity" description="Status terkirim, penerima, dan waktu pengiriman." icon={Bell}>
            <RecentBroadcastActivity broadcasts={latestBroadcasts} onCreate={() => setBroadcastModal(true)} />
          </Panel>
        </aside>
      </section>

      <AnnouncementModal
        form={announcementForm}
        mode={editingId ? "edit" : "create"}
        open={announcementModal}
        onChange={setAnnouncementForm}
        onClose={() => setAnnouncementModal(false)}
        onSave={saveAnnouncement}
      />
      <BroadcastModal
        form={broadcastForm}
        open={broadcastModal}
        onChange={setBroadcastForm}
        onClose={() => setBroadcastModal(false)}
        onSave={createBroadcast}
      />
      <DetailModal announcement={detail} onClose={() => setDetail(null)} />
    </div>
  )
}

function ExportMenu({
  announcements,
  broadcasts,
  stats,
}: {
  announcements: Announcement[]
  broadcasts: Broadcast[]
  stats: Record<"Draft" | "Published" | "Scheduled" | "Urgent", number>
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen((value) => !value)} className="border-white/20 bg-white text-[#0B1F3A] hover:bg-[#F8FAFC] hover:text-[#0B1F3A]">
        <Download data-icon="inline-start" />
        Export Announcements
      </Button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-[#E5E7EB] bg-white p-2 text-[#111827] shadow-xl">
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-[#F8FAFC]" onClick={() => exportPdf(announcements, broadcasts, stats)}>
            <FileText className="size-4 text-[#C3262D]" />
            PDF Premium
          </button>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-[#F8FAFC]" onClick={() => exportExcel(announcements, broadcasts, stats)}>
            <FileSpreadsheet className="size-4 text-[#0B1F3A]" />
            Excel
          </button>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-[#F8FAFC]" onClick={() => exportCsv(announcements)}>
            <Download className="size-4 text-[#D4A017]" />
            CSV
          </button>
        </div>
      ) : null}
    </div>
  )
}

function StatCard({ icon: Icon, label, tone, value }: { icon: typeof Megaphone; label: string; tone: "danger" | "info" | "success" | "warning"; value: number }) {
  return (
    <article className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">{label}</p>
        <span className={cn("grid size-10 place-items-center rounded-md", toneClasses[tone].soft)}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-4xl font-black text-[#111827]">{value}</p>
    </article>
  )
}

function Panel({ children, description, icon: Icon, title }: { children: ReactNode; description: string; icon: typeof Megaphone; title: string }) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#0B1F3A] text-white">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-black text-[#111827]">{title}</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function FilterBar(props: {
  audienceFilter: "All" | AnnouncementAudience
  categoryFilter: "All" | AnnouncementCategory
  priorityFilter: "All" | AnnouncementPriority
  search: string
  statusFilter: "All" | AnnouncementStatus
  onAudienceFilter: (value: "All" | AnnouncementAudience) => void
  onCategoryFilter: (value: "All" | AnnouncementCategory) => void
  onPriorityFilter: (value: "All" | AnnouncementPriority) => void
  onSearch: (value: string) => void
  onStatusFilter: (value: "All" | AnnouncementStatus) => void
}) {
  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(130px,160px))]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
        <Input className="pl-9" placeholder="Search announcement..." value={props.search} onChange={(event) => props.onSearch(event.target.value)} />
      </div>
      <NativeSelect value={props.statusFilter} options={["All", ...statuses]} onChange={(value) => props.onStatusFilter(value as "All" | AnnouncementStatus)} />
      <NativeSelect value={props.categoryFilter} options={["All", ...categories]} onChange={(value) => props.onCategoryFilter(value as "All" | AnnouncementCategory)} />
      <NativeSelect value={props.audienceFilter} options={["All", ...audiences]} onChange={(value) => props.onAudienceFilter(value as "All" | AnnouncementAudience)} />
      <NativeSelect value={props.priorityFilter} options={["All", ...priorities]} onChange={(value) => props.onPriorityFilter(value as "All" | AnnouncementPriority)} />
    </div>
  )
}

function AnnouncementTable({
  announcements,
  onDelete,
  onEdit,
  onPublish,
  onView,
}: {
  announcements: Announcement[]
  onDelete: (id: string) => void
  onEdit: (announcement: Announcement) => void
  onPublish: (id: string) => void
  onView: (announcement: Announcement) => void
}) {
  if (announcements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center">
        <Megaphone className="mx-auto size-8 text-[#C3262D]" />
        <h3 className="mt-3 text-lg font-black text-[#111827]">Belum ada pengumuman resmi.</h3>
        <p className="mt-1 text-sm font-medium text-[#64748B]">Klik Create Announcement untuk membuat pengumuman pertama MCS 1.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-black uppercase tracking-[0.08em] text-[#64748B]">
            {["Tanggal", "Judul", "Kategori", "Audience", "Prioritas", "Status", "Penulis", "Aksi"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-3 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {announcements.map((item) => (
            <tr key={item.id}>
              <td className="border-b border-[#F1F5F9] px-3 py-4 first:pl-0 font-semibold text-[#64748B]">{formatDate(item.publishDate)}</td>
              <td className="max-w-[260px] border-b border-[#F1F5F9] px-3 py-4 font-black text-[#111827]">{item.title}</td>
              <td className="border-b border-[#F1F5F9] px-3 py-4 text-[#64748B]">{item.category}</td>
              <td className="border-b border-[#F1F5F9] px-3 py-4 text-[#64748B]">{item.audience}</td>
              <td className="border-b border-[#F1F5F9] px-3 py-4"><ToneBadge label={item.priority} tone={priorityTone(item.priority)} /></td>
              <td className="border-b border-[#F1F5F9] px-3 py-4"><ToneBadge label={item.status} tone={statusTone(item.status)} /></td>
              <td className="border-b border-[#F1F5F9] px-3 py-4 text-[#64748B]">{item.author}</td>
              <td className="border-b border-[#F1F5F9] px-3 py-4 last:pr-0">
                <div className="flex items-center gap-1">
                  <IconButton label="View" icon={Eye} onClick={() => onView(item)} />
                  <IconButton label="Edit" icon={Pencil} onClick={() => onEdit(item)} />
                  <IconButton label="Publish" icon={Send} onClick={() => onPublish(item.id)} disabled={item.status === "Published"} />
                  <IconButton label="Delete" icon={Trash2} onClick={() => onDelete(item.id)} danger />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BroadcastTable({ broadcasts, onCreate }: { broadcasts: Broadcast[]; onCreate: () => void }) {
  if (broadcasts.length === 0) {
    return (
      <WorkflowEmptyState
        buttonLabel="Create Broadcast"
        description="Broadcast WhatsApp, Email, Dashboard, dan Semua Channel akan muncul setelah dibuat."
        icon={Send}
        onAction={onCreate}
        title="Belum ada broadcast resmi."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-black uppercase tracking-[0.08em] text-[#64748B]">
            {["Broadcast Terakhir", "Target", "Channel", "Status", "Delivery Rate"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-3 py-3 first:pl-0 last:pr-0">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {broadcasts.map((item) => (
            <tr key={item.id}>
              <td className="border-b border-[#F1F5F9] px-3 py-4 first:pl-0 font-black text-[#111827]">{item.title}</td>
              <td className="border-b border-[#F1F5F9] px-3 py-4 text-[#64748B]">{item.target}</td>
              <td className="border-b border-[#F1F5F9] px-3 py-4 text-[#64748B]">{item.channel}</td>
              <td className="border-b border-[#F1F5F9] px-3 py-4"><ToneBadge label={item.status} tone="success" /></td>
              <td className="border-b border-[#F1F5F9] px-3 py-4 last:pr-0 font-mono font-black text-[#111827]">{item.deliveryRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RecentBroadcastActivity({ broadcasts, onCreate }: { broadcasts: Broadcast[]; onCreate: () => void }) {
  if (broadcasts.length === 0) {
    return (
      <WorkflowEmptyState
        buttonLabel="Create Broadcast"
        description="Aktivitas terkirim, jumlah penerima, dan waktu pengiriman akan tampil di sini."
        icon={MessageCircle}
        onAction={onCreate}
        title="Belum ada aktivitas broadcast."
      />
    )
  }

  return (
    <div className="grid gap-3">
      {broadcasts.map((item) => (
        <article key={item.id} className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="font-black text-[#111827]">{item.title}</p>
            <ToneBadge label={item.status} tone="success" />
          </div>
          <p className="mt-2 text-sm font-medium text-[#64748B]">{item.channel} kepada {item.target}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">
            <span>{item.recipientEstimate} penerima</span>
            <span className="text-right">{formatDateTime(item.sentAt)}</span>
          </div>
        </article>
      ))}
    </div>
  )
}

function ActivityTimeline({ items, onCreate }: { items: Array<{ id: string; title: string; meta: string }>; onCreate: () => void }) {
  if (items.length === 0) {
    return (
      <WorkflowEmptyState
        buttonLabel="Create Announcement"
        description="Aktivitas publikasi, broadcast peserta, perubahan venue, dan pengumuman sponsor akan terbentuk otomatis."
        icon={Activity}
        onAction={onCreate}
        title="Belum ada aktivitas pengumuman."
      />
    )
  }

  return (
    <div className="relative grid gap-0">
      <span className="absolute bottom-5 left-[7px] top-5 w-px bg-[#CBD5E1]" />
      {items.map((item) => (
        <div key={item.id} className="relative grid grid-cols-[16px_minmax(0,1fr)] gap-3 py-3">
          <span className="relative z-10 mt-1 size-4 rounded-full border-2 border-[#C3262D] bg-white" />
          <div>
            <p className="font-black text-[#111827]">{item.title}</p>
            <p className="mt-1 text-sm font-medium text-[#64748B]">{item.meta}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function AnnouncementModal({
  form,
  mode,
  open,
  onChange,
  onClose,
  onSave,
}: {
  form: AnnouncementForm
  mode: "create" | "edit"
  open: boolean
  onChange: (form: AnnouncementForm) => void
  onClose: () => void
  onSave: () => void
}) {
  if (!open) return null

  return (
    <ModalFrame onClose={onClose} title={mode === "edit" ? "Edit Announcement" : "Create Announcement"} subtitle="Lengkapi informasi resmi sebelum disimpan atau dipublikasikan.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Judul Pengumuman" className="lg:col-span-2">
          <Input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} placeholder="Judul pengumuman resmi" />
        </Field>
        <Field label="Kategori"><NativeSelect value={form.category} options={categories} onChange={(value) => onChange({ ...form, category: value as AnnouncementCategory })} /></Field>
        <Field label="Target Audience"><NativeSelect value={form.audience} options={audiences} onChange={(value) => onChange({ ...form, audience: value as AnnouncementAudience })} /></Field>
        <Field label="Prioritas"><NativeSelect value={form.priority} options={priorities} onChange={(value) => onChange({ ...form, priority: value as AnnouncementPriority })} /></Field>
        <Field label="Status"><NativeSelect value={form.status} options={statuses} onChange={(value) => onChange({ ...form, status: value as AnnouncementStatus })} /></Field>
        <Field label="Isi Pengumuman" className="lg:col-span-2">
          <Textarea className="min-h-32" value={form.body} onChange={(event) => onChange({ ...form, body: event.target.value })} placeholder="Isi lengkap pengumuman" />
        </Field>
        <Field label="Lampiran" className="lg:col-span-2">
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-3 text-sm font-bold text-[#64748B] hover:border-[#C3262D]">
            <Paperclip className="size-4" />
            {form.attachments.length ? form.attachments.join(", ") : "Pilih lampiran"}
            <input
              className="sr-only"
              multiple
              type="file"
              onChange={(event) => onChange({ ...form, attachments: Array.from(event.target.files ?? []).map((file) => file.name) })}
            />
          </label>
        </Field>
        <Field label="Tanggal Publish"><Input type="date" value={form.publishDate} onChange={(event) => onChange({ ...form, publishDate: event.target.value })} /></Field>
        <Field label="Jadwal Publish"><Input type="time" value={form.publishTime} onChange={(event) => onChange({ ...form, publishTime: event.target.value })} /></Field>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} className="bg-[#C3262D] text-white hover:bg-[#A91F25]">Save Announcement</Button>
      </div>
    </ModalFrame>
  )
}

function BroadcastModal({
  form,
  open,
  onChange,
  onClose,
  onSave,
}: {
  form: BroadcastForm
  open: boolean
  onChange: (form: BroadcastForm) => void
  onClose: () => void
  onSave: () => void
}) {
  if (!open) return null

  const recipientEstimate = audienceEstimates[form.target]

  return (
    <ModalFrame onClose={onClose} title="Broadcast Center" subtitle="Kirim pesan resmi melalui Dashboard, WhatsApp, Email, atau semua channel.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Judul Broadcast" className="lg:col-span-2">
          <Input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} placeholder="Judul broadcast" />
        </Field>
        <Field label="Target"><NativeSelect value={form.target} options={audiences} onChange={(value) => onChange({ ...form, target: value as AnnouncementAudience })} /></Field>
        <Field label="Channel"><NativeSelect value={form.channel} options={channels} onChange={(value) => onChange({ ...form, channel: value as BroadcastChannel })} /></Field>
        <Field label="Isi Pesan" className="lg:col-span-2">
          <Textarea className="min-h-32" value={form.message} onChange={(event) => onChange({ ...form, message: event.target.value })} placeholder="Isi pesan broadcast" />
        </Field>
      </div>
      <div className="mt-4 grid gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">Preview Pesan</p>
        <p className="text-sm font-semibold leading-6 text-[#111827]">{form.message || "Isi pesan akan tampil di sini sebelum dikirim."}</p>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">Estimasi Penerima: {recipientEstimate}</p>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} className="bg-[#0B1F3A] text-white hover:bg-[#12345F]">Send Broadcast</Button>
      </div>
    </ModalFrame>
  )
}

function DetailModal({ announcement, onClose }: { announcement: Announcement | null; onClose: () => void }) {
  if (!announcement) return null

  return (
    <ModalFrame onClose={onClose} title={announcement.title} subtitle="Detail pengumuman resmi MCS 1.">
      <div className="grid gap-4">
        <p className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm font-medium leading-6 text-[#334155]">{announcement.body}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Fact label="Lampiran" value={announcement.attachments.join(", ") || "Tidak ada lampiran"} />
          <Fact label="Audience" value={announcement.audience} />
          <Fact label="Prioritas" value={announcement.priority} />
          <Fact label="Tanggal Publish" value={`${formatDate(announcement.publishDate)} ${announcement.publishTime}`} />
        </div>
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">Riwayat Perubahan</p>
          <div className="grid gap-2">
            {announcement.changeHistory.map((history) => (
              <p key={history} className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#475569]">{history}</p>
            ))}
          </div>
        </div>
      </div>
    </ModalFrame>
  )
}

function ModalFrame({ children, onClose, subtitle, title }: { children: ReactNode; onClose: () => void; subtitle: string; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#111827]/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.28)]">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div>
            <h2 className="text-2xl font-black text-[#111827]">{title}</h2>
            <p className="mt-1 text-sm font-medium text-[#64748B]">{subtitle}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>x</Button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">{label}</span>
      {children}
    </label>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">{label}</p>
      <p className="mt-1 font-semibold text-[#111827]">{value}</p>
    </div>
  )
}

function GuideItem({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
      <p className="font-black text-[#111827]">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  )
}

function WorkflowEmptyState({ buttonLabel, description, icon: Icon, onAction, title }: { buttonLabel: string; description: string; icon: typeof Send; onAction: () => void; title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5 text-center">
      <Icon className="mx-auto size-7 text-[#0B1F3A]" />
      <p className="mt-3 font-black text-[#111827]">{title}</p>
      <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p>
      <Button className="mt-4 bg-[#C3262D] text-white hover:bg-[#A91F25]" onClick={onAction}>
        <Plus data-icon="inline-start" />
        {buttonLabel}
      </Button>
    </div>
  )
}

function IconButton({ danger, disabled, icon: Icon, label, onClick }: { danger?: boolean; disabled?: boolean; icon: typeof Eye; label: string; onClick: () => void }) {
  return (
    <Button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      size="icon-sm"
      title={label}
      variant={danger ? "destructive" : "outline"}
    >
      <Icon />
    </Button>
  )
}

function NativeSelect({ onChange, options, value }: { onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <select
      className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#C3262D] focus:ring-3 focus:ring-[#C3262D]/15"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  )
}

function ToneBadge({ label, tone }: { label: string; tone: "danger" | "info" | "neutral" | "success" | "warning" }) {
  return <Badge className={cn("rounded-md", toneClasses[tone].badge)}>{label}</Badge>
}

const toneClasses = {
  danger: { badge: "bg-[#FEE2E2] text-[#B91C1C]", soft: "bg-[#FEE2E2] text-[#B91C1C]" },
  info: { badge: "bg-[#DBEAFE] text-[#1D4ED8]", soft: "bg-[#DBEAFE] text-[#1D4ED8]" },
  neutral: { badge: "bg-[#F1F5F9] text-[#475569]", soft: "bg-[#F1F5F9] text-[#475569]" },
  success: { badge: "bg-[#DCFCE7] text-[#15803D]", soft: "bg-[#DCFCE7] text-[#15803D]" },
  warning: { badge: "bg-[#FEF3C7] text-[#92400E]", soft: "bg-[#FEF3C7] text-[#92400E]" },
}

function priorityTone(priority: AnnouncementPriority) {
  if (priority === "Urgent") return "danger"
  if (priority === "High") return "warning"
  if (priority === "Low") return "neutral"
  return "info"
}

function statusTone(status: AnnouncementStatus) {
  if (status === "Published") return "success"
  if (status === "Scheduled") return "info"
  return "warning"
}

function buildActivityTimeline(announcements: Announcement[], broadcasts: Broadcast[]) {
  return [
    ...announcements.map((item) => ({
      date: item.updatedAt,
      id: item.id,
      meta: `${item.category} - ${item.audience} - ${item.status}`,
      title: `${item.title} ${item.status === "Published" ? "dipublikasikan." : item.status === "Scheduled" ? "dijadwalkan." : "disimpan sebagai draft."}`,
    })),
    ...broadcasts.map((item) => ({
      date: item.sentAt,
      id: item.id,
      meta: `${item.channel} - ${item.target} - ${item.recipientEstimate} penerima`,
      title: `${item.title} dikirim.`,
    })),
  ]
    .sort((first, second) => Date.parse(second.date) - Date.parse(first.date))
    .slice(0, 6)
}

function formatDate(value: string) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function exportCsv(announcements: Announcement[]) {
  const rows = [
    ["Tanggal", "Judul", "Kategori", "Audience", "Prioritas", "Status", "Penulis"],
    ...announcements.map((item) => [item.publishDate, item.title, item.category, item.audience, item.priority, item.status, item.author]),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), "mcs-1-announcements.csv")
}

async function exportExcel(announcements: Announcement[], broadcasts: Broadcast[], stats: Record<string, number>) {
  const XLSX = await import("xlsx-js-style")
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([stats]), "Statistik")
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(announcements), "Announcements")
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(broadcasts), "Broadcasts")
  XLSX.writeFile(workbook, "mcs-1-announcements.xlsx")
}

async function exportPdf(announcements: Announcement[], broadcasts: Broadcast[], stats: Record<string, number>) {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
  const autoTable = autoTableModule.default
  const doc = new jsPDF()

  doc.setFillColor(11, 31, 58)
  doc.rect(0, 0, 210, 58, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(26)
  doc.text("MCS 1", 16, 22)
  doc.setFontSize(14)
  doc.text(event.theme, 16, 32)
  doc.setFontSize(11)
  doc.text("SMKN 20 Jakarta", 16, 42)
  doc.setTextColor(17, 24, 39)
  doc.setFontSize(13)
  doc.text("Statistik Pengumuman", 16, 72)
  autoTable(doc, {
    body: Object.entries(stats).map(([label, value]) => [label, value]),
    startY: 78,
    styles: { fontSize: 10 },
    theme: "grid",
  })
  autoTable(doc, {
    head: [["Tanggal", "Judul", "Kategori", "Audience", "Status"]],
    body: announcements.map((item) => [item.publishDate, item.title, item.category, item.audience, item.status]),
    startY: 112,
    styles: { fontSize: 8 },
    theme: "striped",
  })
  autoTable(doc, {
    head: [["Timeline Publish", "Audience", "Status"]],
    body: announcements.map((item) => [`${item.publishDate} ${item.publishTime}`, item.audience, item.status]),
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
    styles: { fontSize: 8 },
    theme: "striped",
  })
  autoTable(doc, {
    head: [["Broadcast", "Channel", "Audience", "Status"]],
    body: broadcasts.map((item) => [item.title, item.channel, item.target, item.status]),
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
    styles: { fontSize: 8 },
    theme: "striped",
  })
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(9)
  doc.text("Exported by MCS Management System", 16, 286)
  doc.setProperties({
    creator: "MCS Management System",
    subject: `${brandColors.primary} ${brandColors.secondary} ${brandColors.accent}`,
    title: "MCS 1 Announcement Export",
  })
  doc.save("mcs-1-announcements-premium.pdf")
}
