"use client"

import Link from "next/link"
import { Trophy, AlertTriangle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#081C3A] px-6 text-center text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,177,90,0.08)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="relative z-10 max-w-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#D8B15A]/10 text-[#D8B15A] mb-8 animate-pulse">
          <Trophy className="h-10 w-10" />
        </div>

        <h1 className="font-display text-8xl tracking-tight text-[#D8B15A] sm:text-9xl leading-none">
          404
        </h1>
        
        <h2 className="mt-4 font-sport text-xl font-black uppercase tracking-wider text-[color:var(--mcs-red)] sm:text-2xl">
          Halaman Tidak Ditemukan
        </h2>
        
        <p className="mt-4 text-base font-semibold leading-7 text-white/70">
          Mungkin rute pertandingan sudah berubah atau halaman yang Anda cari telah dipindahkan. Silakan kembali ke halaman utama.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-md bg-[#D8B15A] px-6 font-sport text-sm font-black uppercase text-[#081c3a] transition hover:bg-[#c29c48]"
          >
            Kembali ke Home
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 bg-white/10 px-6 font-sport text-sm font-black uppercase text-white transition hover:bg-white/20"
          >
            Login Panitia
          </Link>
        </div>
      </div>
      
      <p className="absolute bottom-6 text-xs font-semibold text-white/40">
        Melati Championship Series 1 &copy; 2026
      </p>
    </div>
  )
}
