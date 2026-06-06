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
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileCheck,
  FileText,
  GitBranch,
  Globe,
  Handshake,
  Image as ImageIcon,
  ImageUp,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Monitor,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
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
  wallet: Wallet,
  monitor: Monitor,
  activity: Activity,
  "file-check": FileCheck,
  handshake: Handshake,
}

const searchPlaceholder = "Cari jadwal, lomba, peserta, tugas, pengumuman"
const displayEventDate = formatEventDateRange(event.startDate, event.endDate)
const recentSearchStorageKey = "mcs:recent-searches:v1"
const commandPaletteActions: ShellSearchResult[] = [
  {
    description: "Buka form kendala aktif",
    href: "/dashboard/issues?action=create",
    icon: "activity",
    id: "command-create-issue",
    meta: "Aksi Cepat",
    title: "Tambah Kendala",
    type: "Aksi",
  },
  {
    description: "Buka form handoff antar divisi",
    href: "/dashboard/handoffs?action=create",
    icon: "git-branch",
    id: "command-create-handoff",
    meta: "Aksi Cepat",
    title: "Buat Handoff",
    type: "Aksi",
  },
  {
    description: "Buka status venue untuk update kesiapan",
    href: "/dashboard/venues",
    icon: "shield",
    id: "command-update-venue",
    meta: "Aksi Cepat",
    title: "Update Venue",
    type: "Aksi",
  },
  {
    description: "Buka feed penuh notifikasi operasional",
    href: "/dashboard/notifications",
    icon: "activity",
    id: "command-notifications",
    meta: "Aksi Cepat",
    title: "Pusat Notifikasi",
    type: "Aksi",
  },
  {
    description: "Review pengumuman, media, dan issue close",
    href: "/dashboard/approvals",
    icon: "file-check",
    id: "command-approvals",
    meta: "Aksi Cepat",
    title: "Pusat Approval",
    type: "Aksi",
  },
  {
    description: "Buka modul lomba untuk input hasil",
    href: "/dashboard/tournament",
    icon: "trophy",
    id: "command-input-results",
    meta: "Aksi Cepat",
    title: "Input Hasil",
    type: "Aksi",
  },
  {
    description: "Buka rekap kendala, handoff, dan venue",
    href: "/dashboard/operations-report",
    icon: "chart",
    id: "command-operations-report",
    meta: "Aksi Cepat",
    title: "Laporan Operasional",
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
    <div className="min-h-screen overflow-x-hidden bg-[#F8F9FB] font-sans text-[#111827]">
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
        <main className="min-h-[calc(100vh-68px)] min-w-0 overflow-x-hidden bg-[#F8F9FB]" aria-label={`${pageMeta.title} content`}>
          <div className="mx-auto min-h-[calc(100vh-68px)] w-full min-w-0 max-w-[1320px] px-4 py-4 sm:px-5 lg:px-6">
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
    <header className="fixed inset-x-0 top-0 z-40 h-[68px] border-b border-[#E5E7EB] bg-white/98 backdrop-blur">
      <div className="flex h-full min-w-0 items-center gap-3 px-4 sm:px-5 lg:px-6">
        <div className="md:hidden">
          <MobileSidebarTrigger navigation={navigation} roleLabel={roleLabel} />
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="hidden rounded-[10px] border-[#E5E7EB] bg-white text-[#64748B] hover:bg-[#F8F9FB] lg:hidden md:inline-flex"
          aria-label={tabletExpanded ? "Collapse sidebar" : "Expand sidebar"}
          title={tabletExpanded ? "Collapse sidebar" : "Expand sidebar"}
          onClick={onToggleTabletSidebar}
        >
          <ToggleIcon />
        </Button>

        <div className="min-w-0 shrink basis-[210px] sm:basis-[260px]">
          <h1 className="truncate text-base font-semibold leading-5 text-[#111827]">{pageMeta.title}</h1>
          <nav className="flex min-w-0 items-center gap-1 text-xs font-medium text-[#64748B]" aria-label="Breadcrumb">
            <span className="truncate">MCS 1</span>
            {pageMeta.breadcrumb.map((item) => (
              <span key={item} className="flex min-w-0 items-center gap-1">
                <span className="text-[#CBD5E1]">/</span>
                <span className="truncate">{item}</span>
              </span>
            ))}
          </nav>
          <p
            className="mt-0.5 truncate text-[11px] font-semibold leading-4 text-[#0F172A] lg:hidden"
            suppressHydrationWarning
            title={`Role: ${roleLabel}; Hari Event: ${shellStatus.dayLabel}; Tanggal: ${shellStatus.currentDate}; Waktu: ${shellStatus.currentTime}; Status: ${formatPhaseLabel(shellStatus.phase)}`}
          >
            {roleLabel} / {shellStatus.dayLabel} / {formatPhaseLabel(shellStatus.phase)}
          </p>
        </div>

        <GlobalSearch navigation={navigation} />

        <HeaderStatusRail roleLabel={roleLabel} status={shellStatus} />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
            aria-label="Buka website publik MCS"
          >
            <Globe className="size-4 text-[#64748B]" aria-hidden="true" />
            <span className="hidden sm:inline">Website Publik</span>
          </Link>

          <NotificationsMenu />

          <ProfileMenu homePath={homePath} roleLabel={roleLabel} user={user} />
        </div>
      </div>
    </header>
  )
}

function GlobalSearch({ navigation }: { navigation: DashboardNavigationItem[] }) {
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
        className="flex h-9 items-center gap-3 rounded-[10px] border border-[#E5E7EB] bg-[#F8F9FB] px-3"
        onSubmit={handleSubmit}
      >
        <Search className="size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
        <span className="sr-only">Pencarian dashboard</span>
        <input
          type="search"
          ref={inputRef}
          value={query}
          placeholder={searchPlaceholder}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#111827] outline-none placeholder:text-[#94A3B8]"
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
        />
        <span className="hidden rounded-md border border-[#E5E7EB] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#94A3B8] 2xl:inline">
          Ctrl K
        </span>
      </form>

      {focused && (trimmedQuery || recentResults.length > 0 || accessibleCommandActions.length > 0) ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-md ring-1 ring-[#111827]/5">
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
                        className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-[10px] px-2 py-2 text-left text-sm transition hover:bg-[#F8F9FB]"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openResult(item)}
                      >
                        <Icon className="mt-0.5 size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-[#111827]">{item.title}</span>
                          <span className="mt-0.5 block truncate text-xs font-medium text-[#64748B]">{item.description}</span>
                        </span>
                        <span className="max-w-24 truncate rounded-full bg-[#F8F9FB] px-2 py-0.5 text-[11px] font-semibold text-[#64748B] ring-1 ring-[#E5E7EB]">
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
                        className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-[10px] px-2 py-2 text-left text-sm transition hover:bg-[#F8F9FB]"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openResult(item)}
                      >
                        <Icon className="mt-0.5 size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-[#111827]">{item.title}</span>
                          <span className="mt-0.5 block truncate text-xs font-medium text-[#64748B]">{item.description}</span>
                        </span>
                        <span className="max-w-24 truncate rounded-full bg-[#F8F9FB] px-2 py-0.5 text-[11px] font-semibold text-[#64748B] ring-1 ring-[#E5E7EB]">
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
                    className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-[10px] px-2 py-2 text-left text-sm transition hover:bg-[#F8F9FB]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openResult(item)}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[#111827]">{item.title}</span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-[#64748B]">
                        {item.description}
                      </span>
                    </span>
                    <span className="max-w-24 truncate rounded-full bg-[#F8F9FB] px-2 py-0.5 text-[11px] font-semibold text-[#64748B] ring-1 ring-[#E5E7EB]">
                      {item.type}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : normalizedQuery.length >= 2 && searching ? (
            <p className="rounded-[10px] bg-[#F8F9FB] px-3 py-2 text-xs font-semibold text-[#64748B]">
              Mencari data operasional...
            </p>
          ) : normalizedQuery.length >= 2 && searchError ? (
            <p className="rounded-[10px] bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#B91C1C]">
              Pencarian belum bisa dimuat
            </p>
          ) : (
            <p className="rounded-[10px] bg-[#F8F9FB] px-3 py-2 text-xs font-semibold text-[#64748B]">
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
        "fixed bottom-0 left-0 top-[68px] z-30 hidden flex-col border-r border-[#E5E7EB] bg-white transition-[width] duration-200 ease-out md:flex",
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
            className="rounded-[10px] border-[#E5E7EB] bg-white text-[#64748B] hover:bg-[#F8F9FB]"
            aria-label="Buka navigasi"
          />
        }
      >
        <Menu />
        <span className="sr-only">Buka navigasi</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(88vw,320px)] gap-0 border-[#E5E7EB] bg-white p-0 text-[#111827]">
        <SheetHeader className="sr-only">
          <SheetTitle>MCS dashboard navigation</SheetTitle>
          <SheetDescription>Dashboard sections for Melati Championship Series 1 operations.</SheetDescription>
        </SheetHeader>
        <div className="absolute right-3 top-3">
          <SheetClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-[10px] text-[#64748B] hover:bg-[#F8F9FB]"
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
      <div className={cn("border-b border-[#E5E7EB] p-4", !expanded && !mobile && "md:px-3 lg:px-4")}>
        <div
          className={cn(
            "flex items-start gap-3",
            !expanded && !mobile && "md:justify-center md:gap-0 lg:justify-start lg:gap-3",
          )}
        >
          <OfficialLogoStrip compact={!expanded && !mobile} />

          <div className={cn("min-w-0", !expanded && !mobile && "md:hidden lg:block")}>
            <p className="truncate text-lg font-semibold leading-6 text-[#111827]">MCS 1</p>
            <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-[#64748B]">{event.theme}</p>
          </div>
        </div>

        <div
          className={cn(
            "mt-4 grid gap-1.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] p-3",
            !expanded && !mobile && "md:hidden lg:block",
          )}
        >
          <p className="text-xs font-semibold text-[#111827]">Pusat Operasional Event</p>
          <SidebarMeta label="Tanggal" value={displayEventDate} />
          <SidebarMeta label="Sekolah" value="SMKN 20 Jakarta" />
          <SidebarMeta label="Penyelenggara" value="OSIS & MPK" />
          {roleLabel ? <SidebarRoleBadge roleLabel={roleLabel} /> : null}
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3" aria-label="Dashboard navigation">
        <div className="flex flex-col gap-4">
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
    <div className="hidden min-w-0 shrink-0 items-center gap-1.5 lg:flex">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "hidden h-9 max-w-[150px] items-center gap-1.5 rounded-[10px] border border-[#E5E7EB] bg-white px-2.5 text-xs xl:inline-flex",
            item.label === "Akses" && "lg:inline-flex",
            item.label === "Status" && "lg:inline-flex",
          )}
          title={`${item.label}: ${item.value}`}
        >
          <span className="shrink-0 font-medium text-[#94A3B8]">{item.label}</span>
          <span
            suppressHydrationWarning
            className={cn(
              "min-w-0 truncate font-semibold text-[#111827]",
              item.label === "Status" && status.phase === "Live" && "text-[#16A34A]",
              item.label === "Status" && status.phase === "Preparation" && "text-[#D97706]",
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
      <span className="shrink-0 font-medium text-[#94A3B8]">{label}</span>
      <span className="truncate font-semibold text-[#64748B]">{value}</span>
    </div>
  )
}

function SidebarRoleBadge({ roleLabel }: { roleLabel: string }) {
  return (
    <div className="mt-1 flex min-w-0 items-center justify-between gap-2 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1.5">
      <span className="text-[11px] font-medium text-[#94A3B8]">Role</span>
      <span className="min-w-0 truncate text-[11px] font-semibold text-[#0F172A]">{roleLabel}</span>
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
      <p className={cn("px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]", !expanded && !mobile && "md:hidden lg:block")}>
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
        "flex h-10 min-w-0 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition duration-200",
        active ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:bg-[#F8F9FB] hover:text-[#111827]",
        !expanded && !mobile && "md:justify-center md:px-0 lg:justify-start lg:px-3",
      )}
      aria-current={active ? "page" : undefined}
      title={!expanded && !mobile ? label : undefined}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-white" : "text-[#64748B]")} aria-hidden="true" />
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
            "relative grid place-items-center rounded-xl border border-[#E5E7EB] bg-white",
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

function NotificationsMenu() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<ShellNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter((notification) => notification.status === "unread").length

  useEffect(() => {
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
  }, [refreshTick])

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
        className="relative grid size-9 place-items-center rounded-[10px] border border-[#E5E7EB] bg-white text-[#64748B] transition hover:bg-[#F8F9FB]"
        aria-controls="mcs-notifications-menu"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Notifikasi"
        title="Notifikasi"
        onClick={toggleMenu}
      >
        <Bell className="size-4" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#B91C1C] px-1 text-[10px] font-semibold leading-5 text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {menuOpen ? (
        <div
          id="mcs-notifications-menu"
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#E5E7EB] bg-white p-2 text-[#111827] shadow-md ring-1 ring-[#111827]/5"
        >
          <div className="px-2 py-2">
            <p className="text-sm font-semibold text-[#111827]">Notifikasi Operasional</p>
            <p className="mt-1 text-xs font-medium leading-5 text-[#64748B]">
              Update resmi dari sistem komando MCS 1.
            </p>
          </div>
          <div className="my-2 h-px bg-[#E5E7EB]" />
          {loading ? (
            <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8F9FB] px-3 py-3 text-center">
              <p className="text-xs font-semibold text-[#64748B]">Memuat notifikasi...</p>
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
                  className="grid gap-1 rounded-[10px] px-2 py-2 text-sm transition hover:bg-[#F8F9FB]"
                  role="menuitem"
                  onClick={() => void markRead(item.id)}
                >
                  <span className="flex min-w-0 items-start justify-between gap-3">
                    <span className="min-w-0 truncate font-semibold text-[#111827]">{item.title}</span>
                    <PriorityBadge priority={getNotificationPriority(item)} />
                  </span>
                  <span className="line-clamp-2 text-xs font-medium leading-5 text-[#64748B]">{item.body}</span>
                  <span className="text-[11px] font-semibold text-[#94A3B8]">{formatNotificationTime(item.createdAt)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8F9FB] px-3 py-3 text-center">
              <p className="text-xs font-semibold text-[#64748B]">Belum ada notifikasi baru</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function ProfileMenu({ homePath, roleLabel, user }: { homePath: string; roleLabel: string; user: UserDTO }) {
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
        className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-2 text-[#111827] transition hover:bg-[#F8F9FB]"
        aria-controls="mcs-profile-menu"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Buka menu profil"
        onClick={() => setMenuOpen((current) => !current)}
      >
        <Avatar size="sm" className="size-7 bg-[#0F172A] text-white after:border-[#0F172A]">
          <AvatarFallback className="bg-[#0F172A] text-xs font-semibold text-white">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-28 truncate text-sm font-semibold text-[#111827] lg:block">
          {user.displayName}
        </span>
        <span className="hidden h-6 items-center rounded-full bg-[#F8F9FB] px-2 text-xs font-semibold text-[#0F172A] ring-1 ring-[#E5E7EB] xl:inline-flex">
          {roleLabel}
        </span>
        <ChevronDown className="hidden size-4 text-[#64748B] sm:block" aria-hidden="true" />
      </button>

      {menuOpen ? (
        <div
          id="mcs-profile-menu"
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-[#E5E7EB] bg-white p-1 text-[#111827] shadow-md ring-1 ring-[#111827]/5"
        >
          <div className="flex items-start gap-3 px-2 py-2">
            <Avatar size="sm" className="size-8 bg-[#0F172A] text-white after:border-[#0F172A]">
              <AvatarFallback className="bg-[#0F172A] text-xs font-semibold text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[#111827]">{user.displayName}</span>
              <span className="mt-0.5 block truncate text-xs font-medium text-[#64748B]">{user.email}</span>
              <span className="mt-2 inline-flex h-6 items-center rounded-full bg-[#F8F9FB] px-2 text-xs font-semibold text-[#0F172A] ring-1 ring-[#E5E7EB]">
                {roleLabel}
              </span>
            </div>
          </div>
          <div className="-mx-1 my-1 h-px bg-[#E5E7EB]" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-2 py-2 text-left text-sm text-[#111827] outline-none hover:bg-[#F8F9FB] focus:bg-[#F8F9FB]"
            onClick={() => {
              setMenuOpen(false)
              router.push(homePath)
            }}
          >
            <UserRound className="size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
            Profile
          </button>
          <div
            role="menuitem"
            aria-disabled="true"
            className="flex items-center gap-2 rounded-[10px] px-2 py-2 text-sm text-[#111827]"
          >
            <Building2 className="size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Divisi: {divisionLabel}</span>
          </div>
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-2 py-2 text-left text-sm text-[#111827] outline-none hover:bg-[#F8F9FB] focus:bg-[#F8F9FB]"
            onClick={() => {
              setMenuOpen(false)
              router.push("/dashboard/settings")
            }}
          >
            <Settings className="size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
            Settings
          </button>
          <div
            role="menuitem"
            aria-disabled="true"
            className="flex items-center gap-2 rounded-[10px] px-2 py-2 text-sm text-[#111827]"
          >
            <ShieldCheck className="size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Role: {roleLabel}</span>
          </div>
          <div className="-mx-1 my-1 h-px bg-[#E5E7EB]" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-2 py-2 text-left text-sm text-[#B91C1C] outline-none hover:bg-[#FEF2F2] focus:bg-[#FEF2F2]"
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
      label: "Komando",
    },
    {
      keys: [
        "competition-management",
        "competition-monitoring",
        "my-competitions",
        "competition-operations",
        "schedule-management",
        "schedule-monitoring",
        "schedules",
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
        "event-day",
        "active-issues",
        "division-handoffs",
        "venue-status",
        "notification-center",
        "approval-center",
        "operations-report",
      ],
      label: "Operasional",
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
  if (item.type === "Handoff") return GitBranch
  if (item.type === "Venue") return ShieldCheck
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
    "approval-center": "Pusat Approval",
    bracket: "Bracket",
    budgeting: "Anggaran",
    "business-operations": "Kewirausahaan",
    "cleanliness-operations": "Kebersihan",
    "competition-management": "Manajemen Lomba",
    "competition-monitoring": "Monitoring Lomba",
    "competition-operations": "Operasi Lomba",
    dashboard: "Dashboard",
    "active-issues": "Kendala Aktif",
    "division-activities": "Aktivitas Divisi",
    "division-handoffs": "Handoff Divisi",
    "division-status": "Status Divisi",
    documents: "Dokumen",
    "event-day": "Mode Hari-H",
    "equipment-inventory": "Inventaris",
    "event-rundown": "Rundown",
    "financial-reports": "Laporan Keuangan",
    "gallery-management": "Galeri",
    "highlight-videos": "Video Highlight",
    "humas-sponsorship": "Humas & Sponsor",
    "juknis-management": "Juknis",
    "match-results": "Hasil Match",
    "media-archive": "Arsip Media",
    "media-center": "Media",
    "media-posts": "Posting Media",
    "my-competitions": "Lomba Saya",
    "my-tasks": "Tugas Saya",
    "news-center": "News Center",
    "notification-center": "Pusat Notifikasi",
    "operations-report": "Laporan Operasional",
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
    "upload-media": "Upload Media",
    "venue-status": "Status Venue",
  }

  return labels[item.key] ?? item.label
}

function formatNavigationGroupLabel(label: string) {
  if (label === "Command") return "Komando"
  if (label === "Operations") return "Operasional"
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
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const month = monthNames[end.month - 1] ?? "June"

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
    return {
      currentDate: formatShellDate(now),
      currentTime: formatShellTime(now),
      dayLabel: `H-0 dari ${totalDays}`,
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
