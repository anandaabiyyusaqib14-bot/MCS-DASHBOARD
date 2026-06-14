"use client"

import { useMemo, useState, type FormEvent } from "react"
import {
  BadgeCheck,
  BellRing,
  CalendarClock,
  FileCheck,
  Flag,
  GitBranch,
  MonitorPlay,
  Printer,
  QrCode,
  Radio,
  ShieldAlert,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react"

import type {
  AttendanceCenterSnapshot,
  AttendancePerson,
  BracketCenterSnapshot,
  CertificateCenterSnapshot,
  CommandCenterSnapshot,
  DisplaySnapshot,
  JudgingCenterSnapshot,
  NationRankingRow,
  OperatingStatus,
} from "@/server/mcs/operating-system"
import type { IssueRecord } from "@/server/mcs/types"
import { cn } from "@/lib/utils"

type IncidentStatus = "Open" | "Assigned" | "In Progress" | "Escalated" | "Resolved" | "Closed"
type IncidentSeverity = "Low" | "Medium" | "High" | "Critical"

const issueColumns: Array<{ label: string; statuses: IssueRecord["status"][] }> = [
  { label: "Open", statuses: ["Terbuka"] },
  { label: "Assigned", statuses: ["Ditugaskan"] },
  { label: "Progress", statuses: ["Diproses", "Eskalasi"] },
  { label: "Resolved", statuses: ["Selesai", "Ditutup"] },
]
const incidentCategories = ["Venue", "Peralatan", "Jadwal", "Keamanan", "Sponsor", "Dokumentasi", "Peserta", "Panitia", "Lainnya"]
const incidentSeverities: IncidentSeverity[] = ["Low", "Medium", "High", "Critical"]
const incidentStatuses: IncidentStatus[] = ["Open", "Assigned", "In Progress", "Escalated", "Resolved", "Closed"]

export function EventCommandCenter({ snapshot }: { snapshot: CommandCenterSnapshot }) {
  const liveCards = [
    ["Kegiatan Saat Ini", snapshot.currentActivity.title, snapshot.currentActivity.meta, CalendarClock],
    ["Kegiatan Berikutnya", snapshot.nextActivity.title, snapshot.nextActivity.meta, MonitorPlay],
    ["Match Berlangsung", String(snapshot.liveMatches.length), "Live score aktif", Radio],
    ["Venue Aktif", String(snapshot.venues.length), "Status tempat terpantau", Flag],
    ["Panitia Hadir", snapshot.presentLabel, "Berdasarkan status divisi", Users],
    ["Kendala Aktif", String(snapshot.incidentCount), "Open sampai resolved", ShieldAlert],
  ] as const

  return (
    <OperatingShell
      eyebrow="Event Operating System"
      title="Event Command Center"
      description="Satu layar untuk Ketua Pelaksana saat Hari H: aktivitas, match, venue, kendala, pengumuman, dan status divisi."
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {liveCards.map(([label, value, meta, Icon]) => (
          <OperatingCard key={label}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
                <p className="mt-3 font-heading text-2xl font-bold text-[#111827]">{value}</p>
                <p className="mt-2 text-sm font-semibold text-[#64748B]">{meta}</p>
              </div>
              <Icon className="size-5 text-[#F97316]" />
            </div>
          </OperatingCard>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <OperatingCard title="Division Status">
          <div className="grid gap-2">
            {snapshot.divisionStatuses.map((division) => (
              <div key={division.label} className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                <div>
                  <p className="font-bold text-[#111827]">{division.label}</p>
                  <p className="text-xs font-semibold text-[#64748B]">{division.present}/{division.members} hadir / {division.activeIssues} kendala</p>
                </div>
                <StatusPill status={division.status} />
              </div>
            ))}
          </div>
        </OperatingCard>
        <OperatingCard title="Today Timeline">
          <div className="grid gap-2">
            {snapshot.timeline.length ? snapshot.timeline.map((row) => (
              <div key={row.id} className="grid gap-3 rounded-lg border border-[#E5E7EB] p-3 sm:grid-cols-[80px_1fr_160px]">
                <p className="font-mono text-sm font-black text-[#F97316]">{row.time}</p>
                <p className="font-bold text-[#111827]">{row.title}</p>
                <p className="text-sm font-semibold text-[#64748B]">{row.venue}</p>
              </div>
            )) : <EmptyBlock label="Data Not Published Yet" />}
          </div>
        </OperatingCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <OperatingCard title="Kendala Aktif">
          <IssueList issues={snapshot.urgentIssues} />
        </OperatingCard>
        <OperatingCard title="Pengumuman Terbaru">
          <div className="grid gap-2">
            {snapshot.announcements.length ? snapshot.announcements.map((item) => (
              <div key={item.id} className="rounded-lg border border-[#E5E7EB] p-3">
                <p className="font-bold text-[#111827]">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-[#64748B]">{item.body}</p>
              </div>
            )) : <EmptyBlock label="Data Not Published Yet" />}
          </div>
        </OperatingCard>
        <OperatingCard title="Venue Aktif">
          <div className="grid gap-2">
            {snapshot.venues.length ? snapshot.venues.map((venue) => (
              <div key={venue.id} className="rounded-lg border border-[#E5E7EB] p-3">
                <p className="font-bold text-[#111827]">{venue.venue}</p>
                <p className="mt-1 text-sm font-semibold text-[#64748B]">{venue.status} / {venue.ownerName ?? "PIC belum ditentukan"}</p>
              </div>
            )) : <EmptyBlock label="Data Not Published Yet" />}
          </div>
        </OperatingCard>
      </section>
    </OperatingShell>
  )
}

export function IncidentCenter({ initialIssues }: { initialIssues: IssueRecord[] }) {
  const [issues, setIssues] = useState(initialIssues)
  const [message, setMessage] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setMessage("")
    const response = await fetch("/api/mcs/issues", {
      body: JSON.stringify(Object.fromEntries(form.entries())),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const payload = await response.json().catch(() => null) as { data?: IssueRecord; error?: { message?: string } } | null

    if (!response.ok || !payload?.data) {
      setMessage(payload?.error?.message ?? "Kendala belum berhasil dibuat.")
      return
    }

    setIssues((current) => [payload.data!, ...current])
    setMessage("Kendala berhasil dibuat.")
    event.currentTarget.reset()
  }

  async function moveIssue(issue: IssueRecord, status: IncidentStatus) {
    const response = await fetch(`/api/mcs/issues/${issue.id}`, {
      body: JSON.stringify({ status }),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const payload = await response.json().catch(() => null) as { data?: IssueRecord; error?: { message?: string } } | null

    if (!response.ok || !payload?.data) {
      setMessage(payload?.error?.message ?? "Status kendala belum berhasil diperbarui.")
      return
    }

    setIssues((current) => current.map((item) => item.id === issue.id ? payload.data! : item))
  }

  return (
    <OperatingShell eyebrow="Incident Center" title="Pusat Kendala Event" description="Buat, assign, eskalasi, dan selesaikan kendala event dari satu board.">
      <OperatingCard title="Input Kendala">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={submit}>
          <input className={fieldClass} name="title" required placeholder="Judul" />
          <select className={fieldClass} name="category">{incidentCategories.map((item) => <option key={item}>{item}</option>)}</select>
          <select className={fieldClass} name="severity">{incidentSeverities.map((item) => <option key={item}>{item}</option>)}</select>
          <input className={fieldClass} name="deadline" required placeholder="Deadline" />
          <input className={fieldClass} name="assignedToName" placeholder="Owner" />
          <input className={fieldClass} name="attachment" placeholder="Lampiran URL/nama file" />
          <textarea className={cn(fieldClass, "min-h-20 md:col-span-2")} name="description" required placeholder="Deskripsi" />
          <button className="mcs-button-primary h-10 rounded-lg px-4 text-sm font-bold">Buat Incident</button>
        </form>
        {message ? <p className="mt-3 text-sm font-bold text-[#F97316]">{message}</p> : null}
      </OperatingCard>

      <section className="grid gap-4 xl:grid-cols-4">
        {issueColumns.map((column) => (
          <OperatingCard key={column.label} title={column.label}>
            <div className="grid gap-2">
              {issues.filter((issue) => column.statuses.includes(issue.status)).map((issue) => (
                <div key={issue.id} className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-[#111827]">{issue.title}</p>
                    <SeverityPill severity={issue.severity} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-[#64748B]">{issue.description}</p>
                  <p className="mt-2 text-xs font-bold text-[#64748B]">{issue.assignedToName ?? issue.assignedDivisionName ?? "Owner belum ditentukan"} / {issue.deadline}</p>
                  <select className="mt-3 h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-2 text-xs font-bold" value={toIncidentStatus(issue.status)} onChange={(event) => void moveIssue(issue, event.target.value as IncidentStatus)}>
                    {incidentStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
              ))}
              {issues.filter((issue) => column.statuses.includes(issue.status)).length === 0 ? <EmptyBlock label="No Data Available" /> : null}
            </div>
          </OperatingCard>
        ))}
      </section>
    </OperatingShell>
  )
}

export function NationRankingCenter({ rows }: { rows: NationRankingRow[] }) {
  return (
    <OperatingShell eyebrow="Nation Ranking" title="Nation Ranking Center" description="Ranking otomatis dari live score, bracket, dan hasil match.">
      <OperatingCard>
        <DataTable headings={["Rank", "Flag", "Country", "Points", "Gold", "Silver", "Bronze"]}>
          {rows.map((row) => (
            <tr key={row.country}>
              <Cell strong>{row.rank}</Cell><Cell>{row.flag}</Cell><Cell strong>{row.country}</Cell><Cell>{row.points}</Cell><Cell>{row.gold}</Cell><Cell>{row.silver}</Cell><Cell>{row.bronze}</Cell>
            </tr>
          ))}
        </DataTable>
      </OperatingCard>
    </OperatingShell>
  )
}

export function MasterBracketCenter({ snapshot }: { snapshot: BracketCenterSnapshot }) {
  const [selectedId, setSelectedId] = useState(snapshot.competitions[0]?.id ?? "futsal")
  const [message, setMessage] = useState("")
  const rounds = snapshot.brackets.map((round) => ({
    ...round,
    matches: round.matches.filter((match) => match.competitionId === selectedId),
  })).filter((round) => round.matches.length)

  async function generateRound() {
    setMessage("")
    const response = await fetch("/api/mcs/competition-center/brackets/generate", {
      body: JSON.stringify({ competitionId: selectedId }),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null

    if (!response.ok) {
      setMessage(payload?.error?.message ?? "Round belum berhasil dibuat.")
      return
    }

    setMessage("Round berhasil dibuat. Refresh halaman untuk membaca bracket terbaru.")
  }

  return (
    <OperatingShell eyebrow="Master Bracket" title="Master Bracket Center" description="Visual bracket tersambung dengan live score. Winner dapat dipakai untuk update round berikutnya.">
      <div className="flex flex-wrap gap-2">
        {snapshot.competitions.filter((item) => ["futsal", "basket", "volly", "badminton", "mobile-legends"].includes(item.id)).map((competition) => (
          <button key={competition.id} type="button" className={cn("rounded-lg border px-3 py-2 text-sm font-bold", selectedId === competition.id ? "border-[#F97316] bg-[#FFF7ED] text-[#F97316]" : "border-[#E5E7EB] bg-white text-[#64748B]")} onClick={() => setSelectedId(competition.id)}>
            {competition.name}
          </button>
        ))}
      </div>
      <OperatingCard title="Visual Bracket">
        <div className="grid gap-4 xl:grid-cols-2">
          {rounds.length ? rounds.flatMap((round) => round.matches.map((match) => (
            <div key={match.id} className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.08em] text-[#F97316]">{round.title}</p>
              {match.slots.map((slot) => (
                <div key={`${match.id}-${slot.seed}`} className="flex items-center justify-between border-b border-[#E5E7EB] py-2 last:border-b-0">
                  <span className="font-bold text-[#111827]">{slot.flag} {slot.name}</span>
                  <span className="font-mono text-sm font-bold text-[#64748B]">{slot.score ?? "-"}</span>
                </div>
              ))}
            </div>
          ))) : <EmptyBlock label="Bracket belum dibuat" />}
        </div>
      </OperatingCard>
      {message ? <p className="text-sm font-bold text-[#F97316]">{message}</p> : null}
      <div className="grid gap-3 md:grid-cols-4">
        <ActionCard icon={GitBranch} label="Generate Round" onClick={() => void generateRound()} />
        <ActionCard icon={Trophy} label="Manual Override" onClick={() => { window.location.href = "/dashboard/live-score" }} />
        <ActionCard icon={Printer} label="Print Bracket" onClick={() => window.print()} />
        <ActionCard icon={FileCheck} label="Export PDF" onClick={() => window.print()} />
      </div>
    </OperatingShell>
  )
}

export function AttendanceSystem({ snapshot }: { snapshot: AttendanceCenterSnapshot }) {
  const people = [...snapshot.panitia, ...snapshot.participants, ...snapshot.judges]
  const [scanCode, setScanCode] = useState("")
  const [logs, setLogs] = useState<Array<{ code: string; name: string; time: string }>>([])
  const matched = people.find((person) => person.code.toLowerCase() === scanCode.trim().toLowerCase())

  function scan() {
    if (!matched) return
    setLogs((current) => [{ code: matched.code, name: matched.name, time: new Date().toLocaleString("id-ID") }, ...current])
    setScanCode("")
  }

  return (
    <OperatingShell eyebrow="QR Attendance" title="QR Attendance System" description="Generate kode presensi, scan kode, dan pantau log kehadiran Panitia, Peserta, dan Juri.">
      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <OperatingCard title="Scan QR">
          <div className="grid gap-3">
            <input className={fieldClass} value={scanCode} onChange={(event) => setScanCode(event.target.value)} placeholder="Scan atau input kode QR" />
            <button className="mcs-button-primary h-10 rounded-lg px-4 text-sm font-bold" onClick={scan} type="button">Scan QR</button>
            <p className="text-sm font-semibold text-[#64748B]">{matched ? `${matched.name} / ${matched.group}` : "Data akan cocok setelah kode QR valid."}</p>
          </div>
        </OperatingCard>
        <OperatingCard title="Attendance Analytics">
          <div className="grid gap-3 sm:grid-cols-4">
            <MiniMetric label="Panitia" value={snapshot.panitia.length} />
            <MiniMetric label="Peserta" value={snapshot.participants.length} />
            <MiniMetric label="Juri" value={snapshot.judges.length} />
            <MiniMetric label="Scan Hari Ini" value={logs.length} />
          </div>
        </OperatingCard>
      </section>
      <OperatingCard title="Generate QR">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {people.map((person) => <QrCard key={person.code} person={person} />)}
        </div>
      </OperatingCard>
      <OperatingCard title="Attendance Log">
        {logs.length ? logs.map((log) => <p key={`${log.code}-${log.time}`} className="border-b border-[#E5E7EB] py-2 text-sm font-semibold">{log.time} / {log.name} / {log.code}</p>) : <EmptyBlock label="No Data Available" />}
      </OperatingCard>
    </OperatingShell>
  )
}

export function CertificateEngine({ snapshot }: { snapshot: CertificateCenterSnapshot }) {
  const recipients = [...snapshot.winners, ...snapshot.participants, ...snapshot.panitia, ...snapshot.judges, ...snapshot.sponsors]
  const [selectedType, setSelectedType] = useState("Peserta")
  const filtered = recipients.filter((recipient) => recipient.type === selectedType)

  function generate() {
    window.print()
  }

  return (
    <OperatingShell eyebrow="Certificate Engine" title="Certificate Engine" description="Generate sertifikat dari data peserta, panitia, juri, sponsor, dan juara yang tersedia.">
      <div className="flex flex-wrap gap-2">
        {["Peserta", "Panitia", "Juri", "Sponsor", "Juara"].map((type) => (
          <button key={type} className={cn("rounded-lg border px-3 py-2 text-sm font-bold", selectedType === type ? "border-[#F97316] bg-[#FFF7ED] text-[#F97316]" : "border-[#E5E7EB] bg-white text-[#64748B]")} onClick={() => setSelectedType(type)}>{type}</button>
        ))}
      </div>
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <OperatingCard title="Template Builder">
          <div className="grid gap-3">
            <input className={fieldClass} defaultValue={`Sertifikat ${selectedType} MCS 1`} />
            <textarea className={cn(fieldClass, "min-h-28")} defaultValue="Diberikan sebagai bentuk apresiasi pada Melati Championship Series 1." />
            <button className="mcs-button-primary h-10 rounded-lg px-4 text-sm font-bold" onClick={generate}>Generate PDF / Bulk Generate</button>
          </div>
        </OperatingCard>
        <OperatingCard title="Preview">
          <div className="grid min-h-72 place-items-center rounded-lg border border-[#E5E7EB] bg-[#FFFDF8] p-8 text-center">
            <BadgeCheck className="mx-auto size-12 text-[#F97316]" />
            <p className="mt-4 font-heading text-2xl font-bold text-[#111827]">Sertifikat {selectedType}</p>
            <p className="mt-2 text-sm font-semibold text-[#64748B]">QR Verification: /verify-certificate</p>
          </div>
        </OperatingCard>
      </section>
      <OperatingCard title="Recipient List">
        {filtered.length ? <DataTable headings={["Nama", "Tipe", "Meta"]}>{filtered.map((item) => <tr key={item.id}><Cell strong>{item.name}</Cell><Cell>{item.type}</Cell><Cell>{item.meta}</Cell></tr>)}</DataTable> : <EmptyBlock label="No Data Available" />}
      </OperatingCard>
    </OperatingShell>
  )
}

export function JudgePanel({ snapshot }: { snapshot: JudgingCenterSnapshot }) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  const ranking = useMemo(() => snapshot.participants.map((participant) => ({
    ...participant,
    score: scores[participant.id] ?? 0,
  })).sort((first, second) => second.score - first.score), [scores, snapshot.participants])

  async function submitScore(participantId: string, competitionId: string) {
    const criteria = snapshot.criteria.find((item) => item.competitionId === competitionId)
    if (!criteria) {
      setMessage("Kriteria penilaian belum tersedia untuk peserta ini.")
      return
    }

    const response = await fetch("/api/mcs/competition-center/judge-scores", {
      body: JSON.stringify({
        comments: comments[participantId] ?? "",
        competitionId,
        criteriaId: criteria.id,
        judge: "Judge Panel",
        participantId,
        score: scores[participantId] ?? 0,
      }),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null

    setMessage(response.ok ? "Nilai berhasil disimpan." : payload?.error?.message ?? "Nilai belum berhasil disimpan.")
  }

  return (
    <OperatingShell eyebrow="Judge Panel" title="Judge Panel" description="Input nilai, komentar, ranking, auto winner, dan approval untuk cabang penilaian.">
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <OperatingCard title="Input Nilai">
          <div className="grid gap-3">
            {snapshot.participants.length ? snapshot.participants.map((participant) => (
              <label key={participant.id} className="grid gap-1">
                <span className="text-sm font-bold text-[#111827]">{participant.name}</span>
                <input className={fieldClass} min={0} max={100} type="number" value={scores[participant.id] ?? 0} onChange={(event) => setScores((current) => ({ ...current, [participant.id]: Number(event.target.value) }))} />
                <input className={fieldClass} value={comments[participant.id] ?? ""} onChange={(event) => setComments((current) => ({ ...current, [participant.id]: event.target.value }))} placeholder="Komentar" />
                <button className="mcs-button-primary h-9 rounded-lg px-3 text-xs font-bold" type="button" onClick={() => void submitScore(participant.id, participant.competitionId)}>Simpan Nilai</button>
              </label>
            )) : <EmptyBlock label="No Data Available" />}
          </div>
          {message ? <p className="mt-3 text-sm font-bold text-[#F97316]">{message}</p> : null}
        </OperatingCard>
        <OperatingCard title="Ranking">
          {ranking.length ? <DataTable headings={["Rank", "Peserta", "Lomba", "Nilai"]}>{ranking.map((row, index) => <tr key={row.id}><Cell>{index + 1}</Cell><Cell strong>{row.name}</Cell><Cell>{row.competitionId}</Cell><Cell>{row.score}</Cell></tr>)}</DataTable> : <EmptyBlock label="No Data Available" />}
        </OperatingCard>
      </section>
      <OperatingCard title="Cabang Penilaian">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {snapshot.competitions.map((competition) => <MiniMetric key={competition.id} label={competition.name} value={snapshot.criteria.filter((item) => item.competitionId === competition.id).length} helper="Kriteria" />)}
        </div>
      </OperatingCard>
    </OperatingShell>
  )
}

export function TvDisplayMode({ snapshot }: { snapshot: DisplaySnapshot }) {
  return (
    <main className="min-h-screen bg-[#03070d] p-6 text-white">
      <section className="grid min-h-[calc(100vh-48px)] gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-5">
          <DisplayPanel icon={Radio} title="Live Score">
            {snapshot.liveMatches.length ? snapshot.liveMatches.map((match) => <p key={match.id} className="font-display text-5xl leading-none">{match.teamA} {match.scoreA} - {match.scoreB} {match.teamB}</p>) : <p className="font-display text-5xl">Match data not available.</p>}
          </DisplayPanel>
          <DisplayPanel icon={Trophy} title="Nation Ranking">
            <div className="grid gap-2">
              {snapshot.ranking.slice(0, 5).map((row) => <p key={row.country} className="text-2xl font-black">{row.rank}. {row.flag} {row.country} / {row.points} pts</p>)}
            </div>
          </DisplayPanel>
        </div>
        <div className="grid gap-5">
          <DisplayPanel icon={GitBranch} title="Bracket">
            <p className="text-2xl font-black">{snapshot.brackets[0]?.title ?? "Bracket belum dibuat"}</p>
          </DisplayPanel>
          <DisplayPanel icon={BellRing} title="Announcement">
            <p className="text-2xl font-black">{snapshot.announcements[0]?.title ?? "Data Not Published Yet"}</p>
          </DisplayPanel>
        </div>
      </section>
    </main>
  )
}

export function NotificationCenterV2({ notifications }: { notifications: Array<{ id: string; title: string; body: string; type: string; status: string; createdAt: string }> }) {
  return (
    <OperatingShell eyebrow="Notification Center V2" title="Notification Center V2" description="Semua sinyal operasional dari sponsor, match, asset, announcement, jadwal, dan incident critical.">
      <OperatingCard>
        {notifications.length ? <DataTable headings={["Tipe", "Judul", "Isi", "Status", "Waktu"]}>{notifications.map((item) => <tr key={item.id}><Cell>{item.type}</Cell><Cell strong>{item.title}</Cell><Cell>{item.body}</Cell><Cell>{item.status}</Cell><Cell>{formatDate(item.createdAt)}</Cell></tr>)}</DataTable> : <EmptyBlock label="No Data Available" />}
      </OperatingCard>
    </OperatingShell>
  )
}

export function WorkflowAutomationCenter() {
  const steps = ["Jadwal", "Live Match", "Bracket", "Nation Ranking", "Landing Page", "Analytics"]

  return (
    <OperatingShell eyebrow="Workflow Automation" title="Workflow Automation" description="Sekali update skor, live match, bracket, ranking, landing page, dan analytics memakai data yang sama.">
      <OperatingCard>
        <div className="grid gap-3 md:grid-cols-6">
          {steps.map((step, index) => (
            <div key={step} className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-center">
              <p className="mx-auto grid size-10 place-items-center rounded-full bg-[#FFF7ED] font-black text-[#F97316]">{index + 1}</p>
              <p className="mt-3 font-bold text-[#111827]">{step}</p>
            </div>
          ))}
        </div>
      </OperatingCard>
    </OperatingShell>
  )
}

function OperatingShell({ children, description, eyebrow, title }: { children: React.ReactNode; description: string; eyebrow: string; title: string }) {
  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#F97316]">{eyebrow}</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-[#111827]">{title}</h1>
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-[#64748B]">{description}</p>
      </section>
      {children}
    </div>
  )
}

function OperatingCard({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
      {title ? <h2 className="mb-4 font-heading text-xl font-bold text-[#111827]">{title}</h2> : null}
      {children}
    </section>
  )
}

function StatusPill({ status }: { status: OperatingStatus }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", status === "Normal" && "bg-[#DCFCE7] text-[#15803D]", status === "Warning" && "bg-[#FEF3C7] text-[#B45309]", status === "Critical" && "bg-[#FEE2E2] text-[#B91C1C]")}>{status}</span>
}

function SeverityPill({ severity }: { severity: IssueRecord["severity"] }) {
  return <span className={cn("rounded-full px-2 py-1 text-[0.65rem] font-black", severity === "Kritis" && "bg-[#FEE2E2] text-[#B91C1C]", severity === "Tinggi" && "bg-[#FEF3C7] text-[#B45309]", severity === "Sedang" && "bg-[#DBEAFE] text-[#1D4ED8]", severity === "Rendah" && "bg-[#DCFCE7] text-[#15803D]")}>{severity}</span>
}

function IssueList({ issues }: { issues: IssueRecord[] }) {
  if (issues.length === 0) return <EmptyBlock label="No Data Available" />
  return <div className="grid gap-2">{issues.map((issue) => <div key={issue.id} className="rounded-lg border border-[#E5E7EB] p-3"><p className="font-bold text-[#111827]">{issue.issueCode} / {issue.title}</p><p className="mt-1 text-xs font-semibold text-[#64748B]">{issue.severity} / {issue.status} / {issue.deadline}</p></div>)}</div>
}

function DataTable({ children, headings }: { children: React.ReactNode; headings: string[] }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr>{headings.map((heading) => <th key={heading} className="border-b border-[#E5E7EB] px-3 py-3 text-xs font-black uppercase text-[#64748B]">{heading}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
}

function Cell({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return <td className={cn("border-b border-[#F1F5F9] px-3 py-3 text-[#64748B]", strong && "font-bold text-[#111827]")}>{children}</td>
}

function EmptyBlock({ label }: { label: string }) {
  return <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm font-semibold text-[#64748B]">{label}</div>
}

function MiniMetric({ helper, label, value }: { helper?: string; label: string; value: number | string }) {
  return <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4"><p className="text-xs font-black uppercase text-[#64748B]">{label}</p><p className="mt-2 font-heading text-2xl font-bold text-[#111827]">{value}</p>{helper ? <p className="mt-1 text-xs font-semibold text-[#94A3B8]">{helper}</p> : null}</div>
}

function QrCard({ person }: { person: AttendancePerson }) {
  return <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4"><QrCode className="size-8 text-[#F97316]" /><p className="mt-3 font-bold text-[#111827]">{person.name}</p><p className="mt-1 text-xs font-semibold text-[#64748B]">{person.code}</p><p className="mt-1 text-xs font-semibold text-[#64748B]">{person.group} / {person.status}</p></div>
}

export function CertificateVerificationPage({ certificateId }: { certificateId?: string }) {
  return (
    <main className="min-h-screen bg-[#F8FAFC] p-6">
      <section className="mx-auto grid min-h-[calc(100vh-48px)] max-w-2xl place-items-center">
        <div className="w-full rounded-lg border border-[#E5E7EB] bg-white p-6 text-center shadow-sm">
          <BadgeCheck className="mx-auto size-12 text-[#F97316]" />
          <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-[#F97316]">MCS 1 Certificate Verification</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-[#111827]">Verifikasi Sertifikat</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#64748B]">
            {certificateId ? `ID ${certificateId} belum ditemukan pada certificate registry.` : "Masukkan ID sertifikat dari QR untuk memulai verifikasi."}
          </p>
          <form className="mt-5 flex gap-2" action="/verify-certificate">
            <input className={cn(fieldClass, "flex-1")} name="id" placeholder="Certificate ID" defaultValue={certificateId ?? ""} />
            <button className="mcs-button-primary rounded-lg px-4 text-sm font-bold">Verifikasi</button>
          </form>
        </div>
      </section>
    </main>
  )
}

function ActionCard({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-lg border border-[#E5E7EB] bg-white p-4 text-left shadow-sm transition hover:border-[#F97316]"><Icon className="size-5 text-[#F97316]" /><p className="mt-3 font-bold text-[#111827]">{label}</p></button>
}

function DisplayPanel({ children, icon: Icon, title }: { children: React.ReactNode; icon: LucideIcon; title: string }) {
  return <section className="rounded-lg border border-white/12 bg-white/[0.04] p-6"><div className="mb-5 flex items-center gap-3"><Icon className="size-6 text-[#D8B15A]" /><h2 className="font-sport text-xl font-black uppercase">{title}</h2></div>{children}</section>
}

function toIncidentStatus(status: IssueRecord["status"]): IncidentStatus {
  if (status === "Ditugaskan") return "Assigned"
  if (status === "Diproses") return "In Progress"
  if (status === "Eskalasi") return "Escalated"
  if (status === "Selesai") return "Resolved"
  if (status === "Ditutup") return "Closed"
  return "Open"
}

function formatDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
}

const fieldClass = "min-h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-[#111827] outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
