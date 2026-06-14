import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-base font-medium text-[#111827] transition-colors outline-none placeholder:text-[#94A3B8] focus-visible:border-[#F97316] focus-visible:ring-3 focus-visible:ring-[#F97316]/20 disabled:cursor-not-allowed disabled:bg-[#F8F9FB] disabled:text-[#94A3B8] disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
