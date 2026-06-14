"use client"

import { useMemo, useRef, useState } from "react"
import {
  Activity,
  Archive,
  ClipboardList,
  Download,
  Eye,
  FileText,
  GitCompare,
  Globe,
  Plus,
  Printer,
  Search,
  Upload,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { competitionJuknis, competitions, juknisPdf, type JuknisDocument } from "@/data/mcs"
import { cn } from "@/lib/utils"

type JuknisVersion = {
  author: string
  changes: string[]
  date: string
  status: "Draft" | "Review" | "Published" | "Initial Release"
  version: string
}

type RuleRecord = {
  category: string
  competitionId: string
  content: string
  order: number
  status: "Aktif" | "Nonaktif"
}

type ModalMode = "upload" | "rule" | "compare" | null

const ruleCategories = [
  "Persyaratan",
  "Teknis Pertandingan",
  "Penilaian",
  "Larangan",
  "Sanksi",
  "Kriteria Juara",
  "Ketentuan Peserta",
]

const statuses = ["Draft", "Review", "Published"] as const
const ruleStatuses = ["Aktif", "Nonaktif"] as const
const todayLabel = "12 Juni 2026"

export function JuknisManagementModule({ title = "Juknis Management" }: { title?: string }) {
  const [selectedId, setSelectedId] = useState(competitionJuknis[0]?.competitionId ?? "")
  const [query, setQuery] = useState("")
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [activityLog, setActivityLog] = useState<string[]>([])
  const [rules, setRules] = useState<RuleRecord[]>([])
  const [versionsByCompetition, setVersionsByCompetition] = useState<Record<string, JuknisVersion[]>>(
    () =>
      Object.fromEntries(
        competitionJuknis.map((document) => [
          document.competitionId,
          [
            {
              author: "Super Admin",
              changes: [`Initial release ${document.title}.`],
              date: document.registrationStart,
              status: "Initial Release",
              version: "v1.0",
            },
          ],
        ]),
      ),
  )
  const [uploadForm, setUploadForm] = useState({
    changes: "",
    competitionId: competitionJuknis[0]?.competitionId ?? "",
    status: "Draft",
    version: "v1.1",
  })
  const [ruleForm, setRuleForm] = useState({
    category: ruleCategories[0],
    competitionId: competitionJuknis[0]?.competitionId ?? "",
    content: "",
    order: 1,
    status: "Aktif",
  })
  const [compareForm, setCompareForm] = useState({ from: "v1.0", to: "v1.0" })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeDocument = useMemo(
    () => competitionJuknis.find((document) => document.competitionId === selectedId) ?? competitionJuknis[0],
    [selectedId],
  )
  const activeCompetition = competitions.find((competition) => competition.id === activeDocument?.competitionId)
  const activeVersions = activeDocument ? versionsByCompetition[activeDocument.competitionId] ?? [] : []
  const latestVersion = activeVersions[activeVersions.length - 1]
  const publishedCount = competitionJuknis.filter((document) => document.status === "Published").length
  const draftCount = Object.values(versionsByCompetition).flat().filter((version) => version.status === "Draft").length
  const activeRuleCount =
    competitionJuknis.reduce((total, document) => total + getAllRules(document, rules).length, 0) +
    rules.filter((rule) => rule.status === "Aktif").length

  const filteredDocuments = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase()

    if (!loweredQuery) {
      return competitionJuknis
    }

    return competitionJuknis.filter((document) => getDocumentHaystack(document, rules).includes(loweredQuery))
  }, [query, rules])

  const searchMatches = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase()

    if (!loweredQuery) {
      return []
    }

    return competitionJuknis.flatMap((document) =>
      getAllRules(document, rules)
        .filter((rule) => rule.toLowerCase().includes(loweredQuery))
        .slice(0, 3)
        .map((rule) => ({ competition: document.shortName, rule })),
    )
  }, [query, rules])

  function openUploadModal() {
    if (activeDocument) {
      setUploadForm((current) => ({
        ...current,
        competitionId: activeDocument.competitionId,
        version: getNextVersion(activeVersions),
      }))
    }
    setModalMode("upload")
  }

  function openRuleModal() {
    if (activeDocument) {
      setRuleForm((current) => ({ ...current, competitionId: activeDocument.competitionId }))
    }
    setModalMode("rule")
  }

  function publishUpdate() {
    if (!activeDocument) {
      return
    }

    const version = getNextVersion(activeVersions)
    const newVersion: JuknisVersion = {
      author: "Super Admin",
      changes: ["Publish update dari dashboard Juknis Management."],
      date: todayLabel,
      status: "Published",
      version,
    }

    setVersionsByCompetition((current) => appendVersion(current, activeDocument.competitionId, newVersion))
    setActivityLog((current) => [`Super Admin publish Juknis ${activeDocument.shortName} ${version}`, ...current])
  }

  function saveUpload(status: "Draft" | "Published") {
    const document = competitionJuknis.find((item) => item.competitionId === uploadForm.competitionId)

    if (!document) {
      return
    }

    const changes = uploadForm.changes
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
    const version: JuknisVersion = {
      author: "Super Admin",
      changes: changes.length ? changes : [`${status === "Published" ? "Publish" : "Simpan draft"} ${document.title}.`],
      date: todayLabel,
      status,
      version: uploadForm.version.trim() || getNextVersion(versionsByCompetition[document.competitionId] ?? []),
    }

    setVersionsByCompetition((current) => appendVersion(current, document.competitionId, version))
    setSelectedId(document.competitionId)
    setActivityLog((current) => [
      `${status === "Published" ? "Super Admin publish" : "Super Admin menyimpan draft"} Juknis ${document.shortName} ${version.version}`,
      ...current,
    ])
    setModalMode(null)
    setUploadedFile(null)
  }

  function addRule() {
    if (!ruleForm.content.trim()) {
      return
    }

    const document = competitionJuknis.find((item) => item.competitionId === ruleForm.competitionId)
    const nextRule: RuleRecord = {
      category: ruleForm.category,
      competitionId: ruleForm.competitionId,
      content: ruleForm.content.trim(),
      order: Number(ruleForm.order) || 1,
      status: ruleForm.status as "Aktif" | "Nonaktif",
    }

    setRules((current) => [...current, nextRule])
    if (document) {
      setSelectedId(document.competitionId)
      setActivityLog((current) => [`Admin menambahkan rule baru untuk ${document.shortName}`, ...current])
    }
    setRuleForm((current) => ({ ...current, content: "", order: current.order + 1 }))
    setModalMode(null)
  }

  function handlePrint() {
    const printWindow = window.open(juknisPdf.href, "_blank", "noopener,noreferrer")
    printWindow?.addEventListener("load", () => printWindow.print())
  }

  if (!activeDocument) {
    return (
      <section className="rounded-lg border border-[#E5E7EB] bg-white p-6">
        <p className="text-sm font-semibold text-[#111827]">No Data Available</p>
      </section>
    )
  }

  return (
    <div className="grid gap-6 bg-[#FFFDF8]">
      <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[3px_3px_0_rgba(17,24,39,0.08)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-[#111827]/10 bg-[#F97316] text-white">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-heading text-2xl font-bold tracking-normal text-[#111827]">{title}</h2>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#6B7280]">
                Pusat manajemen peraturan lomba resmi MCS 1 untuk peserta, PJ lomba, juri, panitia, dan Super Admin.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={openUploadModal}>
              <Upload className="size-4" aria-hidden="true" />
              Upload Juknis
            </Button>
            <Button type="button" variant="outline" onClick={openRuleModal}>
              <Plus className="size-4" aria-hidden="true" />
              Add Rule
            </Button>
            <Button type="button" variant="secondary" onClick={publishUpdate}>
              <Globe className="size-4" aria-hidden="true" />
              Publish Update
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Total Juknis" value={competitionJuknis.length} />
        <StatTile label="Juknis Published" value={publishedCount} tone="success" />
        <StatTile label="Draft" value={draftCount} tone={draftCount ? "warning" : "neutral"} />
        <StatTile label="Versi Terbaru" value={latestVersion?.version ?? "v1.0"} tone="info" />
        <StatTile label="Total Rule Aktif" value={activeRuleCount} tone="gold" />
      </section>

      <section className="rounded-lg border border-[#E5E7EB] bg-white p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">Cari Rule, Juknis, Kata Kunci</span>
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#F97316]" aria-hidden="true" />
              <Input
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari pemain cadangan, sistem gugur, sanksi, penilaian"
              />
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <ExportButton label="Export PDF" />
            <ExportButton label="Export Word" />
            <ExportButton label="Export ZIP" />
          </div>
        </div>
        {searchMatches.length ? (
          <div className="mt-4 grid gap-2">
            {searchMatches.map((match) => (
              <button
                key={`${match.competition}-${match.rule}`}
                type="button"
                className="rounded-lg border border-[#E5E7EB] bg-[#FFFDF8] p-3 text-left text-sm font-medium leading-6 text-[#111827] transition hover:border-[#F97316]"
                onClick={() => {
                  const document = competitionJuknis.find((item) => item.shortName === match.competition)
                  if (document) setSelectedId(document.competitionId)
                }}
              >
                <span className="font-bold text-[#F97316]">{match.competition}</span> - {match.rule}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <Panel icon={FileText} title="Juknis List" description="Pilih lomba untuk membuka detail dan riwayat versi.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                  {["Nama Lomba", "Format", "Team Format", "Versi Aktif", "Publish Status"].map((heading) => (
                    <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((document) => {
                  const selected = document.competitionId === activeDocument.competitionId
                  const versions = versionsByCompetition[document.competitionId] ?? []
                  const currentVersion = versions[versions.length - 1]

                  return (
                    <tr key={document.id}>
                      <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0">
                        <button
                          type="button"
                          className={cn(
                            "text-left font-semibold transition",
                            selected ? "text-[#F97316]" : "text-[#111827] hover:text-[#F97316]",
                          )}
                          onClick={() => setSelectedId(document.competitionId)}
                        >
                          {document.shortName}
                        </button>
                      </td>
                      <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{document.format}</td>
                      <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{document.teamFormat}</td>
                      <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{currentVersion?.version ?? "v1.0"}</td>
                      <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                        <StatusPill label={document.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel icon={ClipboardList} title="Juknis Detail" description="Detail dinamis berdasarkan lomba yang dipilih dari tabel.">
            <JuknisDetail
              competitionName={activeCompetition?.name ?? activeDocument.shortName}
              document={activeDocument}
              latestVersion={latestVersion}
              onPrint={handlePrint}
              rules={rules}
            />
          </Panel>

          <Panel icon={Activity} title="Aktivitas Terbaru" description="Log aktivitas update Juknis di sesi dashboard ini.">
            <div className="grid gap-2">
              {(activityLog.length ? activityLog : [`${activeDocument.title} tersedia dari data resmi MCS 1.`]).map((item) => (
                <div key={item} className="rounded-lg border border-[#E5E7EB] bg-[#FFFDF8] p-3 text-sm font-semibold text-[#111827]">
                  {item}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel icon={Activity} title="Version History" description={`Timeline versi untuk ${activeDocument.shortName}.`}>
          <VersionTimeline versions={activeVersions} />
        </Panel>
        <Panel icon={GitCompare} title="Compare Version" description="Bandingkan perubahan antar versi Juknis.">
          <div className="grid gap-3">
            <Button type="button" variant="outline" onClick={() => setModalMode("compare")}>
              <GitCompare className="size-4" aria-hidden="true" />
              Bandingkan Versi
            </Button>
            <ComparePreview versions={activeVersions} from={compareForm.from} to={compareForm.to} />
          </div>
        </Panel>
      </section>

      {modalMode === "upload" ? (
        <Modal title="Upload Juknis" onClose={() => setModalMode(null)}>
          <div className="grid gap-4">
            <Field label="Nama Lomba">
              <NativeSelect
                value={uploadForm.competitionId}
                onChange={(value) => setUploadForm((current) => ({ ...current, competitionId: value }))}
                options={competitionJuknis.map((document) => ({ label: document.shortName, value: document.competitionId }))}
              />
            </Field>
            <Field label="Versi">
              <Input value={uploadForm.version} onChange={(event) => setUploadForm((current) => ({ ...current, version: event.target.value }))} />
            </Field>
            <Field label="Upload File PDF">
              <div
                className="grid min-h-28 cursor-pointer place-items-center rounded-lg border border-dashed border-[#F97316]/50 bg-[#FFF7ED] p-4 text-center"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  setUploadedFile(event.dataTransfer.files?.[0] ?? null)
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(event) => setUploadedFile(event.target.files?.[0] ?? null)}
                />
                <div>
                  <Upload className="mx-auto size-5 text-[#F97316]" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold text-[#111827]">Drag and Drop PDF atau pilih file</p>
                  <p className="mt-1 text-xs font-medium text-[#6B7280]">
                    {uploadedFile ? uploadedFile.name : juknisPdf.sourceLabel}
                  </p>
                </div>
              </div>
            </Field>
            <Field label="Catatan Perubahan">
              <Textarea
                className="min-h-28"
                value={uploadForm.changes}
                onChange={(event) => setUploadForm((current) => ({ ...current, changes: event.target.value }))}
              />
            </Field>
            <Field label="Status">
              <NativeSelect
                value={uploadForm.status}
                onChange={(value) => setUploadForm((current) => ({ ...current, status: value }))}
                options={statuses.map((status) => ({ label: status, value: status }))}
              />
            </Field>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => saveUpload("Draft")}>
                Simpan Draft
              </Button>
              <Button type="button" onClick={() => saveUpload("Published")}>
                Publish Juknis
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {modalMode === "rule" ? (
        <Modal title="Add Rule" onClose={() => setModalMode(null)}>
          <div className="grid gap-4">
            <Field label="Lomba">
              <NativeSelect
                value={ruleForm.competitionId}
                onChange={(value) => setRuleForm((current) => ({ ...current, competitionId: value }))}
                options={competitionJuknis.map((document) => ({ label: document.shortName, value: document.competitionId }))}
              />
            </Field>
            <Field label="Kategori Rule">
              <NativeSelect
                value={ruleForm.category}
                onChange={(value) => setRuleForm((current) => ({ ...current, category: value }))}
                options={ruleCategories.map((category) => ({ label: category, value: category }))}
              />
            </Field>
            <Field label="Isi Rule">
              <Textarea
                className="min-h-36"
                value={ruleForm.content}
                onChange={(event) => setRuleForm((current) => ({ ...current, content: event.target.value }))}
              />
            </Field>
            <Field label="Urutan Rule">
              <Input
                type="number"
                min={1}
                value={ruleForm.order}
                onChange={(event) => setRuleForm((current) => ({ ...current, order: Number(event.target.value) }))}
              />
            </Field>
            <Field label="Status">
              <NativeSelect
                value={ruleForm.status}
                onChange={(value) => setRuleForm((current) => ({ ...current, status: value as "Aktif" | "Nonaktif" }))}
                options={ruleStatuses.map((status) => ({ label: status, value: status }))}
              />
            </Field>
            <div className="flex justify-end">
              <Button type="button" onClick={addRule}>
                Simpan Rule
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {modalMode === "compare" ? (
        <Modal title="Bandingkan Versi" onClose={() => setModalMode(null)}>
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Versi Awal">
                <NativeSelect
                  value={compareForm.from}
                  onChange={(value) => setCompareForm((current) => ({ ...current, from: value }))}
                  options={activeVersions.map((version) => ({ label: version.version, value: version.version }))}
                />
              </Field>
              <Field label="Versi Tujuan">
                <NativeSelect
                  value={compareForm.to}
                  onChange={(value) => setCompareForm((current) => ({ ...current, to: value }))}
                  options={activeVersions.map((version) => ({ label: version.version, value: version.version }))}
                />
              </Field>
            </div>
            <ComparePreview versions={activeVersions} from={compareForm.from} to={compareForm.to} expanded />
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function JuknisDetail({
  competitionName,
  document,
  latestVersion,
  onPrint,
  rules,
}: {
  competitionName: string
  document: JuknisDocument
  latestVersion?: JuknisVersion
  onPrint: () => void
  rules: RuleRecord[]
}) {
  const sections = getDetailSections(document, rules)

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFDF8] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">Nama Lomba</p>
            <h3 className="mt-1 font-heading text-xl font-bold text-[#111827]">{competitionName}</h3>
          </div>
          <StatusPill label={document.status} />
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <DetailItem label="Versi Aktif" value={latestVersion?.version ?? "v1.0"} />
          <DetailItem label="Tanggal Publish" value={latestVersion?.date ?? document.registrationStart} />
          <DetailItem label="PJ Lomba" value={document.contacts.join(" | ")} />
          <DetailItem label="Status" value={document.status} />
        </dl>
      </div>

      <DetailSection title="Deskripsi Lomba" items={[document.summary]} />
      {sections.map((section) => (
        <DetailSection key={section.title} title={section.title} items={section.items} />
      ))}

      <div className="grid gap-2 sm:grid-cols-3">
        <Button nativeButton={false} variant="outline" render={<a href={juknisPdf.href} target="_blank" rel="noreferrer" />}>
          <Eye className="size-4" aria-hidden="true" />
          Lihat PDF
        </Button>
        <Button nativeButton={false} render={<a href={juknisPdf.href} download />}>
          <Download className="size-4" aria-hidden="true" />
          Download PDF
        </Button>
        <Button type="button" variant="secondary" onClick={onPrint}>
          <Printer className="size-4" aria-hidden="true" />
          Print PDF
        </Button>
      </div>
    </div>
  )
}

function VersionTimeline({ versions }: { versions: JuknisVersion[] }) {
  return (
    <div className="grid gap-4">
      {[...versions].reverse().map((version) => (
        <article key={`${version.version}-${version.date}`} className="relative rounded-lg border border-[#E5E7EB] bg-[#FFFDF8] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-heading text-lg font-bold text-[#111827]">{version.version}</p>
              <p className="mt-1 text-sm font-semibold text-[#6B7280]">
                {version.status} - {version.date} - {version.author}
              </p>
            </div>
            <StatusPill label={version.status} />
          </div>
          <p className="mt-4 text-sm font-bold text-[#111827]">Perubahan:</p>
          <ul className="mt-2 grid gap-2 text-sm font-medium leading-6 text-[#4B5563]">
            {version.changes.map((change) => (
              <li key={change} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#F97316]" />
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  )
}

function ComparePreview({
  expanded = false,
  from,
  to,
  versions,
}: {
  expanded?: boolean
  from: string
  to: string
  versions: JuknisVersion[]
}) {
  const fromVersion = versions.find((version) => version.version === from) ?? versions[0]
  const toVersion = versions.find((version) => version.version === to) ?? versions[versions.length - 1]
  const fromChanges = new Set(fromVersion?.changes ?? [])
  const differentChanges = (toVersion?.changes ?? []).filter((change) => !fromChanges.has(change))

  return (
    <div className={cn("rounded-lg border border-[#E5E7EB] bg-[#FFFDF8] p-4", expanded ? "min-h-48" : "")}>
      <p className="text-sm font-bold text-[#111827]">
        {fromVersion?.version ?? "v1.0"} vs {toVersion?.version ?? "v1.0"}
      </p>
      <div className="mt-3 grid gap-2 text-sm font-medium leading-6 text-[#4B5563]">
        {(differentChanges.length ? differentChanges : ["Tidak ada perbedaan tambahan pada versi yang dipilih."]).map((change) => (
          <div key={change} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2">
            {change}
          </div>
        ))}
      </div>
    </div>
  )
}

function Panel({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode
  description: string
  icon: typeof FileText
  title: string
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[3px_3px_0_rgba(17,24,39,0.06)]">
      <div className="flex items-start gap-3 border-b border-[#E5E7EB] px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#F97316]/20 bg-[#FFF7ED] text-[#F97316]">
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

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#111827]/30 p-4 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white shadow-[6px_6px_0_rgba(17,24,39,0.18),0_24px_70px_rgba(17,24,39,0.2)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
          <h3 className="font-heading text-lg font-bold text-[#111827]">{title}</h3>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </section>
    </div>
  )
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</span>
      {children}
    </label>
  )
}

function NativeSelect({
  onChange,
  options,
  value,
}: {
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
  value: string
}) {
  return (
    <select
      className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] outline-none transition focus:border-[#F97316] focus:ring-3 focus:ring-[#F97316]/20"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function StatTile({ label, tone = "neutral", value }: { label: string; tone?: "neutral" | "success" | "warning" | "info" | "gold"; value: React.ReactNode }) {
  return (
    <article className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[2px_2px_0_rgba(17,24,39,0.06)]">
      <p className="text-sm font-semibold text-[#6B7280]">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-heading text-xl font-bold leading-6 text-[#111827]">{value}</p>
        <span
          className={cn(
            "mb-1 size-2.5 rounded-full",
            tone === "success" && "bg-[#16A34A]",
            tone === "warning" && "bg-[#D97706]",
            tone === "info" && "bg-[#2563EB]",
            tone === "gold" && "bg-[#F59E0B]",
            tone === "neutral" && "bg-[#CBD5E1]",
          )}
        />
      </div>
    </article>
  )
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-6 text-[#111827]">{value}</dd>
    </div>
  )
}

function DetailSection({ items, title }: { items: string[]; title: string }) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-4">
      <h4 className="font-heading text-base font-bold text-[#111827]">{title}</h4>
      <ul className="mt-3 grid gap-2 text-sm font-medium leading-6 text-[#4B5563]">
        {items.length ? (
          items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#F97316]" />
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li>Data Not Published Yet</li>
        )}
      </ul>
    </section>
  )
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex h-7 w-fit items-center rounded-md border border-[#DCFCE7] bg-[#F0FDF4] px-2.5 text-xs font-bold text-[#16A34A]">
      {label}
    </span>
  )
}

function ExportButton({ label }: { label: string }) {
  return (
    <Button type="button" variant="outline">
      <Archive className="size-4" aria-hidden="true" />
      {label}
    </Button>
  )
}

function appendVersion(current: Record<string, JuknisVersion[]>, competitionId: string, version: JuknisVersion) {
  return {
    ...current,
    [competitionId]: [...(current[competitionId] ?? []), version],
  }
}

function getNextVersion(versions: JuknisVersion[]) {
  const latest = versions[versions.length - 1]?.version ?? "v1.0"
  const match = latest.match(/^v(\d+)\.(\d+)$/)

  if (!match) {
    return "v1.1"
  }

  return `v${match[1]}.${Number(match[2]) + 1}`
}

function getDetailSections(document: JuknisDocument, rules: RuleRecord[]) {
  const extraRules = rules
    .filter((rule) => rule.competitionId === document.competitionId && rule.status === "Aktif")
    .sort((first, second) => first.order - second.order)
    .map((rule) => `${rule.category}: ${rule.content}`)

  return [
    { title: "Persyaratan Peserta", items: findSectionItems(document, ["pendaftaran", "ketentuan"]) },
    { title: "Teknis Pelaksanaan", items: findSectionItems(document, ["teknis", "peraturan"]) },
    { title: "Sistem Penilaian", items: document.criteria ?? [] },
    { title: "Sanksi", items: getSanctionItems(document) },
    { title: "Hadiah", items: [] },
    { title: "Rule Tambahan", items: extraRules },
  ]
}

function findSectionItems(document: JuknisDocument, keywords: string[]) {
  return document.sections
    .filter((section) => keywords.some((keyword) => section.title.toLowerCase().includes(keyword)))
    .flatMap((section) => section.items)
}

function getSanctionItems(document: JuknisDocument) {
  const sanctionKeywords = ["sanksi", "diskualifikasi", "wo", "terlambat", "dilarang", "tidak sah", "curang", "plagiasi", "foul"]

  return document.sections
    .flatMap((section) => section.items)
    .filter((item) => sanctionKeywords.some((keyword) => item.toLowerCase().includes(keyword)))
}

function getAllRules(document: JuknisDocument, rules: RuleRecord[]) {
  return [
    ...document.sections.flatMap((section) => section.items),
    ...(document.criteria ?? []),
    ...rules.filter((rule) => rule.competitionId === document.competitionId).map((rule) => rule.content),
  ]
}

function getDocumentHaystack(document: JuknisDocument, rules: RuleRecord[]) {
  return [
    document.title,
    document.shortName,
    document.format,
    document.teamFormat,
    document.summary,
    document.contacts.join(" "),
    getAllRules(document, rules).join(" "),
  ]
    .join(" ")
    .toLowerCase()
}
