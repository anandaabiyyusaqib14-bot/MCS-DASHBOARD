"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  Activity,
  BarChart3,
  CircleDollarSign,
  Download,
  Globe,
  Handshake,
  Megaphone,
  PieChart,
  Radio,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  brandAssets,
  budgetSummary,
  competitions,
  event,
  mcsNations,
  sponsorProspects,
} from "@/data/mcs"
import { cn } from "@/lib/utils"
import type { DashboardSummary } from "@/server/mcs/types"

type PeriodFilter = "today" | "7d" | "30d" | "event"

type ChartDatum = {
  label: string
  value: number
}

type KpiItem = {
  label: string
  value: string
  helper: string
  icon: typeof Trophy
  tone: "orange" | "blue" | "green" | "red" | "navy" | "gold"
}

const PERIODS: Array<{ key: PeriodFilter; label: string }> = [
  { key: "today", label: "Hari Ini" },
  { key: "7d", label: "7 Hari" },
  { key: "30d", label: "30 Hari" },
  { key: "event", label: "Event" },
]

const CHART_COLORS = ["#F97316", "#0EA5E9", "#22C55E", "#A61D2D", "#D8B15A", "#111827"]

export function AnalyticsCenterScreen({ summary }: { summary: DashboardSummary }) {
  const [period, setPeriod] = useState<PeriodFilter>("event")
  const analytics = useMemo(() => buildAnalytics(summary), [summary])

  return (
    <div className="grid gap-6">
      <section className="mcs-soft-surface mcs-starburst overflow-hidden rounded-2xl p-5 after:-right-5 after:top-4">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="relative z-10 flex min-w-0 gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#111827]/15 bg-[#F97316] text-white shadow-[3px_3px_0_rgba(17,24,39,0.16)]">
              <BarChart3 className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-heading text-2xl font-bold tracking-normal text-[#111827]">ANALYTICS CENTER</h2>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#6B7280]">
                Insight real-time seluruh operasional MCS 1.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
            <div className="inline-grid grid-cols-2 gap-1 rounded-xl border border-[#111827]/10 bg-white p-1 sm:flex">
              {PERIODS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPeriod(item.key)}
                  className={cn(
                    "h-9 rounded-lg px-3 text-xs font-bold text-[#6B7280] transition",
                    period === item.key ? "bg-[#111827] text-white shadow-sm" : "hover:bg-[#FFF7ED] hover:text-[#111827]",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => exportExecutiveReport(analytics, period)}
              className="mcs-button-primary inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition"
            >
              <Download className="size-4" aria-hidden="true" />
              Ekspor Executive Report
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {analytics.kpis.map((item) => (
          <KpiCard key={item.label} item={item} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Panel
          icon={Sparkles}
          title="EXECUTIVE SUMMARY"
          description="Progress gabungan dari lomba, peserta, panitia, sponsor, media, dokumentasi, dan keuangan."
        >
          <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
            <ProgressRing value={analytics.executiveProgress} />
            <div className="grid gap-3">
              {analytics.progressRows.map((row) => (
                <ProgressRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
          </div>
        </Panel>

        <Panel icon={BarChart3} title="PESERTA PER LOMBA" description="Distribusi peserta resmi per kompetisi MCS 1.">
          <ChartBox hasData={analytics.participantChart.some((item) => item.value > 0)} emptyTitle="Belum ada data peserta." emptyDescription="Tunggu pendaftaran peserta dipublikasikan.">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.participantChart} margin={{ bottom: 48, left: -18, right: 10, top: 8 }}>
                <CartesianGrid stroke="#E5E7EB" vertical={false} />
                <XAxis angle={-35} dataKey="label" height={68} interval={0} stroke="#6B7280" textAnchor="end" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis allowDecimals={false} stroke="#6B7280" tick={{ fontSize: 11, fontWeight: 700 }} />
                <Tooltip contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 12 }} />
                <Bar dataKey="value" name="Peserta" radius={[10, 10, 0, 0]}>
                  {analytics.participantChart.map((entry, index) => (
                    <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel icon={PieChart} title="KEHADIRAN PANITIA" description="Komposisi hadir, izin, sakit, alpha, dan on duty.">
          <ChartBox hasData={analytics.attendanceChart.some((item) => item.value > 0)} emptyTitle="Belum ada data kehadiran." emptyDescription="Data presensi panitia akan muncul setelah check-in dipublikasikan.">
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPieChart>
                <Pie data={analytics.attendanceChart} dataKey="value" innerRadius={72} outerRadius={104} paddingAngle={4} nameKey="label">
                  {analytics.attendanceChart.map((entry, index) => (
                    <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 12 }} />
              </RechartsPieChart>
            </ResponsiveContainer>
            <LegendGrid data={analytics.attendanceChart} />
          </ChartBox>
        </Panel>

        <Panel icon={Handshake} title="SPONSOR PERFORMANCE" description="Pipeline sponsor dari data sponsorship resmi.">
          <MetricGrid
            items={[
              ["Total Sponsor", String(analytics.totalSponsors)],
              ["Sponsor Deal", String(analytics.sponsorDeals)],
              ["Sponsor Pending", String(analytics.sponsorPending)],
              ["Total Value", formatCurrency(analytics.sponsorValue)],
            ]}
          />
          <div className="mt-5">
            <ChartTitle title="Sponsor by Category" />
            <ChartBox hasData={analytics.sponsorCategoryChart.some((item) => item.value > 0)} emptyTitle="Kategori sponsor belum tersedia." emptyDescription="Cash, product, dan media partner akan tampil setelah kategori deal resmi diisi.">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.sponsorCategoryChart} margin={{ left: -18, right: 10, top: 8 }}>
                  <CartesianGrid stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="label" stroke="#6B7280" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis allowDecimals={false} stroke="#6B7280" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 12 }} />
                  <Bar dataKey="value" name="Sponsor" fill="#F97316" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel icon={Wallet} title="FINANCIAL ANALYTICS" description="Ikhtisar RAB dan arus keuangan yang sudah resmi tersedia.">
          <MetricGrid
            items={[
              ["Total Pemasukan", analytics.sponsorValue > 0 ? formatCurrency(analytics.sponsorValue) : "Data Not Published Yet"],
              ["Total Pengeluaran", formatCurrency(analytics.estimatedExpense)],
              ["Saldo", analytics.sponsorValue > 0 ? formatCurrency(analytics.sponsorValue - analytics.estimatedExpense) : "Data Not Published Yet"],
              ["Dana Sponsor", analytics.sponsorValue > 0 ? formatCurrency(analytics.sponsorValue) : "Data Not Published Yet"],
            ]}
          />
          <div className="mt-5">
            <ChartTitle title="Arus Keuangan Harian" />
            <ChartBox hasData={analytics.financeTrend.some((item) => item.value > 0)} emptyTitle="Arus keuangan belum tersedia." emptyDescription="Transaksi pemasukan dan pengeluaran harian belum dipublikasikan.">
              <TrendLine data={analytics.financeTrend} name="Nominal" />
            </ChartBox>
          </div>
        </Panel>

        <Panel icon={Megaphone} title="MEDIA PERFORMANCE" description="Publikasi dan performa media internal MCS 1.">
          <MetricGrid
            items={[
              ["Poster", String(analytics.mediaTypeCounts.poster)],
              ["Feed", String(analytics.mediaTypeCounts.feed)],
              ["Story", String(analytics.mediaTypeCounts.story)],
              ["Video", String(analytics.mediaTypeCounts.video)],
            ]}
          />
          <div className="mt-5">
            <ChartTitle title="Publikasi per Platform" />
            <ChartBox hasData={analytics.platformChart.some((item) => item.value > 0)} emptyTitle="Publikasi platform belum tersedia." emptyDescription="Data Instagram, TikTok, dan Website akan muncul setelah konten publikasi dicatat.">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.platformChart} margin={{ left: -18, right: 10, top: 8 }}>
                  <CartesianGrid stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="label" stroke="#6B7280" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis allowDecimals={false} stroke="#6B7280" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 12 }} />
                  <Bar dataKey="value" name="Publikasi" fill="#0EA5E9" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Panel icon={Trophy} title="TOP NATIONS" description="Jumlah juara, poin, dan medali per negara MCS 1.">
          <TopNationsTable rows={analytics.topNations} />
        </Panel>

        <Panel icon={Globe} title="WEBSITE INSIGHT" description="Traffic, page views, registrasi, dan download website MCS 1.">
          <MetricGrid
            items={[
              ["Visitors", "Data Not Published Yet"],
              ["Page Views", "Data Not Published Yet"],
              ["Registrations", analytics.totalParticipants > 0 ? String(analytics.totalParticipants) : "Data Not Published Yet"],
              ["Downloads", "Data Not Published Yet"],
            ]}
          />
          <div className="mt-5">
            <ChartTitle title="Traffic Trend" />
            <ChartBox hasData={analytics.websiteTrend.some((item) => item.value > 0)} emptyTitle="Analytics website belum aktif." emptyDescription="Visitor dan page view akan tampil setelah tracking website dipublikasikan.">
              <TrendLine data={analytics.websiteTrend} name="Visitors" />
            </ChartBox>
          </div>
        </Panel>

        <Panel icon={Trophy} title="COMPETITION ANALYTICS" description="Status lomba, venue, PIC, match, dan progress.">
          <CompetitionTable rows={analytics.competitionRows} />
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Panel icon={Users} title="PANITIA PERFORMANCE" description="Ranking divisi berdasarkan tugas, kehadiran, dan kendala.">
          <DivisionRanking rows={analytics.divisionRows} />
        </Panel>

        <Panel icon={Activity} title="MCS ACTIVITY" description="Timeline aktivitas dari audit, jadwal, tugas, dan publikasi.">
          <ActivityTimeline rows={analytics.activityRows} />
        </Panel>
      </section>

      <Panel icon={Sparkles} title="AUTOMATIC INSIGHT" description="Insight otomatis yang dihitung dari data modul MCS 1 yang tersedia.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {analytics.insights.map((insight) => (
            <article key={insight} className="rounded-2xl border border-[#111827]/10 bg-[#FFF7ED] p-4">
              <p className="text-sm font-semibold leading-6 text-[#111827]">{insight}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function KpiCard({ item }: { item: KpiItem }) {
  const Icon = item.icon

  return (
    <article className="mcs-neo-card min-w-0 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{item.label}</p>
          <p className="mt-3 break-words font-heading text-2xl font-bold tracking-normal text-[#111827]">{item.value}</p>
        </div>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl border", getToneClass(item.tone))}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-[#6B7280]">{item.helper}</p>
    </article>
  )
}

function Panel({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: ReactNode
  description: string
  icon: typeof Trophy
  title: string
}) {
  return (
    <section className="mcs-surface min-w-0 overflow-hidden rounded-2xl">
      <div className="flex items-start gap-3 border-b border-[#111827]/10 px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#111827]/10 bg-[#FFF7ED] text-[#F97316]">
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

function ProgressRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(value, 100))

  return (
    <div className="mx-auto grid size-52 place-items-center rounded-full bg-[#FFF7ED] p-4 shadow-inner">
      <div
        className="grid size-44 place-items-center rounded-full"
        style={{ background: `conic-gradient(#F97316 ${clamped * 3.6}deg, #E5E7EB 0deg)` }}
      >
        <div className="grid size-32 place-items-center rounded-full border border-[#111827]/10 bg-white text-center shadow-sm">
          <div>
            <p className="font-heading text-4xl font-bold text-[#111827]">{clamped}%</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">Progress Event</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#111827]/10 bg-white p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-bold text-[#111827]">{label}</span>
        <span className="font-bold text-[#F97316]">{value}%</span>
      </div>
      <div className="mcs-progress-track mt-3 h-2 rounded-full">
        <div className="h-full rounded-full bg-[#F97316]" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
      </div>
    </div>
  )
}

function ChartBox({
  children,
  emptyDescription,
  emptyTitle,
  hasData,
}: {
  children: ReactNode
  emptyDescription: string
  emptyTitle: string
  hasData: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible) return

    const element = containerRef.current

    if (!element || typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "220px" },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [visible])

  if (!hasData) {
    return <AnalyticsEmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div ref={containerRef} className="min-h-[220px]">
      {visible ? children : <div className="mcs-inset-panel min-h-[220px] rounded-2xl border-dashed" />}
    </div>
  )
}

function AnalyticsEmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="mcs-inset-panel grid min-h-[220px] place-items-center rounded-2xl border-dashed px-5 py-8 text-center">
      <div className="max-w-sm">
        <span className="mcs-empty-mark" aria-hidden="true">
          <span />
          <i />
        </span>
        <p className="text-sm font-bold text-[#111827]">{title}</p>
        <p className="mt-2 text-sm font-medium leading-6 text-[#6B7280]">{description}</p>
        <p className="mt-4 rounded-xl border border-[#111827]/10 bg-white px-3 py-2 text-xs font-bold text-[#111827]">
          CTA: Lengkapi data resmi di modul terkait.
        </p>
      </div>
    </div>
  )
}

function MetricGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-[#111827]/10 bg-[#FFF7ED] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</p>
          <p className="mt-2 break-words text-lg font-bold text-[#111827]">{value}</p>
        </div>
      ))}
    </div>
  )
}

function ChartTitle({ title }: { title: string }) {
  return <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{title}</p>
}

function TrendLine({ data, name }: { data: ChartDatum[]; name: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: -18, right: 12, top: 8 }}>
        <CartesianGrid stroke="#E5E7EB" vertical={false} />
        <XAxis dataKey="label" stroke="#6B7280" tick={{ fontSize: 11, fontWeight: 700 }} />
        <YAxis allowDecimals={false} stroke="#6B7280" tick={{ fontSize: 11, fontWeight: 700 }} />
        <Tooltip contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 12 }} />
        <Line dataKey="value" name={name} stroke="#F97316" strokeWidth={3} dot={{ fill: "#F97316", r: 4 }} type="monotone" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function LegendGrid({ data }: { data: ChartDatum[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {data.map((item, index) => (
        <div key={item.label} className="flex items-center justify-between rounded-xl border border-[#111827]/10 bg-white px-3 py-2 text-sm">
          <span className="flex items-center gap-2 font-semibold text-[#111827]">
            <span className="size-2.5 rounded-full" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
            {item.label}
          </span>
          <span className="font-bold text-[#6B7280]">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function CompetitionTable({ rows }: { rows: ReturnType<typeof buildAnalytics>["competitionRows"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">
            {["Lomba", "Peserta", "Match", "Venue", "PIC", "Status", "Progress"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-bold text-[#111827]">{row.name}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#64748B]">{row.participants}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#64748B]">{row.matches}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{row.venue}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 text-[#64748B]">{row.pic}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4">
                <StatusPill label={row.status} />
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 last:pr-0">
                <div className="flex min-w-32 items-center gap-2">
                  <div className="mcs-progress-track h-2 flex-1 rounded-full">
                    <div className="h-full rounded-full bg-[#F97316]" style={{ width: `${row.progress}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs font-bold text-[#6B7280]">{row.progress}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DivisionRanking({ rows }: { rows: ReturnType<typeof buildAnalytics>["divisionRows"] }) {
  return (
    <div className="grid gap-3">
      {rows.map((row, index) => (
        <article key={row.name} className="rounded-2xl border border-[#111827]/10 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#111827]">{index + 1}. {row.name}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#6B7280]">
                Selesai {row.completedTasks} / aktif {row.activeTasks} / hadir {row.attendanceRate}% / kendala {row.issues}
              </p>
            </div>
            <p className="font-heading text-2xl font-bold text-[#F97316]">{row.score}</p>
          </div>
          <div className="mcs-progress-track mt-3 h-2 rounded-full">
            <div className="h-full rounded-full bg-[#0EA5E9]" style={{ width: `${row.score}%` }} />
          </div>
        </article>
      ))}
    </div>
  )
}

function TopNationsTable({ rows }: { rows: ReturnType<typeof buildAnalytics>["topNations"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">
            {["Nation", "Juara", "Poin", "Medali"].map((heading) => (
              <th key={heading} className="border-b border-[#E5E7EB] px-4 py-3 first:pl-0 last:pr-0">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.countryName}>
              <td className="border-b border-[#F1F5F9] px-4 py-4 first:pl-0 font-bold text-[#111827]">
                <span className="mr-2" aria-hidden="true">{row.countryFlag}</span>
                {row.countryName}
              </td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#64748B]">{row.champions}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#64748B]">{row.points}</td>
              <td className="border-b border-[#F1F5F9] px-4 py-4 font-semibold text-[#64748B]">{row.medals}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs font-semibold text-[#6B7280]">Data juara, poin, dan medali akan bertambah setelah hasil resmi dipublikasikan.</p>
    </div>
  )
}

function ActivityTimeline({ rows }: { rows: ReturnType<typeof buildAnalytics>["activityRows"] }) {
  if (rows.length === 0) {
    return (
      <AnalyticsEmptyState
        title="Belum ada aktivitas event."
        description="Aktivitas sistem, jadwal, publikasi, dan update modul akan tampil setelah ada catatan resmi."
      />
    )
  }

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <article key={`${row.time}-${row.title}`} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-2xl border border-[#111827]/10 bg-white p-4">
          <p className="font-mono text-sm font-bold text-[#F97316]">{row.time}</p>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#111827]">{row.title}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#6B7280]">{row.detail}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex h-7 w-fit items-center rounded-lg border border-[#111827]/10 bg-[#FFF7ED] px-2.5 text-xs font-bold text-[#111827]">
      {label}
    </span>
  )
}

function buildAnalytics(summary: DashboardSummary) {
  const competitionById = new Map(summary.activeCompetitions.map((item) => [item.id, item]))
  const totalSponsors = sponsorProspects.length
  const sponsorDeals = sponsorProspects.filter((item) => item.pipelineStatus === "Confirmed" || item.proposalStatus === "Confirmed").length
  const sponsorPending = sponsorProspects.filter((item) => item.pipelineStatus !== "Confirmed" && item.pipelineStatus !== "Rejected").length
  const sponsorValue = sponsorProspects.reduce((total, item) => total + (item.receivedAmount ?? 0), 0)
  const estimatedExpense = budgetSummary.totalMaxAmount
  const totalPanitia = summary.metrics.totalPanitia
  const attendanceTotal = summary.committeeStatus.reduce(
    (state, division) => ({
      absent: state.absent + division.absent,
      excused: state.excused + division.excused,
      late: state.late + division.late,
      present: state.present + division.present,
    }),
    { absent: 0, excused: 0, late: 0, present: 0 },
  )
  const documentationProgress = summary.metrics.mediaUploaded > 0 ? 100 : 0
  const financeProgress = estimatedExpense > 0 ? 60 : 0
  const sponsorProgress = totalSponsors > 0 ? Math.round((sponsorDeals / totalSponsors) * 100) : 0
  const panitiaProgress = summary.metrics.attendanceRate
  const progressRows = [
    { label: "Lomba", value: summary.metrics.eventProgress },
    { label: "Peserta", value: summary.metrics.totalParticipants > 0 ? 100 : 0 },
    { label: "Panitia", value: panitiaProgress },
    { label: "Sponsor", value: sponsorProgress },
    { label: "Media", value: summary.metrics.mediaUploaded > 0 ? 100 : 0 },
    { label: "Dokumentasi", value: documentationProgress },
    { label: "Keuangan", value: financeProgress },
  ]
  const executiveProgress = Math.round(progressRows.reduce((total, item) => total + item.value, 0) / progressRows.length)
  const participantChart = competitions.map((competition) => ({
    label: competition.shortName,
    value: competitionById.get(competition.id)?.participantCount ?? 0,
  }))
  const attendanceChart = [
    { label: "Hadir", value: attendanceTotal.present },
    { label: "Izin", value: attendanceTotal.excused },
    { label: "Sakit", value: 0 },
    { label: "Alpha", value: attendanceTotal.absent },
    { label: "On Duty", value: summary.metrics.onDutyPanitia },
  ]
  const sponsorCategoryChart = [
    { label: "Cash", value: sponsorProspects.filter((item) => (item.receivedAmount ?? 0) > 0).length },
    { label: "Product", value: 0 },
    { label: "Media Partner", value: 0 },
  ]
  const mediaTypeCounts = {
    feed: 0,
    poster: 0,
    story: 0,
    video: summary.metrics.mediaUploaded,
  }
  const platformChart = [
    { label: "Instagram", value: 0 },
    { label: "TikTok", value: 0 },
    { label: "Website", value: 0 },
  ]
  const financeTrend = buildEmptyTrend()
  const websiteTrend = buildEmptyTrend()
  const competitionRows = competitions.map((competition) => {
    const record = competitionById.get(competition.id)
    const matchCount = summary.liveMatches.filter((match) => match.competitionId === competition.id).length

    return {
      id: competition.id,
      matches: matchCount,
      name: competition.shortName,
      participants: record?.participantCount ?? 0,
      pic: competition.pj.join(", "),
      progress: record?.progress ?? 0,
      status: record?.status ?? "draft",
      venue: competition.venue,
    }
  })
  const topNations = mcsNations.map((nation) => ({
    champions: 0,
    countryFlag: nation.countryFlag,
    countryName: nation.countryName,
    medals: 0,
    points: 0,
  }))
  const divisionRows = summary.committeeStatus
    .map((division) => {
      const completed = summary.upcomingTasks.filter((task) => task.divisionId === division.id && task.status === "Completed").length
      const issueCount = summary.activeIssues.filter((issue) => issue.assignedDivisionId === division.id).length
      const attendanceRate = Math.round((division.present / Math.max(division.members, 1)) * 100)
      const score = Math.round((division.completion + attendanceRate + division.responsiveness - issueCount * 5) / 3)

      return {
        activeTasks: division.activeTasks,
        attendanceRate,
        completedTasks: completed,
        issues: issueCount,
        name: division.name,
        score: Math.max(0, Math.min(score, 100)),
      }
    })
    .sort((first, second) => second.score - first.score)
  const activityRows = [
    ...summary.auditPreview.map((item) => ({
      detail: `${item.userName} / ${item.resource}`,
      time: formatActivityTime(item.timestamp),
      title: item.action,
    })),
    ...summary.todaySchedule.slice(0, 4).map((item) => ({
      detail: `${item.venue} / PIC: ${item.pic}`,
      time: formatScheduleTime(item.time),
      title: item.title,
    })),
  ].slice(0, 8)
  const topDivision = divisionRows[0]
  const insights = [
    summary.metrics.totalParticipants > 0
      ? `Total peserta resmi saat ini ${summary.metrics.totalParticipants} peserta.`
      : "Data peserta resmi belum dipublikasikan.",
    sponsorDeals > 0
      ? `Sponsor deal tercatat ${sponsorDeals} dari ${totalSponsors} prospek.`
      : `Sponsor deal belum tercatat; ${sponsorPending} prospek masih pending.`,
    `Kehadiran panitia mencapai ${summary.metrics.attendanceRate}% dari ${totalPanitia} panitia aktif.`,
    topDivision ? `Divisi ${topDivision.name} menjadi divisi paling aktif dengan skor ${topDivision.score}.` : "Ranking divisi belum tersedia.",
  ]
  const kpis: KpiItem[] = [
    { helper: "Kompetisi resmi MCS 1.", icon: Trophy, label: "TOTAL LOMBA", tone: "navy", value: String(competitions.length) },
    { helper: "Peserta resmi yang sudah tercatat.", icon: UserCheck, label: "TOTAL PESERTA", tone: "blue", value: summary.metrics.totalParticipants > 0 ? String(summary.metrics.totalParticipants) : "Data Not Published Yet" },
    { helper: "Total anggota panitia aktif.", icon: Users, label: "TOTAL PANITIA", tone: "green", value: String(totalPanitia) },
    { helper: "Rasio panitia hadir.", icon: Activity, label: "KEHADIRAN", tone: "orange", value: `${summary.metrics.attendanceRate}%` },
    { helper: "Sponsor dengan status confirmed.", icon: Handshake, label: "SPONSOR DEAL", tone: "gold", value: String(sponsorDeals) },
    { helper: "Nilai sponsor yang sudah diterima.", icon: CircleDollarSign, label: "TOTAL NILAI SPONSOR", tone: "green", value: sponsorValue > 0 ? formatCurrency(sponsorValue) : "Data Not Published Yet" },
    { helper: "Konten media yang tersedia untuk role ini.", icon: Radio, label: "MEDIA TERBIT", tone: "red", value: summary.metrics.mediaUploaded > 0 ? String(summary.metrics.mediaUploaded) : "Data Not Published Yet" },
    { helper: "Visitor website resmi.", icon: Globe, label: "AKTIVITAS WEBSITE", tone: "blue", value: "Data Not Published Yet" },
  ]

  return {
    activityRows,
    attendanceChart,
    competitionRows,
    divisionRows,
    estimatedExpense,
    executiveProgress,
    financeTrend,
    insights,
    kpis,
    mediaTypeCounts,
    participantChart,
    platformChart,
    progressRows,
    sponsorCategoryChart,
    sponsorDeals,
    sponsorPending,
    sponsorValue,
    topNations,
    totalParticipants: summary.metrics.totalParticipants,
    totalSponsors,
    websiteTrend,
  }
}

function buildEmptyTrend() {
  return ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "Hari Ini"].map((label) => ({ label, value: 0 }))
}

async function exportExecutiveReport(analytics: ReturnType<typeof buildAnalytics>, period: PeriodFilter) {
  const { jsPDF } = await import("jspdf")
  const autoTableModule = await import("jspdf-autotable")
  const autoTable = autoTableModule.default ?? autoTableModule.autoTable
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
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
  doc.setFontSize(28)
  doc.text("Executive Analytics Report", 48, 214)
  doc.setFontSize(22)
  doc.text("MCS 1", 48, 254)
  doc.setFontSize(14)
  doc.text(event.theme, 48, 284)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Periode: ${PERIODS.find((item) => item.key === period)?.label ?? "Event"}`, 48, 320)
  doc.text(`Exported by MCS Dashboard / ${formatLongDate(new Date())}`, 48, 338)

  addPdfPage(doc, "HALAMAN 1 - Executive Summary")
  autoTable(doc, {
    body: [
      ["Progress Event", `${analytics.executiveProgress}%`],
      ["Total Lomba", competitions.length],
      ["Total Peserta", analytics.totalParticipants || "Data Not Published Yet"],
      ["Total Panitia", analytics.kpis.find((item) => item.label === "TOTAL PANITIA")?.value ?? "-"],
      ["Kehadiran", analytics.kpis.find((item) => item.label === "KEHADIRAN")?.value ?? "-"],
    ],
    head: [["Metric", "Value"]],
    headStyles: pdfHeadStyle(),
    margin: pdfMargin(),
    styles: pdfStyle(),
  })

  addPdfPage(doc, "HALAMAN 2 - Analytics Peserta")
  autoTable(doc, {
    body: analytics.competitionRows.map((row) => [row.name, row.participants, row.matches, row.venue, row.status, `${row.progress}%`]),
    head: [["Lomba", "Peserta", "Match", "Venue", "Status", "Progress"]],
    headStyles: pdfHeadStyle(),
    margin: pdfMargin(),
    styles: pdfStyle(),
    alternateRowStyles: pdfAltStyle(),
  })

  addPdfPage(doc, "HALAMAN 3 - Analytics Sponsor")
  autoTable(doc, {
    body: [
      ["Total Sponsor", analytics.totalSponsors],
      ["Sponsor Deal", analytics.sponsorDeals],
      ["Sponsor Pending", analytics.sponsorPending],
      ["Total Value", analytics.sponsorValue > 0 ? formatCurrency(analytics.sponsorValue) : "Data Not Published Yet"],
    ],
    head: [["Metric", "Value"]],
    headStyles: pdfHeadStyle(),
    margin: pdfMargin(),
    styles: pdfStyle(),
  })

  addPdfPage(doc, "HALAMAN 4 - Analytics Keuangan")
  autoTable(doc, {
    body: [
      ["Total Pemasukan", analytics.sponsorValue > 0 ? formatCurrency(analytics.sponsorValue) : "Data Not Published Yet"],
      ["Total Pengeluaran", formatCurrency(analytics.estimatedExpense)],
      ["Saldo", analytics.sponsorValue > 0 ? formatCurrency(analytics.sponsorValue - analytics.estimatedExpense) : "Data Not Published Yet"],
      ["Dana Sponsor", analytics.sponsorValue > 0 ? formatCurrency(analytics.sponsorValue) : "Data Not Published Yet"],
    ],
    head: [["Metric", "Value"]],
    headStyles: pdfHeadStyle(),
    margin: pdfMargin(),
    styles: pdfStyle(),
  })

  addPdfPage(doc, "HALAMAN 5 - Analytics Media")
  autoTable(doc, {
    body: Object.entries(analytics.mediaTypeCounts).map(([key, value]) => [key, value]),
    head: [["Type", "Count"]],
    headStyles: pdfHeadStyle(),
    margin: pdfMargin(),
    styles: pdfStyle(),
  })

  addPdfPage(doc, "HALAMAN 6 - Analytics Website")
  autoTable(doc, {
    body: [
      ["Visitors", "Data Not Published Yet"],
      ["Page Views", "Data Not Published Yet"],
      ["Registrations", analytics.totalParticipants || "Data Not Published Yet"],
      ["Downloads", "Data Not Published Yet"],
    ],
    head: [["Metric", "Value"]],
    headStyles: pdfHeadStyle(),
    margin: pdfMargin(),
    styles: pdfStyle(),
  })

  addPdfPage(doc, "HALAMAN 7 - Analytics Panitia")
  autoTable(doc, {
    body: analytics.divisionRows.map((row) => [row.name, row.completedTasks, row.activeTasks, `${row.attendanceRate}%`, row.issues, row.score]),
    head: [["Divisi", "Tugas Selesai", "Tugas Aktif", "Kehadiran", "Kendala", "Skor"]],
    headStyles: pdfHeadStyle(),
    margin: pdfMargin(),
    styles: pdfStyle(),
    alternateRowStyles: pdfAltStyle(),
  })

  addPdfPage(doc, "HALAMAN 8 - Kesimpulan")
  autoTable(doc, {
    body: analytics.insights.map((insight, index) => [`Insight ${index + 1}`, insight]),
    head: [["Ringkasan", "Catatan"]],
    headStyles: pdfHeadStyle(),
    margin: pdfMargin(),
    styles: pdfStyle(),
  })

  const totalPages = doc.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text("Exported by MCS Dashboard", 40, pageHeight - 28)
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - 94, pageHeight - 28)
  }

  doc.save("mcs-1-executive-analytics-report.pdf")
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

function pdfHeadStyle() {
  return { fillColor: [249, 115, 22] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] }
}

function pdfStyle() {
  return { cellPadding: 8, fontSize: 9 }
}

function pdfAltStyle() {
  return { fillColor: [255, 247, 237] as [number, number, number] }
}

function pdfMargin() {
  return { left: 40, right: 40, top: 120 }
}

function getToneClass(tone: KpiItem["tone"]) {
  if (tone === "blue") return "border-[#BAE6FD] bg-[#EFF6FF] text-[#0EA5E9]"
  if (tone === "green") return "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]"
  if (tone === "red") return "border-[#FECACA] bg-[#FEF2F2] text-[#A61D2D]"
  if (tone === "gold") return "border-[#FEF3C7] bg-[#FFFBEB] text-[#92400E]"
  if (tone === "navy") return "border-[#111827] bg-[#111827] text-white"
  return "border-[#FED7AA] bg-[#FFF7ED] text-[#F97316]"
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    currency: "IDR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value)
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date)
}

function formatActivityTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "--:--"

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date)
}

function formatScheduleTime(time: string) {
  return time.replace(".", ":")
}
