import Image from "next/image"

import { brandAssets, event } from "@/data/mcs"
import { cn } from "@/lib/utils"

type BrandMarkProps = {
  compact?: boolean
  className?: string
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative grid shrink-0 place-items-center overflow-hidden border border-[color:var(--mcs-gold)] bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]",
          compact ? "size-10 rounded-md" : "size-14 rounded-lg"
        )}
      >
        <Image src={brandAssets[0].src} alt={brandAssets[0].name} fill sizes={compact ? "40px" : "56px"} className="object-contain p-1.5" />
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
