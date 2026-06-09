"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  AtSign,
  BookOpen,
  CalendarDays,
  Camera,
  Clock,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  MessageCircle,
  Music2,
  Trophy,
  Users,
} from "lucide-react"

import {
  brandAssets,
  competitionJuknis,
  competitions,
  contact,
  dashboardFootage,
  event,
  eventDescriptions,
  gallery,
  juknisPdf,
  landingStats,
  majors,
  scheduleDays,
  supporterGuidelines,
  type Competition,
  type CompetitionKind,
  type JuknisDocument,
} from "@/data/mcs"

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Competitions", href: "#competitions" },
  { label: "Schedule", href: "#schedule" },
  { label: "Gallery", href: "#gallery" },
  { label: "Juknis", href: "#juknis" },
  { label: "Departments", href: "#departments" },
  { label: "Contact", href: "#contact" },
]

const heroStats = [
  landingStats[0],
  { value: String(competitions.length), label: "Competitions" },
  landingStats[2],
  { value: "SMKN 20 Jakarta", label: "Host School" },
]

const sectionReveal = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
}

const unpublishedStatus = "Data Not Published Yet"
const countdownTargetTime = new Date(`${event.startDate}T06:30:00+07:00`).getTime()
const preparationProgress = 83

type CountdownParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function PublicHome() {
  const [activeDayId, setActiveDayId] = useState(scheduleDays[0]?.id ?? "")
  const [activeCompetitionId, setActiveCompetitionId] = useState(competitions[0]?.id ?? "")
  const [activeJuknisCompetitionId, setActiveJuknisCompetitionId] = useState(
    competitionJuknis[0]?.competitionId ?? "",
  )
  const [scrollProgress, setScrollProgress] = useState(0)

  const activeDay = useMemo(
    () => scheduleDays.find((day) => day.id === activeDayId) ?? scheduleDays[0],
    [activeDayId],
  )

  const activeCompetition = useMemo(
    () => competitions.find((competition) => competition.id === activeCompetitionId) ?? competitions[0],
    [activeCompetitionId],
  )

  const activeCompetitionJuknis = useMemo(
    () => competitionJuknis.find((document) => document.competitionId === activeCompetition?.id),
    [activeCompetition],
  )

  const activeJuknis = useMemo(
    () =>
      competitionJuknis.find((document) => document.competitionId === activeJuknisCompetitionId) ??
      competitionJuknis[0],
    [activeJuknisCompetitionId],
  )

  const competitionSchedule = useMemo(
    () => activeDay?.items.filter((item) => item.type === "match" && getCompetitionFromScheduleTitle(item.title)) ?? [],
    [activeDay],
  )

  const dayCompetitionNames = useMemo(() => {
    const names = competitionSchedule
      .map((item) => getCompetitionFromScheduleTitle(item.title))
      .filter((competition): competition is Competition => Boolean(competition))
      .map(getCompetitionPublicName)

    return Array.from(new Set(names))
  }, [competitionSchedule])

  useEffect(() => {
    function updateScrollProgress() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(scrollable > 0 ? window.scrollY / scrollable : 0)
    }

    updateScrollProgress()
    window.addEventListener("scroll", updateScrollProgress, { passive: true })

    return () => window.removeEventListener("scroll", updateScrollProgress)
  }, [])

  return (
    <main className="min-h-screen bg-white text-[#07111d]">
      <div
        className="fixed inset-x-0 top-0 z-[70] h-1 origin-left bg-[color:var(--mcs-gold)]"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      <header className="fixed inset-x-0 top-0 z-[60] border-b border-white/14 bg-[#081c3a]/90 text-white backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:min-h-20 lg:px-10">
          <a href="#home" className="flex min-w-0 items-center gap-3">
            <div className="flex items-center gap-1.5">
              {brandAssets.map((asset) => (
                <LogoMark key={asset.name} asset={asset} compact />
              ))}
            </div>
            <span className="font-display text-3xl leading-none sm:text-4xl">MCS 1</span>
          </a>

          <nav className="hidden items-center justify-center gap-6 font-sport text-xs font-black uppercase text-white/82 lg:flex xl:gap-8">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-[color:var(--mcs-gold-soft)]">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2">
            <SocialLink href={contact.instagram} icon={AtSign} label="Instagram" />
            <SocialLink href={contact.tiktok} icon={Music2} label="TikTok" />
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md border border-white/24 px-3 font-sport text-[0.68rem] font-black uppercase text-white/88 transition hover:border-[color:var(--mcs-gold)] hover:text-[color:var(--mcs-gold-soft)]"
            >
              Login Panitia
            </Link>
          </div>
        </div>

        <nav className="no-scrollbar flex gap-5 overflow-x-auto border-t border-white/10 px-4 py-2 font-sport text-[0.68rem] font-black uppercase text-white/70 sm:px-6 lg:hidden">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="shrink-0 transition hover:text-[color:var(--mcs-gold-soft)]">
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <section id="home" className="relative overflow-hidden bg-[#081c3a] text-white">
        <motion.div
          initial={{ scale: 1.03 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={dashboardFootage[0].src}
            alt={dashboardFootage[0].label}
            fill
            priority
            className={`object-cover ${dashboardFootage[0].crop}`}
            sizes="100vw"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,28,58,0.98)_0%,rgba(8,28,58,0.84)_42%,rgba(8,28,58,0.48)_74%,rgba(8,28,58,0.28)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,28,58,0.08)_0%,rgba(8,28,58,0.08)_54%,#081c3a_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1260px] flex-col justify-center px-5 pb-10 pt-32 sm:px-8 md:min-h-[820px] md:pt-36 lg:min-h-[900px] lg:px-10 xl:min-h-[920px]">
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="max-w-[850px]"
          >
            <div className="mb-7 flex items-center gap-3">
              {brandAssets.map((asset) => (
                <LogoMark key={asset.name} asset={asset} />
              ))}
            </div>

            <h1 className="font-display text-6xl leading-[0.9] text-white sm:text-8xl lg:text-[8.5rem]">
              MELATI
              <br />
              CHAMPIONSHIP
              <br />
              SERIES 1
            </h1>
            <p className="mt-7 font-sport text-xl font-black uppercase leading-tight text-[color:var(--mcs-gold-soft)] sm:text-3xl">
              {event.theme}
            </p>
            <p className="mt-4 max-w-[32rem] text-lg font-bold leading-8 text-white/94">
              Every Play is a Story,
              <br />
              Every Student is a Star.
            </p>
            <p className="mt-5 max-w-[43rem] text-base font-semibold leading-7 text-white/76 sm:text-lg sm:leading-8">
              Modern championship experience for SMKN 20 Jakarta students.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#competitions"
                className="inline-flex h-12 items-center justify-center gap-3 rounded-md bg-[color:var(--mcs-gold)] px-6 font-sport text-sm font-black uppercase text-[#081c3a] transition hover:bg-[color:var(--mcs-gold-soft)]"
              >
                <Trophy className="size-4" />
                View Competitions
              </a>
              <a
                href="#schedule"
                className="inline-flex h-12 items-center justify-center gap-3 rounded-md border border-white/24 bg-white/10 px-6 font-sport text-sm font-black uppercase text-white transition hover:bg-white/16"
              >
                View Schedule
                <ArrowRight className="size-4" />
              </a>
            </div>

            <HeroCountdown />
          </motion.div>

          <HeroStatsGrid className="mt-8 hidden md:grid" />
        </div>
      </section>

      <div className="bg-white px-5 py-5 sm:px-8 md:hidden">
        <HeroStatsGrid className="mx-auto" />
      </div>

      <RevealSection id="about" className="bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="font-sport text-xs font-black uppercase text-[color:var(--mcs-red)]">{event.organizer}</p>
            <h2 className="mt-4 font-display text-6xl leading-none text-[#07111d] sm:text-7xl">
              ABOUT
              <br />
              MCS 1
            </h2>
          </div>
          <div className="max-w-3xl">
            <p className="text-xl font-semibold leading-9 text-black/72">{eventDescriptions.formal}</p>
            <div className="mt-8 grid gap-4 border-t border-black/10 pt-6 sm:grid-cols-3">
              <InlineFact icon={MapPin} label={event.location} title={event.school} />
              <InlineFact icon={CalendarDays} label={event.dateRange} title="Event Date" />
              <InlineFact icon={Users} label={event.audience} title="Audience" />
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="competitions" className="bg-[#f4f6f8] px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="COMPETITIONS"
            body="Sembilan kategori resmi MCS 1 ditampilkan memakai data yang tersedia dari penyelenggara."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {competitions.map((competition) => (
              <CompetitionCard
                key={competition.id}
                competition={competition}
                juknis={getJuknisForCompetition(competition.id)}
                isActive={activeCompetition.id === competition.id}
                onViewDetails={() => setActiveCompetitionId(competition.id)}
                onViewJuknis={() => setActiveJuknisCompetitionId(competition.id)}
              />
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-[#081c3a]/14 bg-white p-5 shadow-[0_18px_50px_rgba(8,28,58,0.08)]">
            <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <p className="font-sport text-xs font-black uppercase text-[color:var(--mcs-red)]">Selected Competition</p>
                <h3 className="mt-2 font-sport text-2xl font-black uppercase leading-tight text-[#081c3a]">
                  {getCompetitionPublicFullName(activeCompetition)}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-black/60">
                  Data detail publik mengikuti informasi resmi yang sudah tersedia. Regulasi JUKNIS kini memakai dokumen
                  resmi panitia.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <DetailCell title="Category" value={activeCompetition.category} />
                <DetailCell title="Venue" value={activeCompetition.venue} />
                <DetailCell title="Status" value={unpublishedStatus} />
                <DetailCell title="Juknis" value={activeCompetitionJuknis?.status ?? unpublishedStatus} />
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="schedule" className="bg-[#081c3a] px-5 py-16 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="SCHEDULE HIGHLIGHT"
            body="Highlight publik ini hanya memuat lomba resmi berdasarkan jadwal panitia."
            dark
          />

          <div className="mt-8 flex flex-wrap gap-2">
            {scheduleDays.map((day, index) => (
              <button
                key={day.id}
                type="button"
                onClick={() => setActiveDayId(day.id)}
                className={`h-11 rounded-md border px-4 font-sport text-xs font-black uppercase transition ${
                  activeDay?.id === day.id
                    ? "border-[color:var(--mcs-gold)] bg-[color:var(--mcs-gold)] text-[#081c3a]"
                    : "border-white/14 bg-white/[0.05] text-white/76 hover:border-white/34 hover:text-white"
                }`}
              >
                Day {index + 1}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="rounded-lg border border-white/14 bg-white/[0.05] p-5">
              <p className="font-sport text-xs font-black uppercase text-[color:var(--mcs-gold-soft)]">
                {activeDay?.dayName}, {activeDay?.label}
              </p>
              <h3 className="mt-3 font-display text-5xl leading-none text-white">
                {dayCompetitionNames.length > 0 ? dayCompetitionNames.join(", ") : "Match data not available."}
              </h3>
              <p className="mt-4 text-sm font-semibold leading-6 text-white/62">
                Seluruh daftar di sisi kanan berasal dari jadwal lomba resmi MCS 1.
              </p>
              <a
                href="#schedule"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/20 px-4 font-sport text-xs font-black uppercase text-white transition hover:border-[color:var(--mcs-gold)] hover:text-[color:var(--mcs-gold-soft)]"
              >
                View Full Schedule
                <ExternalLink className="size-4" />
              </a>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {competitionSchedule.length > 0 ? (
                competitionSchedule.map((item) => (
                  <article key={`${activeDay?.id}-${item.time}-${item.title}`} className="rounded-lg border border-white/12 bg-white p-4 text-[#07111d]">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-sport text-lg font-black uppercase leading-6">{formatScheduleTitle(item.title)}</h4>
                      <span className="shrink-0 rounded-md bg-[color:var(--mcs-red)] px-2.5 py-1 font-mono text-xs font-bold text-white">
                        {item.time}
                      </span>
                    </div>
                    <div className="mt-5 grid gap-2 text-sm font-semibold text-black/64">
                      <p className="flex items-center gap-2">
                        <MapPin className="size-4 text-[color:var(--mcs-red)]" />
                        {item.venue}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="size-4 text-[color:var(--mcs-red)]" />
                        {item.duration}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState label="Match data not available." />
              )}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="gallery" className="bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <SectionHeader
              title="GALLERY"
              body="Dokumentasi resmi dari aset MCS yang tersedia di repositori."
              compact
            />
            <a
              href={contact.instagram}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#07111d] px-5 font-sport text-sm font-black uppercase text-white transition hover:bg-[color:var(--mcs-red)]"
            >
              <AtSign className="size-4" />
              {contact.instagramLabel}
            </a>
          </div>

          <div className="mt-8 grid auto-rows-[210px] gap-4 md:grid-cols-6">
            {gallery.map((item, index) => (
              <motion.figure
                key={item.src}
                whileHover={{ scale: 0.99 }}
                className={`relative overflow-hidden rounded-lg bg-[#07111d] ${
                  index === 0 || index === 3 ? "md:col-span-3 md:row-span-2" : "md:col-span-3"
                }`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover transition duration-500 hover:scale-105"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </motion.figure>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection id="juknis" className="bg-[#f4f6f8] px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="JUKNIS CENTER"
            body="Dokumen teknis resmi MCS 1 dari panitia, dipetakan per cabang lomba tanpa menambah data fiktif."
          />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={juknisPdf.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#081c3a] px-5 font-sport text-xs font-black uppercase text-white transition hover:bg-[color:var(--mcs-red)]"
            >
              <FileText className="size-4" />
              Open PDF
            </a>
            <a
              href={juknisPdf.href}
              download
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#081c3a]/16 bg-white px-5 font-sport text-xs font-black uppercase text-[#081c3a] transition hover:border-[color:var(--mcs-red)] hover:text-[color:var(--mcs-red)]"
            >
              <Download className="size-4" />
              Download Full Juknis
            </a>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="grid gap-3">
              {competitionJuknis.map((document) => (
                <JuknisSelector
                  key={document.id}
                  document={document}
                  active={activeJuknis?.competitionId === document.competitionId}
                  onSelect={() => setActiveJuknisCompetitionId(document.competitionId)}
                />
              ))}
            </div>

            {activeJuknis ? <JuknisDetail document={activeJuknis} /> : <EmptyState label="No Data Available" />}
          </div>

          <div className="mt-8 rounded-lg border border-[#081c3a]/14 bg-white p-5 shadow-[0_18px_50px_rgba(8,28,58,0.07)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-sport text-xs font-black uppercase text-[color:var(--mcs-red)]">Supporter Rules</p>
                <h3 className="mt-2 font-sport text-2xl font-black uppercase leading-7 text-[#081c3a]">
                  Tata Tertib Penonton
                </h3>
              </div>
              <Users className="size-6 shrink-0 text-[color:var(--mcs-gold)]" />
            </div>
            <div className="mt-5 grid gap-2 md:grid-cols-2">
              {supporterGuidelines.map((rule) => (
                <p key={rule} className="border-t border-black/8 pt-3 text-sm font-semibold leading-6 text-black/66">
                  {rule}
                </p>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="departments" className="bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="DEPARTMENTS"
            body="Enam jurusan resmi SMKN 20 Jakarta ditampilkan dengan deskripsi, materi, dan peluang karier dari data MCS."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {majors.map((major) => (
              <article key={major.name} className="rounded-lg border border-black/10 bg-white p-5 shadow-[0_18px_50px_rgba(8,28,58,0.07)]">
                <BookOpen className="size-6 text-[color:var(--mcs-red)]" />
                <h3 className="mt-4 font-sport text-xl font-black uppercase leading-6">{major.name}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-black/62">{major.description}</p>
                <p className="mt-3 text-sm font-bold leading-6 text-[color:var(--mcs-red)]">{major.fit}</p>
                <TagList title="Subjects" items={major.materials} />
                <TagList title="Careers" items={major.careers} />
              </article>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection id="contact" className="bg-[color:var(--mcs-red)] px-5 py-14 text-white sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-display text-6xl leading-none sm:text-7xl">CONTACT</h2>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-white/78">
              SMK Negeri 20 Jakarta
              <br />
              Jl. Melati No.24
              <br />
              Cilandak Barat
              <br />
              Jakarta Selatan
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ContactButton href={contact.whatsappOfficial.href} icon={MessageCircle} title="WhatsApp Official" label={`${contact.whatsappOfficial.number} - ${contact.whatsappOfficial.label}`} />
            <ContactButton href={contact.chairperson.href} icon={MessageCircle} title="Ketua Pelaksana" label={`${contact.chairperson.number} - ${contact.chairperson.label}`} />
            <ContactButton href={contact.instagram} icon={AtSign} title="Instagram" label={contact.instagramLabel} />
            <ContactButton href={contact.tiktok} icon={Music2} title="TikTok" label={contact.tiktokLabel} />
          </div>
        </div>
      </RevealSection>

      <footer className="bg-[#06162f] px-5 py-10 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              {brandAssets.map((asset) => (
                <LogoMark key={asset.name} asset={asset} compact />
              ))}
            </div>
            <p className="mt-5 font-display text-4xl leading-none">{event.name}</p>
            <p className="mt-2 font-sport text-sm font-black uppercase text-[color:var(--mcs-gold-soft)]">{event.theme}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/62">{event.slogan}</p>
          </div>
          <p className="text-sm font-semibold text-white/52">Copyright &copy; 2026 OSIS & MPK SMKN 20 Jakarta</p>
        </div>
      </footer>
    </main>
  )
}

function RevealSection({
  id,
  className,
  children,
}: {
  id?: string
  className: string
  children: ReactNode
}) {
  return (
    <motion.section
      id={id}
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`${className} scroll-mt-28 lg:scroll-mt-24`}
    >
      {children}
    </motion.section>
  )
}

function SectionHeader({
  title,
  body,
  dark = false,
  compact = false,
}: {
  title: string
  body: string
  dark?: boolean
  compact?: boolean
}) {
  return (
    <div className={compact ? "max-w-2xl" : "max-w-3xl"}>
      <h2 className={`font-display text-6xl leading-none sm:text-7xl ${dark ? "text-white" : "text-[#07111d]"}`}>{title}</h2>
      <p className={`mt-4 text-base font-semibold leading-7 ${dark ? "text-white/66" : "text-black/62"}`}>{body}</p>
    </div>
  )
}

function LogoMark({ asset, compact = false }: { asset: { name: string; src: string }; compact?: boolean }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center rounded-md border border-white/18 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.22)] ${
        compact ? "size-9 p-1" : "size-15 p-2 sm:size-16"
      }`}
    >
      <Image src={asset.src} alt={asset.name} fill className="object-contain p-1.5" sizes={compact ? "36px" : "64px"} />
    </span>
  )
}

function HeroStatsGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`grid w-full max-w-[1180px] grid-cols-2 overflow-hidden rounded-lg bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:grid-cols-4 ${className}`}>
      {heroStats.map((stat, index) => (
        <div
          key={`${stat.label}-${stat.value}`}
          className={`min-w-0 border-black/10 px-4 py-4 sm:px-5 ${
            index < heroStats.length - 1 ? "border-r" : ""
          } ${index < 2 ? "border-b sm:border-b-0" : ""}`}
        >
          <span className="block font-sport text-xs font-black uppercase text-[color:var(--mcs-red)]">{stat.label}</span>
          <span className="mt-2 block break-words font-display text-3xl leading-none text-[#081c3a] sm:text-4xl">{stat.value}</span>
        </div>
      ))}
    </div>
  )
}

function HeroCountdown() {
  const [timeLeft, setTimeLeft] = useState<CountdownParts>(() => getCountdownParts())

  useEffect(() => {
    function updateCountdown() {
      setTimeLeft(getCountdownParts())
    }

    updateCountdown()
    const intervalId = window.setInterval(updateCountdown, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  const countdownUnits = [
    { label: "Hari", value: timeLeft.days },
    { label: "Jam", value: timeLeft.hours },
    { label: "Menit", value: timeLeft.minutes },
    { label: "Detik", value: timeLeft.seconds },
  ]

  return (
    <div className="mt-7 box-border w-full max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.95] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.15)] backdrop-blur-sm sm:max-w-[850px] sm:p-6">
      <div className="min-w-0 rounded-[18px] bg-[#081c3a] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:px-6 sm:py-6">
        <p className="font-sport text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#D4A017]">
          EVENT DIMULAI DALAM
        </p>

        <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-lg border border-white/[0.08] sm:grid-cols-4">
          {countdownUnits.map((unit, index) => (
            <div
              key={unit.label}
              className={`min-w-0 px-3 py-4 text-center sm:px-4 ${getCountdownDividerClass(index)}`}
            >
              <motion.span
                key={`${unit.label}-${unit.value}`}
                initial={{ opacity: 0.56 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                suppressHydrationWarning
                className="block font-display text-[2.35rem] font-bold leading-none text-white sm:text-5xl lg:text-[3.8rem]"
              >
                {formatCountdownValue(unit.value)}
              </motion.span>
              <span className="mt-2 block font-sport text-xs font-medium uppercase text-white/75 sm:text-sm">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-1 text-xs font-semibold text-white/70 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
          <span>{event.dateRange}</span>
          <span className="hidden size-1 rounded-full bg-white/28 sm:block" />
          <span>{event.school}</span>
        </div>

        <div className="mt-5 border-t border-white/[0.08] pt-4">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <span className="font-sport font-black uppercase tracking-[0.08em] text-white/78">
              Persiapan MCS 1
            </span>
            <span className="shrink-0 font-sport font-black uppercase text-[color:var(--mcs-gold-soft)]">
              {preparationProgress}% Siap
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[color:var(--mcs-gold)]" style={{ width: `${preparationProgress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function SocialLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <a
      href={href}
      className="hidden h-9 items-center justify-center gap-2 rounded-md px-2 font-sport text-[0.68rem] font-black uppercase text-white/76 transition hover:text-[color:var(--mcs-gold-soft)] sm:inline-flex"
    >
      <Icon className="size-4" />
      {label}
    </a>
  )
}

function InlineFact({ icon: Icon, title, label }: { icon: LucideIcon; title: string; label: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-1 size-5 shrink-0 text-[color:var(--mcs-red)]" />
      <div>
        <p className="font-sport text-xs font-black uppercase text-[#081c3a]">{title}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-black/58">{label}</p>
      </div>
    </div>
  )
}

function CompetitionCard({
  competition,
  juknis,
  isActive,
  onViewDetails,
  onViewJuknis,
}: {
  competition: Competition
  juknis?: JuknisDocument
  isActive: boolean
  onViewDetails: () => void
  onViewJuknis: () => void
}) {
  return (
    <article
      id={`competition-${competition.id}`}
      className={`rounded-lg border bg-white p-5 shadow-[0_18px_50px_rgba(8,28,58,0.07)] transition ${
        isActive ? "border-[color:var(--mcs-red)]" : "border-black/10 hover:border-[#081c3a]/28"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sport text-xs font-black uppercase text-[color:var(--mcs-red)]">{getKindLabel(competition.kind)}</p>
                  <h3 className="mt-2 font-sport text-2xl font-black uppercase leading-7 text-[#081c3a]">{getCompetitionPublicName(competition)}</h3>
        </div>
        <CompetitionIcon kind={competition.kind} />
      </div>

      <div className="mt-5 grid gap-3 text-sm font-semibold text-black/64">
        <MetaRow label="Competition Name" value={getCompetitionPublicFullName(competition)} />
        <MetaRow label="Category" value={competition.category} />
        <MetaRow label="Venue" value={competition.venue} />
        <MetaRow label="Juknis" value={juknis?.status ?? unpublishedStatus} />
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onViewDetails}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#081c3a] px-4 font-sport text-xs font-black uppercase text-white transition hover:bg-[color:var(--mcs-red)]"
        >
          View Details
          <ArrowRight className="size-4" />
        </button>
        <a
          href="#juknis"
          onClick={onViewJuknis}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#081c3a]/12 bg-[#f8fafc] px-4 font-sport text-xs font-black uppercase text-[#081c3a] transition hover:border-[color:var(--mcs-red)] hover:text-[color:var(--mcs-red)]"
        >
          <FileText className="size-4" />
          View Juknis
        </a>
      </div>
    </article>
  )
}

function JuknisSelector({
  document,
  active,
  onSelect,
}: {
  document: JuknisDocument
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-lg border p-4 text-left transition ${
        active
          ? "border-[color:var(--mcs-red)] bg-white shadow-[0_18px_50px_rgba(8,28,58,0.08)]"
          : "border-black/10 bg-white/72 hover:border-[#081c3a]/28"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-sport text-xs font-black uppercase text-[color:var(--mcs-red)]">{document.status}</p>
          <h3 className="mt-2 font-sport text-xl font-black uppercase leading-6 text-[#081c3a]">{document.shortName}</h3>
        </div>
        <FileText className="size-5 shrink-0 text-[color:var(--mcs-gold)]" />
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-black/58">{document.teamFormat}</p>
    </button>
  )
}

function JuknisDetail({ document }: { document: JuknisDocument }) {
  return (
    <article className="rounded-lg border border-[#081c3a]/14 bg-white p-5 shadow-[0_22px_70px_rgba(8,28,58,0.1)]">
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-start">
        <div>
          <p className="font-sport text-xs font-black uppercase text-[color:var(--mcs-red)]">{document.status}</p>
          <h3 className="mt-2 font-display text-5xl leading-none text-[#081c3a] sm:text-6xl">{document.shortName}</h3>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-black/62">{document.summary}</p>
        </div>
        <a
          href={juknisPdf.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[color:var(--mcs-red)] px-4 font-sport text-xs font-black uppercase text-white transition hover:bg-[#081c3a]"
        >
          PDF
          <ExternalLink className="size-4" />
        </a>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <DetailCell title="Registration" value={document.registrationPeriod} />
        <DetailCell title="Team" value={document.teamFormat} />
        <DetailCell title="Format" value={document.format} />
      </div>

      <div className="mt-6 grid gap-5">
        {document.sections.map((section) => (
          <section key={section.title} className="border-t border-black/10 pt-5">
            <h4 className="font-sport text-sm font-black uppercase text-[#081c3a]">{section.title}</h4>
            <div className="mt-3 grid gap-2">
              {section.items.map((item) => (
                <p key={item} className="grid grid-cols-[14px_minmax(0,1fr)] gap-2 text-sm font-semibold leading-6 text-black/66">
                  <span className="mt-2 size-1.5 rounded-full bg-[color:var(--mcs-red)]" />
                  <span>{item}</span>
                </p>
              ))}
            </div>
          </section>
        ))}

        {document.criteria && document.criteria.length > 0 ? (
          <section className="border-t border-black/10 pt-5">
            <h4 className="font-sport text-sm font-black uppercase text-[#081c3a]">Kriteria Penilaian</h4>
            <div className="mt-3 grid gap-2">
              {document.criteria.map((item) => (
                <p key={item} className="grid grid-cols-[14px_minmax(0,1fr)] gap-2 text-sm font-semibold leading-6 text-black/66">
                  <span className="mt-2 size-1.5 rounded-full bg-[color:var(--mcs-gold)]" />
                  <span>{item}</span>
                </p>
              ))}
            </div>
          </section>
        ) : null}

        <section className="border-t border-black/10 pt-5">
          <h4 className="font-sport text-sm font-black uppercase text-[#081c3a]">Contact</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {document.contacts.map((contactItem) => (
              <span key={contactItem} className="rounded-md border border-black/10 bg-[#f8fafc] px-3 py-2 text-xs font-bold text-black/62">
                {contactItem}
              </span>
            ))}
          </div>
        </section>
      </div>
    </article>
  )
}

function CompetitionIcon({ kind }: { kind: CompetitionKind }) {
  const Icon = kind === "sport" ? Trophy : kind === "art" ? Music2 : kind === "media" ? Camera : GraduationCap

  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[color:var(--mcs-gold)]/18 text-[color:var(--mcs-red)]">
      <Icon className="size-5" />
    </span>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="grid grid-cols-[120px_1fr] gap-3 border-t border-black/8 pt-3">
      <span className="font-sport text-[0.68rem] font-black uppercase text-black/38">{label}</span>
      <span className="font-bold text-black/72">{value}</span>
    </p>
  )
}

function DetailCell({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-black/10 bg-[#f8fafc] p-4">
      <p className="font-sport text-[0.68rem] font-black uppercase text-black/40">{title}</p>
      <p className="mt-2 text-sm font-bold leading-5 text-[#081c3a]">{value}</p>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/22 bg-white/[0.05] p-6 text-center text-sm font-bold text-white/58 md:col-span-2">
      {label}
    </div>
  )
}

function TagList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <p className="font-sport text-xs font-black uppercase text-black/42">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-md border border-black/10 bg-[#f8fafc] px-2.5 py-1.5 text-xs font-bold text-black/62">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function ContactButton({ href, icon: Icon, title, label }: { href: string; icon: LucideIcon; title: string; label: string }) {
  return (
    <a href={href} className="rounded-lg border border-white/18 bg-white px-5 py-4 text-[#07111d] transition hover:bg-[color:var(--mcs-gold-soft)]">
      <Icon className="size-5 text-[color:var(--mcs-red)]" />
      <span className="mt-3 block font-sport text-sm font-black uppercase">{title}</span>
      <span className="mt-1 block text-sm font-semibold leading-5 text-black/62">{label}</span>
    </a>
  )
}

function getCountdownParts(): CountdownParts {
  const distance = Math.max(0, countdownTargetTime - Date.now())
  const totalSeconds = Math.floor(distance / 1000)

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

function formatCountdownValue(value: number) {
  return String(value).padStart(2, "0")
}

function getCountdownDividerClass(index: number) {
  const dividerColor = "border-white/[0.08]"

  if (index === 0) {
    return `border-r border-b ${dividerColor} sm:border-b-0`
  }

  if (index === 1) {
    return `border-b ${dividerColor} sm:border-r sm:border-b-0`
  }

  if (index === 2) {
    return `border-r ${dividerColor}`
  }

  return ""
}

function getKindLabel(kind: CompetitionKind) {
  if (kind === "sport") {
    return "Sport"
  }

  if (kind === "art") {
    return "Art"
  }

  if (kind === "media") {
    return "Media"
  }

  return "Digital Competition"
}

function getJuknisForCompetition(competitionId: string) {
  return competitionJuknis.find((document) => document.competitionId === competitionId)
}

const scheduleCompetitionAliases: Record<string, string[]> = {
  futsal: ["futsal"],
  basket: ["basket"],
  volly: ["voli", "volly"],
  "mobile-legends": ["mobile legends"],
  badminton: ["badminton"],
  "solo-vokal": ["solo vokal"],
  "canvas-drawing": ["canvas drawing"],
  "best-news-card": ["best news card"],
  "best-news-video": ["best news video"],
}

function getCompetitionFromScheduleTitle(title: string) {
  const normalizedTitle = title.toLowerCase()

  return competitions.find((competition) =>
    (scheduleCompetitionAliases[competition.id] ?? [competition.shortName.toLowerCase()]).some((alias) =>
      normalizedTitle.includes(alias),
    ),
  )
}

function getCompetitionPublicName(competition: Competition) {
  if (competition.id === "basket") {
    return "Basket 3x3"
  }

  if (competition.id === "volly") {
    return "Voli"
  }

  return competition.shortName
}

function getCompetitionPublicFullName(competition: Competition) {
  if (competition.id === "basket") {
    return "Perlombaan Basket 3x3"
  }

  if (competition.id === "volly") {
    return "Perlombaan Voli"
  }

  return competition.name
}

function formatScheduleTitle(title: string) {
  return title.replaceAll("Volly", "Voli").replaceAll("Basket", "Basket 3x3")
}
