import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-base font-medium text-[#111827] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#111827] placeholder:text-[#94A3B8] focus-visible:border-[#F97316] focus-visible:ring-3 focus-visible:ring-[#F97316]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#F8F9FB] disabled:text-[#94A3B8] disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
