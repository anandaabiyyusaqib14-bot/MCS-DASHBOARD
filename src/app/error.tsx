"use client"

import { useEffect } from "react"
import { AlertOctagon, RotateCcw } from "lucide-react"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console or error report service
    console.error("Unhandled runtime error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#081C3A] px-6 text-center text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(166,29,45,0.12)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#A61D2D]/20 text-[#A61D2D] mb-8 animate-bounce">
          <AlertOctagon className="h-10 w-10" />
        </div>

        <h1 className="font-display text-6xl tracking-tight text-white sm:text-7xl leading-none">
          SYSTEM ERROR
        </h1>

        <h2 className="mt-4 font-sport text-lg font-black uppercase tracking-wider text-[#D8B15A] sm:text-xl">
          Terjadi Gangguan pada Sistem
        </h2>

        <p className="mt-4 text-base font-semibold leading-7 text-white/70">
          Sistem event operating system mengalami error yang tidak terduga. Silakan coba memuat kembali halaman.
        </p>

        {error.message && (
          <div className="mt-6 rounded-lg bg-black/30 p-4 font-mono text-xs text-red-300 max-h-32 overflow-y-auto border border-white/10">
            {error.message}
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#A61D2D] px-6 font-sport text-sm font-black uppercase text-white transition hover:bg-[#851622]"
          >
            <RotateCcw className="h-4 w-4" />
            Coba Lagi
          </button>
          <a
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 bg-white/10 px-6 font-sport text-sm font-black uppercase text-white transition hover:bg-white/20"
          >
            Kembali ke Home
          </a>
        </div>
      </div>

      <p className="absolute bottom-6 text-xs font-semibold text-white/40">
        Melati Championship Series 1 &copy; 2026
      </p>
    </div>
  )
}
