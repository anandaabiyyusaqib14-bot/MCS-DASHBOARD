"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Archive,
  BarChart3,
  Bell,
  BellRing,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  FileText,
  GitBranch,
  GitBranchPlus,
  Globe,
  Handshake,
  Image as ImageIcon,
  Images,
  ImageUp,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Megaphone,
  Menu,
  Monitor,
  MonitorPlay,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Store,
  TriangleAlert,
  Trophy,
  Upload,
  UserRound,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { brandAssets, event } from "@/data/mcs"
import type { DashboardNavigationIcon, DashboardNavigationItem } from "@/lib/mcs-rbac"
import { cn } from "@/lib/utils"
import type { UserDTO } from "@/server/mcs/types"

type DashboardShellProps = {
  children?: ReactNode
  homePath: string
  navigation: DashboardNavigationItem[]
  roleLabel: string
  user: UserDTO
}

type RouteMeta = {
  title: string
  breadcrumb: string[]
}

type NavigationGroup = {
  items: DashboardNavigationItem[]
  label: string
}

type NotificationPriority = "urgent" | "important" | "informational"

type ShellNotification = {
  body: string
  createdAt: string
  id: string
  resource?: string
  resourceId?: string
  status: "read" | "unread"
  title: string
  type: string
}

type ShellSearchResult = {
  description: string
  href: string
  icon?: DashboardNavigationIcon
  id: string
  meta?: string
  title: string
  type: string
}

type ShellStatus = {
  currentDate: string
  currentTime: string
  dayLabel: string
  phase: "Preparation" | "Live" | "Completed"
}

const iconMap: Record<DashboardNavigationIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  trophy: Trophy,
  calendar: CalendarDays,
  users: Users,
  shield: ShieldCheck,
  image: ImageUp,
  megaphone: Megaphone,
  file: FileText,
  chart: BarChart3,
  settings: Settings,
  clipboard: ClipboardList,
  "git-branch": GitBranch,
  newspaper: Newspaper,
  upload: Upload,
  gallery: ImageIcon,
  video: Video,
  archive: Archive,
  "bell-ring": BellRing,
  "briefcase-business": BriefcaseBusiness,
  "clipboard-check": ClipboardCheck,
  wallet: Wallet,
  monitor: Monitor,
  "monitor-play": MonitorPlay,
  activity: Activity,
  "file-check": FileCheck,
  "git-branch-plus": GitBranchPlus,
  handshake: Handshake,
  images: Images,
  "map-pinned": MapPinned,
  store: Store,
  "triangle-alert": TriangleAlert,
}

const searchPlaceholder = "Cari jadwal, lomba, tugas, dokumen, laporan"
const displayEventDate = formatEventDateRange(event.startDate, event.endDate)
const recentSearchStorageKey = "mcs:recent-searches:v1"
const commandPaletteActions: ShellSearchResult[] = [
  {
    description: "Kirim update resmi internal ke panitia",
    href: "/dashboard/announcements?action=create",
    icon: "megaphone",
    id: "command-create-announcement",
    meta: "Aksi Cepat",
    title: "Buat Pengumuman",
    type: "Aksi",
  },
  {
    description: "Tambahkan aktivitas resmi ke timeline event",
    href: "/dashboard/schedules?action=create",
    icon: "calendar",
    id: "command-create-schedule",
    meta: "Aksi Cepat",
    title: "Tambah Jadwal",
    type: "Aksi",
  },
  {
    description: "Tugaskan pekerjaan ke divisi atau PIC",
    href: "/dashboard/tasks?action=create",
    icon: "clipboard",
    id: "command-create-task",
    meta: "Aksi Cepat",
    title: "Buat Tugas",
    type: "Aksi",
  },
  {
    description: "Catat insiden operasional yang perlu penanganan",
    href: "/dashboard/issues?action=create",
    icon: "activity",
    id: "command-create-issue",
    meta: "Aksi Cepat",
    title: "Buat Tiket Kendala",
    type: "Aksi",
  },
  {
    description: "Minta handoff resmi antar divisi",
    href: "/dashboard/handoffs?action=create",
    icon: "git-branch",
    id: "command-create-handoff",
    meta: "Aksi Cepat",
    title: "Request Koordinasi",
    type: "Aksi",
  },
  {
    description: "Buka ringkasan operasional MCS 1",
    href: "/dashboard/reports",
    icon: "chart",
    id: "command-reports",
    meta: "Aksi Cepat",
    title: "Lihat Laporan",
    type: "Aksi",
  },
]

export function DashboardShell({ children, homePath, navigation, roleLabel, user }: DashboardShellProps) {
  const pathname = usePathname()
  const [tabletExpanded, setTabletExpanded] = useState(false)
  const [shellStatus, setShellStatus] = useState<ShellStatus>(() => getShellStatus(new Date()))

  const pageMeta = useMemo(() => getRouteMeta(pathname, navigation), [navigation, pathname])

  useEffect(() => {
    function updateStatus() {
      setShellStatus(getShellStatus(new Date()))
    }

    updateStatus()
    const interval = window.setInterval(updateStatus, 30_000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="mcs-dashboard min-h-screen overflow-x-hidden bg-[var(--mcs-dash-bg)] font-sans text-[#111827]">
      <TopNavigation
        homePath={homePath}
        navigation={navigation}
        pageMeta={pageMeta}
        roleLabel={roleLabel}
        shellStatus={shellStatus}
        tabletExpanded={tabletExpanded}
        user={user}
        onToggleTabletSidebar={() => setTabletExpanded((current) => !current)}
      />

      <SidebarShell expanded={tabletExpanded} navigation={navigation} pathname={pathname} roleLabel={roleLabel} />

      <div
        className={cn(
          "min-w-0 overflow-x-hidden pt-[68px] transition-[padding] duration-200 ease-out",
          tabletExpanded ? "md:pl-[280px]" : "md:pl-[88px]",
          "lg:pl-[280px]",
        )}
      >
        <main className="min-h-[calc(100vh-68px)] min-w-0 overflow-x-hidden bg-transparent" aria-label={`${pageMeta.title} content`}>
          <div className="mx-auto min-h-[calc(100vh-68px)] w-full min-w-0 max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function TopNavigation({
  homePath,
  navigation,
  pageMeta,
  roleLabel,
  shellStatus,
  tabletExpanded,
  user,
  onToggleTabletSidebar,
}: {
  homePath: string
  navigation: DashboardNavigationItem[]
  pageMeta: RouteMeta
  roleLabel: string
  shellStatus: ShellStatus
  tabletExpanded: boolean
  user: UserDTO
  onToggleTabletSidebar: () => void
}) {
  const ToggleIcon = tabletExpanded ? PanelLeftClose : PanelLeftOpen

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-[68px] border-b border-[#111827]/12 bg-[#FFFDF8]/95 shadow-[0_1px_0_rgba(17,24,39,0.04)] backdrop-blur">
      <div className="flex h-full min-w-0 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="md:hidden">
          <MobileSidebarTrigger navigation={navigation} roleLabel={roleLabel} />
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="hidden rounded-lg border-[#111827]/14 bg-[#FFFDF8] text-[#6B7280] shadow-[2px_2px_0_rgba(17,24,39,0.06)] hover:bg-[#FFF7ED] lg:hidden md:inline-flex"
          aria-label={tabletExpanded ? "Collapse sidebar" : "Expand sidebar"}
          title={tabletExpanded ? "Collapse sidebar" : "Expand sidebar"}
          onClick={onToggleTabletSidebar}
        >
          <ToggleIcon />
        </Button>

        <div className="min-w-0 shrink basis-[210px] sm:basis-[260px]">
          <h1 className="truncate font-heading text-base font-bold leading-5 text-[#111827]">{pageMeta.title}</h1>
          <nav className="flex min-w-0 items-center gap-1 text-xs font-semibold text-[#6B7280]" aria-label="Breadcrumb">
            <span className="truncate">MCS 1</span>
            {pageMeta.breadcrumb.map((item) => (
              <span key={item} className="flex min-w-0 items-center gap-1">
                <span className="text-[#F97316]">/</span>
                <span className="truncate">{item}</span>
              </span>
            ))}
          </nav>
          <p
            className="mt-0.5 truncate text-[11px] font-semibold leading-4 text-[#081C3A] lg:hidden"
            suppressHydrationWarning
            title={`Role: ${roleLabel}; Hari Event: ${shellStatus.dayLabel}; Tanggal: ${shellStatus.currentDate}; Waktu: ${shellStatus.currentTime}; Status: ${formatPhaseLabel(shellStatus.phase)}`}
          >
            {roleLabel} / {shellStatus.dayLabel} / {formatPhaseLabel(shellStatus.phase)}
          </p>
        </div>

        <SearchIsland navigation={navigation} />

        <HeaderStatusRail roleLabel={roleLabel} status={shellStatus} />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="mcs-button-secondary inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition"
            aria-label="Buka website publik MCS"
          >
            <Globe className="size-4 text-[#0EA5E9]" aria-hidden="true" />
            <span className="hidden sm:inline">Website Publik</span>
          </Link>

          <NotificationIsland />

          <ProfileIsland homePath={homePath} roleLabel={roleLabel} user={user} />
        </div>
      </div>
    </header>
  )
}

function SearchIsland({ navigation }: { navigation: DashboardNavigationItem[] }) {
  const router = useRouter()
  const [focused, setFocused] = useState(false)
  const [query, setQuery] = useState("")
  const [recentResults, setRecentResults] = useState<ShellSearchResult[]>(() => readRecentSearches())
  const [remoteResults, setRemoteResults] = useState<ShellSearchResult[]>([])
  const [searchError, setSearchError] = useState(false)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const trimmedQuery = query.trim()
  const normalizedQuery = normalizeSearchValue(trimmedQuery)
  const accessibleCommandActions = useMemo(() => {
    const accessibleRoutes = new Set(navigation.map((item) => item.href))

    return commandPaletteActions.filter((item) => {
      const route = item.href.split("?")[0] || item.href

      return accessibleRoutes.has(route)
    })
  }, [navigation])

  const actionMatches = useMemo<ShellSearchResult[]>(() => {
    if (!normalizedQuery) return accessibleCommandActions.slice(0, 6)

    return accessibleCommandActions
      .filter((item) => {
        const searchable = normalizeSearchValue([item.title, item.description, item.type, item.meta ?? ""].join(" "))

        return searchable.includes(normalizedQuery)
      })
      .slice(0, 5)
  }, [accessibleCommandActions, normalizedQuery])

  const navigationMatches = useMemo<ShellSearchResult[]>(() => {
    if (!normalizedQuery) return []

    return navigation
      .filter((item) => {
        const searchable = normalizeSearchValue([item.label, item.key, item.href, ...(item.aliases ?? [])].join(" "))

        return searchable.includes(normalizedQuery)
      })
      .map((item) => ({
        description: "Modul dashboard MCS 1",
        href: item.href,
        icon: item.icon,
        id: `nav-${item.key}`,
        meta: "Navigasi",
        title: getNavigationDisplayLabel(item),
        type: "Modul",
      }))
      .slice(0, 5)
  }, [navigation, normalizedQuery])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setFocused(true)
        inputRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setSearching(true)

      try {
        const response = await fetch(`/api/mcs/search?q=${encodeURIComponent(trimmedQuery)}`, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Search unavailable")
        }

        const payload = (await response.json()) as { data?: ShellSearchResult[] }

        setRemoteResults(payload.data ?? [])
        setSearchError(false)
      } catch {
        if (!controller.signal.aborted) {
          setRemoteResults([])
          setSearchError(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false)
        }
      }
    }, 180)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [normalizedQuery, trimmedQuery])

  const matches = useMemo(() => {
    const seen = new Set<string>()
    const activeRemoteResults = normalizedQuery.length >= 2 ? remoteResults : []

    return [...actionMatches, ...navigationMatches, ...activeRemoteResults]
      .filter((item) => {
        const key = `${item.href}-${item.title}`

        if (seen.has(key)) {
          return false
        }

        seen.add(key)
        return true
      })
      .slice(0, 8)
  }, [actionMatches, navigationMatches, normalizedQuery.length, remoteResults])

  function openResult(target: ShellSearchResult) {
    setQuery("")
    setFocused(false)
    saveRecentSearch(target)
    setRecentResults(readRecentSearches())
    router.push(target.href)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (matches[0]) {
      openResult(matches[0])
    }
  }

  return (
    <div className="relative hidden min-w-[220px] max-w-[360px] flex-1 xl:block">
      <form
        className="flex h-9 items-center gap-3 rounded-lg border border-[#111827]/14 bg-white px-3 shadow-[2px_2px_0_rgba(17,24,39,0.05)] transition focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/18"
        onSubmit={handleSubmit}
      >
        <Search className="size-4 shrink-0 text-[#0EA5E9]" aria-hidden="true" />
        <span className="sr-only">Pencarian dashboard</span>
        <input
          type="search"
          ref={inputRef}
          value={query}
          placeholder={searchPlaceholder}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#111827] outline-none placeholder:text-[#9CA3AF]"
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
        />
        <span className="hidden rounded-md border border-[#111827]/12 bg-[#FFF7ED] px-1.5 py-0.5 text-[10px] font-bold text-[#6B7280] 2xl:inline">
          Ctrl K
        </span>
      </form>

      {focused && (trimmedQuery || recentResults.length > 0 || accessibleCommandActions.length > 0) ? (
        <div className="mcs-surface absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-lg p-2">
          {!trimmedQuery ? (
            <div className="grid gap-3">
              {actionMatches.length ? (
                <div className="grid gap-1">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">Aksi cepat</p>
                  {actionMatches.map((item) => {
                    const Icon = getSearchResultIcon(item)

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-[#FFF7ED]"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openResult(item)}
                      >
                        <Icon className="mt-0.5 size-4 shrink-0 text-[#F97316]" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-[#111827]">{item.title}</span>
                          <span className="mt-0.5 block truncate text-xs font-medium text-[#64748B]">{item.description}</span>
                        </span>
                        <span className="max-w-24 truncate rounded-md bg-[#F0F9FF] px-2 py-0.5 text-[11px] font-bold text-[#0369A1] ring-1 ring-[#BAE6FD]">
                          {item.type}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
              {recentResults.length > 0 ? (
                <div className="grid gap-1">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">Pencarian terakhir</p>
                  {recentResults.slice(0, 4).map((item) => {
                    const Icon = getSearchResultIcon(item)

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-[#FFF7ED]"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openResult(item)}
                      >
                        <Icon className="mt-0.5 size-4 shrink-0 text-[#F97316]" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-[#111827]">{item.title}</span>
                          <span className="mt-0.5 block truncate text-xs font-medium text-[#64748B]">{item.description}</span>
                        </span>
                        <span className="max-w-24 truncate rounded-md bg-[#F0F9FF] px-2 py-0.5 text-[11px] font-bold text-[#0369A1] ring-1 ring-[#BAE6FD]">
                          {item.type}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ) : matches.length > 0 ? (
            <div className="grid gap-1">
              {matches.map((item) => {
                const Icon = getSearchResultIcon(item)

                return (
                  <button
                    key={item.id}
                    type="button"
                    className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-[#FFF7ED]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openResult(item)}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-[#F97316]" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[#111827]">{item.title}</span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-[#64748B]">
                        {item.description}
                      </span>
                    </span>
                    <span className="max-w-24 truncate rounded-md bg-[#F0F9FF] px-2 py-0.5 text-[11px] font-bold text-[#0369A1] ring-1 ring-[#BAE6FD]">
                      {item.type}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : normalizedQuery.length >= 2 && searching ? (
            <p className="rounded-lg bg-[#FFF7ED] px-3 py-2 text-xs font-semibold text-[#6B7280]">
              Mencari data kepanitiaan...
            </p>
          ) : normalizedQuery.length >= 2 && searchError ? (
            <p className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#B91C1C]">
              Pencarian belum bisa dimuat
            </p>
          ) : (
            <p className="rounded-lg bg-[#FFF7ED] px-3 py-2 text-xs font-semibold text-[#6B7280]">
              Tidak ada hasil. Coba kata kunci lomba, venue, PIC, atau tugas.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}

function SidebarShell({
  expanded,
  navigation,
  pathname,
  roleLabel,
}: {
  expanded: boolean
  navigation: DashboardNavigationItem[]
  pathname: string
  roleLabel: string
}) {
  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-[68px] z-30 hidden flex-col border-r border-[#111827]/12 bg-[#FFFDF8]/96 shadow-[4px_0_0_rgba(17,24,39,0.035)] backdrop-blur transition-[width] duration-200 ease-out md:flex",
        expanded ? "w-[280px]" : "w-[88px]",
        "lg:w-[280px]",
      )}
      aria-label="Dashboard sidebar"
    >
      <SidebarContent expanded={expanded} navigation={navigation} pathname={pathname} roleLabel={roleLabel} />
    </aside>
  )
}

function MobileSidebarTrigger({ navigation, roleLabel }: { navigation: DashboardNavigationItem[]; roleLabel: string }) {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-lg border-[#111827]/14 bg-[#FFFDF8] text-[#6B7280] shadow-[2px_2px_0_rgba(17,24,39,0.06)] hover:bg-[#FFF7ED]"
            aria-label="Buka navigasi"
          />
        }
      >
        <Menu />
        <span className="sr-only">Buka navigasi</span>
      </SheetTrigger>
      <SheetContent side="left" className="mcs-dashboard w-[min(88vw,320px)] gap-0 border-[#111827]/14 bg-[#FFFDF8] p-0 text-[#111827]">
        <SheetHeader className="sr-only">
          <SheetTitle>MCS dashboard navigation</SheetTitle>
          <SheetDescription>Bagian dashboard untuk manajemen kepanitiaan Melati Championship Series 1.</SheetDescription>
        </SheetHeader>
        <div className="absolute right-3 top-3">
          <SheetClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-lg text-[#6B7280] hover:bg-[#FFF7ED]"
                aria-label="Close navigation"
              />
            }
          >
            <X />
            <span className="sr-only">Close navigation</span>
          </SheetClose>
        </div>
        <SidebarContent expanded mobile navigation={navigation} pathname={pathname} roleLabel={roleLabel} />
      </SheetContent>
    </Sheet>
  )
}

function SidebarContent({
  expanded,
  navigation,
  pathname,
  roleLabel,
  mobile = false,
}: {
  expanded: boolean
  navigation: DashboardNavigationItem[]
  pathname: string
  roleLabel?: string
  mobile?: boolean
}) {
  const navigationGroups = useMemo(() => getNavigationGroups(navigation), [navigation])

  return (
    <>
      <div className={cn("mcs-starburst overflow-hidden border-b border-[#111827]/12 p-4 after:-right-6 after:top-5", !expanded && !mobile && "md:px-3 lg:px-4")}>
        <div
          className={cn(
            "flex items-start gap-3",
            !expanded && !mobile && "md:justify-center md:gap-0 lg:justify-start lg:gap-3",
          )}
        >
          <OfficialLogoStrip compact={!expanded && !mobile} />

          <div className={cn("min-w-0", !expanded && !mobile && "md:hidden lg:block")}>
            <p className="truncate font-heading text-lg font-bold leading-6 text-[#111827]">MCS 1</p>
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#6B7280]">{event.theme}</p>
          </div>
        </div>

        <div
          className={cn(
            "mt-4 grid gap-1.5 rounded-lg border border-[#111827]/12 bg-[#FFF7ED] p-3 shadow-[2px_2px_0_rgba(17,24,39,0.07)]",
            !expanded && !mobile && "md:hidden lg:block",
          )}
        >
          <p className="text-xs font-bold text-[#111827]">Sistem Kepanitiaan MCS 1</p>
          <SidebarMeta label="Tanggal" value={displayEventDate} />
          <SidebarMeta label="Sekolah" value="SMKN 20 Jakarta" />
          <SidebarMeta label="Penyelenggara" value="OSIS & MPK" />
          {roleLabel ? <SidebarRoleBadge roleLabel={roleLabel} /> : null}
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard navigation">
        <div className="flex flex-col gap-5">
          {navigationGroups.map((group) => (
            <SidebarNavGroup
              key={group.label}
              expanded={expanded || mobile}
              group={group}
              mobile={mobile}
              pathname={pathname}
            />
          ))}
        </div>
      </nav>
    </>
  )
}

function HeaderStatusRail({ roleLabel, status }: { roleLabel: string; status: ShellStatus }) {
  const items = [
    { label: "Akses", value: roleLabel },
    { label: "Hari", value: status.dayLabel },
    { label: "Tanggal", value: status.currentDate },
    { label: "Waktu", value: status.currentTime },
    { label: "Status", value: formatPhaseLabel(status.phase) },
  ]

  return (
    <div className="hidden min-w-0 shrink-0 items-center gap-1.5 2xl:flex">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "inline-flex h-9 max-w-[150px] items-center gap-1.5 rounded-lg border border-[#111827]/12 bg-white px-2.5 text-xs shadow-[2px_2px_0_rgba(17,24,39,0.04)]",
          )}
          title={`${item.label}: ${item.value}`}
        >
          <span className="shrink-0 font-semibold text-[#9CA3AF]">{item.label}</span>
          <span
            suppressHydrationWarning
            className={cn(
              "min-w-0 truncate font-semibold text-[#111827]",
              item.label === "Status" && status.phase === "Live" && "text-[#22C55E]",
              item.label === "Status" && status.phase === "Preparation" && "text-[#F97316]",
            )}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function SidebarMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] leading-4">
      <span className="shrink-0 font-semibold text-[#9CA3AF]">{label}</span>
      <span className="truncate font-bold text-[#374151]">{value}</span>
    </div>
  )
}

function SidebarRoleBadge({ roleLabel }: { roleLabel: string }) {
  return (
    <div className="mt-1 flex min-w-0 items-center justify-between gap-2 rounded-md border border-[#F97316]/30 bg-white px-2.5 py-1.5">
      <span className="text-[11px] font-semibold text-[#9CA3AF]">Role</span>
      <span className="min-w-0 truncate text-[11px] font-bold text-[#F97316]">{roleLabel}</span>
    </div>
  )
}

function SidebarNavGroup({
  expanded,
  group,
  mobile,
  pathname,
}: {
  expanded: boolean
  group: NavigationGroup
  mobile: boolean
  pathname: string
}) {
  return (
    <div className="grid gap-1">
      <p className={cn("px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7280]", !expanded && !mobile && "md:hidden lg:block")}>
        {formatNavigationGroupLabel(group.label)}
      </p>
      {group.items.map((item) => (
        <SidebarLink key={item.key} expanded={expanded} item={item} mobile={mobile} pathname={pathname} />
      ))}
    </div>
  )
}

function SidebarLink({
  expanded,
  item,
  mobile,
  pathname,
}: {
  expanded: boolean
  item: DashboardNavigationItem
  mobile: boolean
  pathname: string
}) {
  const active = isActivePath(pathname, item)
  const Icon = iconMap[item.icon]
  const label = getNavigationDisplayLabel(item)

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex h-10 min-w-0 items-center gap-3 rounded-lg border px-3 text-sm font-semibold transition duration-200",
        active
          ? "border-[#F97316] bg-[#F97316] text-white shadow-[3px_3px_0_rgba(17,24,39,0.18)]"
          : "border-transparent text-slate-500 hover:border-[#111827]/10 hover:bg-[#FFF7ED] hover:text-orange-500",
        !expanded && !mobile && "md:justify-center md:px-0 lg:justify-start lg:px-3",
      )}
      aria-current={active ? "page" : undefined}
      title={!expanded && !mobile ? label : undefined}
    >
      <Icon
        className={cn("h-[18px] w-[18px] shrink-0", active ? "text-white" : "text-slate-500 group-hover:text-orange-500")}
        strokeWidth={2}
        aria-hidden="true"
      />
      <span className={cn("truncate", !expanded && !mobile && "md:hidden lg:block")}>{label}</span>
    </Link>
  )
}

function OfficialLogoStrip({ compact }: { compact: boolean }) {
  return (
    <div className={cn("flex shrink-0 items-center", compact ? "gap-0.5" : "gap-1.5")}>
      {brandAssets.map((asset) => (
        <div
          key={asset.name}
          className={cn(
            "relative grid place-items-center rounded-lg border border-[#111827]/12 bg-white shadow-[2px_2px_0_rgba(17,24,39,0.06)]",
            compact ? "size-6 p-0.5" : "size-9 p-1",
          )}
        >
          <Image
            src={asset.src}
            alt={asset.name}
            fill
            sizes={compact ? "24px" : "36px"}
            className="object-contain p-0.5"
          />
        </div>
      ))}
    </div>
  )
}

function NotificationIsland() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<ShellNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter((notification) => notification.status === "unread").length

  useEffect(() => {
    if (!menuOpen) return

    let active = true

    async function loadNotifications() {
      if (active) {
        setLoading(true)
      }

      try {
        const response = await fetch("/api/mcs/notifications", { cache: "no-store" })

        if (!response.ok) {
          throw new Error("Unable to load notifications")
        }

        const payload = (await response.json()) as { data?: ShellNotification[] }

        if (active) {
          setNotifications(payload.data ?? [])
          setLoadError(false)
        }
      } catch {
        if (active) {
          setLoadError(true)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadNotifications()

    return () => {
      active = false
    }
  }, [menuOpen, refreshTick])

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [menuOpen])

  async function markRead(notificationId: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, status: "read" } : notification,
      ),
    )

    try {
      await fetch(`/api/mcs/notifications/${notificationId}/read`, { method: "PATCH" })
    } catch {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, status: "unread" } : notification,
        ),
      )
    }
  }

  function toggleMenu() {
    const nextOpen = !menuOpen

    setMenuOpen(nextOpen)

    if (nextOpen) {
      setRefreshTick((current) => current + 1)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="relative grid size-9 place-items-center rounded-lg border border-[#111827]/14 bg-white text-[#6B7280] shadow-[2px_2px_0_rgba(17,24,39,0.06)] transition hover:bg-[#FFF7ED]"
        aria-controls="mcs-notifications-menu"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Notifikasi"
        title="Notifikasi"
        onClick={toggleMenu}
      >
        <Bell className="size-4" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#F97316] px-1 text-[10px] font-bold leading-5 text-white ring-2 ring-[#FFFDF8]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {menuOpen ? (
        <div
          id="mcs-notifications-menu"
          role="menu"
          className="mcs-surface absolute right-0 top-[calc(100%+8px)] z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg p-2 text-[#111827]"
        >
          <div className="px-2 py-2">
            <p className="text-sm font-semibold text-[#111827]">Notifikasi Kepanitiaan</p>
            <p className="mt-1 text-xs font-medium leading-5 text-[#6B7280]">
              Update resmi dari sistem komando MCS 1.
            </p>
          </div>
          <div className="my-2 h-px bg-[#111827]/10" />
          {loading ? (
            <div className="mcs-inset-panel rounded-lg border-dashed px-3 py-3 text-center">
              <p className="text-xs font-semibold text-[#6B7280]">Memuat notifikasi...</p>
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-dashed border-[#FECACA] bg-[#FEF2F2] px-3 py-3 text-center">
              <p className="text-xs font-semibold text-[#B91C1C]">Notifikasi belum bisa dimuat</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="grid max-h-80 gap-1 overflow-y-auto pr-1">
              {notifications.slice(0, 8).map((item) => (
                <Link
                  key={item.id}
                  href={getNotificationHref(item)}
                  className="grid gap-1 rounded-lg px-2 py-2 text-sm transition hover:bg-[#FFF7ED]"
                  role="menuitem"
                  onClick={() => void markRead(item.id)}
                >
                  <span className="flex min-w-0 items-start justify-between gap-3">
                    <span className="min-w-0 truncate font-semibold text-[#111827]">{item.title}</span>
                    <PriorityBadge priority={getNotificationPriority(item)} />
                  </span>
                  <span className="line-clamp-2 text-xs font-medium leading-5 text-[#6B7280]">{item.body}</span>
                  <span className="text-[11px] font-semibold text-[#94A3B8]">{formatNotificationTime(item.createdAt)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mcs-inset-panel rounded-lg border-dashed px-3 py-3 text-center">
              <p className="text-xs font-semibold text-[#6B7280]">Belum ada notifikasi baru</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function ProfileIsland({ homePath, roleLabel, user }: { homePath: string; roleLabel: string; user: UserDTO }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const initials = getInitials(user.displayName)
  const divisionLabel = user.divisionIds.length ? user.divisionIds.join(", ") : "Belum ada divisi"

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [menuOpen])

  async function handleLogout() {
    setLoggingOut(true)

    try {
      await fetch("/api/mcs/auth/logout", { method: "POST" })
    } finally {
      router.replace("/login")
      router.refresh()
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#111827]/14 bg-white px-2 text-[#111827] shadow-[2px_2px_0_rgba(17,24,39,0.06)] transition hover:bg-[#FFF7ED]"
        aria-controls="mcs-profile-menu"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Buka menu profil"
        onClick={() => setMenuOpen((current) => !current)}
      >
        <Avatar size="sm" className="size-7 bg-[#111827] text-white after:border-[#111827]">
          <AvatarFallback className="bg-[#111827] text-xs font-bold text-white">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-28 truncate text-sm font-semibold text-[#111827] lg:block">
          {user.displayName}
        </span>
        <span className="hidden h-6 items-center rounded-md bg-[#FFF7ED] px-2 text-xs font-bold text-[#F97316] ring-1 ring-[#FED7AA] xl:inline-flex">
          {roleLabel}
        </span>
        <ChevronDown className="hidden size-4 text-[#64748B] sm:block" aria-hidden="true" />
      </button>

      {menuOpen ? (
        <div
          id="mcs-profile-menu"
          role="menu"
          className="mcs-surface absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-lg p-1 text-[#111827]"
        >
          <div className="flex items-start gap-3 px-2 py-2">
            <Avatar size="sm" className="size-8 bg-[#111827] text-white after:border-[#111827]">
              <AvatarFallback className="bg-[#111827] text-xs font-bold text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[#111827]">{user.displayName}</span>
              <span className="mt-0.5 block truncate text-xs font-medium text-[#6B7280]">{user.email}</span>
              <span className="mt-2 inline-flex h-6 items-center rounded-md bg-[#FFF7ED] px-2 text-xs font-bold text-[#F97316] ring-1 ring-[#FED7AA]">
                {roleLabel}
              </span>
            </div>
          </div>
          <div className="-mx-1 my-1 h-px bg-[#111827]/10" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[#111827] outline-none hover:bg-[#FFF7ED] focus:bg-[#FFF7ED]"
            onClick={() => {
              setMenuOpen(false)
              router.push(homePath)
            }}
          >
            <UserRound className="size-4 shrink-0 text-[#0EA5E9]" aria-hidden="true" />
            Profile
          </button>
          <div
            role="menuitem"
            aria-disabled="true"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#111827]"
          >
            <Building2 className="size-4 shrink-0 text-[#6B7280]" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Divisi: {divisionLabel}</span>
          </div>
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[#111827] outline-none hover:bg-[#FFF7ED] focus:bg-[#FFF7ED]"
            onClick={() => {
              setMenuOpen(false)
              router.push("/dashboard/settings")
            }}
          >
            <Settings className="size-4 shrink-0 text-[#0EA5E9]" aria-hidden="true" />
            Settings
          </button>
          <div
            role="menuitem"
            aria-disabled="true"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#111827]"
          >
            <ShieldCheck className="size-4 shrink-0 text-[#6B7280]" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Role: {roleLabel}</span>
          </div>
          <div className="-mx-1 my-1 h-px bg-[#111827]/10" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[#B91C1C] outline-none hover:bg-[#FEF2F2] focus:bg-[#FEF2F2]"
            disabled={loggingOut}
            onClick={() => {
              setMenuOpen(false)
              void handleLogout()
            }}
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            {loggingOut ? "Logging out" : "Logout"}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function PriorityBadge({ priority }: { priority: NotificationPriority }) {
  const label = priority === "urgent" ? "Penting" : priority === "important" ? "Perlu dicek" : "Info"

  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2 text-[11px] font-semibold capitalize ring-1",
        priority === "urgent" && "bg-[#FEF2F2] text-[#B91C1C] ring-[#FECACA]",
        priority === "important" && "bg-[#FFFBEB] text-[#92400E] ring-[#FDE68A]",
        priority === "informational" && "bg-[#EFF6FF] text-[#1D4ED8] ring-[#DBEAFE]",
      )}
    >
      {label}
    </span>
  )
}

function getNotificationPriority(notification: ShellNotification): NotificationPriority {
  if (notification.status === "read") return "informational"
  if (
    notification.type === "issue_created" ||
    notification.type === "issue_escalated" ||
    notification.type === "handoff_blocked" ||
    notification.type === "schedule_update" ||
    notification.type === "score_update"
  ) return "urgent"
  if (
    notification.type === "approval_requested" ||
    notification.type === "handoff_requested" ||
    notification.type === "issue_assigned" ||
    notification.type === "task_assignment" ||
    notification.type === "announcement"
  ) return "important"
  return "informational"
}

function getNotificationHref(notification: ShellNotification) {
  if (notification.resource === "announcements") return "/dashboard/announcements"
  if (notification.resource === "matches") return "/dashboard/live-match"
  if (notification.resource === "media") return "/dashboard/media"
  if (notification.resource === "schedules") return "/dashboard/schedules"
  if (notification.resource === "tasks") return "/dashboard/tasks"
  if (notification.resource === "issues") return "/dashboard/issues"
  if (notification.resource === "handoffs") return "/dashboard/handoffs"
  if (notification.resource === "venues") return "/dashboard/venues"

  return "/dashboard"
}

function getRouteMeta(pathname: string, navigation: DashboardNavigationItem[]): RouteMeta {
  const matchedItem = navigation.find((item) => isActivePath(pathname, item))

  if (!matchedItem) {
    return {
      title: "Dashboard",
      breadcrumb: ["Dashboard"],
    }
  }

  if (matchedItem.key === "dashboard") {
    return {
      title: getNavigationDisplayLabel(matchedItem),
      breadcrumb: [getNavigationDisplayLabel(matchedItem)],
    }
  }

  return {
    title: getNavigationDisplayLabel(matchedItem),
    breadcrumb: ["Dashboard", getNavigationDisplayLabel(matchedItem)],
  }
}

function isActivePath(pathname: string, item: DashboardNavigationItem) {
  const candidates = [item.href, ...(item.aliases ?? [])]

  return candidates.some((href) => {
    if (pathname === href) {
      return true
    }

    if (href === "/dashboard") {
      return false
    }

    return pathname.startsWith(`${href}/`)
  })
}

function getNavigationGroups(navigation: DashboardNavigationItem[]): NavigationGroup[] {
  const groupDefinitions = [
    {
      keys: ["dashboard"],
      label: "Utama",
    },
    {
      keys: [
        "event-day",
        "live-score",
        "live-match",
        "schedule-management",
        "schedule-monitoring",
        "schedules",
        "active-issues",
        "venue-status",
        "division-handoffs",
        "notification-center",
        "approval-center",
      ],
      label: "Hari-H",
    },
    {
      keys: [
        "competition-management",
        "competition-monitoring",
        "my-competitions",
        "competition-operations",
        "participant-management",
        "participants",
        "panitia-management",
        "my-tasks",
        "bracket",
        "match-results",
        "technical-support",
        "division-activities",
        "division-status",
        "event-rundown",
        "cleanliness-operations",
        "equipment-inventory",
        "security-operations",
        "business-operations",
        "operations-report",
      ],
      label: "Kepanitiaan",
    },
    {
      keys: [
        "media-center",
        "upload-media",
        "gallery-management",
        "highlight-videos",
        "media-archive",
        "announcement-center",
        "announcements",
        "humas-sponsorship",
        "news-center",
        "publication-schedule",
        "media-posts",
      ],
      label: "Komunikasi",
    },
    {
      keys: [
        "juknis-management",
        "administration",
        "documents",
        "analytics",
        "reports",
        "settings",
        "budgeting",
        "financial-reports",
      ],
      label: "Sistem",
    },
  ]

  const usedKeys = new Set<string>()
  const groups = groupDefinitions.flatMap((definition) => {
    const items = navigation.filter((item) => definition.keys.includes(item.key))
    items.forEach((item) => usedKeys.add(item.key))

    return items.length > 0 ? [{ items, label: definition.label }] : []
  })
  const remainingItems = navigation.filter((item) => !usedKeys.has(item.key))

  if (remainingItems.length > 0) {
    groups.push({ items: remainingItems, label: "Ruang Kerja" })
  }

  return groups
}

function getSearchResultIcon(item: ShellSearchResult) {
  if (item.icon) return iconMap[item.icon]
  if (item.type === "Lomba" || item.type === "Match") return Trophy
  if (item.type === "Jadwal") return CalendarDays
  if (item.type === "Tugas") return ClipboardList
  if (item.type === "Kendala") return Activity
  if (item.type === "Handoff" || item.type === "Koordinasi") return GitBranch
  if (item.type === "Venue" || item.type === "Tempat") return ShieldCheck
  if (item.type === "Pengumuman") return Megaphone
  if (item.type === "Divisi") return ShieldCheck
  if (item.type === "Media") return ImageIcon
  if (item.type === "Peserta" || item.type === "Tim" || item.type === "Panitia") return Users
  return Search
}

function getNavigationDisplayLabel(item: DashboardNavigationItem) {
  const labels: Record<string, string> = {
    administration: "Administrasi",
    analytics: "Analitik",
    announcements: "Pengumuman",
    "announcement-center": "Pusat Pengumuman",
    "approval-center": "Pusat Persetujuan",
    bracket: "Bracket",
    budgeting: "Anggaran",
    "business-operations": "Kewirausahaan",
    "cleanliness-operations": "Kebersihan",
    "competition-management": "Manajemen Lomba",
    "competition-monitoring": "Monitoring Lomba",
    "competition-operations": "Manajemen Lomba",
    dashboard: "Dashboard",
    "active-issues": "Kendala Aktif",
    "division-activities": "Aktivitas Divisi",
    "division-handoffs": "Koordinasi Divisi",
    "division-status": "Status Divisi",
    documents: "Dokumen",
    "event-day": "Hari Kegiatan",
    "equipment-inventory": "Inventaris",
    "event-rundown": "Rundown",
    "financial-reports": "Laporan Keuangan",
    "gallery-management": "Galeri",
    "highlight-videos": "Video Highlight",
    "humas-sponsorship": "Humas & Sponsor",
    "juknis-management": "Juknis",
    "live-match": "Live Score Control Room",
    "live-score": "Live Score Control Room",
    "match-results": "Hasil Match",
    "media-archive": "Arsip Media",
    "media-center": "Media",
    "media-posts": "Posting Media",
    "my-competitions": "Lomba Saya",
    "my-tasks": "Tugas Saya",
    "news-center": "News Center",
    "notification-center": "Pusat Notifikasi",
    "operations-report": "Laporan Kepanitiaan",
    "panitia-management": "Manajemen Panitia",
    "participant-management": "Peserta",
    participants: "Peserta",
    "publication-schedule": "Jadwal Publikasi",
    reports: "Laporan",
    "schedule-management": "Manajemen Jadwal",
    "schedule-monitoring": "Monitoring Jadwal",
    schedules: "Jadwal",
    "security-operations": "Keamanan",
    settings: "Pengaturan",
    "technical-support": "Teknis",
    "upload-media": "Unggah Media",
    "venue-status": "Status Tempat",
  }

  return labels[item.key] ?? item.label
}

function formatNavigationGroupLabel(label: string) {
  if (label === "Command") return "Utama"
  if (label === "Operations") return "Kepanitiaan"
  if (label === "Communication") return "Komunikasi"
  if (label === "System") return "Sistem"
  if (label === "Workspace") return "Workspace"
  return label
}

function formatPhaseLabel(phase: ShellStatus["phase"]) {
  if (phase === "Preparation") return "Persiapan"
  if (phase === "Completed") return "Selesai"
  return "Live"
}

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function readRecentSearches(): ShellSearchResult[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(recentSearchStorageKey)
    const parsed = raw ? JSON.parse(raw) : []

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isSearchResult).slice(0, 6)
  } catch {
    return []
  }
}

function saveRecentSearch(result: ShellSearchResult) {
  if (typeof window === "undefined") return

  const nextResults = [result, ...readRecentSearches().filter((item) => item.id !== result.id)].slice(0, 6)
  window.localStorage.setItem(recentSearchStorageKey, JSON.stringify(nextResults))
}

function isSearchResult(value: unknown): value is ShellSearchResult {
  if (!value || typeof value !== "object") return false

  const result = value as Partial<ShellSearchResult>
  return (
    typeof result.description === "string" &&
    typeof result.href === "string" &&
    typeof result.id === "string" &&
    typeof result.title === "string" &&
    typeof result.type === "string"
  )
}

function formatNotificationTime(value: string) {
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))} WIB`
}

function formatEventDateRange(startDate: string, endDate: string) {
  const start = getDateParts(startDate)
  const end = getDateParts(endDate)

  if (!start || !end) return event.dateRange

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]

  const month = monthNames[end.month - 1] ?? "Juni"

  if (start.month === end.month && start.year === end.year) {
    return `${start.day}-${end.day} ${month} ${end.year}`
  }

  const startMonth = monthNames[start.month - 1] ?? month
  return `${start.day} ${startMonth} ${start.year}-${end.day} ${month} ${end.year}`
}

function getDateParts(value: string) {
  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) return null

  return { day, month, year }
}

function getInitials(displayName: string) {
  const [first = "M", second = "C"] = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return `${first[0] ?? "M"}${second[0] ?? "C"}`.toUpperCase()
}

function getShellStatus(now: Date): ShellStatus {
  const today = getJakartaDateKey(now)
  const totalDays = getDateDifference(event.startDate, event.endDate) + 1

  if (today < event.startDate) {
    const daysUntilEvent = Math.max(getDateDifference(today, event.startDate), 1)

    return {
      currentDate: formatShellDate(now),
      currentTime: formatShellTime(now),
      dayLabel: `H-${daysUntilEvent}`,
      phase: "Preparation",
    }
  }

  if (today > event.endDate) {
    return {
      currentDate: formatShellDate(now),
      currentTime: formatShellTime(now),
      dayLabel: "Pasca Event",
      phase: "Completed",
    }
  }

  const currentDay = Math.min(Math.max(getDateDifference(event.startDate, today) + 1, 1), totalDays)

  return {
    currentDate: formatShellDate(now),
    currentTime: formatShellTime(now),
    dayLabel: `Hari ${currentDay} dari ${totalDays}`,
    phase: "Live",
  }
}

function getJakartaDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).formatToParts(value)
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "01"

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`
}

function getDateDifference(startDate: string, endDate: string) {
  return Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000)
}

function formatShellDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(value)
}

function formatShellTime(value: Date) {
  return `${new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(value)} WIB`
}
