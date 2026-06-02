import Image from "next/image"
import Link from "next/link"

import { brandAssets, dashboardFootage, event } from "@/data/mcs"
import { cn } from "@/lib/utils"

const NO_DATA = "No Data Available"
const DATA_NOT_PUBLISHED = "Data Not Published Yet"
const MATCH_DATA_NOT_AVAILABLE = "Match data not available."

export function LiveMatchScreen() {
  const featuredImage = dashboardFootage[0]

  return (
    <main className="min-h-screen bg-[#03070d] text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#03070d]/86 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="flex items-center gap-2">
              {brandAssets.map((asset) => (
                <span key={asset.name} className="relative grid size-9 place-items-center bg-white p-1.5 sm:size-10">
                  <Image src={asset.src} alt={asset.name} width={34} height={34} className="max-h-full w-auto object-contain" />
                </span>
              ))}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="font-display text-3xl leading-none text-white">MCS 1</p>
              <p className="font-sport text-[0.62rem] font-black uppercase tracking-[0.16em] text-white/42">Live Match Center</p>
            </div>
          </Link>
          <Link href="/dashboard/tournament" className="border border-white/12 px-4 py-2 font-sport text-xs font-black uppercase tracking-[0.08em] text-white/62 transition hover:border-[color:var(--mcs-gold)] hover:text-white">
            Competition Center
          </Link>
        </div>
      </header>

      <section className="relative min-h-[720px] overflow-hidden pt-24">
        {featuredImage ? (
          <Image
            src={featuredImage.src}
            alt={featuredImage.label}
            fill
            priority
            sizes="100vw"
            className={cn("scale-[1.03] object-cover", featuredImage.crop)}
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,13,0.96),rgba(3,7,13,0.82)_42%,rgba(3,7,13,0.34)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,13,0.08),rgba(3,7,13,0.52)_66%,#03070d_96%)]" />

        <div className="relative z-10 mx-auto flex min-h-[620px] max-w-[1500px] flex-col justify-between px-5 pb-8 pt-8 sm:px-8 lg:px-10">
          <div className="max-w-[900px]">
            <p className="font-sport text-xs font-black uppercase tracking-[0.22em] text-[color:var(--mcs-gold-soft)]">
              {DATA_NOT_PUBLISHED}
            </p>
            <h1 className="mt-5 font-display text-[5.4rem] leading-[0.82] text-white sm:text-[8rem] lg:text-[11rem]">
              Match Data
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/72 sm:text-lg">
              Official live match records, scores, brackets, and match media have not been published yet.
            </p>
          </div>

          <div className="grid border-y border-white/14 bg-[#050b13]/68 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4">
            <HeroFact value={MATCH_DATA_NOT_AVAILABLE} label="Live match" />
            <HeroFact value={NO_DATA} label="Scores" />
            <HeroFact value={NO_DATA} label="Bracket" />
            <HeroFact value={event.dateRange} label="Event dates" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-4 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <EmptyState title={MATCH_DATA_NOT_AVAILABLE} body="Official match data has not been published yet." />
        <EmptyState title={NO_DATA} body="Official score data has not been published yet." />
        <EmptyState title={NO_DATA} body="Official bracket data has not been published yet." />
        <EmptyState title={NO_DATA} body="Official match media has not been published yet." />
      </section>
    </main>
  )
}

function HeroFact({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-b border-white/10 p-4 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="font-display text-4xl leading-none text-white sm:text-5xl">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-white/46">{label}</p>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-52 border-y border-white/12 bg-white/[0.025] p-5">
      <p className="font-display text-5xl leading-none text-white">{title}</p>
      <p className="mt-3 text-sm font-semibold leading-6 text-white/54">{body}</p>
    </div>
  )
}
