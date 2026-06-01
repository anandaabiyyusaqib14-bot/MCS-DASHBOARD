"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  AtSign,
  BookOpen,
  Camera,
  GraduationCap,
  MapPin,
  MessageCircle,
  Music2,
  Trophy,
  Users,
} from "lucide-react"

import {
  brandAssets,
  competitions,
  contact,
  dashboardFootage,
  event,
  eventDescriptions,
  gallery,
  landingStats,
  majors,
  timeline,
} from "@/data/mcs"

const navItems = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Competition", href: "#competition" },
  { label: "Gallery", href: "#gallery" },
  { label: "Departments", href: "#departments" },
  { label: "Contact", href: "#contact" },
]

const experienceCards = [
  {
    icon: Trophy,
    title: "Sport Championship",
    body: "Futsal, basket, voli, badminton, and supporter energy in a professional school-league atmosphere.",
  },
  {
    icon: Music2,
    title: "Art & Media Stage",
    body: "Solo vokal, canvas drawing, news card, news video, and student creativity as part of the championship story.",
  },
  {
    icon: Camera,
    title: "Digital Publication",
    body: "Media coverage, live competition updates, and digital publication built for a modern youth event.",
  },
]

const heroReveal = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
}

const sectionReveal = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
}

function getCountdown() {
  const target = new Date(`${event.startDate}T00:00:00+07:00`).getTime()
  const distance = Math.max(0, target - Date.now())

  return {
    days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, "0"),
    hours: String(Math.floor((distance / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
    minutes: String(Math.floor((distance / (1000 * 60)) % 60)).padStart(2, "0"),
    seconds: String(Math.floor((distance / 1000) % 60)).padStart(2, "0"),
  }
}

export function PublicHome() {
  const [countdown, setCountdown] = useState(getCountdown)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const countdownTimer = window.setInterval(() => setCountdown(getCountdown()), 1000)

    function updateScrollProgress() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(scrollable > 0 ? window.scrollY / scrollable : 0)
    }

    updateScrollProgress()
    window.addEventListener("scroll", updateScrollProgress, { passive: true })

    return () => {
      window.clearInterval(countdownTimer)
      window.removeEventListener("scroll", updateScrollProgress)
    }
  }, [])

  return (
    <main className="min-h-screen bg-white text-[#07111d]">
      <div className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-[color:var(--mcs-gold)]" style={{ transform: `scaleX(${scrollProgress})` }} />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#081c3a]/78 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
          <a href="#home" className="flex min-w-0 items-center gap-3">
            <div className="flex items-center gap-2">
              {brandAssets.map((asset) => (
                <LogoMark key={asset.name} asset={asset} compact />
              ))}
            </div>
            <span className="font-display text-2xl leading-none text-white sm:text-3xl">MCS 1</span>
          </a>

          <nav className="hidden items-center gap-6 font-sport text-xs font-black uppercase text-white/82 lg:flex xl:gap-8">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-[color:var(--mcs-gold-soft)]">
                {item.label}
              </a>
            ))}
          </nav>

          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-[color:var(--mcs-red)] px-4 font-sport text-xs font-black uppercase text-white transition hover:bg-[color:var(--mcs-red-dark)]"
          >
            Login
          </Link>
        </div>
      </header>

      <section id="home" className="relative min-h-screen overflow-hidden bg-[#081c3a] text-white">
        <motion.div
          initial={{ scale: 1.04 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={dashboardFootage[0].src}
            alt="Pemain basket SMKN 20 Jakarta dalam pertandingan MCS 1"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,28,58,0.98)_0%,rgba(8,28,58,0.82)_38%,rgba(8,28,58,0.48)_72%,rgba(8,28,58,0.34)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,28,58,0.02)_0%,rgba(8,28,58,0.18)_56%,rgba(8,28,58,0.96)_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1260px] flex-col justify-center px-5 pb-40 pt-28 sm:px-8 lg:px-10">
          <motion.div
            variants={heroReveal}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="max-w-[820px]"
          >
            <div className="mb-7 flex items-center gap-3">
              {brandAssets.map((asset) => (
                <LogoMark key={asset.name} asset={asset} />
              ))}
            </div>

            <h1 className="font-display text-[3.6rem] leading-[0.88] text-white sm:text-[7.2rem] lg:text-[9rem]">
              MELATI
              <br />
              CHAMPIONSHIP
              <br />
              SERIES 1
            </h1>
            <p className="mt-7 font-sport text-2xl font-black uppercase leading-tight text-[color:var(--mcs-gold-soft)] sm:text-3xl">
              {event.theme}
            </p>
            <p className="mt-4 max-w-[34rem] text-lg font-bold leading-8 text-white/92">
              Every Play is a Story,
              <br />
              Every Student is a Star.
            </p>
            <p className="mt-5 max-w-[43rem] text-base font-semibold leading-7 text-white/76 sm:text-lg sm:leading-8">
              {eventDescriptions.hero}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={contact.whatsappOfficial.href}
                className="inline-flex h-12 items-center justify-center gap-3 rounded-md bg-[color:var(--mcs-gold)] px-6 font-sport text-sm font-black uppercase text-[#081c3a] transition hover:bg-[color:var(--mcs-gold-soft)]"
              >
                <MessageCircle className="size-4" />
                WhatsApp Humas
              </a>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-3 rounded-md border border-white/24 bg-white/10 px-6 font-sport text-sm font-black uppercase text-white transition hover:bg-white/16"
              >
                Operator Login
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="absolute inset-x-4 bottom-0 z-20 mx-auto grid max-w-[1180px] translate-y-1/2 grid-cols-3 overflow-hidden rounded-lg bg-[color:var(--mcs-red)] font-sport text-sm font-black uppercase text-white shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
          {landingStats.map((stat) => (
            <div key={stat.label} className="border-r border-white/18 px-3 py-4 last:border-r-0 sm:px-6 sm:py-5">
              <span className="block text-xl leading-none text-[color:var(--mcs-gold-soft)] sm:text-3xl">{stat.value}</span>
              <span className="mt-2 block text-[0.58rem] leading-tight text-white/76 sm:text-sm">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <RevealSection id="about" className="bg-white px-5 pb-16 pt-32 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <h2 className="font-display text-6xl leading-none text-[#07111d] sm:text-7xl">THE GENESIS OF EXCELLENCE</h2>
            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-black/62">{eventDescriptions.formal}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <InfoTile icon={MapPin} title={event.school} label={event.location} />
            <InfoTile icon={Users} title="Audience" label={event.audience} />
            <InfoTile icon={GraduationCap} title="Organizer" label={event.organizer} />
          </div>
        </div>
      </RevealSection>

      <RevealSection id="competition" className="bg-[#07111d] px-5 py-16 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <h2 className="font-display text-6xl leading-none sm:text-7xl">MODERN CHAMPIONSHIP EXPERIENCE</h2>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/70">{eventDescriptions.modern}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {experienceCards.map((item) => (
                <HighlightTile key={item.title} {...item} />
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {competitions.map((competition) => (
              <motion.article
                key={competition.id}
                whileHover={{ y: -4 }}
                className="rounded-lg border border-white/12 bg-white/[0.04] p-4 transition hover:border-[color:var(--mcs-gold)]/60"
              >
                <p className="font-sport text-sm font-black uppercase text-[color:var(--mcs-gold-soft)]">
                  {competition.shortName}
                </p>
                <div className="mt-5 grid gap-2 text-xs font-bold uppercase text-white/48">
                  <p>
                    Category <span className="block pt-1 text-sm normal-case text-white/78">{competition.category}</span>
                  </p>
                  <p>
                    Division <span className="block pt-1 text-sm normal-case text-white/78">{getDivisionLabel(competition.kind)}</span>
                  </p>
                  <p>
                    Location <span className="block pt-1 text-sm normal-case text-white/78">{competition.venue}</span>
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="bg-[#f4f6f8] px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
            <div>
              <h2 className="font-display text-6xl leading-none text-[#07111d] sm:text-7xl">LIVE EVENT TIMELINE</h2>
              <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-black/62">
                Professional event roadmap for opening ceremony, tournament rounds, grand finals, and closing ceremony.
              </p>
            </div>
            <div className="grid gap-4">
              {timeline.map((item, index) => (
                <article key={item.date} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-[0_18px_50px_rgba(8,28,58,0.08)] sm:grid-cols-[130px_1fr]">
                  <div>
                    <p className="font-sport text-xs font-black uppercase text-[color:var(--mcs-red)]">{item.label}</p>
                    <p className="mt-2 font-mono text-sm font-bold text-black/62">{item.date}</p>
                  </div>
                  <div className="relative border-l border-black/10 pl-5">
                    <span className="absolute -left-[7px] top-1 grid size-3 place-items-center rounded-full bg-[color:var(--mcs-red)] ring-4 ring-[#f4f6f8]" />
                    <h3 className="font-sport text-xl font-black uppercase">{item.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-black/58">{item.description}</p>
                    <p className="mt-4 font-display text-4xl leading-none text-[color:var(--mcs-gold)]">0{index + 1}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="gallery" className="bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-display text-6xl leading-none sm:text-7xl">MCS IN ACTION</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-black/60">
                Sports, supporters, media team, competition, and ceremony moments from the SMKN 20 championship ecosystem.
              </p>
            </div>
            <a
              href={contact.instagram}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#07111d] px-5 font-sport text-sm font-black uppercase text-white transition hover:bg-[color:var(--mcs-red)]"
            >
              <AtSign className="size-4" />
              {contact.instagramLabel}
            </a>
          </div>

          <div className="mt-8 grid auto-rows-[220px] gap-4 md:grid-cols-6">
            {gallery.map((item, index) => (
              <motion.figure
                key={item.src}
                whileHover={{ scale: 0.99 }}
                className={`relative overflow-hidden rounded-lg bg-[#07111d] ${
                  index === 0 || index === 2 ? "md:col-span-3 md:row-span-2" : "md:col-span-3"
                }`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  loading="eager"
                  className="object-cover transition duration-500 hover:scale-105"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </motion.figure>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection id="departments" className="bg-[#f4f6f8] px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="font-display text-6xl leading-none text-[#07111d] sm:text-7xl">EXPLORE SMKN 20</h2>
            <p className="mt-4 text-base font-semibold leading-7 text-black/62">
              Six departments contribute different strengths to MCS 1: business, technology, administration, finance,
              retail, and sharia banking services.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {majors.map((major) => (
              <article key={major.name} className="rounded-lg border border-black/10 bg-white p-5 shadow-[0_18px_50px_rgba(8,28,58,0.07)]">
                <BookOpen className="size-6 text-[color:var(--mcs-red)]" />
                <h3 className="mt-4 font-sport text-xl font-black uppercase leading-6">{major.name}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-black/62">{major.description}</p>
                <p className="mt-3 text-sm font-bold leading-6 text-[color:var(--mcs-red)]">{major.fit}</p>
                <TagList title="Skills" items={major.materials} />
                <TagList title="Career Opportunities" items={major.careers} />
              </article>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="relative overflow-hidden bg-[#081c3a] px-5 py-16 text-white sm:px-8 lg:px-10">
        <div className="absolute inset-0 field-line opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(216,177,90,0.22),transparent_34%),linear-gradient(180deg,rgba(8,28,58,0.25),#081c3a)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-display text-6xl leading-none sm:text-7xl">COUNTDOWN TO MCS 1</h2>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-white/70">
              Target: 22 June 2026. The championship begins when the opening ceremony starts at SMKN 20 Jakarta.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CountdownBox label="Days" value={countdown.days} />
            <CountdownBox label="Hours" value={countdown.hours} />
            <CountdownBox label="Minutes" value={countdown.minutes} />
            <CountdownBox label="Seconds" value={countdown.seconds} />
          </div>
        </div>
      </RevealSection>

      <RevealSection id="contact" className="bg-[color:var(--mcs-red)] px-5 py-14 text-white sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-display text-6xl leading-none sm:text-7xl">CONTACT & SOCIAL</h2>
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
            <ContactButton href={contact.tiktok} icon={AtSign} title="TikTok" label={contact.tiktokLabel} />
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
            <p className="mt-5 font-display text-4xl leading-none">Melati Championship Series 1</p>
            <p className="mt-2 font-sport text-sm font-black uppercase text-[color:var(--mcs-gold-soft)]">{event.theme}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/62">
              Every Play is a Story,
              <br />
              Every Student is a Star.
            </p>
          </div>
          <p className="text-sm font-semibold text-white/52">Copyright &copy; 2026</p>
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
  children: React.ReactNode
}) {
  return (
    <motion.section
      id={id}
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

function LogoMark({ asset, compact = false }: { asset: { name: string; src: string }; compact?: boolean }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center rounded-md border border-white/18 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.26)] ${
        compact ? "size-10 p-1" : "size-16 p-2"
      }`}
    >
      <Image src={asset.src} alt={asset.name} fill className="object-contain p-1.5" sizes={compact ? "40px" : "64px"} />
    </span>
  )
}

function InfoTile({ icon: Icon, title, label }: { icon: LucideIcon; title: string; label: string }) {
  return (
    <article className="rounded-lg border border-black/10 bg-[#f4f6f8] p-5">
      <Icon className="size-6 text-[color:var(--mcs-red)]" />
      <h3 className="mt-5 font-sport text-base font-black uppercase leading-5">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-6 text-black/58">{label}</p>
    </article>
  )
}

function HighlightTile({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <article className="rounded-lg border border-white/12 bg-white/[0.05] p-5">
      <Icon className="size-6 text-[color:var(--mcs-gold-soft)]" />
      <h3 className="mt-4 font-sport text-base font-black uppercase leading-5">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-6 text-white/64">{body}</p>
    </article>
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

function CountdownBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/12 bg-white/[0.06] p-5 text-center">
      <p className="font-display text-6xl leading-none text-[color:var(--mcs-gold-soft)]">{value}</p>
      <p className="mt-2 font-sport text-xs font-black uppercase text-white/64">{label}</p>
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

function getDivisionLabel(kind: string) {
  if (kind === "sport") {
    return "Sport Championship"
  }

  if (kind === "art") {
    return "Art Stage"
  }

  if (kind === "media") {
    return "Digital Publication"
  }

  if (kind === "esport") {
    return "E-Sports Competition"
  }

  return "Supporter Program"
}
