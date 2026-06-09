"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { brandAssets, contact, dashboardFootage, event } from "@/data/mcs"

const authorizedRoles = [
  "Super Admin",
  "Ketua Pelaksana",
  "Wakil Ketua",
  "Sekretaris",
  "Bendahara",
  "Acara",
  "PJ Lomba",
  "Humas",
  "Dokumentasi",
  "Kebersihan",
  "Perlengkapan",
  "Keamanan",
  "Kewirausahaan",
  "Operator",
]

export function LoginScreen() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [status, setStatus] = useState<"idle" | "checking" | "ready" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("checking")
    setMessage("")

    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch("/api/mcs/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          rememberMe,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null
        setStatus("error")
        setMessage(getLoginErrorMessage(payload?.error))
        return
      }

      setStatus("ready")
      setMessage("Akses valid. Mengarahkan ke dashboard.")

      window.setTimeout(() => {
        const searchParams = new URLSearchParams(window.location.search)
        const nextPath = searchParams.get("from") || "/dashboard"
        router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard")
        router.refresh()
      }, 250)
    } catch {
      setStatus("error")
      setMessage("Login belum bisa diproses. Periksa koneksi lalu coba lagi.")
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef2f6] text-[#07111d]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex min-h-11 items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex min-w-0 items-center gap-2 rounded-md px-1 py-2 font-sport text-xs font-black uppercase text-[#07111d]/60 transition hover:text-[#07111d]"
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span className="truncate">Kembali ke Landing</span>
          </Link>

          <div className="hidden items-center gap-2 rounded-md border border-[#081c3a]/12 bg-white px-3 py-2 text-xs font-bold text-[#081c3a]/64 sm:flex">
            <ShieldCheck className="size-4 text-[color:var(--mcs-red)]" />
            Internal
          </div>
        </header>

        <section className="grid flex-1 place-items-center py-4 sm:py-6">
          <div className="grid w-full overflow-hidden rounded-lg border border-[#081c3a]/12 bg-white shadow-[0_24px_80px_rgba(8,28,58,0.14)] lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.75fr)]">
            <BrandPanel />

            <div className="min-w-0 px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div className="flex flex-col gap-3 lg:hidden">
                <div className="inline-flex min-w-0 items-center gap-3 rounded-full bg-white/95 px-4 py-3 shadow-sm ring-1 ring-[#081c3a]/10">
                  <LogoRow compact />
                  <div className="min-w-0">
                    <p className="font-display text-2xl leading-none text-[#07111d]">{event.shortName}</p>
                    <p className="truncate text-xs font-bold text-[#07111d]/54">{event.organizer}</p>
                  </div>
                </div>
              </div>

              <div className="mt-7 lg:mt-0">
                <p className="font-sport text-xs font-black uppercase tracking-[0.16em] text-[color:var(--mcs-red)]">
                  Login Panitia
                </p>
                <h1 className="mt-3 font-display text-6xl leading-none text-[#07111d] sm:text-7xl">
                  Masuk
                </h1>
                <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-[#07111d]/58">
                  Akses sistem manajemen kepanitiaan resmi MCS 1.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8" aria-busy={status === "checking"}>
                <div className="grid gap-4">
                  <FieldLabel htmlFor="email" label="Email">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#07111d]/36" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      suppressHydrationWarning
                      autoComplete="email"
                      placeholder="Email akun panitia"
                      className="h-12 w-full min-w-0 rounded-md border border-[#07111d]/14 bg-[#f8fafc] px-3 py-2 pl-11 text-[0.95rem] font-semibold text-[#07111d] outline-none transition placeholder:text-[#07111d]/34 focus-visible:border-[color:var(--mcs-red)] focus-visible:ring-[3px] focus-visible:ring-[rgba(166,29,45,0.12)]"
                    />
                  </FieldLabel>

                  <FieldLabel htmlFor="password" label="Password">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#07111d]/36" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      suppressHydrationWarning
                      autoComplete="current-password"
                      placeholder="Password akun"
                      className="h-12 w-full min-w-0 rounded-md border border-[#07111d]/14 bg-[#f8fafc] px-3 py-2 pl-11 pr-11 text-[0.95rem] font-semibold text-[#07111d] outline-none transition placeholder:text-[#07111d]/34 focus-visible:border-[color:var(--mcs-red)] focus-visible:ring-[3px] focus-visible:ring-[rgba(166,29,45,0.12)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-[#07111d]/44 transition hover:bg-[#07111d]/6 hover:text-[#07111d]"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      <span className="sr-only">{showPassword ? "Sembunyikan password" : "Tampilkan password"}</span>
                    </button>
                  </FieldLabel>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#07111d]/64">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      suppressHydrationWarning
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="size-4 appearance-none rounded-[3px] border border-[#07111d]/26 bg-white transition checked:border-[color:var(--mcs-red)] checked:bg-[color:var(--mcs-red)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--mcs-red)]"
                    />
                    Ingat sesi
                  </label>
                  <a
                    href={contact.whatsappOfficial.href}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#07111d]/52 transition hover:text-[color:var(--mcs-red)]"
                  >
                    <MessageCircle className="size-4" />
                    Butuh akses?
                  </a>
                </div>

                <Button
                  type="submit"
                  disabled={status === "checking"}
                  className="mt-7 h-12 w-full rounded-md bg-[color:var(--mcs-red)] font-sport text-sm font-black uppercase tracking-[0.08em] text-white shadow-none hover:bg-[#7f1422]"
                >
                  {status === "checking" ? (
                    "Memeriksa Akses"
                  ) : (
                    <>
                      <LogIn className="size-4" />
                      Masuk ke Dashboard
                    </>
                  )}
                </Button>

                <StatusMessage status={status} message={message} />
              </form>

              <div className="mt-6 border-t border-[#081c3a]/10 pt-4">
                <p className="text-xs font-semibold leading-5 text-[#07111d]/48">
                  Role yang dapat masuk: {authorizedRoles.join(", ")}.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function BrandPanel() {
  return (
    <aside className="relative hidden min-h-[620px] overflow-hidden bg-[#081c3a] text-white lg:block">
      <Image
        src={dashboardFootage[1].src}
        alt={dashboardFootage[1].label}
        fill
        priority
        sizes="620px"
        className={`object-cover ${dashboardFootage[1].crop}`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,28,58,0.98)_0%,rgba(8,28,58,0.88)_48%,rgba(8,28,58,0.46)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,28,58,0.12)_0%,rgba(8,28,58,0.1)_50%,rgba(8,28,58,0.86)_100%)]" />

      <div className="relative z-10 flex min-h-[620px] flex-col p-10">
        <div className="flex items-center gap-3">
          <div className="inline-flex min-w-0 items-center gap-3 rounded-full bg-white/10 px-4 py-3">
            <LogoRow compact />
            <div className="min-w-0">
              <p className="font-display text-4xl leading-none text-white">{event.shortName}</p>
              <p className="truncate text-xs font-bold text-white/58">{event.organizer}</p>
            </div>
          </div>
        </div>

        <div className="my-auto max-w-xl">
          <p className="font-sport text-xs font-black uppercase tracking-[0.18em] text-[color:var(--mcs-gold-soft)]">
            Sistem Kepanitiaan
          </p>
          <h2 className="mt-4 font-display text-7xl leading-[0.9]">
            Akses
            <br />
            Internal
            <br />
            Panitia
          </h2>
          <p className="mt-5 max-w-md text-sm font-semibold leading-7 text-white/68">
            Untuk mengelola jadwal, lomba, pengumuman, dokumen, laporan, dan koordinasi panitia MCS 1.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-white/14 pt-5">
          <BrandFact label="Event" value={event.shortName} />
          <BrandFact label="Tanggal" value={event.dateRange} />
          <BrandFact label="Akses" value="Internal" />
        </div>
      </div>
    </aside>
  )
}

function BrandFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-sport text-[0.65rem] font-black uppercase text-[color:var(--mcs-gold-soft)]">{label}</p>
      <p className="mt-1 text-sm font-bold text-white/76">{value}</p>
    </div>
  )
}

function FieldLabel({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-bold text-[#07111d]">
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  )
}

function StatusMessage({ status, message }: { status: "idle" | "checking" | "ready" | "error"; message: string }) {
  if (status !== "ready" && status !== "error") {
    return (
      <p className="mt-4 min-h-5 text-center text-xs font-semibold text-[#07111d]/42">
        Akses terbatas untuk panitia resmi MCS 1.
      </p>
    )
  }

  const isReady = status === "ready"

  return (
    <div
      className={`mt-4 flex items-start gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${
        isReady
          ? "border-emerald-500/20 bg-emerald-50 text-emerald-700"
          : "border-[color:var(--mcs-red)]/20 bg-red-50 text-[color:var(--mcs-red)]"
      }`}
      aria-live="polite"
    >
      {isReady ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}
      <span>{message}</span>
    </div>
  )
}

function getLoginErrorMessage(error?: { code?: string; message?: string }) {
  if (error?.code === "invalid_credentials") {
    return "Email atau password tidak sesuai."
  }

  if (error?.code === "invalid_input") {
    return "Email dan password wajib diisi."
  }

  return error?.message ?? "Login belum bisa diproses. Coba lagi."
}

function LogoRow({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {brandAssets.map((asset) => (
        <LogoBadge key={asset.name} name={asset.name} src={asset.src} compact={compact} />
      ))}
    </div>
  )
}

function LogoBadge({ name, src, compact = false }: { name: string; src: string; compact?: boolean }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center rounded-full bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.14)] ${
        compact ? "size-10" : "size-11 sm:size-12"
      }`}
    >
      <Image src={src} alt={name} width={42} height={42} className="max-h-full w-auto object-contain" />
    </span>
  )
}
