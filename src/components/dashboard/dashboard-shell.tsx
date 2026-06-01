"use client"

import Image from "next/image"
import Link from "next/link"
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  announcements,
  brandAssets,
  committee,
  competitions,
  dashboardFootage,
  event,
  initialLiveMatches,
  scheduleDays,
  type Announcement,
} from "@/data/mcs"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Competition Hub", href: "/dashboard/tournament" },
  { label: "Schedule", href: "/dashboard" },
  { label: "Media Center", href: "/dashboard" },
  { label: "Panitia", href: "/dashboard/panitia" },
  { label: "Announcements", href: "/dashboard/announcements" },
  { label: "Analytics", href: "/dashboard" },
]

const timelineItems = scheduleDays[0].items.slice(0, 7)
const liveMatches = initialLiveMatches.slice(0, 4)
const newsroomUpdates = [
  { time: "08:05", title: "Opening Ceremony Started", detail: "MC membuka rangkaian MCS 1 di lapangan utama." },
  { time: "08:12", title: "Humas Uploaded New Photos", detail: "Dokumentasi basket dan supporter masuk ke media center." },
  { time: "08:15", title: "Futsal Match Started", detail: "Round of 16 putra dimulai di Lapangan A." },
  { time: "08:18", title: "Score Updated", detail: "Live desk memperbarui skor pertandingan basket." },
  { time: "08:22", title: "Announcement Published", detail: "Briefing panitia lapangan dikirim ke seluruh divisi." },
]

const operations = [
  { label: "55+ Panitia", value: `${committee.length + 49}`, icon: Users },
  { label: "Divisi Aktif", value: "8", icon: ShieldCheck },
  { label: "Task Completion", value: "78%", icon: CheckCircle2 },
  { label: "Attendance", value: "92%", icon: BarChart3 },
]

const quickAccess = [
  { title: "Competition Hub", href: "/dashboard/tournament", kicker: "Brackets, scores, live status" },
  { title: "Schedule Center", href: "/dashboard", kicker: "Rundown, venues, match blocks" },
  { title: "Media Center", href: "/dashboard/live-match", kicker: "Photos, highlights, broadcast feed" },
  { title: "Panitia Center", href: "/dashboard/panitia", kicker: "Committee, tasks, attendance" },
  { title: "Announcement Center", href: "/dashboard/announcements", kicker: "Urgent updates and newsroom" },
]

export function DashboardShell() {
  const featuredMatch = liveMatches[0]
  const featuredImage = dashboardFootage[1] ?? dashboardFootage[0]
  const mediaItems = dashboardFootage.slice(0, 6)
  const featuredAnnouncements = announcements.slice(0, 3)

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#03070d] text-white">
      <TopNavigation />

      <section className="relative min-h-[760px] overflow-hidden pt-24 sm:min-h-[820px] lg:min-h-[calc(100vh-80px)]">
        <Image
          src={featuredImage.src}
          alt={featuredImage.label}
          fill
          priority
          sizes="100vw"
          className={cn("scale-[1.04] object-cover", featuredImage.crop)}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,13,0.98),rgba(3,7,13,0.86)_38%,rgba(3,7,13,0.42)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,13,0.2),rgba(3,7,13,0.44)_58%,#03070d)]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.82)_0.65px,transparent_0.7px)] [background-size:4px_4px]" />

        <div className="relative z-10 mx-auto flex min-h-[calc(760px-96px)] w-full min-w-0 max-w-[1500px] flex-col justify-between px-5 pb-8 pt-8 sm:px-8 lg:min-h-[calc(100vh-104px)] lg:px-10">
          <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="w-[calc(100vw-2.5rem)] min-w-0 max-w-[940px] sm:w-auto">
              <span className="inline-flex items-center gap-2 border border-white/12 bg-white/[0.06] px-3 py-2 font-sport text-[0.66rem] font-black uppercase tracking-[0.2em] text-[color:var(--mcs-gold-soft)] backdrop-blur-sm">
                <Radio className="size-4" />
                Live Now
              </span>
              <h1 className="mt-6 font-display text-[6rem] leading-[0.8] sm:text-[9rem] lg:text-[12rem]">
                MCS <span className="text-[color:var(--mcs-red)]">1</span>
              </h1>
              <p className="mt-5 max-w-[760px] font-display text-[3.7rem] leading-[0.88] sm:text-[6.5rem] lg:text-[8rem]">
                TODAY AT MCS
              </p>
              <p className="mt-5 max-w-full break-words font-sport text-2xl font-black uppercase leading-tight text-[color:var(--mcs-gold-soft)] sm:text-4xl">
                {event.theme}
              </p>
              <div className="mt-8 grid max-w-4xl gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.42fr)]">
                <p className="max-w-full break-words text-sm font-semibold leading-7 text-white/74 sm:max-w-2xl sm:text-base">
                  A cinematic championship operating center for live competition, media coverage,
                  panitia coordination, and official MCS 1 announcements.
                </p>
                <div className="border-l border-white/14 pl-5">
                  <p className="font-sport text-[0.7rem] font-black uppercase tracking-[0.18em] text-white/42">Day Status</p>
                  <p className="mt-2 font-display text-5xl leading-none text-white">DAY 2 OF 4</p>
                </div>
              </div>
            </div>

            <div className="w-[calc(100vw-2.5rem)] min-w-0 max-w-full overflow-hidden border-y border-white/12 bg-[#050b13]/58 p-5 backdrop-blur-md sm:w-auto lg:mt-16">
              <p className="font-sport text-xs font-black uppercase tracking-[0.18em] text-[color:var(--mcs-gold-soft)]">
                {featuredMatch.sport} Putra
              </p>
              <p className="mt-2 font-display text-5xl leading-none text-white">{featuredMatch.round}</p>
              <div className="mt-5 grid gap-3">
                <FeaturedScoreRow name={featuredMatch.teamA} score={featuredMatch.scoreA} />
                <FeaturedScoreRow name={featuredMatch.teamB} score={featuredMatch.scoreB} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm">
                <InfoLine label="Venue" value={featuredMatch.venue} />
                <InfoLine label="Clock" value={featuredMatch.clock} align="right" />
              </div>
            </div>
          </div>

          <div className="grid w-[calc(100vw-2.5rem)] border-y border-white/12 bg-[#050b13]/62 backdrop-blur-md sm:w-full sm:grid-cols-2 lg:grid-cols-4">
            <HeroMetric label="Live Focus" value="Futsal Putra" />
            <HeroMetric label="Competitions" value={`${competitions.length} Categories`} />
            <HeroMetric label="Venue" value="Lapangan A" />
            <HeroMetric label="Event Countdown" value="03D 14H 27M" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1500px] gap-20 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <section className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionIntro
            eyebrow="Event Rundown"
            title="TODAY AT MCS"
            body="Timeline editorial untuk melihat ritme acara hari ini tanpa rasa tabel admin."
          />
          <EditorialTimeline items={timelineItems} />
        </section>

        <section className="grid gap-8">
          <SectionIntro
            eyebrow="Broadcast Match Desk"
            title="LIVE COMPETITIONS"
            body="Panel pertandingan dibuat seperti broadcast desk, bukan tabel statistik padat."
            wide
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {liveMatches.map((match) => (
              <LiveCompetitionPanel key={match.id} match={match} />
            ))}
          </div>
        </section>

        <section className="grid gap-10 xl:grid-cols-[0.92fr_1.08fr]">
          <NewsroomFeed />
          <MediaHighlights items={mediaItems} />
        </section>

        <section className="grid gap-10 xl:grid-cols-[1.05fr_0.95fr]">
          <AnnouncementsBoard announcements={featuredAnnouncements} />
          <PanitiaStatus />
        </section>

        <section className="grid gap-8">
          <SectionIntro
            eyebrow="Operating Shortcuts"
            title="QUICK ACCESS"
            body="Shortcut besar untuk masuk ke pusat kerja utama tanpa sidebar permanen."
            wide
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {quickAccess.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group min-h-44 border-y border-white/12 bg-white/[0.035] p-5 transition hover:bg-white/[0.07]"
              >
                <p className="font-sport text-[0.64rem] font-black uppercase tracking-[0.18em] text-[color:var(--mcs-gold-soft)]">
                  MCS Center
                </p>
                <p className="mt-6 font-display text-4xl leading-none text-white">{item.title}</p>
                <p className="mt-4 text-sm leading-6 text-white/52">{item.kicker}</p>
                <ChevronRight className="mt-5 size-5 text-white/38 transition group-hover:translate-x-1 group-hover:text-white" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function TopNavigation() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#050b13]/82 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2">
            {brandAssets.map((asset) => (
              <span key={asset.name} className="relative grid size-10 place-items-center rounded-md bg-white p-1.5 sm:size-11">
                <Image src={asset.src} alt={asset.name} width={38} height={38} className="max-h-full w-auto object-contain" />
              </span>
            ))}
          </div>
          <span className="hidden font-display text-3xl leading-none text-white sm:inline">MCS 1</span>
        </Link>

        <nav className="hidden flex-1 justify-center gap-5 overflow-x-auto px-4 font-sport text-[0.68rem] font-black uppercase tracking-[0.08em] text-white/58 lg:flex xl:gap-7">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="whitespace-nowrap transition hover:text-[color:var(--mcs-gold-soft)]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden border-r border-white/12 pr-4 text-right md:block">
            <p className="font-sport text-[0.62rem] font-black uppercase tracking-[0.16em] text-white/42">Countdown</p>
            <p className="font-mono text-sm font-black text-[color:var(--mcs-gold-soft)]">03:14:27:51</p>
          </div>
          <button className="relative grid size-10 place-items-center rounded-md border border-white/12 bg-white/[0.04] text-white/72">
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-[color:var(--mcs-red)]" />
          </button>
          <Avatar className="hidden size-10 rounded-md border border-white/12 min-[420px]:block">
            <AvatarFallback className="rounded-md bg-[color:var(--mcs-red)] font-sport text-xs font-black text-white">SA</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <nav className="flex gap-5 overflow-x-auto border-t border-white/8 px-5 py-3 font-sport text-[0.68rem] font-black uppercase tracking-[0.08em] text-white/58 lg:hidden">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} className="whitespace-nowrap">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}

function SectionIntro({
  eyebrow,
  title,
  body,
  wide = false,
}: {
  eyebrow: string
  title: string
  body: string
  wide?: boolean
}) {
  return (
    <div className={cn("max-w-xl", wide && "max-w-3xl")}>
      <p className="font-sport text-xs font-black uppercase tracking-[0.2em] text-[color:var(--mcs-red)]">{eyebrow}</p>
      <h2 className="mt-4 font-display text-6xl leading-none text-white sm:text-8xl">{title}</h2>
      <p className="mt-4 text-base font-semibold leading-7 text-white/58">{body}</p>
    </div>
  )
}

function EditorialTimeline({ items }: { items: typeof timelineItems }) {
  return (
    <div className="border-y border-white/12">
      {items.map((item) => (
        <div key={`${item.time}-${item.title}`} className="grid gap-3 border-b border-white/10 py-5 last:border-b-0 sm:grid-cols-[90px_minmax(0,1fr)_180px]">
          <p className="font-mono text-xl font-black text-[color:var(--mcs-gold-soft)]">{item.time}</p>
          <div>
            <p className="font-sport text-lg font-black uppercase text-white">{item.title}</p>
            <p className="mt-1 text-sm text-white/52">{item.pic}</p>
          </div>
          <p className="font-sport text-sm font-bold uppercase text-white/52 sm:text-right">{item.venue}</p>
        </div>
      ))}
    </div>
  )
}

function LiveCompetitionPanel({ match }: { match: (typeof liveMatches)[number] }) {
  return (
    <article className="min-h-64 border-y border-white/12 bg-white/[0.035] p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 font-sport text-xs font-black uppercase text-[color:var(--mcs-red)]">
          <span className="size-2 rounded-full bg-[color:var(--mcs-red)]" />
          Live
        </span>
        <span className="font-mono text-xs text-white/44">{match.clock}</span>
      </div>
      <p className="mt-7 font-display text-5xl leading-none text-white">{match.sport}</p>
      <p className="mt-2 font-sport text-xs font-black uppercase tracking-[0.14em] text-[color:var(--mcs-gold-soft)]">{match.round}</p>
      <div className="mt-8 grid grid-cols-1 items-end gap-4 overflow-hidden sm:grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] sm:gap-3">
        <ScoreSide name={match.teamA} score={match.scoreA} />
        <span className="hidden pb-2 font-display text-2xl text-white/30 sm:block">-</span>
        <ScoreSide name={match.teamB} score={match.scoreB} align="right" />
      </div>
      <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-white/54">
        <span>{match.venue}</span>
        <span>{match.category}</span>
      </div>
    </article>
  )
}

function NewsroomFeed() {
  return (
    <section>
      <SectionIntro
        eyebrow="Newsroom Updates"
        title="EVENT OPERATIONS"
        body="Realtime operational feed dengan rasa newsroom, bukan notification widget."
      />
      <div className="mt-8 border-y border-white/12">
        {newsroomUpdates.map((item) => (
          <div key={`${item.time}-${item.title}`} className="grid gap-3 border-b border-white/10 py-5 last:border-b-0 sm:grid-cols-[72px_1fr]">
            <p className="font-mono text-sm font-black text-[color:var(--mcs-gold-soft)]">{item.time}</p>
            <div>
              <p className="font-sport text-base font-black uppercase text-white">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-white/52">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function MediaHighlights({ items }: { items: typeof dashboardFootage }) {
  return (
    <section>
      <SectionIntro
        eyebrow="Documentation"
        title="MEDIA HIGHLIGHTS"
        body="Masonry footage dari pertandingan, supporter, dan panggung seni MCS."
      />
      <div className="mt-8 grid auto-rows-[170px] gap-3 sm:grid-cols-3">
        {items.map((item, index) => (
          <article
            key={item.id}
            className={cn(
              "group relative overflow-hidden",
              index === 0 && "sm:col-span-2 sm:row-span-2",
              index === 3 && "sm:row-span-2"
            )}
          >
            <Image src={item.src} alt={item.label} fill sizes="(min-width: 1280px) 24vw, 100vw" className={cn("object-cover transition duration-500 group-hover:scale-105", item.crop)} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(3,7,13,0.92))]" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="font-display text-3xl leading-none text-white">{item.label}</p>
              <p className="mt-1 text-xs font-semibold uppercase text-[color:var(--mcs-gold-soft)]">{item.type}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function AnnouncementsBoard({ announcements }: { announcements: Announcement[] }) {
  return (
    <section>
      <SectionIntro
        eyebrow="Newsroom Board"
        title="ANNOUNCEMENTS"
        body="Pengumuman tampil seperti editorial bulletin untuk keputusan operasional."
      />
      <div className="mt-8 border-y border-white/12">
        {announcements.map((announcement, index) => (
          <article key={announcement.id} className="grid gap-3 border-b border-white/10 py-5 last:border-b-0 sm:grid-cols-[120px_1fr]">
            <p className={cn("font-sport text-sm font-black uppercase tracking-[0.14em]", index === 0 ? "text-[color:var(--mcs-red)]" : "text-[color:var(--mcs-gold-soft)]")}>
              {index === 0 ? "Urgent" : index === 1 ? "Important" : "Info"}
            </p>
            <div>
              <p className="font-sport text-lg font-black uppercase text-white">{announcement.title}</p>
              <p className="mt-2 text-sm leading-6 text-white/56">{announcement.body}</p>
              <p className="mt-3 font-mono text-xs text-white/38">{announcement.time}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function PanitiaStatus() {
  return (
    <section>
      <SectionIntro
        eyebrow="Committee Signal"
        title="PANITIA STATUS"
        body="Ringkasan operasional yang ringan, fokus, dan mudah dipindai."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {operations.map((item) => (
          <div key={item.label} className="border-y border-white/12 bg-white/[0.035] p-5">
            <item.icon className="size-5 text-[color:var(--mcs-gold-soft)]" />
            <p className="mt-6 font-display text-5xl leading-none text-white">{item.value}</p>
            <p className="mt-2 font-sport text-xs font-black uppercase tracking-[0.14em] text-white/46">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 border-y border-white/12 p-5">
        <div className="mb-3 flex items-center justify-between text-sm text-white/58">
          <span>Task Completion</span>
          <span>78%</span>
        </div>
        <Progress value={78} className="h-2 bg-white/10" />
      </div>
    </section>
  )
}

function ScoreSide({ name, score, align = "left" }: { name: string; score: number; align?: "left" | "right" }) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className="truncate font-sport text-xs font-black uppercase text-white/52">{name}</p>
      <p className="mt-2 font-display text-4xl leading-none text-white min-[420px]:text-5xl sm:text-6xl">{score}</p>
    </div>
  )
}

function FeaturedScoreRow({ name, score }: { name: string; score: number }) {
  return (
    <div className="grid min-w-0 gap-2 border-b border-white/10 pb-3 last:border-b-0">
      <p className="min-w-0 truncate font-sport text-xs font-black uppercase text-white/52">{name}</p>
      <p className="font-display text-5xl leading-none text-white">{score}</p>
    </div>
  )
}

function InfoLine({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <div className={cn(align === "right" && "text-right")}>
      <p className="font-sport text-[0.62rem] font-black uppercase tracking-[0.14em] text-white/38">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  )
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-24 border-b border-white/10 px-5 py-4 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b-0">
      <p className="font-sport text-[0.64rem] font-black uppercase tracking-[0.18em] text-white/42">{label}</p>
      <p className="mt-4 font-sport text-base font-black uppercase text-white">{value}</p>
    </div>
  )
}
