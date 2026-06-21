import Image from "next/image"

import { brandAssets, event, eventLogo } from "@/data/mcs"
import { cn } from "@/lib/utils"

type BrandMarkProps = {
  compact?: boolean
  className?: string
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex shrink-0 items-center gap-1.5">
        <div
          className={cn(
            "relative grid place-items-center",
            compact ? "h-10 w-8" : "h-12 w-10",
          )}
        >
          <Image src={eventLogo.src} alt={eventLogo.name} fill sizes={compact ? "32px" : "40px"} className="object-contain" />
        </div>
        {brandAssets.map((asset) => (
          <div
            key={asset.name}
            className={cn(
              "relative grid place-items-center overflow-hidden rounded-md bg-white shadow-[0_10px_24px_rgba(0,0,0,0.22)]",
              compact ? "size-9 p-1" : "size-11 p-1.5"
            )}
          >
            <Image src={asset.src} alt={asset.name} fill sizes={compact ? "36px" : "44px"} className="object-contain p-1" />
          </div>
        ))}
      </div>
      <div className={cn("min-w-0", compact && "hidden sm:block")}>
        <p className="font-display text-3xl leading-none text-white">MCS 1</p>
        <p className="truncate text-[0.68rem] font-semibold uppercase text-[color:var(--mcs-gold)]">
          {event.school}
        </p>
      </div>
    </div>
  )
}
