"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { brandAssets, dashboardFootage, event } from "@/data/mcs"
import { cn } from "@/lib/utils"

const heroDescription =
  "Melati Championship Series 1 merupakan ajang kompetisi olahraga dan seni dalam rangka Anniversary SMKN 20 Jakarta yang menghadirkan pengalaman event sekolah dengan atmosfer profesional, modern, dan kompetitif."

const authorizedRoles = [
  "Super Admin",
  "Ketua Pelaksana",
  "PJ Lomba",
  "Humas",
  "Dokumentasi",
  "Panitia",
]

export function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [status, setStatus] = useState<"idle" | "checking" | "ready">("idle")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("checking")

    window.setTimeout(() => {
      setStatus("ready")
    }, 700)
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#07111d]">
      <div className="grid min-h-screen max-w-full grid-cols-1 overflow-x-hidden lg:grid-cols-[minmax(0,70fr)_minmax(380px,30fr)]">
        <section className="relative min-h-[620px] min-w-0 overflow-hidden bg-[#07111d] text-white lg:min-h-screen">
          <Image
            src={dashboardFootage[0].src}
            alt="Pertandingan basket Melati Championship Series 1 di SMKN 20 Jakarta"
            fill
            priority
            sizes="(min-width: 1024px) 70vw, 100vw"
            className={cn("object-cover", dashboardFootage[0].crop)}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,13,0.82)_0%,rgba(3,7,13,0.58)_42%,rgba(3,7,13,0.2)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,13,0.18)_0%,rgba(3,7,13,0.12)_48%,rgba(3,7,13,0.7)_100%)]" />

          <div className="relative z-10 flex min-h-[620px] min-w-0 flex-col px-5 py-6 sm:px-8 lg:min-h-screen lg:px-14 lg:py-10 xl:px-18">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex items-center gap-2.5">
                {brandAssets.map((asset) => (
                  <LogoBadge key={asset.name} name={asset.name} src={asset.src} />
                ))}
              </div>
              <div className="h-8 w-px bg-white/32" />
              <p className="font-sport text-xs font-black uppercase tracking-[0.2em] text-white/82">
                {event.shortName}
              </p>
            </div>

            <div className="my-auto max-w-[18rem] py-16 sm:max-w-[820px] sm:py-20 lg:py-12">
              <h1 className="font-display text-[3rem] leading-[0.9] text-white min-[430px]:text-[4.05rem] sm:text-[7.5rem] lg:text-[9.5rem] xl:text-[11rem]">
                MELATI
                <br />
                CHAMPIONSHIP
                <br />
                SERIES 1
              </h1>
              <p className="mt-7 font-sport text-lg font-black uppercase tracking-[0.14em] text-[color:var(--mcs-gold-soft)] sm:text-2xl">
                {event.theme}
              </p>
              <p className="mt-6 max-w-[42rem] text-sm font-medium leading-7 text-white/78 sm:text-base sm:leading-8">
                {heroDescription}
              </p>
              <p className="mt-9 border-l-2 border-[color:var(--mcs-gold)] pl-5 font-display text-3xl leading-none text-white sm:text-5xl">
                Every Play is a Story,
                <br />
                Every Student is a Star.
              </p>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-[660px] min-w-0 items-center justify-center overflow-hidden bg-white px-0 py-16 text-[#07111d] lg:min-h-screen lg:px-8">
          <Link
            href="/"
            className="absolute left-6 top-6 inline-flex max-w-[calc(100%-3rem)] items-center gap-2 truncate text-xs font-bold uppercase tracking-[0.08em] text-[#07111d]/48 transition hover:text-[#07111d] sm:left-10 lg:left-8"
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span className="truncate">Back to Landing Page</span>
          </Link>

          <div className="box-border w-full min-w-0 px-[44px] sm:px-[56px] lg:max-w-[420px] lg:px-0">
            <McsWordmark />

            <div className="mt-9">
              <h2 className="font-display text-6xl leading-none text-[#07111d] sm:text-7xl">
                Operator Login
              </h2>
              <p className="mt-4 max-w-[20rem] text-sm font-medium leading-6 text-[#07111d]/58">
                Access the official MCS 1 Event Operating Center
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 w-[270px] min-[430px]:w-[320px] sm:w-full">
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-semibold text-[#07111d]">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#07111d]/34" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="operator@mcs1.id"
                      className="h-13 rounded-md border-[#07111d]/12 bg-[#f7f8fa] pl-11 text-[0.95rem] text-[#07111d] placeholder:text-[#07111d]/32 focus-visible:border-[color:var(--mcs-red)] focus-visible:ring-[3px] focus-visible:ring-[rgba(166,29,45,0.12)]"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="password" className="text-sm font-semibold text-[#07111d]">
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#07111d]/34" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="h-13 rounded-md border-[#07111d]/12 bg-[#f7f8fa] pl-11 pr-11 text-[0.95rem] text-[#07111d] placeholder:text-[#07111d]/32 focus-visible:border-[color:var(--mcs-red)] focus-visible:ring-[3px] focus-visible:ring-[rgba(166,29,45,0.12)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center text-[#07111d]/42 transition hover:text-[#07111d]"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex min-w-0 items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#07111d]/64">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="size-4 appearance-none rounded-[3px] border border-[#07111d]/26 bg-white transition checked:border-[color:var(--mcs-red)] checked:bg-[color:var(--mcs-red)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--mcs-red)]"
                  />
                  Remember Me
                </label>
                <button
                  type="button"
                  className="shrink-0 text-sm font-semibold text-[#07111d]/46 transition hover:text-[color:var(--mcs-red)]"
                >
                  Forgot Password
                </button>
              </div>

              <Button
                type="submit"
                disabled={status === "checking"}
                className="mt-8 h-13 w-full rounded-md bg-[color:var(--mcs-red)] font-sport text-sm font-black uppercase tracking-[0.1em] text-white shadow-none hover:bg-[#7f1422]"
              >
                {status === "checking" ? "CHECKING" : "LOGIN"}
              </Button>

              <p className="mx-auto mt-5 max-w-[20rem] text-center text-xs leading-5 text-[#07111d]/45">
                Authorized access only for official MCS 1 committee members.
              </p>
              <p className="mt-3 min-h-5 text-center text-xs font-medium text-[color:var(--mcs-red)]" aria-live="polite">
                {status === "ready" ? "Access validated for the Event Operating Center." : ""}
              </p>
            </form>

            <div className="mt-9 w-[270px] border-t border-[#07111d]/10 pt-5 min-[430px]:w-[320px] sm:w-full">
              <p className="font-sport text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#07111d]/36">
                Authorized Roles
              </p>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs font-semibold text-[#07111d]/56">
                {authorizedRoles.map((role, index) => (
                  <span key={role}>
                    {role}
                    {index < authorizedRoles.length - 1 ? "," : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function McsWordmark() {
  const mcsLogo = brandAssets.find((a) => a.src.includes("mcs-logo"))

  return (
    <div className="inline-flex items-center gap-4">
      {mcsLogo ? (
        <Image src={mcsLogo.src} alt={mcsLogo.name} width={56} height={56} className="rounded-md object-contain" />
      ) : (
        <div className="grid size-14 place-items-center rounded-md bg-[color:var(--mcs-red)] text-white">
          <span className="font-display text-3xl leading-none">MCS</span>
        </div>
      )}

      <div className="min-w-0">
        <p className="font-sport text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#07111d]/42 truncate">
          {event.shortName}
        </p>
        <p className="mt-1 text-sm font-semibold text-[#07111d] truncate">{event.organizer}</p>
      </div>
    </div>
  )
}

function LogoBadge({ name, src }: { name: string; src: string }) {
  return (
    <span className="relative grid size-11 place-items-center rounded-md bg-white p-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.22)] sm:size-13">
      <Image src={src} alt={name} width={42} height={42} className="max-h-full w-auto object-contain" />
    </span>
  )
}
