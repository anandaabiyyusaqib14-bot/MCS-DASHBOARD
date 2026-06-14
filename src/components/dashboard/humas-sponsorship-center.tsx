"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import {
  Activity,
  Bell,
  CalendarDays,
  Download,
  Eye,
  FileText,
  Handshake,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
  Upload,
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
import { brandAssets, event, sponsorProspects } from "@/data/mcs"
import { cn } from "@/lib/utils"
import type { DashboardSummary, UserDTO } from "@/server/mcs/types"

type SponsorStatus = "Prospect" | "Follow Up" | "Proposal Dikirim" | "Negosiasi" | "Deal" | "Tidak Jadi"
type SponsorCategory = "Cash" | "Product" | "Media Partner"
type ProposalStatus = "Draft" | "Dikirim" | "Review" | "Negosiasi" | "Deal" | "Ditolak"
type BenefitStatus = "Pending" | "In Progress" | "Done"
type PublicationStatus = "Draft" | "Scheduled" | "Published"
type ModalMode =
  | "announcement"
  | "proposal"
  | "sponsor"
  | "publication"
  | "follow-up"
  | "sponsor-detail"
  | "edit-sponsor"
  | "update-status"
  | "update-benefit"
  | null

type Sponsor = {
  id: string
  name: string
  pic: string
  contact: string
  email: string
  category: SponsorCategory
  value: number
  benefitText: string
  benefits: Record<BenefitName, boolean>
  status: SponsorStatus
  notes: string
  lastContact: string
  nextFollowUp: string
}

type Proposal = {
  id: string
  sponsorId: string
  sponsorName: string
  type: "Gold" | "Silver" | "Bronze" | "Custom"
  sentDate: string
  deadline: string
  pic: string
  status: ProposalStatus
  fileName: string
  notes: string
}

type Publication = {
  id: string
  name: string
  platform: "Instagram Feed" | "Instagram Story" | "TikTok" | "Website"
  date: string
  time: string
  pic: string
  status: PublicationStatus
}

type FollowUp = {
  id: string
  sponsorId: string
  sponsorName: string
  lastContact: string
  nextFollowUp: string
  pic: string
  status: SponsorStatus
  notes: string
}

type BenefitName = "Logo Banner" | "Logo Feed" | "Logo Story" | "Booth" | "MC Mention"

type BenefitRecord = {
  id: string
  sponsorId: string
  sponsorName: string
  benefit: BenefitName
  status: BenefitStatus
  date: string
  pic: string
}

type Announcement = {
  id: string
  title: string
  category: string
  body: string
  target: string
  priority: string
  status: "Draft" | "Publish"
}

type ActivityLog = {
  id: string
  time: string
  message: string
}

const sponsorStatuses: SponsorStatus[] = ["Prospect", "Follow Up", "Proposal Dikirim", "Negosiasi", "Deal", "Tidak Jadi"]
const proposalStatuses: ProposalStatus[] = ["Draft", "Dikirim", "Review", "Negosiasi", "Deal", "Ditolak"]
const benefitStatuses: BenefitStatus[] = ["Pending", "In Progress", "Done"]
const benefitNames: BenefitName[] = ["Logo Banner", "Logo Feed", "Logo Story", "Booth", "MC Mention"]
const storageKey = "mcs-humas-sponsorship-state-v2"

const defaultPublications: Publication[] = []

const initialActivities: ActivityLog[] = []

function createInitialSponsors(): Sponsor[] {
  return sponsorProspects.map((sponsor) => ({
    id: sponsor.id,
    name: sponsor.name,
    pic: sponsor.pic || "Humas",
    contact: sponsor.contact === "Coming Soon" ? "" : sponsor.contact,
    email: "",
    category: "Cash",
    value: sponsor.receivedAmount ?? 0,
    benefitText: "",
    benefits: {
      "Logo Banner": false,
      "Logo Feed": false,
      "Logo Story": false,
      Booth: false,
      "MC Mention": false,
    },
    status: mapInitialSponsorStatus(sponsor.pipelineStatus),
    notes: "",
    lastContact: "",
    nextFollowUp: sponsor.followUpDate === "Coming Soon" ? "" : sponsor.followUpDate,
  }))
}

function createInitialProposals(sponsors: Sponsor[]): Proposal[] {
  void sponsors
  return []
}

function createInitialBenefits(sponsors: Sponsor[]): BenefitRecord[] {
  return sponsors.flatMap((sponsor) =>
    benefitNames
      .filter((benefit) => sponsor.benefits[benefit])
      .map((benefit) => ({
        id: `benefit-${sponsor.id}-${slugify(benefit)}`,
        sponsorId: sponsor.id,
        sponsorName: sponsor.name,
        benefit,
        status: sponsor.status === "Deal" ? "Done" : "Pending",
        date: "2026-06-22",
        pic: "Humas",
      })),
  )
}

type PersistedState = {
  announcements: Announcement[]
  benefits: BenefitRecord[]
  followUps: FollowUp[]
  logs: ActivityLog[]
  proposals: Proposal[]
  publications: Publication[]
  sponsors: Sponsor[]
}

const initialSponsors = createInitialSponsors()
const fallbackState: PersistedState = {
  announcements: [],
  benefits: createInitialBenefits(initialSponsors),
  followUps: [],
  logs: initialActivities,
  proposals: createInitialProposals(initialSponsors),
  publications: defaultPublications,
  sponsors: initialSponsors,
}

export function HumasSponsorshipCenter({
  summary,
  user,
  variant = "module",
}: {
  summary: DashboardSummary
  user: UserDTO
  variant?: "module" | "role-dashboard"
}) {
  const [state, setState] = useState<PersistedState>(() => {
    if (typeof window === "undefined") return fallbackState

    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return fallbackState

    try {
      return { ...fallbackState, ...JSON.parse(raw) }
    } catch {
      return fallbackState
    }
  })
  const [modal, setModal] = useState<ModalMode>(null)
  const [toast, setToast] = useState("")
  const [selectedSponsorId, setSelectedSponsorId] = useState<string>("")
  const [selectedBenefitId, setSelectedBenefitId] = useState<string>("")
  const [draggingSponsorId, setDraggingSponsorId] = useState("")
  const activeAnnouncements = state.announcements.filter((item) => item.status === "Publish").length + summary.announcements.filter((item) => item.status === "published").length
  const scheduledPosts = state.publications.filter((item) => item.status === "Scheduled").length
  const pendingApprovals = summary.announcements.filter((item) => item.status === "pending_approval").length
  const sponsorDeal = state.sponsors.filter((sponsor) => sponsor.status === "Deal").length
  const sponsorPending = state.sponsors.filter((sponsor) => !["Deal", "Tidak Jadi"].includes(sponsor.status)).length
  const totalValue = state.sponsors.reduce((sum, sponsor) => sum + sponsor.value, 0)
  const selectedSponsor = state.sponsors.find((sponsor) => sponsor.id === selectedSponsorId) ?? null
  const selectedBenefit = state.benefits.find((benefit) => benefit.id === selectedBenefitId) ?? null

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state])

  const dashboardStats = [
    { label: "Pengumuman Aktif", value: activeAnnouncements },
    { label: "Postingan Terjadwal", value: scheduledPosts },
    { label: "Broadcast Terkirim", value: state.announcements.filter((item) => item.status === "Publish").length },
    { label: "Menunggu Persetujuan", value: pendingApprovals },
  ]

  function addLog(message: string) {
    setState((current) => ({
      ...current,
      logs: [{ id: createId("log"), time: formatTime(new Date()), message }, ...current.logs].slice(0, 30),
    }))
  }

  function patchState(patch: Partial<PersistedState>, message?: string) {
    setState((current) => ({ ...current, ...patch }))
    if (message) addLog(message)
  }

  function closeModal() {
    setModal(null)
    setSelectedSponsorId("")
    setSelectedBenefitId("")
  }

  function openSponsorModal(mode: ModalMode, sponsorId: string) {
    setSelectedSponsorId(sponsorId)
    setModal(mode)
  }

  function openBenefitModal(benefitId: string) {
    setSelectedBenefitId(benefitId)
    setModal("update-benefit")
  }

  function showError(message: string) {
    setToast(message)
  }

  function submitAnnouncement(formData: FormData, publish: boolean) {
    const title = getRequired(formData, "title", "Judul wajib diisi.", showError)
    const body = getRequired(formData, "body", "Isi pengumuman wajib diisi.", showError)
    if (!title || !body) return

    const next: Announcement = {
      id: createId("announcement"),
      title,
      body,
      category: String(formData.get("category") || "Umum"),
      target: String(formData.get("target") || "Internal Panitia"),
      priority: String(formData.get("priority") || "Sedang"),
      status: publish ? "Publish" : "Draft",
    }
    patchState(
      { announcements: [next, ...state.announcements] },
      publish ? `Pengumuman "${title}" dipublikasikan` : `Draft pengumuman "${title}" disimpan`,
    )
    setToast(publish ? "Pengumuman berhasil dipublikasikan." : "Draft pengumuman berhasil disimpan.")
    closeModal()
  }

  function submitProposal(formData: FormData) {
    const sponsorId = getRequired(formData, "sponsorId", "Nama Sponsor wajib diisi.", showError)
    const sentDate = getRequired(formData, "sentDate", "Tanggal kirim wajib dipilih.", showError)
    const file = formData.get("file")
    if (!sponsorId || !sentDate) return
    if (!(file instanceof File) || !file.name) {
      showError("MOU wajib upload file PDF.")
      return
    }

    const sponsor = state.sponsors.find((item) => item.id === sponsorId)
    if (!sponsor) {
      showError("Sponsor tidak ditemukan.")
      return
    }

    const proposal: Proposal = {
      id: createId("proposal"),
      sponsorId,
      sponsorName: sponsor.name,
      type: String(formData.get("type") || "Custom") as Proposal["type"],
      sentDate,
      deadline: addDays(sentDate, 7),
      pic: user.displayName,
      status: "Dikirim",
      fileName: file.name,
      notes: String(formData.get("notes") || ""),
    }
    const sponsors = state.sponsors.map((item) => item.id === sponsorId ? { ...item, status: "Proposal Dikirim" as SponsorStatus } : item)
    patchState(
      { proposals: [proposal, ...state.proposals], sponsors },
      `MOU dikirim ke ${sponsor.name}`,
    )
    setToast("MOU berhasil dikirim dan masuk tracking sponsor.")
    closeModal()
  }

  function submitSponsor(formData: FormData, sponsorId?: string) {
    const name = getRequired(formData, "name", "Nama Sponsor wajib diisi.", showError)
    const pic = getRequired(formData, "pic", "PIC Sponsor wajib diisi.", showError)
    const contact = getRequired(formData, "contact", "Nomor HP wajib diisi.", showError)
    if (!name || !pic || !contact) return

    const selectedBenefits = benefitNames.reduce((acc, benefit) => {
      acc[benefit] = formData.get(benefit) === "on"
      return acc
    }, {} as Record<BenefitName, boolean>)
    const nextSponsor: Sponsor = {
      id: sponsorId ?? createId("sponsor"),
      name,
      pic,
      contact,
      email: String(formData.get("email") || ""),
      category: String(formData.get("category") || "Cash") as SponsorCategory,
      value: Number(formData.get("value") || 0),
      benefitText: String(formData.get("benefitText") || ""),
      benefits: selectedBenefits,
      status: String(formData.get("status") || "Prospect") as SponsorStatus,
      notes: String(formData.get("notes") || ""),
      lastContact: sponsorId ? (selectedSponsor?.lastContact ?? "") : "",
      nextFollowUp: sponsorId ? (selectedSponsor?.nextFollowUp ?? "") : "",
    }
    const sponsors = sponsorId
      ? state.sponsors.map((sponsor) => sponsor.id === sponsorId ? nextSponsor : sponsor)
      : [nextSponsor, ...state.sponsors]
    const existingBenefits = state.benefits.filter((benefit) => benefit.sponsorId !== nextSponsor.id)
    const newBenefits = benefitNames
      .filter((benefit) => selectedBenefits[benefit])
      .map((benefit) => ({
        id: `benefit-${nextSponsor.id}-${slugify(benefit)}`,
        sponsorId: nextSponsor.id,
        sponsorName: nextSponsor.name,
        benefit,
        status: "Pending" as BenefitStatus,
        date: event.startDate,
        pic,
      }))

    patchState(
      { benefits: [...newBenefits, ...existingBenefits], sponsors },
      sponsorId ? `${name} diperbarui` : `${name} masuk alur sponsor`,
    )
    setToast(sponsorId ? "Sponsor berhasil diperbarui." : "Sponsor berhasil ditambahkan.")
    closeModal()
  }

  function submitPublication(formData: FormData) {
    const name = getRequired(formData, "name", "Nama konten wajib diisi.", showError)
    const date = getRequired(formData, "date", "Tanggal wajib dipilih.", showError)
    const time = getRequired(formData, "time", "Jam wajib dipilih.", showError)
    const pic = getRequired(formData, "pic", "PIC wajib diisi.", showError)
    if (!name || !date || !time || !pic) return

    const publication: Publication = {
      id: createId("publication"),
      name,
      platform: String(formData.get("platform") || "Instagram Feed") as Publication["platform"],
      date,
      time,
      pic,
      status: String(formData.get("status") || "Draft") as PublicationStatus,
    }
    patchState({ publications: [publication, ...state.publications] }, `Jadwal publikasi "${name}" disimpan`)
    setToast("Jadwal publikasi berhasil disimpan.")
    closeModal()
  }

  function submitFollowUp(formData: FormData) {
    const sponsorId = getRequired(formData, "sponsorId", "Nama Sponsor wajib diisi.", showError)
    const nextFollowUp = getRequired(formData, "nextFollowUp", "Next follow up wajib dipilih.", showError)
    if (!sponsorId || !nextFollowUp) return

    const sponsor = state.sponsors.find((item) => item.id === sponsorId)
    if (!sponsor) return
    const followUp: FollowUp = {
      id: createId("follow"),
      sponsorId,
      sponsorName: sponsor.name,
      lastContact: String(formData.get("lastContact") || todayIso()),
      nextFollowUp,
      pic: String(formData.get("pic") || user.displayName),
      status: String(formData.get("status") || sponsor.status) as SponsorStatus,
      notes: String(formData.get("notes") || ""),
    }
    const sponsors = state.sponsors.map((item) =>
      item.id === sponsorId
        ? { ...item, lastContact: followUp.lastContact, nextFollowUp: followUp.nextFollowUp, status: followUp.status }
        : item,
    )
    patchState({ followUps: [followUp, ...state.followUps], sponsors }, `Follow up ${sponsor.name} dilakukan`)
    setToast("Follow up sponsor berhasil ditambahkan.")
    closeModal()
  }

  function submitStatusUpdate(formData: FormData) {
    if (!selectedSponsor) return
    const status = String(formData.get("status") || selectedSponsor.status) as SponsorStatus
    const sponsors = state.sponsors.map((sponsor) => sponsor.id === selectedSponsor.id ? { ...sponsor, status } : sponsor)
    patchState({ sponsors }, `${selectedSponsor.name} masuk tahap ${status}`)
    setToast("Status sponsor berhasil diperbarui.")
    closeModal()
  }

  function submitBenefitUpdate(formData: FormData) {
    if (!selectedBenefit) return
    const status = String(formData.get("status") || selectedBenefit.status) as BenefitStatus
    const date = getRequired(formData, "date", "Tanggal wajib dipilih.", showError)
    if (!date) return

    const benefits = state.benefits.map((benefit) =>
      benefit.id === selectedBenefit.id
        ? { ...benefit, status, date, pic: String(formData.get("pic") || benefit.pic) }
        : benefit,
    )
    patchState({ benefits }, `Benefit ${selectedBenefit.benefit} untuk ${selectedBenefit.sponsorName} diperbarui`)
    setToast("Benefit sponsor berhasil diperbarui.")
    closeModal()
  }

  function deleteSponsor(sponsorId: string) {
    const sponsor = state.sponsors.find((item) => item.id === sponsorId)
    if (!sponsor) return
    patchState(
      {
        benefits: state.benefits.filter((item) => item.sponsorId !== sponsorId),
        followUps: state.followUps.filter((item) => item.sponsorId !== sponsorId),
        proposals: state.proposals.filter((item) => item.sponsorId !== sponsorId),
        sponsors: state.sponsors.filter((item) => item.id !== sponsorId),
      },
      `${sponsor.name} dihapus dari daftar sponsor`,
    )
    setToast("Sponsor berhasil dihapus.")
  }

  function handleDrop(status: SponsorStatus) {
    if (!draggingSponsorId) return
    const sponsor = state.sponsors.find((item) => item.id === draggingSponsorId)
    if (!sponsor) return
    const sponsors = state.sponsors.map((item) => item.id === draggingSponsorId ? { ...item, status } : item)
    patchState({ sponsors }, `${sponsor.name} dipindahkan ke ${status}`)
    setDraggingSponsorId("")
  }

  async function exportPdf() {
    try {
      const { jsPDF } = await import("jspdf")
      const autoTableModule = await import("jspdf-autotable")
      const autoTable = autoTableModule.default ?? autoTableModule.autoTable
      const doc = new jsPDF({ unit: "pt", format: "a4" })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const exportDate = formatLongDate(new Date())
      const logos = await Promise.all(brandAssets.map((asset) => loadImageAsDataUrl(asset.src)))

      doc.setFillColor(8, 28, 58)
      doc.rect(0, 0, pageWidth, pageHeight, "F")
      logos.forEach((logo, index) => {
        const x = 48 + index * 62
        doc.setFillColor(255, 255, 255)
        doc.roundedRect(x, 64, 46, 46, 8, 8, "F")
        if (logo) doc.addImage(logo, "PNG", x + 7, 71, 32, 32, undefined, "FAST")
      })
      doc.setFillColor(249, 115, 22)
      doc.roundedRect(pageWidth - 172, 66, 124, 42, 10, 10, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text("MCS 1", pageWidth - 127, 92)
      doc.setFontSize(24)
      doc.text("LAPORAN HUMAS & SPONSORSHIP", 48, 206)
      doc.setFontSize(20)
      doc.text("MCS 1", 48, 242)
      doc.setFontSize(13)
      doc.text(event.theme, 48, 270)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(`Tanggal Export: ${exportDate}`, 48, 304)

      addPdfPage(doc, "HALAMAN 1 - Ringkasan Sponsor")
      autoTable(doc, {
        body: [
          ["Total Sponsor", state.sponsors.length],
          ["Sponsor Aktif", state.sponsors.filter((item) => item.status !== "Tidak Jadi").length],
          ["Sponsor Deal", sponsorDeal],
          ["Sponsor Pending", sponsorPending],
          ["Total Value", formatCurrency(totalValue)],
        ],
        head: [["Ringkasan Sponsor", "Nilai"]],
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        margin: { left: 40, right: 40, top: 120 },
        styles: { cellPadding: 8, fontSize: 9 },
      })

      addPdfPage(doc, "HALAMAN 2 - Daftar Sponsor")
      autoTable(doc, {
        body: state.sponsors.map((sponsor) => [sponsor.name, sponsor.category, formatCurrency(sponsor.value), sponsor.status, sponsor.pic]),
        head: [["Nama", "Kategori", "Nilai", "Status", "PIC"]],
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        margin: { left: 40, right: 40, top: 120 },
        styles: { cellPadding: 7, fontSize: 8 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
      })

      addPdfPage(doc, "HALAMAN 3 - Proposal Tracking")
      autoTable(doc, {
        body: state.proposals.map((proposal) => [proposal.sponsorName, proposal.type, proposal.sentDate, proposal.deadline, proposal.pic, proposal.status]),
        head: [["Sponsor", "Jenis Proposal", "Tanggal Kirim", "Deadline", "PIC", "Status"]],
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        margin: { left: 40, right: 40, top: 120 },
        styles: { cellPadding: 7, fontSize: 8 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
      })

      addPdfPage(doc, "HALAMAN 4 - Benefit Sponsor")
      autoTable(doc, {
        body: state.benefits.map((benefit) => [benefit.sponsorName, benefit.benefit, benefit.status, benefit.date, benefit.pic]),
        head: [["Sponsor", "Benefit", "Status", "Tanggal", "PIC"]],
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        margin: { left: 40, right: 40, top: 120 },
        styles: { cellPadding: 7, fontSize: 8 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
      })

      addPdfPage(doc, "HALAMAN 5 - Activity Log")
      autoTable(doc, {
        body: state.logs.map((log) => [log.time, log.message]),
        head: [["Waktu", "Aktivitas"]],
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        margin: { left: 40, right: 40, top: 120 },
        styles: { cellPadding: 8, fontSize: 9 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
      })

      for (let page = 1; page <= doc.getNumberOfPages(); page += 1) {
        doc.setPage(page)
        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        doc.text("Exported by MCS Dashboard", 40, doc.internal.pageSize.getHeight() - 28)
      }
      doc.save("MCS1_Laporan_Humas_Sponsorship.pdf")
      setToast("PDF laporan sponsor berhasil dibuat.")
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Export PDF gagal.")
    }
  }

  async function exportExcel() {
    try {
      const XLSX = await import("xlsx-js-style")
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(state.sponsors.map((sponsor) => ({
        Nama: sponsor.name,
        Kategori: sponsor.category,
        Nilai: sponsor.value,
        Status: sponsor.status,
        PIC: sponsor.pic,
        Kontak: sponsor.contact,
        Email: sponsor.email,
      }))), "Daftar Sponsor")
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(state.proposals), "Proposal Tracking")
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(state.benefits), "Benefit Sponsor")
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(state.publications), "Jadwal Publikasi")
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(state.logs), "Activity Log")
      XLSX.writeFile(workbook, "MCS1_Laporan_Humas_Sponsorship.xlsx")
      setToast("Excel laporan sponsor berhasil dibuat.")
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Export Excel gagal.")
    }
  }

  return (
    <div className="grid gap-5">
      <section className="mcs-soft-surface mcs-starburst overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm after:-right-5 after:top-4">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="relative z-10 flex min-w-0 gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[#111827]/15 bg-[#F97316] text-white shadow-[3px_3px_0_rgba(17,24,39,0.16)]">
              <Handshake className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-heading text-2xl font-bold tracking-normal text-[#111827]">
                {variant === "role-dashboard" ? `Sponsor Management Center, ${user.displayName}` : "Sponsor Management Center"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#6B7280]">
                Tracking sponsor, follow up, proposal, benefit, publikasi, activity log, dan laporan profesional Humas & Sponsorship MCS 1.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <HeaderButton icon={Megaphone} label="Buat Pengumuman" onClick={() => setModal("announcement")} />
            <HeaderButton icon={Upload} label="Upload MOU" onClick={() => setModal("proposal")} />
            <HeaderButton icon={Handshake} label="Tambah Sponsor" onClick={() => setModal("sponsor")} />
            <HeaderButton icon={CalendarDays} label="Jadwal Publikasi" onClick={() => setModal("publication")} />
            <ExportMenu onExcel={exportExcel} onPdf={exportPdf} />
          </div>
        </div>
        {toast ? <p className="relative z-10 mt-4 rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-3 py-2 text-sm font-semibold text-[#C2410C]">{toast}</p> : null}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel icon={Megaphone} title="Dashboard Humas" description="Ringkasan komunikasi dan publikasi aktif.">
          <div className="grid gap-3 sm:grid-cols-2">
            {dashboardStats.map((item) => (
              <MetricCard key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </Panel>

        <Panel icon={Handshake} title="Ikhtisar Sponsor" description="Ringkasan sponsor dan nilai kerja sama.">
          <MiniStats
            items={[
              ["Total Sponsor", state.sponsors.length],
              ["Sponsor Aktif", state.sponsors.filter((item) => item.status !== "Tidak Jadi").length],
              ["Sponsor Deal", sponsorDeal],
              ["Sponsor Pending", sponsorPending],
              ["Total Value Sponsor", formatCurrency(totalValue)],
            ]}
          />
        </Panel>
      </section>

      <Panel icon={Handshake} title="Alur Sponsor" description="Drag sponsor antar status untuk update tahap otomatis.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {sponsorStatuses.map((status) => {
            const sponsors = state.sponsors.filter((sponsor) => sponsor.status === status)

            return (
              <div
                key={status}
                className="min-h-48 rounded-2xl border border-[#E5E7EB] bg-[#F8F9FB] p-3"
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(status)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#111827]">{status}</p>
                  <StatusPill tone="neutral">{sponsors.length}</StatusPill>
                </div>
                <div className="mt-3 grid gap-2">
                  {sponsors.map((sponsor) => (
                    <button
                      key={sponsor.id}
                      type="button"
                      draggable
                      className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-left shadow-sm transition hover:border-[#F97316]"
                      onClick={() => openSponsorModal("sponsor-detail", sponsor.id)}
                      onDragStart={() => setDraggingSponsorId(sponsor.id)}
                    >
                      <p className="text-sm font-bold text-[#111827]">{sponsor.name}</p>
                      <p className="mt-1 text-xs font-medium text-[#64748B]">{sponsor.pic} / {formatCurrency(sponsor.value)}</p>
                    </button>
                  ))}
                  {sponsors.length === 0 ? <p className="rounded-xl border border-dashed border-[#CBD5E1] p-3 text-xs font-semibold text-[#94A3B8]">Coming Soon</p> : null}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      <Panel icon={UsersIcon} title="Daftar Sponsor" description="Klik View untuk melihat detail lengkap sponsor.">
        <DataTable
          columns={["Nama", "Kategori", "Nilai", "Status", "PIC", "Aksi"]}
          rows={state.sponsors.map((sponsor) => [
            sponsor.name,
            sponsor.category,
            formatCurrency(sponsor.value),
            <StatusPill key="status" tone={sponsorTone(sponsor.status)}>{sponsor.status}</StatusPill>,
            sponsor.pic,
            <ActionButtons
              key="actions"
              onDelete={() => deleteSponsor(sponsor.id)}
              onEdit={() => openSponsorModal("edit-sponsor", sponsor.id)}
              onStatus={() => openSponsorModal("update-status", sponsor.id)}
              onView={() => openSponsorModal("sponsor-detail", sponsor.id)}
            />,
          ])}
        />
      </Panel>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel
          action={<Button className="h-9 rounded-xl bg-[#F97316] text-white hover:bg-[#EA580C]" onClick={() => setModal("follow-up")}><Plus className="size-4" />Tambah Follow Up</Button>}
          icon={Bell}
          title="Follow Up Sponsor"
          description="Kontrol last contact dan tindak lanjut berikutnya."
        >
          <DataTable
            columns={["Sponsor", "Last Contact", "Next Follow Up", "PIC", "Status", "Catatan"]}
            rows={state.followUps.map((item) => [item.sponsorName, item.lastContact, item.nextFollowUp, item.pic, item.status, item.notes || "Coming Soon"])}
          />
        </Panel>

        <Panel icon={FileText} title="Proposal Tracking" description="Tabel proposal sponsor dengan aksi status.">
          <DataTable
            columns={["Sponsor", "Jenis Proposal", "Tanggal Kirim", "Deadline", "PIC", "Status", "Aksi"]}
            rows={state.proposals.map((proposal) => [
              proposal.sponsorName,
              proposal.type,
              proposal.sentDate,
              proposal.deadline,
              proposal.pic,
              <StatusPill key="status" tone={proposalTone(proposal.status)}>{proposal.status}</StatusPill>,
              <Button key="action" size="sm" variant="outline" className="rounded-xl bg-white text-[#111827] hover:text-[#111827]" onClick={() => {
                const nextStatus = nextProposalStatus(proposal.status)
                patchState(
                  { proposals: state.proposals.map((item) => item.id === proposal.id ? { ...item, status: nextStatus } : item) },
                  `${proposal.sponsorName} proposal masuk status ${nextStatus}`,
                )
              }}>Update</Button>,
            ])}
          />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel icon={CalendarDays} title="Jadwal Publikasi" description="Kalender konten publikasi resmi Humas.">
          <DataTable
            columns={["Nama Konten", "Platform", "Tanggal", "Jam", "PIC", "Status"]}
            rows={state.publications.map((item) => [item.name, item.platform, item.date, item.time, item.pic, item.status])}
          />
        </Panel>

        <Panel icon={Activity} title="Benefit Tracker" description="Monitor benefit sponsor sampai selesai.">
          <DataTable
            columns={["Sponsor", "Benefit", "Status", "Tanggal", "PIC", "Aksi"]}
            rows={state.benefits.map((benefit) => [
              benefit.sponsorName,
              benefit.benefit,
              <StatusPill key="status" tone={benefitTone(benefit.status)}>{benefit.status}</StatusPill>,
              benefit.date,
              benefit.pic,
              <Button key="action" size="sm" variant="outline" className="rounded-xl bg-white text-[#111827] hover:text-[#111827]" onClick={() => openBenefitModal(benefit.id)}>Update Benefit</Button>,
            ])}
          />
        </Panel>
      </section>

      <Panel icon={Activity} title="Activity Log" description="Semua aksi Humas & Sponsorship terekam otomatis.">
        <div className="grid gap-2">
          {state.logs.map((log) => (
            <div key={log.id} className="grid gap-2 rounded-xl border border-[#E5E7EB] bg-white p-3 sm:grid-cols-[80px_1fr]">
              <p className="font-mono text-xs font-bold text-[#F97316]">{log.time}</p>
              <p className="text-sm font-semibold text-[#111827]">{log.message}</p>
            </div>
          ))}
        </div>
      </Panel>

      <AnnouncementModal open={modal === "announcement"} onClose={closeModal} onSubmit={submitAnnouncement} />
      <ProposalModal open={modal === "proposal"} sponsors={state.sponsors} onClose={closeModal} onSubmit={submitProposal} />
      <SponsorModal open={modal === "sponsor"} onClose={closeModal} onSubmit={(data) => submitSponsor(data)} />
      <SponsorModal open={modal === "edit-sponsor"} sponsor={selectedSponsor} onClose={closeModal} onSubmit={(data) => selectedSponsor && submitSponsor(data, selectedSponsor.id)} />
      <PublicationModal open={modal === "publication"} user={user} onClose={closeModal} onSubmit={submitPublication} />
      <FollowUpModal open={modal === "follow-up"} sponsors={state.sponsors} user={user} onClose={closeModal} onSubmit={submitFollowUp} />
      <SponsorDetailModal sponsor={selectedSponsor} logs={state.logs} open={modal === "sponsor-detail"} onClose={closeModal} />
      <StatusModal open={modal === "update-status"} sponsor={selectedSponsor} onClose={closeModal} onSubmit={submitStatusUpdate} />
      <BenefitModal benefit={selectedBenefit} open={modal === "update-benefit"} onClose={closeModal} onSubmit={submitBenefitUpdate} />
    </div>
  )
}

function HeaderButton({ icon: Icon, label, onClick }: { icon: typeof Megaphone; label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" className="h-9 rounded-xl border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] hover:bg-[#FFF7ED]" onClick={onClick}>
      <Icon className="size-4 text-[#F97316]" aria-hidden="true" />
      {label}
    </Button>
  )
}

function ExportMenu({ onExcel, onPdf }: { onExcel: () => void; onPdf: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button type="button" className="h-9 rounded-xl bg-[#F97316] px-3 text-sm font-semibold text-white hover:bg-[#EA580C]" onClick={() => setOpen((current) => !current)}>
        <Download className="size-4" aria-hidden="true" />
        Ekspor Laporan Sponsor
      </Button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 grid w-48 gap-1 rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-lg">
          <button className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#111827] hover:bg-[#FFF7ED]" type="button" onClick={() => { setOpen(false); void onPdf() }}>Export PDF</button>
          <button className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#111827] hover:bg-[#FFF7ED]" type="button" onClick={() => { setOpen(false); void onExcel() }}>Export Excel</button>
        </div>
      ) : null}
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
  icon: typeof Handshake
  title: string
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E5E7EB] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#FED7AA] bg-[#FFF7ED] text-[#F97316]">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-heading text-base font-bold text-[#111827]">{title}</h3>
            <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-[#E5E7EB] bg-[#FFFDF8] p-4">
      <p className="text-sm font-semibold text-[#64748B]">{label}</p>
      <p className="mt-3 font-heading text-2xl font-bold text-[#111827]">{value}</p>
    </article>
  )
}

function MiniStats({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <div className="grid gap-2">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#FFFDF8] p-3">
          <span className="text-sm font-semibold text-[#64748B]">{label}</span>
          <span className="text-sm font-bold text-[#111827]">{value}</span>
        </div>
      ))}
    </div>
  )
}

function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">
            {columns.map((column) => (
              <th key={column} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 last:pr-0">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ActionButtons({
  onDelete,
  onEdit,
  onStatus,
  onView,
}: {
  onDelete: () => void
  onEdit: () => void
  onStatus: () => void
  onView: () => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <IconButton label="View Sponsor" onClick={onView}><Eye className="size-4" /></IconButton>
      <IconButton label="Edit Sponsor" onClick={onEdit}><Pencil className="size-4" /></IconButton>
      <IconButton label="Update Status Sponsor" onClick={onStatus}><Activity className="size-4" /></IconButton>
      <IconButton label="Delete Sponsor" danger onClick={onDelete}><Trash2 className="size-4" /></IconButton>
    </div>
  )
}

function IconButton({ children, danger, label, onClick }: { children: ReactNode; danger?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "grid size-8 place-items-center rounded-lg border bg-white transition hover:bg-[#FFF7ED]",
        danger ? "border-[#FECACA] text-[#DC2626]" : "border-[#E5E7EB] text-[#64748B]",
      )}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function AnnouncementModal({ onClose, onSubmit, open }: { onClose: () => void; onSubmit: (formData: FormData, publish: boolean) => void; open: boolean }) {
  return (
    <FormDialog description="Buat pengumuman untuk panitia, sponsor, peserta, atau publik." open={open} title="Buat Pengumuman" onClose={onClose}>
      <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget), false) }}>
        <Field label="Judul"><Input className="bg-white" name="title" /></Field>
        <Field label="Kategori"><Input className="bg-white" name="category" placeholder="Sponsor / Publikasi / Event" /></Field>
        <Field label="Isi Pengumuman"><Textarea className="bg-white" name="body" /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Target"><NativeSelect name="target" options={["Internal Panitia", "Sponsor", "Peserta", "Publik"]} /></Field>
          <Field label="Prioritas"><NativeSelect name="priority" options={["Rendah", "Sedang", "Tinggi"]} /></Field>
          <Field label="Status"><NativeSelect name="status" options={["Draft", "Publish"]} /></Field>
        </div>
        <DialogFooter className="mcs-dialog-footer bg-[#F8F9FB]">
          <Button type="submit" variant="outline" className="bg-white text-[#111827] hover:text-[#111827]">Simpan Draft</Button>
          <Button type="button" className="bg-[#F97316] text-white hover:bg-[#EA580C]" onClick={(event) => {
            const form = event.currentTarget.form
            if (form) onSubmit(new FormData(form), true)
          }}>Publikasikan</Button>
        </DialogFooter>
      </form>
    </FormDialog>
  )
}

function ProposalModal({ onClose, onSubmit, open, sponsors }: { onClose: () => void; onSubmit: (formData: FormData) => void; open: boolean; sponsors: Sponsor[] }) {
  return (
    <FormDialog description="Upload MOU PDF dan masukkan ke tracking sponsor." open={open} title="Upload MOU" onClose={onClose}>
      <form className="grid gap-4" onSubmit={(event) => submitForm(event, onSubmit)}>
        <Field label="Nama Sponsor"><NativeSelect name="sponsorId" options={sponsors.map((sponsor) => sponsor.name)} values={sponsors.map((sponsor) => sponsor.id)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Jenis MOU"><NativeSelect name="type" options={["Gold", "Silver", "Bronze", "Custom"]} /></Field>
          <Field label="Tanggal Kirim"><Input className="bg-white" name="sentDate" type="date" /></Field>
        </div>
        <Field label="Upload MOU PDF"><Input accept="application/pdf,.pdf" className="bg-white" name="file" type="file" /></Field>
        <Field label="Catatan"><Textarea className="bg-white" name="notes" /></Field>
        <DialogFooter className="mcs-dialog-footer bg-[#F8F9FB]">
          <Button type="submit" className="bg-[#F97316] text-white hover:bg-[#EA580C]">Kirim MOU</Button>
        </DialogFooter>
      </form>
    </FormDialog>
  )
}

function SponsorModal({ onClose, onSubmit, open, sponsor }: { onClose: () => void; onSubmit: (formData: FormData) => void; open: boolean; sponsor?: Sponsor | null }) {
  return (
    <FormDialog description="Data tersimpan ke state lokal Sponsor Management Center." open={open} title={sponsor ? "Edit Sponsor" : "Tambah Sponsor"} onClose={onClose}>
      <form className="grid gap-4" onSubmit={(event) => submitForm(event, onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Sponsor"><Input className="bg-white" defaultValue={sponsor?.name} name="name" /></Field>
          <Field label="PIC Sponsor"><Input className="bg-white" defaultValue={sponsor?.pic} name="pic" /></Field>
          <Field label="Nomor HP"><Input className="bg-white" defaultValue={sponsor?.contact} name="contact" /></Field>
          <Field label="Email"><Input className="bg-white" defaultValue={sponsor?.email} name="email" type="email" /></Field>
          <Field label="Kategori"><NativeSelect name="category" options={["Cash", "Product", "Media Partner"]} defaultValue={sponsor?.category} /></Field>
          <Field label="Nilai Sponsor"><Input className="bg-white" defaultValue={sponsor?.value ?? 0} min={0} name="value" type="number" /></Field>
          <Field label="Status Awal"><NativeSelect name="status" options={["Prospect", "Follow Up", "Proposal Dikirim"]} defaultValue={sponsor?.status} /></Field>
        </div>
        <Field label="Benefit Sponsor"><Textarea className="bg-white" defaultValue={sponsor?.benefitText} name="benefitText" /></Field>
        <div className="grid gap-2 sm:grid-cols-3">
          {benefitNames.map((benefit) => (
            <label key={benefit} className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm font-semibold text-[#111827]">
              <input defaultChecked={sponsor?.benefits[benefit]} name={benefit} type="checkbox" />
              {benefit}
            </label>
          ))}
        </div>
        <Field label="Catatan"><Textarea className="bg-white" defaultValue={sponsor?.notes} name="notes" /></Field>
        <DialogFooter className="mcs-dialog-footer bg-[#F8F9FB]">
          <Button type="submit" className="bg-[#F97316] text-white hover:bg-[#EA580C]">Simpan Sponsor</Button>
        </DialogFooter>
      </form>
    </FormDialog>
  )
}

function PublicationModal({ onClose, onSubmit, open, user }: { onClose: () => void; onSubmit: (formData: FormData) => void; open: boolean; user: UserDTO }) {
  return (
    <FormDialog description="Simpan jadwal publikasi ke kalender Humas." open={open} title="Jadwal Publikasi" onClose={onClose}>
      <form className="grid gap-4" onSubmit={(event) => submitForm(event, onSubmit)}>
        <Field label="Nama Konten"><Input className="bg-white" name="name" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Platform"><NativeSelect name="platform" options={["Instagram Feed", "Instagram Story", "TikTok", "Website"]} /></Field>
          <Field label="Tanggal"><Input className="bg-white" name="date" type="date" /></Field>
          <Field label="Jam"><Input className="bg-white" name="time" type="time" /></Field>
          <Field label="PIC"><Input className="bg-white" defaultValue={user.displayName} name="pic" /></Field>
          <Field label="Status"><NativeSelect name="status" options={["Draft", "Scheduled", "Published"]} /></Field>
        </div>
        <DialogFooter className="mcs-dialog-footer bg-[#F8F9FB]">
          <Button type="submit" className="bg-[#F97316] text-white hover:bg-[#EA580C]">Simpan Jadwal</Button>
        </DialogFooter>
      </form>
    </FormDialog>
  )
}

function FollowUpModal({ onClose, onSubmit, open, sponsors, user }: { onClose: () => void; onSubmit: (formData: FormData) => void; open: boolean; sponsors: Sponsor[]; user: UserDTO }) {
  return (
    <FormDialog description="Tambah follow up sponsor dan update status otomatis." open={open} title="Tambah Follow Up" onClose={onClose}>
      <form className="grid gap-4" onSubmit={(event) => submitForm(event, onSubmit)}>
        <Field label="Sponsor"><NativeSelect name="sponsorId" options={sponsors.map((sponsor) => sponsor.name)} values={sponsors.map((sponsor) => sponsor.id)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Last Contact"><Input className="bg-white" defaultValue={todayIso()} name="lastContact" type="date" /></Field>
          <Field label="Next Follow Up"><Input className="bg-white" name="nextFollowUp" type="date" /></Field>
          <Field label="PIC"><Input className="bg-white" defaultValue={user.displayName} name="pic" /></Field>
          <Field label="Status"><NativeSelect name="status" options={sponsorStatuses} /></Field>
        </div>
        <Field label="Catatan"><Textarea className="bg-white" name="notes" /></Field>
        <DialogFooter className="mcs-dialog-footer bg-[#F8F9FB]">
          <Button type="submit" className="bg-[#F97316] text-white hover:bg-[#EA580C]">Tambah Follow Up</Button>
        </DialogFooter>
      </form>
    </FormDialog>
  )
}

function SponsorDetailModal({ logs, onClose, open, sponsor }: { logs: ActivityLog[]; onClose: () => void; open: boolean; sponsor: Sponsor | null }) {
  return (
    <FormDialog description="Detail sponsor dan riwayat aktivitas terkait." open={open} title="Detail Sponsor" onClose={onClose}>
      {sponsor ? (
        <div className="grid gap-4">
          <MiniStats
            items={[
              ["Nama Sponsor", sponsor.name],
              ["PIC", sponsor.pic],
              ["Kontak", sponsor.contact || "Coming Soon"],
              ["Email", sponsor.email || "Coming Soon"],
              ["Kategori", sponsor.category],
              ["Value Sponsor", formatCurrency(sponsor.value)],
              ["Status", sponsor.status],
              ["Catatan Follow Up", sponsor.notes || "Coming Soon"],
            ]}
          />
          <div>
            <p className="mb-2 text-sm font-bold text-[#111827]">Benefit</p>
            <div className="flex flex-wrap gap-2">
              {benefitNames.map((benefit) => <StatusPill key={benefit} tone={sponsor.benefits[benefit] ? "success" : "neutral"}>{benefit}</StatusPill>)}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-[#111827]">Riwayat Aktivitas</p>
            <div className="grid gap-2">
              {logs.filter((log) => log.message.toLowerCase().includes(sponsor.name.toLowerCase())).slice(0, 5).map((log) => (
                <div key={log.id} className="rounded-xl border border-[#E5E7EB] p-3 text-sm font-semibold text-[#111827]">{log.time} - {log.message}</div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </FormDialog>
  )
}

function StatusModal({ onClose, onSubmit, open, sponsor }: { onClose: () => void; onSubmit: (formData: FormData) => void; open: boolean; sponsor: Sponsor | null }) {
  return (
    <FormDialog description={sponsor ? `Update status ${sponsor.name}.` : "Update status sponsor."} open={open} title="Update Status Sponsor" onClose={onClose}>
      <form className="grid gap-4" onSubmit={(event) => submitForm(event, onSubmit)}>
        <Field label="Status"><NativeSelect name="status" options={sponsorStatuses} defaultValue={sponsor?.status} /></Field>
        <DialogFooter className="mcs-dialog-footer bg-[#F8F9FB]">
          <Button type="submit" className="bg-[#F97316] text-white hover:bg-[#EA580C]">Update Status Sponsor</Button>
        </DialogFooter>
      </form>
    </FormDialog>
  )
}

function BenefitModal({ benefit, onClose, onSubmit, open }: { benefit: BenefitRecord | null; onClose: () => void; onSubmit: (formData: FormData) => void; open: boolean }) {
  return (
    <FormDialog description={benefit ? `${benefit.sponsorName} / ${benefit.benefit}` : "Update benefit sponsor."} open={open} title="Update Benefit" onClose={onClose}>
      <form className="grid gap-4" onSubmit={(event) => submitForm(event, onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status"><NativeSelect name="status" options={benefitStatuses} defaultValue={benefit?.status} /></Field>
          <Field label="Tanggal"><Input className="bg-white" defaultValue={benefit?.date} name="date" type="date" /></Field>
          <Field label="PIC"><Input className="bg-white" defaultValue={benefit?.pic} name="pic" /></Field>
        </div>
        <DialogFooter className="mcs-dialog-footer bg-[#F8F9FB]">
          <Button type="submit" className="bg-[#F97316] text-white hover:bg-[#EA580C]">Update Benefit</Button>
        </DialogFooter>
      </form>
    </FormDialog>
  )
}

function FormDialog({ children, description, onClose, open, title }: { children: ReactNode; description: string; onClose: () => void; open: boolean; title: string }) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="mcs-dialog-panel max-h-[90vh] overflow-y-auto border-[#E5E7EB] bg-white text-[#111827] sm:max-w-3xl">
        <DialogHeader className="border-b border-[#E5E7EB] bg-white pb-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#111827]">
      <span>{label}</span>
      {children}
    </label>
  )
}

function NativeSelect({
  defaultValue,
  name,
  options,
  values,
}: {
  defaultValue?: string
  name: string
  options: readonly string[]
  values?: readonly string[]
}) {
  return (
    <select
      className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:border-[#F97316] focus:ring-3 focus:ring-[#F97316]/20"
      defaultValue={defaultValue}
      name={name}
    >
      {options.map((option, index) => (
        <option key={option} value={values?.[index] ?? option}>{option}</option>
      ))}
    </select>
  )
}

function StatusPill({ children, tone }: { children: ReactNode; tone: "danger" | "info" | "neutral" | "success" | "warning" }) {
  return (
    <span className={cn("inline-flex h-7 w-fit items-center rounded-lg border px-2.5 text-xs font-bold", statusClass(tone))}>
      {children}
    </span>
  )
}

const UsersIcon = Handshake

function submitForm(event: FormEvent<HTMLFormElement>, callback: (formData: FormData) => void) {
  event.preventDefault()
  callback(new FormData(event.currentTarget))
}

function getRequired(formData: FormData, key: string, message: string, onError: (message: string) => void) {
  const value = String(formData.get(key) || "").trim()
  if (!value) {
    onError(message)
    return ""
  }
  return value
}

function mapInitialSponsorStatus(status: string): SponsorStatus {
  if (status === "Confirmed") return "Deal"
  if (status === "Negotiation") return "Negosiasi"
  if (status === "Rejected") return "Tidak Jadi"
  if (status === "Waiting Response") return "Follow Up"
  return "Prospect"
}

function sponsorTone(status: SponsorStatus) {
  if (status === "Deal") return "success"
  if (status === "Tidak Jadi") return "danger"
  if (status === "Negosiasi" || status === "Proposal Dikirim") return "warning"
  if (status === "Follow Up") return "info"
  return "neutral"
}

function proposalTone(status: ProposalStatus) {
  if (status === "Deal") return "success"
  if (status === "Ditolak") return "danger"
  if (status === "Negosiasi" || status === "Review") return "warning"
  if (status === "Dikirim") return "info"
  return "neutral"
}

function benefitTone(status: BenefitStatus) {
  if (status === "Done") return "success"
  if (status === "In Progress") return "info"
  return "neutral"
}

function statusClass(tone: "danger" | "info" | "neutral" | "success" | "warning") {
  if (tone === "success") return "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
  if (tone === "danger") return "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
  if (tone === "info") return "border-[#BAE6FD] bg-[#F0F9FF] text-[#0369A1]"
  if (tone === "warning") return "border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C]"
  return "border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]"
}

function nextProposalStatus(status: ProposalStatus): ProposalStatus {
  const index = proposalStatuses.indexOf(status)
  return proposalStatuses[Math.min(index + 1, proposalStatuses.length - 1)] ?? status
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date)
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    currency: "IDR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value)
}

function addPdfPage(doc: import("jspdf").jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.addPage()
  doc.setFillColor(8, 28, 58)
  doc.rect(0, 0, pageWidth, 86, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text(title, 40, 48)
  doc.setFillColor(249, 115, 22)
  doc.roundedRect(pageWidth - 146, 24, 106, 38, 10, 10, "F")
  doc.setFontSize(12)
  doc.text("MCS 1", pageWidth - 106, 48)
}

async function loadImageAsDataUrl(src: string) {
  try {
    const response = await fetch(src)
    const blob = await response.blob()

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return ""
  }
}
