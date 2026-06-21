"use client"

import { useState } from "react"
import Image from "next/image"

import { event, partners, type Partner } from "@/data/mcs"
import { cn } from "@/lib/utils"

const partnerGroups = [
  { id: "official", label: "OFFICIAL PARTNERS", partners: partners.filter((partner) => partner.category === "official") },
  { id: "fnb", label: "OFFICIAL F&B PARTNERS", partners: partners.filter((partner) => partner.category === "f&b") },
]

export function OfficialPartnersSection({
  className,
  compact = false,
  dark = false,
  showWall = true,
}: {
  className?: string
  compact?: boolean
  dark?: boolean
  showWall?: boolean
}) {
  return (
    <section
      id="sponsors"
      aria-labelledby="official-partners-title"
      className={cn(
        "overflow-hidden px-5 py-16 sm:px-8 lg:px-10",
        dark ? "bg-[#06162f] text-white" : "bg-[#f4f6f8] text-[#07111d]",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className={cn("font-sport text-xs font-black uppercase tracking-[0.18em]", dark ? "text-[#D8B15A]" : "text-[#A61D2D]")}>
            Proudly Supported By
          </p>
          <h2 id="official-partners-title" className={cn("mt-3 font-display leading-none", compact ? "text-5xl sm:text-6xl" : "text-6xl sm:text-7xl")}>
            OFFICIAL PARTNERS
          </h2>
          <p className={cn("mt-3 text-sm font-bold uppercase tracking-[0.08em]", dark ? "text-white/62" : "text-[#081c3a]/62")}>
            {event.name}
          </p>
        </div>

        <div className="mt-10 grid gap-9">
          {partnerGroups.map((group) => (
            <div key={group.id}>
              <h3 className={cn("text-center font-sport text-sm font-black uppercase tracking-[0.14em]", dark ? "text-white/78" : "text-[#081c3a]")}>
                {group.label}
              </h3>
              <div className="mt-5 grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-5">
                {group.partners.map((partner, index) => (
                  <PartnerCard key={partner.id} partner={partner} index={index} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {showWall ? <SponsorWall /> : null}
      </div>
    </section>
  )
}

function PartnerCard({ partner, index }: { partner: Partner; index: number }) {
  return (
    <article
      className="group animate-mcs-fade-up rounded-2xl border border-[#081c3a]/10 bg-white p-4 text-center shadow-[0_18px_48px_rgba(8,28,58,0.10)] transition duration-300 hover:-translate-y-1 hover:border-[#D8B15A]/70 hover:shadow-[0_28px_70px_rgba(8,28,58,0.18)]"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="grid h-[120px] place-items-center rounded-xl border border-[#081c3a]/8 bg-[#f8fafc] px-5 py-4">
        <PartnerLogo partner={partner} />
      </div>
      <h4 className="mt-4 font-sport text-lg font-black uppercase leading-6 text-[#081c3a]">{partner.name}</h4>
      <p className="mt-1 min-h-10 text-sm font-semibold leading-5 text-[#667085]">{partner.role}</p>
    </article>
  )
}

function PartnerLogo({ partner }: { partner: Partner }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-[#081c3a]/18 bg-white px-3 font-sport text-xl font-black uppercase text-[#081c3a]">
        {partner.name}
      </span>
    )
  }

  return (
    <Image
      src={partner.logo}
      alt={`${partner.name} logo`}
      width={220}
      height={120}
      className="max-h-[92px] w-auto max-w-full object-contain"
      sizes="(min-width: 1024px) 180px, 44vw"
      onError={() => setFailed(true)}
    />
  )
}

function SponsorWall() {
  const marqueePartners = [...partners, ...partners]

  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-[#081c3a]/10 bg-white py-4 shadow-[0_18px_50px_rgba(8,28,58,0.08)]">
      <div className="flex w-max animate-mcs-partner-marquee items-center gap-8 px-4 will-change-transform">
        {marqueePartners.map((partner, index) => (
          <div key={`${partner.id}-${index}`} className="flex h-16 w-40 shrink-0 items-center justify-center rounded-xl bg-[#f8fafc] px-4">
            <PartnerLogo partner={partner} />
          </div>
        ))}
      </div>
    </div>
  )
}
