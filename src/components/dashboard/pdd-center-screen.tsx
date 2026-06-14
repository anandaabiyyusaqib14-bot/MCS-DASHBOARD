"use client"

import Image from "next/image"
import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react"
import {
  Camera,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileImage,
  FileText,
  FileType,
  FolderOpen,
  ImagePlus,
  PenLine,
  PlayCircle,
  Plus,
  RotateCcw,
  Trash2,
  UploadCloud,
  Video,
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
import { officialCommitteeMembers } from "@/data/mcs-panitia"
import { brandAssets, event } from "@/data/mcs"
import { cn } from "@/lib/utils"

type AssetStatus = "Belum Mulai" | "Sedang Dikerjakan" | "Revisi" | "Menunggu Approval" | "Selesai"
type ApprovalStatus = "Belum Dicek" | "Revisi" | "Disetujui"
type DocumentationStatus = "Belum Upload" | "Sedang Upload" | "Selesai"
type PreviewKind = "image" | "pdf"
type DocumentationKind = "photos" | "videos" | "aftermovie" | "albums"
type ExportMenu = "closed" | "open"

type PddAsset = {
  approval: ApprovalStatus
  canvaUrl: string
  category: string
  deadline: string
  driveUrl: string
  id: string
  name: string
  pic: string
  previewKind: PreviewKind
  previewName: string
  previewUrl: string
  progress: number
  revisionNote: string
  reviewer: string
  status: AssetStatus
}

type AssetFormState = Omit<PddAsset, "id">

type PddActivity = {
  id: string
  message: string
  time: string
}

type MediaItem = {
  id: string
  name: string
  type: "image" | "video"
  url: string
}

type AlbumItem = {
  id: string
  name: string
  items: MediaItem[]
}

type DocumentationState = {
  aftermovieStatus: DocumentationStatus
  aftermovieUrl: string
  albums: AlbumItem[]
  photos: MediaItem[]
  videos: MediaItem[]
}

const pddMembers = officialCommitteeMembers
  .filter((member) => member.division === "Sie Dokumentasi")
  .map((member) => member.name)
const reviewers = ["Ketua Pelaksana", "Pembina OSIS", "Super Admin"]
const assetCategories = [
  "Poster",
  "Feed Instagram",
  "Story Instagram",
  "Banner",
  "Twibbon",
  "Sertifikat",
  "Video",
  "Motion Graphic",
  "Template",
  "Dokumentasi Hari H",
]
const assetStatuses: AssetStatus[] = ["Belum Mulai", "Sedang Dikerjakan", "Revisi", "Menunggu Approval", "Selesai"]
const approvalStatuses: ApprovalStatus[] = ["Belum Dicek", "Revisi", "Disetujui"]
const progressSteps = [0, 25, 50, 75, 100]

const initialAssets: PddAsset[] = []

const initialActivities: PddActivity[] = []

const emptyAssetForm: AssetFormState = {
  approval: "Belum Dicek",
  canvaUrl: "",
  category: "Poster",
  deadline: todayInput(),
  driveUrl: "",
  name: "",
  pic: pddMembers[0] ?? "",
  previewKind: "image",
  previewName: "",
  previewUrl: "",
  progress: 0,
  revisionNote: "",
  reviewer: reviewers[0],
  status: "Belum Mulai",
}

export function PddCenterScreen() {
  const [activities, setActivities] = useState<PddActivity[]>(initialActivities)
  const [assets, setAssets] = useState<PddAsset[]>(initialAssets)
  const [documentation, setDocumentation] = useState<DocumentationState>({
    aftermovieStatus: "Belum Upload",
    aftermovieUrl: "",
    albums: [],
    photos: [],
    videos: [],
  })
  const [documentationModal, setDocumentationModal] = useState<DocumentationKind | null>(null)
  const [editingAsset, setEditingAsset] = useState<PddAsset | null>(null)
  const [exportMenu, setExportMenu] = useState<ExportMenu>("closed")
  const [selectedAsset, setSelectedAsset] = useState<PddAsset | null>(null)
  const [toast, setToast] = useState("")
  const [updateAsset, setUpdateAsset] = useState<PddAsset | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [headerUpdateOpen, setHeaderUpdateOpen] = useState(false)

  const stats = useMemo(() => getStats(assets), [assets])
  const docStats = useMemo(() => getDocumentationStats(documentation), [documentation])
  const timeline = useMemo(
    () => [...assets].sort((left, right) => left.deadline.localeCompare(right.deadline)),
    [assets],
  )

  function pushActivity(message: string) {
    setActivities((current) => [createActivity(message), ...current].slice(0, 12))
  }

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(""), 2800)
  }

  function addAsset(values: AssetFormState) {
    const asset = createAsset(values)
    setAssets((current) => [asset, ...current])
    pushActivity(`${firstName(asset.pic)} menambahkan ${asset.name}.`)
    setAddOpen(false)
    showToast(`${asset.name} berhasil ditambahkan.`)
  }

  function saveAsset(assetId: string, values: AssetFormState) {
    let updatedName = values.name
    let updatedPic = values.pic
    setAssets((current) =>
      current.map((asset) => {
        if (asset.id !== assetId) return asset
        updatedName = values.name
        updatedPic = values.pic
        return { ...asset, ...values }
      }),
    )
    setEditingAsset(null)
    pushActivity(`${firstName(updatedPic)} memperbarui ${updatedName}.`)
    showToast(`${updatedName} berhasil diperbarui.`)
  }

  function saveProgress(assetId: string, values: Pick<AssetFormState, "approval" | "previewKind" | "previewName" | "previewUrl" | "progress" | "revisionNote" | "status">) {
    let updatedName = ""
    let updatedPic = ""
    setAssets((current) =>
      current.map((asset) => {
        if (asset.id !== assetId) return asset
        updatedName = asset.name
        updatedPic = asset.pic
        return { ...asset, ...values }
      }),
    )
    setUpdateAsset(null)
    setHeaderUpdateOpen(false)
    pushActivity(`${firstName(updatedPic)} update progress ${updatedName} menjadi ${values.progress}%.`)
    showToast(`Progress ${updatedName} berhasil diperbarui.`)
  }

  function finishAsset(asset: PddAsset) {
    const confirmed = window.confirm("Apakah asset sudah final?")
    if (!confirmed) return
    setAssets((current) =>
      current.map((item) =>
        item.id === asset.id ? { ...item, approval: "Disetujui", progress: 100, status: "Selesai" } : item,
      ),
    )
    pushActivity(`${firstName(asset.pic)} menyelesaikan ${asset.name}.`)
    showToast(`${asset.name} ditandai selesai.`)
  }

  function openExternal(url: string, label: string) {
    if (!url.trim()) {
      showToast(`Link ${label} belum tersedia.`)
      return
    }
    window.open(url, "_blank", "noopener,noreferrer")
    showToast(`Membuka link ${label}.`)
  }

  async function exportPdf() {
    try {
      const { jsPDF } = await import("jspdf")
      const autoTableModule = await import("jspdf-autotable")
      const autoTable = autoTableModule.default ?? autoTableModule.autoTable
      const doc = new jsPDF({ unit: "pt", format: "a4" })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const exportDate = formatExportDate(new Date())

      doc.setFillColor(255, 253, 248)
      doc.rect(0, 0, pageWidth, pageHeight, "F")
      doc.setFillColor(249, 115, 22)
      doc.roundedRect(40, 42, pageWidth - 80, 150, 14, 14, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(24)
      doc.text("Melati Championship Series 1", 64, 86)
      doc.setFontSize(16)
      doc.text("Laporan PDD Premium", 64, 116)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(`${event.theme} / ${event.organizer}`, 64, 140, { maxWidth: pageWidth - 128 })
      doc.text(`Tanggal Export: ${exportDate}`, 64, 162)

      const logos = await Promise.all(brandAssets.map((asset) => loadImageAsDataUrl(asset.src)))
      logos.forEach((logo, index) => {
        const x = pageWidth - 218 + index * 54
        doc.setFillColor(255, 255, 255)
        doc.roundedRect(x, 78, 42, 42, 8, 8, "F")
        if (logo) doc.addImage(logo, "PNG", x + 6, 84, 30, 30, undefined, "FAST")
      })

      autoTable(doc, {
        body: [
          ["Total Asset", stats.total],
          ["Asset Selesai", stats.completed],
          ["Asset Revisi", stats.revision],
          ["Approval", stats.waitingApproval],
          ["Progress Keseluruhan", `${stats.overallProgress}%`],
        ],
        head: [["Ringkasan Statistik", "Nilai"]],
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        margin: { left: 40, right: 40, top: 234 },
        styles: { cellPadding: 9, fontSize: 10, lineColor: [229, 231, 235], lineWidth: 0.5 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
      })

      doc.addPage()
      addPdfHeader(doc, "Daftar Asset")
      autoTable(doc, {
        body: assets.map((asset) => [asset.name, asset.pic, asset.category, `${asset.progress}%`, asset.status, asset.approval, formatDate(asset.deadline)]),
        head: [["Nama Asset", "PIC", "Kategori", "Progress", "Status", "Approval", "Deadline"]],
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        margin: { left: 36, right: 36, top: 112 },
        styles: { cellPadding: 7, fontSize: 8.5, lineColor: [229, 231, 235], lineWidth: 0.5 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
      })

      doc.addPage()
      addPdfHeader(doc, "Thumbnail Preview")
      let y = 116
      assets.forEach((asset, index) => {
        const column = index % 2
        const x = column === 0 ? 40 : 310
        if (index > 0 && index % 8 === 0) {
          doc.addPage()
          addPdfHeader(doc, "Thumbnail Preview")
          y = 116
        }
        if (index > 0 && index % 2 === 0) y += 154
        doc.setDrawColor(229, 231, 235)
        doc.roundedRect(x, y, 230, 118, 10, 10)
        doc.setTextColor(17, 24, 39)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.text(asset.name, x + 12, y + 22, { maxWidth: 202 })
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.text(asset.previewName || "No Data Available", x + 12, y + 42, { maxWidth: 202 })
        if (asset.previewUrl && asset.previewKind === "image") {
          doc.addImage(asset.previewUrl, "PNG", x + 12, y + 54, 70, 48, undefined, "FAST")
        } else {
          doc.setFillColor(255, 247, 237)
          doc.roundedRect(x + 12, y + 54, 70, 48, 8, 8, "F")
          doc.setTextColor(249, 115, 22)
          doc.setFont("helvetica", "bold")
          doc.text(asset.previewKind === "pdf" ? "PDF" : "IMAGE", x + 30, y + 82)
        }
      })

      doc.addPage()
      addPdfHeader(doc, "Timeline Produksi")
      autoTable(doc, {
        body: timeline.map((asset) => [asset.name, asset.pic, formatDate(asset.deadline), `${asset.progress}%`, asset.status]),
        head: [["Nama Asset", "PIC", "Deadline", "Progress", "Status"]],
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        margin: { left: 40, right: 40, top: 112 },
        styles: { cellPadding: 8, fontSize: 9, lineColor: [229, 231, 235], lineWidth: 0.5 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
      })

      doc.addPage()
      addPdfHeader(doc, "Aktivitas Terbaru")
      autoTable(doc, {
        body: activities.map((activity) => [activity.time, activity.message]),
        head: [["Waktu", "Aktivitas"]],
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        margin: { left: 40, right: 40, top: 112 },
        styles: { cellPadding: 8, fontSize: 9, lineColor: [229, 231, 235], lineWidth: 0.5 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
      })

      for (let page = 1; page <= doc.getNumberOfPages(); page += 1) {
        doc.setPage(page)
        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        doc.text("Exported by MCS Management System", 40, doc.internal.pageSize.getHeight() - 28)
        doc.text(exportDate, pageWidth - 124, doc.internal.pageSize.getHeight() - 28)
      }

      doc.save("MCS1_Laporan_PDD.pdf")
      pushActivity("Super Admin mengekspor laporan PDD format PDF.")
      setExportMenu("closed")
      showToast("MCS1_Laporan_PDD.pdf berhasil dibuat.")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Laporan PDD gagal dibuat.")
    }
  }

  async function exportExcel() {
    try {
      const XLSX = await import("xlsx-js-style")
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(assets.map((asset) => ({
        "Nama Asset": asset.name,
        PIC: asset.pic,
        Kategori: asset.category,
        Progress: `${asset.progress}%`,
        Status: asset.status,
        Approval: asset.approval,
        Deadline: asset.deadline,
        "Link Canva": asset.canvaUrl || "No Data Available",
        "Link Drive": asset.driveUrl || "No Data Available",
        Revisi: asset.revisionNote || "No Data Available",
      }))), "Daftar Asset")
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(timeline.map((asset) => ({
        Asset: asset.name,
        PIC: asset.pic,
        Deadline: asset.deadline,
        Progress: asset.progress,
        Status: asset.status,
      }))), "Timeline")
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(activities.map((activity) => ({
        Waktu: activity.time,
        Aktivitas: activity.message,
      }))), "Aktivitas")
      XLSX.writeFile(workbook, "MCS1_Laporan_PDD.xlsx")
      pushActivity("Super Admin mengekspor laporan PDD format Excel.")
      setExportMenu("closed")
      showToast("MCS1_Laporan_PDD.xlsx berhasil dibuat.")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Laporan Excel gagal dibuat.")
    }
  }

  function addPhoto(item: MediaItem) {
    setDocumentation((current) => ({ ...current, photos: [item, ...current.photos] }))
    pushActivity(`PDD upload foto ${item.name}.`)
    showToast("Foto berhasil diupload.")
  }

  function addVideo(item: MediaItem) {
    setDocumentation((current) => ({ ...current, videos: [item, ...current.videos] }))
    pushActivity(`PDD upload video ${item.name}.`)
    showToast("Video berhasil diupload.")
  }

  function deleteMedia(kind: "photos" | "videos", itemId: string) {
    setDocumentation((current) => ({ ...current, [kind]: current[kind].filter((item) => item.id !== itemId) }))
    pushActivity(`PDD menghapus ${kind === "photos" ? "foto" : "video"} dokumentasi.`)
    showToast("Media berhasil dihapus.")
  }

  function saveAftermovie(url: string, status: DocumentationStatus) {
    setDocumentation((current) => ({ ...current, aftermovieStatus: status, aftermovieUrl: url }))
    pushActivity("PDD memperbarui aftermovie.")
    showToast("Aftermovie berhasil diperbarui.")
  }

  function addAlbum(album: AlbumItem) {
    setDocumentation((current) => ({ ...current, albums: [album, ...current.albums] }))
    pushActivity(`PDD membuat album ${album.name}.`)
    showToast("Album berhasil dibuat.")
  }

  return (
    <div className="grid gap-6 bg-[#FFFDF8]">
      <section className="overflow-visible rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-[#FED7AA] bg-[#F97316] text-white shadow-[3px_3px_0_rgba(249,115,22,0.18)]">
              <Camera className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-heading text-2xl font-bold tracking-normal text-[#111827]">Workspace PDD</h2>
              <p className="mt-1 text-sm font-bold text-[#F97316]">Publikasi, Desain & Dokumentasi</p>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#6B7280]">
                Kelola progress desain, approval publikasi, tautan kerja, dan dokumentasi Hari H MCS 1.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button type="button" className="h-9 rounded-lg bg-[#F97316] px-3 text-sm font-semibold text-white hover:bg-[#EA580C]" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Tambah Asset
            </Button>
            <Button type="button" variant="outline" className="h-9 rounded-lg border-[#F97316] bg-white px-3 text-sm font-semibold text-[#F97316] hover:bg-[#FFF7ED]" onClick={() => setHeaderUpdateOpen(true)}>
              <PenLine className="size-4" aria-hidden="true" />
              Update Progress
            </Button>
            <div className="relative">
              <Button type="button" className="h-9 rounded-lg bg-[#F97316] px-3 text-sm font-semibold text-white hover:bg-[#EA580C]" onClick={() => setExportMenu((value) => (value === "open" ? "closed" : "open"))}>
                <Download className="size-4" aria-hidden="true" />
                Ekspor Laporan PDD
              </Button>
              {exportMenu === "open" ? (
                <div className="absolute right-0 top-11 z-20 grid w-40 gap-1 rounded-lg border border-[#E5E7EB] bg-white p-2 shadow-[0_18px_44px_rgba(15,23,42,0.16)]">
                  <button className="rounded-md px-3 py-2 text-left text-sm font-bold text-[#111827] hover:bg-[#FFF7ED]" onClick={exportPdf} type="button">PDF</button>
                  <button className="rounded-md px-3 py-2 text-left text-sm font-bold text-[#111827] hover:bg-[#FFF7ED]" onClick={exportExcel} type="button">Excel</button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {toast ? <p className="mt-4 text-sm font-semibold text-[#111827]">{toast}</p> : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Total Asset" value={stats.total} description="Seluruh kebutuhan desain." tone="neutral" />
        <MetricCard label="Asset Selesai" value={stats.completed} description="Final dan siap pakai." tone="success" />
        <MetricCard label="Asset Revisi" value={stats.revision} description="Butuh perbaikan." tone="danger" />
        <MetricCard label="Menunggu Approval" value={stats.waitingApproval} description="Dalam antrian review." tone="warning" />
        <MetricCard label="Terlambat" value={stats.overdue} description="Lewat deadline." tone="danger" />
        <MetricCard label="Progress Keseluruhan" value={`${stats.overallProgress}%`} description="Rata-rata progress." tone="info" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Jumlah Foto" value={docStats.photos} description="Foto dokumentasi." tone="info" />
        <MetricCard label="Jumlah Video" value={docStats.videos} description="Video dokumentasi." tone="info" />
        <MetricCard label="Jumlah Album" value={docStats.albums} description="Album dokumentasi." tone="neutral" />
        <MetricCard label="Jumlah Aftermovie" value={docStats.aftermovies} description="Aftermovie tersedia." tone="success" />
        <MetricCard label="Total Media" value={docStats.totalMedia} description="Gabungan foto/video." tone="warning" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => (
          <AssetCard
            asset={asset}
            key={asset.id}
            onDrive={() => openExternal(asset.driveUrl, "Drive")}
            onCanva={() => openExternal(asset.canvaUrl, "Canva")}
            onEdit={() => setEditingAsset(asset)}
            onFinish={() => finishAsset(asset)}
            onUpdate={() => setUpdateAsset(asset)}
            onView={() => setSelectedAsset(asset)}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <PanelHeader icon={Clock3} title="Timeline Produksi" description="Urutan asset berdasarkan deadline terdekat." />
          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">
                  {["Nama Asset", "PIC", "Deadline", "Progress", "Status"].map((heading) => (
                    <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeline.map((asset) => (
                  <tr key={asset.id}>
                    <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#111827]">{asset.name}</td>
                    <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{asset.pic}</td>
                    <td className="border-b border-[#F1F5F9] px-4 py-4 font-medium text-[#111827]">{formatDate(asset.deadline)}</td>
                    <td className="border-b border-[#F1F5F9] px-4 py-4"><ProgressBar value={asset.progress} /></td>
                    <td className="border-b border-[#F1F5F9] px-4 py-4"><StatusBadge label={asset.status} tone={assetStatusTone(asset.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <PanelHeader icon={RotateCcw} title="Aktivitas Terbaru" description="Log update progress dan approval PDD." />
          <div className="grid gap-3 p-5">
            {activities.map((activity) => (
              <div key={activity.id} className="rounded-lg border border-[#E5E7EB] bg-[#FFFDF8] p-3 text-sm font-semibold leading-6 text-[#111827]">
                <span className="block text-xs font-bold text-[#F97316]">{activity.time}</span>
                {activity.message}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <PanelHeader icon={Camera} title="Dokumentasi Hari H" description="Foto acara, video acara, aftermovie, album, dan status upload." />
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <DocumentationCard count={documentation.photos.length} icon={<Camera className="size-5" />} label="Foto Acara" onClick={() => setDocumentationModal("photos")} status={documentation.photos.length ? "Selesai" : "Belum Upload"} />
          <DocumentationCard count={documentation.videos.length} icon={<Video className="size-5" />} label="Video Acara" onClick={() => setDocumentationModal("videos")} status={documentation.videos.length ? "Selesai" : "Belum Upload"} />
          <DocumentationCard count={documentation.aftermovieUrl ? 1 : 0} icon={<PlayCircle className="size-5" />} label="Aftermovie" onClick={() => setDocumentationModal("aftermovie")} status={documentation.aftermovieStatus} />
          <DocumentationCard count={documentation.albums.length} icon={<FolderOpen className="size-5" />} label="Album Dokumentasi" onClick={() => setDocumentationModal("albums")} status={documentation.albums.length ? "Selesai" : "Belum Upload"} />
        </div>
      </section>

      <AssetFormDialog mode="add" onClose={() => setAddOpen(false)} onSubmit={addAsset} open={addOpen} />
      <AssetFormDialog asset={editingAsset} key={editingAsset?.id ?? "edit-asset"} mode="edit" onClose={() => setEditingAsset(null)} onSubmit={(values) => editingAsset && saveAsset(editingAsset.id, values)} open={Boolean(editingAsset)} />
      <AssetDetailDialog asset={selectedAsset} onClose={() => setSelectedAsset(null)} onEdit={(asset) => { setSelectedAsset(null); setEditingAsset(asset) }} />
      <ProgressDialog asset={updateAsset} key={updateAsset?.id ?? "update-asset"} onClose={() => setUpdateAsset(null)} onSubmit={(values) => updateAsset && saveProgress(updateAsset.id, values)} open={Boolean(updateAsset)} />
      <HeaderProgressDialog assets={assets} onClose={() => setHeaderUpdateOpen(false)} onSubmit={saveProgress} open={headerUpdateOpen} />
      <DocumentationDialog
        documentation={documentation}
        kind={documentationModal}
        onAddAlbum={addAlbum}
        onAddPhoto={addPhoto}
        onAddVideo={addVideo}
        onClose={() => setDocumentationModal(null)}
        onDeleteMedia={deleteMedia}
        onSaveAftermovie={saveAftermovie}
      />
    </div>
  )
}

function AssetFormDialog({ asset, mode, onClose, onSubmit, open }: { asset?: PddAsset | null; mode: "add" | "edit"; onClose: () => void; onSubmit: (values: AssetFormState) => void; open: boolean }) {
  const [form, setForm] = useState<AssetFormState>(assetToForm(asset))

  function reset(nextOpen: boolean) {
    if (!nextOpen) onClose()
    if (nextOpen) setForm(assetToForm(asset))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim()) return
    onSubmit({ ...form, name: form.name.trim(), progress: clampProgress(form.progress) })
    setForm(emptyAssetForm)
  }

  return (
    <Dialog onOpenChange={reset} open={open}>
      <DialogContent className="mcs-dialog-panel max-h-[90vh] overflow-y-auto border-[#E5E7EB] bg-white text-[#111827] sm:max-w-3xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Tambah Asset" : "Edit Asset"}</DialogTitle>
            <DialogDescription>Sistem manajemen progress desain dan publikasi PDD MCS 1.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nama Asset"><Input className="bg-white" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nama asset resmi" /></Field>
            <Field label="PIC"><NativeSelect options={pddMembers} value={form.pic} onChange={(pic) => setForm({ ...form, pic })} /></Field>
            <Field label="Kategori"><NativeSelect options={assetCategories} value={form.category} onChange={(category) => setForm({ ...form, category })} /></Field>
            <Field label="Deadline"><Input className="bg-white" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></Field>
            <Field label="Status"><NativeSelect options={assetStatuses} value={form.status} onChange={(status) => setForm({ ...form, status: status as AssetStatus })} /></Field>
            <Field label="Approval"><NativeSelect options={approvalStatuses} value={form.approval} onChange={(approval) => setForm({ ...form, approval: approval as ApprovalStatus })} /></Field>
            <Field label="Link Canva"><IconInput icon={<ImagePlus className="size-4" />} onChange={(canvaUrl) => setForm({ ...form, canvaUrl })} placeholder="https://canva.com/...." value={form.canvaUrl} /></Field>
            <Field label="Link Drive"><IconInput icon={<FolderOpen className="size-4" />} onChange={(driveUrl) => setForm({ ...form, driveUrl })} placeholder="https://drive.google.com/...." value={form.driveUrl} /></Field>
            <Field label="Upload Preview" className="sm:col-span-2"><PreviewUploader form={form} onChange={setForm} /></Field>
            <Field label="Progress" className="sm:col-span-2"><ProgressSlider value={form.progress} onChange={(progress) => setForm({ ...form, progress })} /></Field>
            <Field label="Catatan Revisi" className="sm:col-span-2"><Textarea className="min-h-24 bg-white" value={form.revisionNote} onChange={(event) => setForm({ ...form, revisionNote: event.target.value })} placeholder="Tuliskan catatan revisi resmi." /></Field>
          </div>
          <DialogFooter className="mcs-dialog-footer mt-5 bg-[#FFFDF8]">
            <Button type="button" variant="outline" onClick={onClose}>Tutup</Button>
            <Button type="submit" className="bg-[#F97316] text-white hover:bg-[#EA580C]">{mode === "add" ? "Simpan Asset" : "Simpan Perubahan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AssetDetailDialog({ asset, onClose, onEdit }: { asset: PddAsset | null; onClose: () => void; onEdit: (asset: PddAsset) => void }) {
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={Boolean(asset)}>
      <DialogContent className="mcs-dialog-panel max-h-[90vh] overflow-y-auto border-[#E5E7EB] bg-white text-[#111827] sm:max-w-2xl">
        {asset ? (
          <>
            <DialogHeader>
              <DialogTitle>Detail Asset</DialogTitle>
              <DialogDescription>{asset.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <PreviewBox asset={asset} large />
              <div className="grid gap-2 text-sm">
                <InfoRow label="Nama Asset" value={asset.name} />
                <InfoRow label="PIC" value={asset.pic} />
                <InfoRow label="Deadline" value={formatDate(asset.deadline)} />
                <InfoRow label="Progress" value={`${asset.progress}%`} />
                <InfoRow label="Approval" value={<StatusBadge label={asset.approval} tone={approvalStatusTone(asset.approval)} />} />
                <InfoRow label="Status" value={<StatusBadge label={asset.status} tone={assetStatusTone(asset.status)} />} />
                <InfoRow label="Catatan Revisi" value={asset.revisionNote || "No Data Available"} />
                <InfoRow label="Link Canva" value={asset.canvaUrl ? <a className="text-[#F97316] underline" href={asset.canvaUrl} target="_blank" rel="noreferrer">Buka Canva</a> : "No Data Available"} />
                <InfoRow label="Link Drive" value={asset.driveUrl ? <a className="text-[#F97316] underline" href={asset.driveUrl} target="_blank" rel="noreferrer">Buka Drive</a> : "No Data Available"} />
              </div>
            </div>
            <DialogFooter className="mcs-dialog-footer mt-5 bg-[#FFFDF8]">
              <Button type="button" variant="outline" onClick={onClose}>Tutup</Button>
              <Button type="button" className="bg-[#F97316] text-white hover:bg-[#EA580C]" onClick={() => onEdit(asset)}>Edit</Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function ProgressDialog({ asset, onClose, onSubmit, open }: { asset: PddAsset | null; onClose: () => void; onSubmit: (values: Pick<AssetFormState, "approval" | "previewKind" | "previewName" | "previewUrl" | "progress" | "revisionNote" | "status">) => void; open: boolean }) {
  const [form, setForm] = useState(assetToForm(asset))

  function sync(nextOpen: boolean) {
    if (!nextOpen) onClose()
    if (nextOpen) setForm(assetToForm(asset))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      approval: form.approval,
      previewKind: form.previewKind,
      previewName: form.previewName,
      previewUrl: form.previewUrl,
      progress: clampProgress(form.progress),
      revisionNote: form.revisionNote,
      status: form.status,
    })
  }

  return (
    <Dialog onOpenChange={sync} open={open}>
      <DialogContent className="mcs-dialog-panel max-h-[90vh] overflow-y-auto border-[#E5E7EB] bg-white text-[#111827] sm:max-w-xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>{asset?.name ?? "Pilih asset untuk memperbarui progress."}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-4">
            <Field label="Progress Slider"><ProgressSlider value={form.progress} onChange={(progress) => setForm({ ...form, progress })} /></Field>
            <Field label="Status"><NativeSelect options={assetStatuses} value={form.status} onChange={(status) => setForm({ ...form, status: status as AssetStatus })} /></Field>
            <Field label="Approval"><NativeSelect options={approvalStatuses} value={form.approval} onChange={(approval) => setForm({ ...form, approval: approval as ApprovalStatus })} /></Field>
            <Field label="Upload Revisi Terbaru"><PreviewUploader form={form} onChange={setForm} /></Field>
            <Field label="Catatan Update"><Textarea className="min-h-24 bg-white" value={form.revisionNote} onChange={(event) => setForm({ ...form, revisionNote: event.target.value })} placeholder="Catatan update progress." /></Field>
          </div>
          <DialogFooter className="mcs-dialog-footer mt-5 bg-[#FFFDF8]">
            <Button type="button" variant="outline" onClick={onClose}>Tutup</Button>
            <Button type="submit" className="bg-[#F97316] text-white hover:bg-[#EA580C]">Simpan Progress</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HeaderProgressDialog({ assets, onClose, onSubmit, open }: { assets: PddAsset[]; onClose: () => void; onSubmit: (assetId: string, values: Pick<AssetFormState, "approval" | "previewKind" | "previewName" | "previewUrl" | "progress" | "revisionNote" | "status">) => void; open: boolean }) {
  const [selectedId, setSelectedId] = useState(assets[0]?.id ?? "")
  const selectedAsset = assets.find((asset) => asset.id === selectedId) ?? assets[0] ?? null

  function submit(values: Pick<AssetFormState, "approval" | "previewKind" | "previewName" | "previewUrl" | "progress" | "revisionNote" | "status">) {
    if (!selectedAsset) return
    onSubmit(selectedAsset.id, values)
  }

  return (
    <Dialog onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); if (nextOpen) setSelectedId(assets[0]?.id ?? "") }} open={open}>
      <DialogContent className="mcs-dialog-panel max-h-[90vh] overflow-y-auto border-[#E5E7EB] bg-white text-[#111827] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Update Progress Asset</DialogTitle>
          <DialogDescription>Pilih salah satu asset lalu simpan perubahan progress.</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Field label="Pilih Asset"><NativeSelect options={assets.map((asset) => asset.id)} labels={Object.fromEntries(assets.map((asset) => [asset.id, asset.name]))} value={selectedAsset?.id ?? ""} onChange={setSelectedId} /></Field>
        </div>
        <ProgressInlineForm asset={selectedAsset} key={selectedAsset?.id ?? "header-progress"} onCancel={onClose} onSubmit={submit} />
      </DialogContent>
    </Dialog>
  )
}

function ProgressInlineForm({ asset, onCancel, onSubmit }: { asset: PddAsset | null; onCancel: () => void; onSubmit: (values: Pick<AssetFormState, "approval" | "previewKind" | "previewName" | "previewUrl" | "progress" | "revisionNote" | "status">) => void }) {
  const [form, setForm] = useState(assetToForm(asset))

  if (!asset) return <p className="text-sm font-semibold text-[#6B7280]">No Data Available</p>

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      approval: form.approval,
      previewKind: form.previewKind,
      previewName: form.previewName,
      previewUrl: form.previewUrl,
      progress: clampProgress(form.progress),
      revisionNote: form.revisionNote,
      status: form.status,
    })
  }

  return (
    <form className="mt-4 grid gap-4" onSubmit={submit}>
      <Field label="Progress Slider"><ProgressSlider value={form.progress} onChange={(progress) => setForm({ ...form, progress })} /></Field>
      <Field label="Status"><NativeSelect options={assetStatuses} value={form.status} onChange={(status) => setForm({ ...form, status: status as AssetStatus })} /></Field>
      <Field label="Approval"><NativeSelect options={approvalStatuses} value={form.approval} onChange={(approval) => setForm({ ...form, approval: approval as ApprovalStatus })} /></Field>
      <Field label="Upload Revisi Terbaru"><PreviewUploader form={form} onChange={setForm} /></Field>
      <Field label="Catatan Update"><Textarea className="min-h-24 bg-white" value={form.revisionNote} onChange={(event) => setForm({ ...form, revisionNote: event.target.value })} /></Field>
      <DialogFooter className="mcs-dialog-footer bg-[#FFFDF8]">
        <Button type="button" variant="outline" onClick={onCancel}>Tutup</Button>
        <Button type="submit" className="bg-[#F97316] text-white hover:bg-[#EA580C]">Simpan Progress</Button>
      </DialogFooter>
    </form>
  )
}

function DocumentationDialog({ documentation, kind, onAddAlbum, onAddPhoto, onAddVideo, onClose, onDeleteMedia, onSaveAftermovie }: { documentation: DocumentationState; kind: DocumentationKind | null; onAddAlbum: (album: AlbumItem) => void; onAddPhoto: (item: MediaItem) => void; onAddVideo: (item: MediaItem) => void; onClose: () => void; onDeleteMedia: (kind: "photos" | "videos", itemId: string) => void; onSaveAftermovie: (url: string, status: DocumentationStatus) => void }) {
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={Boolean(kind)}>
      <DialogContent className="mcs-dialog-panel max-h-[90vh] overflow-y-auto border-[#E5E7EB] bg-white text-[#111827] sm:max-w-3xl">
        {kind === "photos" ? <PhotoDocumentation photos={documentation.photos} onAdd={onAddPhoto} onDelete={(id) => onDeleteMedia("photos", id)} /> : null}
        {kind === "videos" ? <VideoDocumentation videos={documentation.videos} onAdd={onAddVideo} onDelete={(id) => onDeleteMedia("videos", id)} /> : null}
        {kind === "aftermovie" ? <AftermovieDocumentation documentation={documentation} onSave={onSaveAftermovie} /> : null}
        {kind === "albums" ? <AlbumDocumentation albums={documentation.albums} onAdd={onAddAlbum} /> : null}
        <DialogFooter className="mcs-dialog-footer mt-5 bg-[#FFFDF8]">
          <Button type="button" variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PhotoDocumentation({ onAdd, onDelete, photos }: { onAdd: (item: MediaItem) => void; onDelete: (id: string) => void; photos: MediaItem[] }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Foto Acara</DialogTitle>
        <DialogDescription>Upload foto, lihat preview gallery, dan hapus foto.</DialogDescription>
      </DialogHeader>
      <MediaUpload accept="image/*" label="Upload Foto" onAdd={(item) => onAdd({ ...item, type: "image" })} />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {photos.length ? photos.map((photo) => (
          <div key={photo.id} className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#FFFDF8]">
            <div className="relative aspect-[4/3] w-full">
              <Image alt={photo.name} className="object-cover" fill sizes="(min-width: 640px) 33vw, 100vw" src={photo.url} unoptimized />
            </div>
            <div className="flex items-center justify-between gap-2 p-2">
              <span className="truncate text-xs font-bold text-[#111827]">{photo.name}</span>
              <button className="grid size-8 place-items-center rounded-md bg-[#FEF2F2] text-[#B91C1C]" onClick={() => onDelete(photo.id)} type="button"><Trash2 className="size-4" /></button>
            </div>
          </div>
        )) : <EmptyMessage message="No Data Available" />}
      </div>
    </>
  )
}

function VideoDocumentation({ onAdd, onDelete, videos }: { onAdd: (item: MediaItem) => void; onDelete: (id: string) => void; videos: MediaItem[] }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Video Acara</DialogTitle>
        <DialogDescription>Upload video, preview video, dan hapus video.</DialogDescription>
      </DialogHeader>
      <MediaUpload accept="video/*" label="Upload Video" onAdd={(item) => onAdd({ ...item, type: "video" })} />
      <div className="mt-4 grid gap-3">
        {videos.length ? videos.map((video) => (
          <div key={video.id} className="rounded-lg border border-[#E5E7EB] bg-[#FFFDF8] p-3">
            <video className="aspect-video w-full rounded-md bg-black" controls src={video.url} />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-bold text-[#111827]">{video.name}</span>
              <button className="grid size-8 place-items-center rounded-md bg-[#FEF2F2] text-[#B91C1C]" onClick={() => onDelete(video.id)} type="button"><Trash2 className="size-4" /></button>
            </div>
          </div>
        )) : <EmptyMessage message="No Data Available" />}
      </div>
    </>
  )
}

function AftermovieDocumentation({ documentation, onSave }: { documentation: DocumentationState; onSave: (url: string, status: DocumentationStatus) => void }) {
  const [url, setUrl] = useState(documentation.aftermovieUrl)
  const [status, setStatus] = useState<DocumentationStatus>(documentation.aftermovieStatus)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Aftermovie</DialogTitle>
        <DialogDescription>Upload status publish, link YouTube, dan preview video.</DialogDescription>
      </DialogHeader>
      <div className="mt-4 grid gap-4">
        <Field label="Link YouTube"><IconInput icon={<PlayCircle className="size-4" />} onChange={setUrl} placeholder="https://youtube.com/...." value={url} /></Field>
        <Field label="Status Publish"><NativeSelect options={["Belum Upload", "Sedang Upload", "Selesai"]} value={status} onChange={(value) => setStatus(value as DocumentationStatus)} /></Field>
        {url ? <a className="rounded-lg border border-[#E5E7EB] bg-[#FFF7ED] p-4 text-sm font-bold text-[#F97316] underline" href={url} target="_blank" rel="noreferrer">Preview video aftermovie</a> : <EmptyMessage message="Link YouTube belum tersedia." />}
        <Button type="button" className="w-fit bg-[#F97316] text-white hover:bg-[#EA580C]" onClick={() => onSave(url, status)}>Simpan Aftermovie</Button>
      </div>
    </>
  )
}

function AlbumDocumentation({ albums, onAdd }: { albums: AlbumItem[]; onAdd: (album: AlbumItem) => void }) {
  const [name, setName] = useState("")

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    onAdd({ id: createId("album"), items: [], name: name.trim() })
    setName("")
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Album Dokumentasi</DialogTitle>
        <DialogDescription>Buat album dokumentasi untuk agenda resmi MCS 1.</DialogDescription>
      </DialogHeader>
      <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
        <Input className="bg-white" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama album resmi" />
        <Button type="submit" className="bg-[#F97316] text-white hover:bg-[#EA580C]"><Plus className="size-4" />Buat Album</Button>
      </form>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {albums.length ? albums.map((album) => (
          <div key={album.id} className="rounded-lg border border-[#E5E7EB] bg-[#FFFDF8] p-4">
            <h3 className="font-heading text-base font-bold text-[#111827]">{album.name}</h3>
            <p className="mt-2 text-sm font-semibold text-[#6B7280]">{album.items.length} media</p>
          </div>
        )) : <EmptyMessage message="No Data Available" />}
      </div>
    </>
  )
}

function MediaUpload({ accept, label, onAdd }: { accept: string; label: string; onAdd: (item: MediaItem) => void }) {
  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const url = await fileToDataUrl(file)
    onAdd({ id: createId("media"), name: file.name, type: file.type.startsWith("video/") ? "video" : "image", url })
    event.target.value = ""
  }

  return (
    <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-[#FDBA74] bg-[#FFF7ED] p-4 text-sm font-bold text-[#111827]">
      <span className="flex items-center gap-3"><UploadCloud className="size-5 text-[#F97316]" />{label}</span>
      <Input accept={accept} className="max-w-xs bg-white" onChange={handleChange} type="file" />
    </label>
  )
}

function AssetCard({ asset, onCanva, onDrive, onEdit, onFinish, onUpdate, onView }: { asset: PddAsset; onCanva: () => void; onDrive: () => void; onEdit: () => void; onFinish: () => void; onUpdate: () => void; onView: () => void }) {
  return (
    <article className={cn("overflow-hidden rounded-lg border bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)]", asset.status === "Selesai" ? "border-[#BBF7D0] ring-2 ring-[#22C55E]/15" : "border-[#E5E7EB]")}>
      <PreviewBox asset={asset} />
      <div className="grid gap-4 p-4">
        <div>
          <h3 className="font-heading text-lg font-bold text-[#111827]">{asset.name}</h3>
          <p className="mt-1 text-sm font-semibold text-[#6B7280]">PIC: {asset.pic}</p>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-[#6B7280]">Progress</span>
            <span className="font-bold tabular-nums text-[#111827]">{asset.progress}%</span>
          </div>
          <ProgressBar value={asset.progress} />
        </div>
        <div className="grid gap-2 text-sm">
          <InfoRow label="Status" value={<StatusBadge label={asset.status} tone={assetStatusTone(asset.status)} />} />
          <InfoRow label="Approval" value={<StatusBadge label={asset.approval} tone={approvalStatusTone(asset.approval)} />} />
          <InfoRow label="Deadline" value={formatDate(asset.deadline)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <CardButton icon={<Eye className="size-4" />} label="Lihat" onClick={onView} />
          <CardButton icon={<PenLine className="size-4" />} label="Edit" onClick={onEdit} />
          <CardButton icon={<UploadCloud className="size-4" />} label="Update Progress" onClick={onUpdate} />
          <CardButton icon={<CheckCircle2 className="size-4" />} label="Selesai" onClick={onFinish} />
          <CardButton icon={<ImagePlus className="size-4" />} label="Canva" onClick={onCanva} variant="outline" />
          <CardButton icon={<FolderOpen className="size-4" />} label="Drive" onClick={onDrive} variant="outline" />
        </div>
      </div>
    </article>
  )
}

function PreviewBox({ asset, large = false }: { asset: PddAsset; large?: boolean }) {
  return (
    <div className={cn("relative grid place-items-center bg-[#FFF7ED]", large ? "min-h-80 rounded-lg border border-[#E5E7EB]" : "aspect-[16/10]")}>
      {asset.previewUrl && asset.previewKind === "image" ? (
        <Image alt={asset.name} className="object-cover" fill sizes={large ? "768px" : "(min-width: 1024px) 33vw, 100vw"} src={asset.previewUrl} unoptimized />
      ) : asset.previewKind === "pdf" ? (
        <div className="grid gap-2 text-center text-[#F97316]">
          <FileType className="mx-auto size-12" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.12em]">{asset.previewName || "PDF Preview"}</span>
        </div>
      ) : (
        <div className="grid gap-2 text-center text-[#F97316]">
          <FileImage className="mx-auto size-12" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.12em]">{asset.previewName || "Preview Design"}</span>
        </div>
      )}
      <span className="absolute right-3 top-3 rounded-md border border-[#FED7AA] bg-white px-2.5 py-1 text-xs font-bold text-[#F97316]">
        {asset.category}
      </span>
    </div>
  )
}

function DocumentationCard({ count, icon, label, onClick, status }: { count: number; icon: ReactNode; label: string; onClick: () => void; status: DocumentationStatus }) {
  return (
    <button className="rounded-lg border border-[#E5E7EB] bg-[#FFFDF8] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.1)]" onClick={onClick} type="button">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-[#F97316] text-white">{icon}</span>
        <StatusBadge label={status} tone={documentationStatusTone(status)} />
      </div>
      <h3 className="mt-4 font-heading text-base font-bold text-[#111827]">{label}</h3>
      <p className="mt-2 text-sm font-semibold text-[#6B7280]">{count} item</p>
    </button>
  )
}

function MetricCard({ description, label, tone, value }: { description: string; label: string; tone: BadgeTone; value: number | string }) {
  return (
    <article className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-semibold text-[#6B7280]">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-heading text-2xl font-bold leading-7 tracking-normal text-[#111827]">{value}</p>
        <span className={cn("mb-1 size-2.5 shrink-0 rounded-full", dotClass(tone))} />
      </div>
      <p className="mt-3 text-xs font-medium leading-5 text-[#6B7280]">{description}</p>
    </article>
  )
}

function PanelHeader({ description, icon: Icon, title }: { description: string; icon: typeof FileText; title: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-[#E5E7EB] px-5 py-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#FED7AA] bg-[#FFF7ED] text-[#F97316]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="font-heading text-base font-bold text-[#111827]">{title}</h3>
        <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p>
      </div>
    </div>
  )
}

type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger"

function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <span className={cn("inline-flex min-h-7 w-fit items-center rounded-md border px-2.5 py-1 text-xs font-bold", badgeClass(tone))}>
      {label}
    </span>
  )
}

function ProgressBar({ className, value }: { className?: string; value: number }) {
  const progress = clampProgress(value)

  return (
    <div className={cn("h-2.5 overflow-hidden rounded-full bg-[#E5E7EB]", className)} aria-label={`Progress ${progress}%`}>
      <div className="h-full rounded-full bg-[#F97316] transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
    </div>
  )
}

function ProgressSlider({ onChange, value }: { onChange: (value: number) => void; value: number }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
      <input className="w-full accent-[#F97316]" max={100} min={0} onChange={(event) => onChange(Number(event.target.value))} step={25} type="range" value={value} />
      <div className="mt-2 flex justify-between text-xs font-bold text-[#6B7280]">
        {progressSteps.map((step) => <span key={step}>{step}%</span>)}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <ProgressBar className="flex-1" value={value} />
        <span className="w-12 text-right text-sm font-bold text-[#111827]">{value}%</span>
      </div>
    </div>
  )
}

function PreviewUploader({ form, onChange }: { form: AssetFormState; onChange: (form: AssetFormState) => void }) {
  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const previewUrl = await fileToDataUrl(file)
    onChange({
      ...form,
      previewKind: file.type === "application/pdf" ? "pdf" : "image",
      previewName: file.name,
      previewUrl,
    })
  }

  return (
    <div className="rounded-lg border border-dashed border-[#FDBA74] bg-[#FFF7ED] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-white text-[#F97316]"><UploadCloud className="size-5" /></span>
          <div>
            <p className="text-sm font-bold text-[#111827]">{form.previewName || "Upload screenshot desain terbaru."}</p>
            <p className="text-xs font-semibold text-[#6B7280]">PNG, JPG, atau PDF.</p>
          </div>
        </div>
        <Input className="max-w-xs bg-white" accept=".png,.jpg,.jpeg,.pdf" onChange={handleFile} type="file" />
      </div>
    </div>
  )
}

function Field({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <label className={cn("grid gap-2 text-sm font-semibold text-[#111827]", className)}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function NativeSelect({ labels, onChange, options, value }: { labels?: Record<string, string>; onChange: (value: string) => void; options: readonly string[]; value: string }) {
  return (
    <select className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-[#111827] outline-none focus:border-[#F97316] focus:ring-3 focus:ring-[#F97316]/20" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option} value={option}>{labels?.[option] ?? option}</option>
      ))}
    </select>
  )
}

function IconInput({ icon, onChange, placeholder, value }: { icon: ReactNode; onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 focus-within:border-[#F97316] focus-within:ring-3 focus-within:ring-[#F97316]/20">
      <span className="shrink-0 text-[#F97316]">{icon}</span>
      <input className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#111827] outline-none placeholder:text-[#9CA3AF]" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="url" value={value} />
      <ExternalLink className="size-4 shrink-0 text-[#9CA3AF]" aria-hidden="true" />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3">
      <span className="font-semibold text-[#6B7280]">{label}</span>
      <span className="text-right font-bold text-[#111827]">{value}</span>
    </div>
  )
}

function CardButton({ icon, label, onClick, variant = "primary" }: { icon: ReactNode; label: string; onClick: () => void; variant?: "primary" | "outline" }) {
  return (
    <button className={cn("inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold transition", variant === "outline" ? "border border-[#F97316] bg-white text-[#F97316] hover:bg-[#FFF7ED]" : "bg-[#F97316] text-white hover:bg-[#EA580C]")} onClick={onClick} type="button">
      {icon}
      {label}
    </button>
  )
}

function EmptyMessage({ message }: { message: string }) {
  return <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFDF8] p-4 text-sm font-semibold text-[#6B7280]">{message}</div>
}

function getStats(assets: PddAsset[]) {
  const total = assets.length
  const completed = assets.filter((asset) => asset.status === "Selesai").length
  const revision = assets.filter((asset) => asset.status === "Revisi").length
  const waitingApproval = assets.filter((asset) => asset.status === "Menunggu Approval" || asset.approval === "Belum Dicek").length
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdue = assets.filter((asset) => new Date(asset.deadline) < today && asset.status !== "Selesai").length
  const overallProgress = total === 0 ? 0 : Math.round(assets.reduce((sum, asset) => sum + asset.progress, 0) / total)

  return { completed, overdue, overallProgress, revision, total, waitingApproval }
}

function getDocumentationStats(documentation: DocumentationState) {
  const photos = documentation.photos.length
  const videos = documentation.videos.length
  const albums = documentation.albums.length
  const aftermovies = documentation.aftermovieUrl ? 1 : 0

  return { aftermovies, albums, photos, totalMedia: photos + videos, videos }
}

function assetStatusTone(status: AssetStatus): BadgeTone {
  if (status === "Selesai") return "success"
  if (status === "Sedang Dikerjakan") return "info"
  if (status === "Revisi") return "danger"
  if (status === "Menunggu Approval") return "warning"
  return "neutral"
}

function approvalStatusTone(status: ApprovalStatus): BadgeTone {
  if (status === "Disetujui") return "success"
  if (status === "Revisi") return "danger"
  return "neutral"
}

function documentationStatusTone(status: DocumentationStatus): BadgeTone {
  if (status === "Selesai") return "success"
  if (status === "Sedang Upload") return "info"
  return "neutral"
}

function badgeClass(tone: BadgeTone) {
  if (tone === "success") return "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
  if (tone === "info") return "border-[#FDBA74] bg-[#FFF7ED] text-[#C2410C]"
  if (tone === "warning") return "border-[#FED7AA] bg-[#FFFBEB] text-[#B45309]"
  if (tone === "danger") return "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
  return "border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]"
}

function dotClass(tone: BadgeTone) {
  if (tone === "success") return "bg-[#22C55E]"
  if (tone === "info") return "bg-[#F97316]"
  if (tone === "warning") return "bg-[#F59E0B]"
  if (tone === "danger") return "bg-[#EF4444]"
  return "bg-[#94A3B8]"
}

function addPdfHeader(doc: import("jspdf").jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(255, 253, 248)
  doc.rect(0, 0, pageWidth, 86, "F")
  doc.setDrawColor(229, 231, 235)
  doc.line(40, 86, pageWidth - 40, 86)
  doc.setTextColor(17, 24, 39)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(17)
  doc.text("MCS 1", 40, 36)
  doc.setFontSize(12)
  doc.text(title, 40, 58)
  doc.setFillColor(249, 115, 22)
  doc.roundedRect(pageWidth - 146, 24, 106, 38, 10, 10, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.text("PDD", pageWidth - 106, 48)
}

async function loadImageAsDataUrl(src: string) {
  try {
    const response = await fetch(src)
    const blob = await response.blob()

    return await fileToDataUrl(blob)
  } catch {
    return ""
  }
}

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function createAsset(values: AssetFormState): PddAsset {
  return { ...values, id: createId("asset") }
}

function createActivity(message: string): PddActivity {
  return { id: createId("activity"), message, time: formatExportDate(new Date()) }
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function assetToForm(asset?: PddAsset | null): AssetFormState {
  if (!asset) return { ...emptyAssetForm }
  const { id, ...form } = asset
  void id
  return form
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(Number.isFinite(value) ? value : 0, 100))
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "PDD"
}

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value))
}

function formatExportDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}
