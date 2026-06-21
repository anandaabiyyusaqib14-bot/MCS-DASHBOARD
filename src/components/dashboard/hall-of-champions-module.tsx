"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, Medal, Star, Trophy } from "lucide-react"

import { competitions } from "@/data/mcs"
import { competitionResults } from "@/data/competition-center"
import { cn } from "@/lib/utils"
import { OfficialPartnersSection } from "@/components/site/official-partners"

// ─── Types ────────────────────────────────────────────────────────────────────

type Placement = "champion" | "runner-up" | "third"

type ChampionCard = {
  competitionId: string
  competitionName: string
  category: "Sport Championship" | "Art & Media Stage"
  champion: string | null
  runnerUp: string | null
  thirdPlace: string | null
}

// ─── Static data ──────────────────────────────────────────────────────────────

const competitionDisplayNames: Record<string, { label: string; icon: string; category: "Sport Championship" | "Art & Media Stage" }> = {
  futsal: { label: "Futsal", icon: "⚽", category: "Sport Championship" },
  basket: { label: "Basket 3x3", icon: "🏀", category: "Sport Championship" },
  volly: { label: "Voli", icon: "🏐", category: "Sport Championship" },
  badminton: { label: "Badminton", icon: "🏸", category: "Sport Championship" },
  "mobile-legends": { label: "Mobile Legends", icon: "🎮", category: "Sport Championship" },
  "solo-vokal": { label: "Solo Vokal", icon: "🎤", category: "Art & Media Stage" },
  "canvas-drawing": { label: "Canvas Drawing", icon: "🎨", category: "Art & Media Stage" },
  "best-news-card": { label: "Best News Card", icon: "📰", category: "Art & Media Stage" },
  "best-news-video": { label: "Best News Video", icon: "🎬", category: "Art & Media Stage" },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HallOfChampionsModule() {
  const officialCompetitionIds = competitions.map((c) => c.id)

  const cards: ChampionCard[] = officialCompetitionIds.map((id) => {
    const result = competitionResults.find((r) => r.competitionId === id)
    const meta = competitionDisplayNames[id]

    return {
      competitionId: id,
      competitionName: meta?.label ?? id,
      category: meta?.category ?? "Sport Championship",
      champion: result?.winner ?? null,
      runnerUp: result?.runnerUp ?? null,
      thirdPlace: result?.thirdPlace ?? null,
    }
  })

  const sportCards = cards.filter((c) => c.category === "Sport Championship")
  const artCards = cards.filter((c) => c.category === "Art & Media Stage")
  const publishedCount = cards.filter((c) => c.champion).length
  const totalCount = cards.length

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section className="overflow-hidden rounded-xl border border-[#111827]/20 bg-gradient-to-br from-[#081C3A] via-[#0f2d5e] to-[#081C3A] text-white shadow-[4px_4px_0_rgba(249,115,22,0.15)]">
        <div className="grid p-6 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 items-center gap-1.5 rounded-md border border-[#D8B15A]/40 bg-[#D8B15A]/15 px-2.5 text-xs font-bold text-[#D8B15A]">
                <Trophy className="size-3.5" aria-hidden="true" />
                Hall of Champions
              </span>
              <span className="flex h-7 items-center rounded-md border border-white/20 bg-white/10 px-2.5 text-xs font-bold text-white/80">
                MCS 1 · The Genesis of Excellence
              </span>
            </div>
            <h1 className="mt-4 font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">
              Hall of Champions
            </h1>
            <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-white/70">
              Menampilkan juara resmi dari 9 cabang lomba Melati Championship Series 1. Data diperbarui otomatis saat hasil pertandingan dikonfirmasi.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/live-score"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D8B15A]/60 bg-[#D8B15A] px-3 text-sm font-bold text-[#081C3A] transition hover:bg-white"
              >
                Live Score Center
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/dashboard/nation-ranking"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Nation Ranking
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="mt-5 grid shrink-0 grid-cols-2 gap-3 lg:mt-0 lg:grid-cols-1">
            <StatBadge label="Lomba Selesai" value={`${publishedCount}/${totalCount}`} />
            <StatBadge label="Total Cabang" value={String(totalCount)} />
          </div>
        </div>
      </section>

      {/* Sport Championship */}
      <section>
        <SectionHeading
          icon="🏆"
          title="Sport Championship"
          description="Cabang olahraga dan e-sport MCS 1"
          count={sportCards.length}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sportCards.map((card) => (
            <ChampionCardItem key={card.competitionId} card={card} />
          ))}
        </div>
      </section>

      {/* Art & Media Stage */}
      <section>
        <SectionHeading
          icon="🎭"
          title="Art & Media Stage"
          description="Cabang seni dan media MCS 1"
          count={artCards.length}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {artCards.map((card) => (
            <ChampionCardItem key={card.competitionId} card={card} />
          ))}
        </div>
      </section>

      {/* Footer note */}
      <p className="text-center text-xs font-medium text-[#9CA3AF]">
        Data juara diperbarui secara otomatis saat operator menginput hasil pertandingan. Belum ada data berarti belum ada hasil yang dikonfirmasi.
      </p>
      <OfficialPartnersSection compact className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-10" />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/14 bg-white/8 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/50">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function SectionHeading({
  icon,
  title,
  description,
  count,
}: {
  icon: string
  title: string
  description: string
  count: number
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-[#111827]">
          <span aria-hidden="true">{icon}</span>
          {title}
        </h2>
        <p className="mt-1 text-sm font-medium text-[#6B7280]">{description}</p>
      </div>
      <span className="rounded-full border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-1 text-xs font-bold text-[#6B7280]">
        {count} cabang
      </span>
    </div>
  )
}

function ChampionCardItem({ card }: { card: ChampionCard }) {
  const meta = competitionDisplayNames[card.competitionId]
  const hasResult = card.champion !== null
  const isArtStage = card.category === "Art & Media Stage"

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_rgba(17,24,39,0.1)]",
        hasResult
          ? "border-[#D8B15A]/40 bg-gradient-to-b from-[#FFFBF0] to-white shadow-[2px_2px_0_rgba(216,177,90,0.12)]"
          : "border-[#E5E7EB] bg-white",
      )}
    >
      {/* Competition header */}
      <div
        className={cn(
          "flex items-center gap-3 border-b px-4 py-3",
          hasResult ? "border-[#D8B15A]/25 bg-[#FFF7E6]" : "border-[#E5E7EB] bg-[#F8F9FB]",
          isArtStage && hasResult && "border-[#E0D4F7]/25 bg-[#FAF7FF]",
          isArtStage && !hasResult && "border-[#E5E7EB] bg-[#F8F9FB]",
        )}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-[#E5E7EB] bg-white text-xl shadow-sm">
          {meta?.icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#111827]">{card.competitionName}</p>
          <p className="truncate text-xs font-medium text-[#6B7280]">{card.category}</p>
        </div>
        {hasResult && (
          <Star className="ml-auto size-4 shrink-0 text-[#D8B15A]" fill="currentColor" aria-label="Hasil resmi" />
        )}
      </div>

      {/* Podium slots */}
      <div className="grid gap-2 p-4">
        <PodiumSlot placement="champion" label={card.champion} />
        <PodiumSlot placement="runner-up" label={card.runnerUp} />
        <PodiumSlot placement="third" label={card.thirdPlace} />
      </div>
    </article>
  )
}

function PodiumSlot({ placement, label }: { placement: Placement; label: string | null }) {
  const config = {
    "champion": {
      icon: <Trophy className="size-3.5" aria-hidden="true" />,
      badge: "🥇 Champion",
      badgeClass: "border-[#F59E0B]/40 bg-[#FFFBEB] text-[#92400E]",
      rowClass: "border-[#F59E0B]/30 bg-[#FFFBEB]",
      labelClass: "text-[#111827] font-bold",
    },
    "runner-up": {
      icon: <Medal className="size-3.5" aria-hidden="true" />,
      badge: "🥈 Runner Up",
      badgeClass: "border-[#9CA3AF]/40 bg-[#F9FAFB] text-[#4B5563]",
      rowClass: "border-[#E5E7EB] bg-[#F9FAFB]",
      labelClass: "text-[#374151] font-semibold",
    },
    "third": {
      icon: <Medal className="size-3.5" aria-hidden="true" />,
      badge: "🥉 Third Place",
      badgeClass: "border-[#D97706]/30 bg-[#FFFBF3] text-[#92400E]",
      rowClass: "border-[#E5E7EB] bg-[#FFFBF3]",
      labelClass: "text-[#374151] font-semibold",
    },
  } satisfies Record<Placement, {
    icon: ReactNode
    badge: string
    badgeClass: string
    rowClass: string
    labelClass: string
  }>

  const { badge, badgeClass, rowClass, labelClass } = config[placement]

  return (
    <div
      className={cn(
        "flex min-h-[42px] items-center gap-2.5 rounded-lg border px-3 py-2",
        rowClass,
      )}
    >
      <span
        className={cn(
          "inline-flex h-6 shrink-0 items-center rounded-md border px-2 text-[10px] font-bold",
          badgeClass,
        )}
      >
        {badge}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          label ? labelClass : "text-[#9CA3AF]",
        )}
      >
        {label ?? "Data Not Published Yet"}
      </span>
    </div>
  )
}
