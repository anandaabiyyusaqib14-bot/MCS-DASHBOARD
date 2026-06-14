"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Eye,
  FileQuestion,
  Flag,
  Globe,
  ImageUp,
  Layers3,
  Link2,
  Mail,
  MapPin,
  Medal,
  Megaphone,
  Palette,
  Radio,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trophy,
  Upload,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react"

import {
  MCS_SETTINGS_EVENT_NAME,
  MCS_SETTINGS_STORAGE_KEY,
  addSettingsActivity,
  createDefaultMcsSettings,
  eventStatuses,
  mcsRoles,
  mergeMcsSettings,
  permissionCatalog,
  rolePermissionMatrix,
  sportConfigKeys,
  typographyOptions,
  type BrandSettings,
  type EventStatus,
  type GeneralSettings,
  type LandingPageSettings,
  type LiveScoreSettings,
  type McsRole,
  type McsSettingsState,
  type OfficialContactSettings,
  type SportConfigKey,
  type TypographyOption,
} from "@/lib/mcs-settings"
import { cn } from "@/lib/utils"
import type { UserDTO } from "@/server/mcs/types"

const WebsitePreviewModal = dynamic(
  () => import("@/components/dashboard/settings-website-preview-modal").then((module) => module.SettingsWebsitePreviewModal),
  {
    loading: () => <div className="fixed inset-0 z-[80] grid place-items-center bg-[#07111D] text-sm font-bold text-white">Memuat preview...</div>,
    ssr: false,
  },
)

const tabs = [
  { id: "general", label: "General", icon: Globe },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "landing", label: "Landing Page", icon: Layers3 },
  { id: "liveScore", label: "Live Score", icon: Radio },
  { id: "roles", label: "Roles", icon: Users },
  { id: "contact", label: "Contact", icon: Mail },
  { id: "system", label: "System", icon: Activity },
] as const

type TabId = (typeof tabs)[number]["id"]

type ModalState =
  | { type: "permission"; role: McsRole }
  | { type: "landing"; item: LandingCardId }
  | { type: "preview" }
  | null

type SaveState = "idle" | "saving" | "saved"

type LiveScorePayload = {
  competitions: unknown[]
  matches: Array<{ date?: string; status?: string }>
  results: unknown[]
}

type LandingCardId =
  | "hero"
  | "countdown"
  | "liveScore"
  | "bracket"
  | "nationRanking"
  | "sponsor"
  | "gallery"
  | "announcement"
  | "contact"
  | "faq"

const landingCards: Array<{
  id: LandingCardId
  icon: LucideIcon
  label: string
  settingKey: keyof LandingPageSettings
}> = [
  { id: "hero", icon: Sparkles, label: "Hero Section", settingKey: "showHero" },
  { id: "countdown", icon: Clock, label: "Countdown", settingKey: "showCountdown" },
  { id: "liveScore", icon: Radio, label: "Live Score", settingKey: "showLiveScore" },
  { id: "bracket", icon: Trophy, label: "Bracket", settingKey: "showBracket" },
  { id: "nationRanking", icon: Medal, label: "Nation Ranking", settingKey: "showNationRanking" },
  { id: "sponsor", icon: ShieldCheck, label: "Sponsor", settingKey: "showSponsor" },
  { id: "gallery", icon: ImageUp, label: "Gallery", settingKey: "showGallery" },
  { id: "announcement", icon: Megaphone, label: "Announcement", settingKey: "showAnnouncement" },
  { id: "contact", icon: Mail, label: "Contact", settingKey: "showContact" },
  { id: "faq", icon: FileQuestion, label: "FAQ", settingKey: "showFaq" },
]

const sportLabels: Record<SportConfigKey, string> = {
  badminton: "Badminton",
  basket: "Basket",
  futsal: "Futsal",
  mobileLegends: "Mobile Legends",
  soloVokal: "Solo Vokal",
  voli: "Voli",
}

export function SettingsCenter({ user }: { user: UserDTO }) {
  const [settings, setSettings] = useState<McsSettingsState>(() => {
    const base = createDefaultMcsSettings(user)
    if (typeof window === "undefined") return base

    const raw = window.localStorage.getItem(MCS_SETTINGS_STORAGE_KEY)
    if (!raw) return base

    try {
      return mergeMcsSettings(base, JSON.parse(raw) as Partial<McsSettingsState>)
    } catch {
      return base
    }
  })
  const [activeTab, setActiveTab] = useState<TabId>("general")
  const [modal, setModal] = useState<ModalState>(null)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [toast, setToast] = useState("")
  const [liveStats, setLiveStats] = useState({ completed: 0, live: 0, sports: 0, today: 0 })

  const canPublish = user.role === "super_admin" || user.role === "ketua_pelaksana" || user.role === "wakil_ketua"

  const updateSettings = useCallback((updater: (current: McsSettingsState) => McsSettingsState) => {
    setSaveState("saving")
    setSettings(updater)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      try {
        const response = await fetch("/api/mcs/settings", { cache: "no-store" })
        if (!response.ok) throw new Error("Settings request failed")
        const payload = (await response.json()) as { data?: Partial<McsSettingsState> }
        if (!cancelled && payload.data) {
          setSettings(mergeMcsSettings(createDefaultMcsSettings(user), payload.data))
        }
      } catch {
        if (!cancelled) {
          const raw = window.localStorage.getItem(MCS_SETTINGS_STORAGE_KEY)
          if (raw) {
            try {
              setSettings(mergeMcsSettings(createDefaultMcsSettings(user), JSON.parse(raw) as Partial<McsSettingsState>))
            } catch {
              setSettings(createDefaultMcsSettings(user))
            }
          }
        }
      } finally {
        if (!cancelled) setSettingsLoaded(true)
      }
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!settingsLoaded) return

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(MCS_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
      document.documentElement.style.setProperty("--mcs-primary", settings.brand.primaryColor)
      document.documentElement.style.setProperty("--mcs-secondary", settings.brand.secondaryColor)
      document.documentElement.style.setProperty("--mcs-accent", settings.brand.accentColor)
      document.documentElement.style.setProperty("--mcs-font-family", settings.brand.typography)
      window.dispatchEvent(new CustomEvent(MCS_SETTINGS_EVENT_NAME, { detail: settings }))
      void fetch("/api/mcs/settings", {
        body: JSON.stringify(settings),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }).catch(() => undefined)
      setSaveState("saved")
    }, 450)

    return () => window.clearTimeout(timer)
  }, [settings, settingsLoaded])

  useEffect(() => {
    if (activeTab !== "liveScore") return

    let cancelled = false
    async function loadStats() {
      try {
        const response = await fetch("/api/mcs/live-score", { cache: "no-store" })
        const payload = (await response.json()) as LiveScorePayload
        const today = new Date().toISOString().slice(0, 10)
        if (!cancelled) {
          setLiveStats({
            completed: payload.matches.filter((match) => match.status === "Finished").length,
            live: payload.matches.filter((match) => match.status === "Live").length,
            sports: payload.competitions.length,
            today: payload.matches.filter((match) => match.date === today).length,
          })
        }
      } catch {
        if (!cancelled) setLiveStats({ completed: 0, live: 0, sports: 0, today: 0 })
      }
    }

    void loadStats()

    return () => {
      cancelled = true
    }
  }, [activeTab])

  function saveDraft() {
    updateSettings((current) =>
      addSettingsActivity(
        { ...current, general: { ...current.general, status: "Draft" }, updatedAt: new Date().toISOString() },
        user.displayName,
        "Draft Settings Center disimpan.",
      ),
    )
    showToast("Draft tersimpan.")
  }

  function publishChanges() {
    if (!canPublish) {
      showToast("Akun ini tidak memiliki akses publish.")
      return
    }

    updateSettings((current) =>
      addSettingsActivity(
        { ...current, general: { ...current.general, status: "Published" }, updatedAt: new Date().toISOString() },
        user.displayName,
        "Perubahan Settings Center dipublish.",
      ),
    )
    showToast("Perubahan dipublish.")
  }

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(""), 2400)
  }

  const statusTone = settings.general.status === "Published" ? "bg-[#16A34A]" : "bg-[#D8B15A]"

  return (
    <section className="relative grid gap-5">
      <header className="sticky top-0 z-30 -mx-3 border-b border-[#E5E7EB] bg-[#F8FAFC]/94 px-3 py-3 backdrop-blur-xl sm:-mx-5 sm:px-5">
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-4 shadow-[0_12px_34px_rgba(17,24,39,0.07)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#081C3A] text-white shadow-[0_10px_24px_rgba(8,28,58,0.22)]">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h1 className="text-xl font-black tracking-[-0.01em] text-[#0F172A] sm:text-2xl">
                    Control Center Konfigurasi MCS
                  </h1>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#64748B]">
                    Pusat konfigurasi seluruh sistem Melati Championship Series 1.
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.06em] text-[#64748B]">
                <span className="inline-flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", statusTone)} />
                  {settings.general.status}
                </span>
                <span>Last Saved: {formatRelativeTime(settings.updatedAt)}</span>
                <span>{saveState === "saving" ? "Auto save..." : saveState === "saved" ? "Draft cache synced" : "Ready"}</span>
              </div>
            </div>

            <div className="grid gap-2 sm:flex sm:items-center sm:justify-end">
              <HeaderButton icon={Eye} label="Preview Website" onClick={() => setModal({ type: "preview" })} variant="secondary" />
              <HeaderButton icon={Save} label="Simpan Draft" onClick={saveDraft} variant="secondary" />
              <HeaderButton icon={Upload} label="Publish Perubahan" onClick={publishChanges} />
            </div>
          </div>

          <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto" aria-label="Settings Center Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-black transition",
                    active
                      ? "border-[#081C3A] bg-[#081C3A] text-white shadow-[0_10px_20px_rgba(8,28,58,0.18)]"
                      : "border-[#E5E7EB] bg-white text-[#475569] hover:border-[#A61D2D] hover:text-[#A61D2D]",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
        {toast ? <p className="mt-3 rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-2 text-sm font-bold text-[#1D4ED8]">{toast}</p> : null}
      </header>

      <main className="min-w-0">
        {activeTab === "general" ? <GeneralTab settings={settings.general} onChange={(key, value) => updateSettings((current) => ({ ...current, general: { ...current.general, [key]: value } }))} /> : null}
        {activeTab === "branding" ? <BrandingTab settings={settings.brand} onChange={(key, value) => updateSettings((current) => ({ ...current, brand: { ...current.brand, [key]: value } }))} /> : null}
        {activeTab === "landing" ? <LandingTab settings={settings.landingPage} onCardClick={(item) => setModal({ type: "landing", item })} onChange={(key, value) => updateSettings((current) => ({ ...current, landingPage: { ...current.landingPage, [key]: value } }))} /> : null}
        {activeTab === "liveScore" ? <LiveScoreTab settings={settings.liveScore} stats={liveStats} onChange={(key, value) => updateSettings((current) => ({ ...current, liveScore: { ...current.liveScore, [key]: value } }))} /> : null}
        {activeTab === "roles" ? <RolesTab settings={settings} onManage={(role) => setModal({ type: "permission", role })} /> : null}
        {activeTab === "contact" ? <ContactTab settings={settings.contacts} onChange={(key, value) => updateSettings((current) => ({ ...current, contacts: { ...current.contacts, [key]: value } }))} /> : null}
        {activeTab === "system" ? <SystemTab settings={settings} /> : null}
      </main>

      <SettingsModal modal={modal} onClose={() => setModal(null)}>
        {modal?.type === "permission" ? <PermissionMatrix role={modal.role} /> : null}
        {modal?.type === "landing" ? <LandingDetail item={modal.item} settings={settings.landingPage} onChange={(key, value) => updateSettings((current) => ({ ...current, landingPage: { ...current.landingPage, [key]: value } }))} /> : null}
      </SettingsModal>

      {modal?.type === "preview" ? (
        <Suspense fallback={<div className="fixed inset-0 z-[80] grid place-items-center bg-[#07111D] text-sm font-bold text-white">Memuat preview...</div>}>
          <WebsitePreviewModal onClose={() => setModal(null)} />
        </Suspense>
      ) : null}
    </section>
  )
}

const GeneralTab = memo(function GeneralTab({
  onChange,
  settings,
}: {
  onChange: <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => void
  settings: GeneralSettings
}) {
  return (
    <TabSurface
      icon={Globe}
      title="General"
      description="Informasi inti event yang menjadi sumber data landing page dan dashboard internal."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Nama Event" value={settings.eventName} onChange={(value) => onChange("eventName", value)} />
        <Field label="Tema Event" value={settings.theme} onChange={(value) => onChange("theme", value)} />
        <Field label="Tagline Event" value={settings.tagline} onChange={(value) => onChange("tagline", value)} />
        <Field label="Lokasi Event" value={settings.location} onChange={(value) => onChange("location", value)} icon={MapPin} />
        <Field label="Tanggal Mulai" type="date" value={settings.startDate} onChange={(value) => onChange("startDate", value)} icon={CalendarDays} />
        <Field label="Tanggal Selesai" type="date" value={settings.endDate} onChange={(value) => onChange("endDate", value)} icon={CalendarDays} />
        <SelectField label="Status Event" value={settings.status} options={eventStatuses} onChange={(value) => onChange("status", value as EventStatus)} />
        <Field label="Maps URL" value={settings.mapsUrl} onChange={(value) => onChange("mapsUrl", value)} icon={Link2} />
        <label className="grid gap-2 lg:col-span-2">
          <span className="text-xs font-black uppercase tracking-[0.08em] text-[#64748B]">Deskripsi Event</span>
          <textarea
            value={settings.description}
            onChange={(event) => onChange("description", event.target.value)}
            className="min-h-44 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold leading-7 text-[#0F172A] outline-none transition focus:border-[#A61D2D] focus:ring-4 focus:ring-[#A61D2D]/10"
          />
        </label>
      </div>
    </TabSurface>
  )
})

const BrandingTab = memo(function BrandingTab({
  onChange,
  settings,
}: {
  onChange: <K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) => void
  settings: BrandSettings
}) {
  return (
    <div className="grid gap-5">
      <TabSurface icon={ImageUp} title="Logo Management" description="Kelola aset resmi MCS tanpa membuat logo fiktif.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <LogoControl label="Logo Event" name={settings.eventLogoName} value={settings.eventLogo} onChange={(src, name) => { onChange("eventLogo", src); onChange("eventLogoName", name) }} onRemove={() => { onChange("eventLogo", ""); onChange("eventLogoName", "MCS 1 ditampilkan sebagai teks event") }} />
          <LogoControl label="Logo Sekolah" name={settings.schoolLogoName} value={settings.schoolLogo} onChange={(src, name) => { onChange("schoolLogo", src); onChange("schoolLogoName", name) }} onRemove={() => { onChange("schoolLogo", ""); onChange("schoolLogoName", "") }} />
          <LogoControl label="Logo OSIS" name={settings.osisLogoName} value={settings.osisLogo} onChange={(src, name) => { onChange("osisLogo", src); onChange("osisLogoName", name) }} onRemove={() => { onChange("osisLogo", ""); onChange("osisLogoName", "") }} />
          <LogoControl label="Logo MPK" name={settings.mpkLogoName} value={settings.mpkLogo} onChange={(src, name) => { onChange("mpkLogo", src); onChange("mpkLogoName", name) }} onRemove={() => { onChange("mpkLogo", ""); onChange("mpkLogoName", "") }} />
          <LogoControl label="Favicon Website" name={settings.faviconName} value={settings.favicon} onChange={(src, name) => { onChange("favicon", src); onChange("faviconName", name) }} onRemove={() => { onChange("favicon", ""); onChange("faviconName", "") }} />
          <LogoControl label="Open Graph Image" name={settings.ogImageName} value={settings.ogImage} onChange={(src, name) => { onChange("ogImage", src); onChange("ogImageName", name) }} onRemove={() => { onChange("ogImage", ""); onChange("ogImageName", "") }} />
        </div>
      </TabSurface>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TabSurface icon={Palette} title="Color System" description="Warna utama untuk landing page, dashboard, dan state operasional.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ColorControl label="Primary" value={settings.primaryColor} onChange={(value) => onChange("primaryColor", value)} />
            <ColorControl label="Secondary" value={settings.secondaryColor} onChange={(value) => onChange("secondaryColor", value)} />
            <ColorControl label="Accent" value={settings.accentColor} onChange={(value) => onChange("accentColor", value)} />
            <ColorControl label="Danger" value={settings.dangerColor} onChange={(value) => onChange("dangerColor", value)} />
            <ColorControl label="Success" value={settings.successColor} onChange={(value) => onChange("successColor", value)} />
          </div>
        </TabSurface>

        <TabSurface icon={Sparkles} title="Typography" description="Font interface publik dan dashboard.">
          <SelectField label="Font Family" value={settings.typography} options={typographyOptions} onChange={(value) => onChange("typography", value as TypographyOption)} />
          <div className="mt-4 rounded-xl border border-[#E5E7EB] p-4" style={{ fontFamily: settings.typography }}>
            <p className="text-xs font-black uppercase tracking-[0.08em] text-[#A61D2D]">Preview</p>
            <p className="mt-2 text-2xl font-black text-[#0F172A]">Melati Championship Series 1</p>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">Every Play is a Story, Every Student is a Star.</p>
          </div>
        </TabSurface>
      </section>
    </div>
  )
})

const LandingTab = memo(function LandingTab({
  onCardClick,
  onChange,
  settings,
}: {
  onCardClick: (item: LandingCardId) => void
  onChange: (key: keyof LandingPageSettings, value: boolean) => void
  settings: LandingPageSettings
}) {
  return (
    <TabSurface icon={Layers3} title="Landing Page Control" description="Aktifkan section publik dengan card grid. Klik card untuk konfigurasi detail.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {landingCards.map((card) => {
          const Icon = card.icon
          const enabled = settings[card.settingKey]

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onCardClick(card.id)}
              className="group min-w-0 rounded-xl border border-[#E5E7EB] bg-white p-4 text-left shadow-[0_10px_24px_rgba(17,24,39,0.04)] transition hover:-translate-y-0.5 hover:border-[#081C3A]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={cn("grid size-11 place-items-center rounded-xl", enabled ? "bg-[#EFF6FF] text-[#081C3A]" : "bg-[#F1F5F9] text-[#94A3B8]")}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <ToggleSwitch checked={enabled} onChange={(value) => onChange(card.settingKey, value)} />
              </div>
              <p className="mt-4 text-base font-black text-[#0F172A]">{card.label}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <StatusPill active={enabled} />
                <ChevronRight className="size-4 text-[#94A3B8] transition group-hover:translate-x-0.5 group-hover:text-[#081C3A]" aria-hidden="true" />
              </div>
            </button>
          )
        })}
      </div>
    </TabSurface>
  )
})

const LiveScoreTab = memo(function LiveScoreTab({
  onChange,
  settings,
  stats,
}: {
  onChange: <K extends keyof LiveScoreSettings>(key: K, value: LiveScoreSettings[K]) => void
  settings: LiveScoreSettings
  stats: { completed: number; live: number; sports: number; today: number }
}) {
  return (
    <div className="grid gap-5">
      <TabSurface icon={Radio} title="Live Score Control" description="Kontrol display pertandingan, bracket, ranking, timeline, dan refresh data.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ToggleCard icon={Radio} label="Enable Live Score" checked={settings.enableLiveScore} onChange={(value) => onChange("enableLiveScore", value)} />
          <ToggleCard icon={Trophy} label="Enable Bracket" checked={settings.enableBracket} onChange={(value) => onChange("enableBracket", value)} />
          <ToggleCard icon={Medal} label="Enable Ranking" checked={settings.enableNationsRanking} onChange={(value) => onChange("enableNationsRanking", value)} />
          <ToggleCard icon={Activity} label="Enable Match Timeline" checked={settings.enableMatchTimeline} onChange={(value) => onChange("enableMatchTimeline", value)} />
          <ToggleCard icon={RefreshCw} label="Auto Refresh" checked={settings.autoRefresh} onChange={(value) => onChange("autoRefresh", value)} />
          <SelectField
            label="Refresh Interval"
            value={String(settings.refreshInterval)}
            options={["5", "10", "15", "30"]}
            onChange={(value) => onChange("refreshInterval", Number(value))}
          />
        </div>
      </TabSurface>

      <TabSurface icon={Activity} title="Statistics" description="Ringkasan realtime dari Live Score Center.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Match Hari Ini" value={String(stats.today)} />
          <MetricCard label="Match Berlangsung" value={String(stats.live)} tone="success" />
          <MetricCard label="Match Selesai" value={String(stats.completed)} />
          <MetricCard label="Total Cabang Lomba" value={String(stats.sports)} tone="navy" />
        </div>
      </TabSurface>

      <TabSurface icon={Flag} title="Sport Config" description="Cabang lomba yang aktif untuk Live Score Center.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sportConfigKeys.map((key) => (
            <ToggleCard
              key={key}
              icon={Trophy}
              label={sportLabels[key]}
              checked={settings.sportConfig[key]}
              onChange={(value) => onChange("sportConfig", { ...settings.sportConfig, [key]: value })}
            />
          ))}
        </div>
      </TabSurface>
    </div>
  )
})

const RolesTab = memo(function RolesTab({ onManage, settings }: { onManage: (role: McsRole) => void; settings: McsSettingsState }) {
  const counts = useMemo(() => {
    return settings.users.reduce<Record<string, number>>((acc, user) => {
      acc[user.role] = (acc[user.role] ?? 0) + 1
      return acc
    }, {})
  }, [settings.users])

  return (
    <TabSurface icon={Users} title="Role Management" description="Role resmi MCS ditampilkan sebagai card operasional, bukan tabel besar.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mcsRoles.map((role) => {
          const userCount = counts[role] ?? 0

          return (
            <article key={role} className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_10px_24px_rgba(17,24,39,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-[#F8FAFC] text-[#081C3A]">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <StatusPill active />
              </div>
              <h3 className="mt-4 text-lg font-black text-[#0F172A]">{role}</h3>
              <p className="mt-1 text-sm font-bold text-[#64748B]">{userCount} user</p>
              <button
                type="button"
                onClick={() => onManage(role)}
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg border border-[#081C3A] bg-[#081C3A] px-3 text-sm font-black text-white transition hover:bg-[#A61D2D]"
              >
                Kelola Akses
              </button>
            </article>
          )
        })}
      </div>
    </TabSurface>
  )
})

const ContactTab = memo(function ContactTab({
  onChange,
  settings,
}: {
  onChange: <K extends keyof OfficialContactSettings>(key: K, value: OfficialContactSettings[K]) => void
  settings: OfficialContactSettings
}) {
  const fields: Array<{ icon: LucideIcon; key: keyof OfficialContactSettings; label: string }> = [
    { icon: Radio, key: "hotline", label: "Hotline Event" },
    { icon: ShieldCheck, key: "whatsappChairperson", label: "Ketua Pelaksana" },
    { icon: Megaphone, key: "whatsappHumas", label: "Humas" },
    { icon: Globe, key: "instagram", label: "Instagram" },
    { icon: Globe, key: "tiktok", label: "TikTok" },
    { icon: Globe, key: "youtube", label: "YouTube" },
    { icon: Globe, key: "website", label: "Website" },
    { icon: Mail, key: "email", label: "Email Resmi" },
  ]

  return (
    <TabSurface icon={Mail} title="Contact Center" description="Satu sumber kontak resmi untuk landing page, dashboard, dan komunikasi event.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <ContactCard
            key={field.key}
            icon={field.icon}
            label={field.label}
            value={settings[field.key]}
            onChange={(value) => onChange(field.key, value)}
          />
        ))}
      </div>
    </TabSurface>
  )
})

function SystemTab({ settings }: { settings: McsSettingsState }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <TabSurface icon={Activity} title="System" description="Informasi sistem yang relevan untuk operator event.">
        <div className="grid gap-4">
          <MetricCard label="MCS Version" value={settings.version} tone="navy" />
          <MetricCard label="Last Updated" value={formatDateTime(settings.updatedAt)} />
        </div>
      </TabSurface>
      <TabSurface icon={Bell} title="Recent Activity" description="Maksimal 5 aktivitas terbaru Settings Center.">
        <div className="grid gap-3">
          {settings.activities.slice(0, 5).map((item) => (
            <article key={item.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <p className="text-sm font-black text-[#0F172A]">{item.action}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">
                {item.actor} • {formatDateTime(item.timestamp)}
              </p>
            </article>
          ))}
        </div>
      </TabSurface>
    </div>
  )
}

function TabSurface({ children, description, icon: Icon, title }: { children: ReactNode; description: string; icon: LucideIcon; title: string }) {
  return (
    <section className="min-w-0 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_34px_rgba(17,24,39,0.05)] sm:p-5">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F8FAFC] text-[#081C3A]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-black text-[#0F172A]">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#64748B]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function HeaderButton({ icon: Icon, label, onClick, variant = "primary" }: { icon: LucideIcon; label: string; onClick: () => void; variant?: "primary" | "secondary" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-black transition",
        variant === "primary"
          ? "border-[#A61D2D] bg-[#A61D2D] text-white hover:bg-[#081C3A]"
          : "border-[#E5E7EB] bg-white text-[#0F172A] hover:border-[#081C3A]",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  )
}

function Field({ icon: Icon, label, onChange, type = "text", value }: { icon?: LucideIcon; label: string; onChange: (value: string) => void; type?: string; value: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.08em] text-[#64748B]">{label}</span>
      <span className="flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 transition focus-within:border-[#A61D2D] focus-within:ring-4 focus-within:ring-[#A61D2D]/10">
        {Icon ? <Icon className="size-4 shrink-0 text-[#94A3B8]" aria-hidden="true" /> : null}
        <input value={value} type={type} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#0F172A] outline-none" />
      </span>
    </label>
  )
}

function SelectField({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: readonly string[]; value: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.08em] text-[#64748B]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-bold text-[#0F172A] outline-none transition focus:border-[#A61D2D] focus:ring-4 focus:ring-[#A61D2D]/10">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function LogoControl({ label, name, onChange, onRemove, value }: { label: string; name: string; onChange: (src: string, name: string) => void; onRemove: () => void; value: string }) {
  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return
    onChange(await readFileAsDataUrl(file), file.name)
  }

  return (
    <article className="min-w-0 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
      <div className="flex items-center gap-3">
        <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
          {value ? <Image src={value} alt={label} fill unoptimized className="object-contain p-2" sizes="64px" /> : <ImageUp className="size-6 text-[#94A3B8]" aria-hidden="true" />}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-[#0F172A]">{label}</h3>
          <p className="mt-1 truncate text-xs font-bold text-[#64748B]">{name || "Belum ada asset"}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-[#081C3A] bg-[#081C3A] px-2 text-xs font-black text-white">
          Upload
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
        </label>
        <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white px-2 text-xs font-black text-[#0F172A]">
          Replace
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
        </label>
        <button type="button" onClick={onRemove} className="h-9 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-2 text-xs font-black text-[#DC2626]">
          Remove
        </button>
      </div>
    </article>
  )
}

function ColorControl({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
      <span className="text-xs font-black uppercase tracking-[0.08em] text-[#64748B]">{label}</span>
      <span className="flex items-center gap-3">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="size-11 shrink-0 cursor-pointer rounded-lg border border-[#E5E7EB] bg-white p-1" />
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 font-mono text-sm font-black text-[#0F172A] outline-none" />
      </span>
      <span className="h-8 rounded-lg border border-black/10" style={{ backgroundColor: value }} />
    </label>
  )
}

function ToggleCard({ checked, icon: Icon, label, onChange }: { checked: boolean; icon: LucideIcon; label: string; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F8FAFC] text-[#081C3A]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <p className="truncate text-sm font-black text-[#0F172A]">{label}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onChange(!checked)
      }}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition", checked ? "bg-[#081C3A]" : "bg-[#CBD5E1]")}
      aria-pressed={checked}
    >
      <span className={cn("absolute top-1 size-5 rounded-full bg-white transition", checked ? "left-6" : "left-1")} />
    </button>
  )
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span className={cn("inline-flex h-7 items-center rounded-full px-2.5 text-xs font-black", active ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#F1F5F9] text-[#64748B]")}>
      {active ? "Active" : "Hidden"}
    </span>
  )
}

function MetricCard({ label, tone = "default", value }: { label: string; tone?: "default" | "navy" | "success"; value: string }) {
  return (
    <article className={cn("rounded-xl border p-4", tone === "navy" ? "border-[#081C3A] bg-[#081C3A] text-white" : tone === "success" ? "border-[#DCFCE7] bg-[#F0FDF4] text-[#14532D]" : "border-[#E5E7EB] bg-[#F8FAFC] text-[#0F172A]")}>
      <p className="text-xs font-black uppercase tracking-[0.08em] opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </article>
  )
}

function ContactCard({ icon: Icon, label, onChange, value }: { icon: LucideIcon; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
      <span className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-white text-[#081C3A]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="text-sm font-black text-[#0F172A]">{label}</span>
      </span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-bold text-[#0F172A] outline-none transition focus:border-[#A61D2D]" />
    </label>
  )
}

function SettingsModal({ children, modal, onClose }: { children: ReactNode; modal: ModalState; onClose: () => void }) {
  if (!modal || modal.type === "preview") return null

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#0F172A]/46 px-4 py-6 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="max-h-[calc(100vh-48px)] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.24)]" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </section>
    </div>
  )
}

function PermissionMatrix({ role }: { role: McsRole }) {
  const enabled = new Set(rolePermissionMatrix[role])

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.08em] text-[#A61D2D]">Permission Matrix</p>
        <h2 className="mt-1 text-2xl font-black text-[#0F172A]">{role}</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {permissionCatalog.map((permission) => {
          const allowed = enabled.has(permission.key)
          return (
            <div key={permission.key} className={cn("flex items-center gap-2 rounded-xl border p-3 text-sm font-black", allowed ? "border-[#DCFCE7] bg-[#F0FDF4] text-[#166534]" : "border-[#FEE2E2] bg-[#FEF2F2] text-[#991B1B]")}>
              {allowed ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
              {permission.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LandingDetail({ item, onChange, settings }: { item: LandingCardId; onChange: (key: keyof LandingPageSettings, value: boolean) => void; settings: LandingPageSettings }) {
  const card = landingCards.find((entry) => entry.id === item) ?? landingCards[0]
  const Icon = card.icon
  const enabled = settings[card.settingKey]

  return (
    <div className="grid gap-5">
      <div className="flex items-start gap-3">
        <span className="grid size-12 place-items-center rounded-xl bg-[#F8FAFC] text-[#081C3A]">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#A61D2D]">Landing Page Detail</p>
          <h2 className="mt-1 text-2xl font-black text-[#0F172A]">{card.label}</h2>
        </div>
      </div>
      <ToggleCard icon={Icon} label={`Tampilkan ${card.label}`} checked={enabled} onChange={(value) => onChange(card.settingKey, value)} />
      <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
        <p className="text-sm font-bold leading-6 text-[#64748B]">
          Konfigurasi detail section ini disiapkan sebagai extension point. Status visibility langsung tersambung ke landing page realtime.
        </p>
      </div>
    </div>
  )
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.floor(diff / 60_000))
  if (minutes < 1) return "baru saja"
  if (minutes === 1) return "1 menit lalu"
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  return `${hours} jam lalu`
}
