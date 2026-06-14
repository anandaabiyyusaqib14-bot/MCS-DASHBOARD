"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
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

const searchPlaceholder = "Search participants, competitions, schedules, announcements, panitia"

export function DashboardShell({ children, homePath, navigation, roleLabel, user }: DashboardShellProps) {
  const pathname = usePathname()
  const [tabletExpanded, setTabletExpanded] = useState(false)

  const pageMeta = useMemo(() => getRouteMeta(pathname, navigation), [navigation, pathname])

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8F9FB] font-sans text-[#111827]">
      <TopNavigation
        homePath={homePath}
        navigation={navigation}
        pageMeta={pageMeta}
        roleLabel={roleLabel}
        tabletExpanded={tabletExpanded}
        user={user}
        onToggleTabletSidebar={() => setTabletExpanded((current) => !current)}
      />

      <SidebarShell expanded={tabletExpanded} navigation={navigation} pathname={pathname} />

      <div
        className={cn(
          "min-w-0 overflow-x-hidden pt-[72px] transition-[padding] duration-200 ease-out",
          tabletExpanded ? "md:pl-[280px]" : "md:pl-[88px]",
          "lg:pl-[280px]",
        )}
      >
        <main className="min-h-[calc(100vh-72px)] min-w-0 overflow-x-hidden bg-[#F8F9FB]" aria-label={`${pageMeta.title} content`}>
          <div className="mx-auto min-h-[calc(100vh-72px)] w-full min-w-0 max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
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
  tabletExpanded,
  user,
  onToggleTabletSidebar,
}: {
  homePath: string
  navigation: DashboardNavigationItem[]
  pageMeta: RouteMeta
  roleLabel: string
  tabletExpanded: boolean
  user: UserDTO
  onToggleTabletSidebar: () => void
}) {
  const ToggleIcon = tabletExpanded ? PanelLeftClose : PanelLeftOpen

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-[72px] border-b border-[#E5E7EB] bg-white">
      <div className="flex h-full min-w-0 items-center gap-3 px-4 sm:px-6">
        <div className="md:hidden">
          <MobileSidebarTrigger navigation={navigation} />
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="hidden rounded-md border-[#E5E7EB] bg-white text-[#64748B] hover:bg-[#F8F9FB] lg:hidden md:inline-flex"
          aria-label={tabletExpanded ? "Collapse sidebar" : "Expand sidebar"}
          title={tabletExpanded ? "Collapse sidebar" : "Expand sidebar"}
          onClick={onToggleTabletSidebar}
        >
          <ToggleIcon />
        </Button>

        <div className="min-w-0 shrink basis-[230px] sm:basis-[280px]">
          <h1 className="truncate text-base font-semibold leading-6 text-[#111827] sm:text-lg">{pageMeta.title}</h1>
          <nav className="flex min-w-0 items-center gap-1 text-xs font-medium text-[#64748B]" aria-label="Breadcrumb">
            <span className="truncate">MCS 1</span>
            {pageMeta.breadcrumb.map((item) => (
              <span key={item} className="flex min-w-0 items-center gap-1">
                <span className="text-[#CBD5E1]">/</span>
                <span className="truncate">{item}</span>
              </span>
            ))}
          </nav>
        </div>

        <label className="hidden h-10 min-w-[260px] max-w-[560px] flex-1 items-center gap-3 rounded-md border border-[#E5E7EB] bg-[#F8F9FB] px-3 md:flex">
          <Search className="size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
          <span className="sr-only">Global search</span>
          <input
            type="search"
            placeholder={searchPlaceholder}
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#111827] outline-none placeholder:text-[#94A3B8]"
          />
        </label>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
            aria-label="Open public MCS website"
          >
            <Globe className="size-4 text-[#64748B]" aria-hidden="true" />
            <span className="hidden sm:inline">Public Website</span>
          </Link>

          <button
            type="button"
            className="grid size-10 place-items-center rounded-md border border-[#E5E7EB] bg-white text-[#64748B] transition hover:bg-[#F8F9FB]"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="size-4" aria-hidden="true" />
          </button>

          <ProfileMenu homePath={homePath} roleLabel={roleLabel} user={user} />
        </div>
      </div>
    </header>
  )
}

function SidebarShell({
  expanded,
  navigation,
  pathname,
}: {
  expanded: boolean
  navigation: DashboardNavigationItem[]
  pathname: string
}) {
  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-[72px] z-30 hidden flex-col border-r border-[#E5E7EB] bg-white transition-[width] duration-200 ease-out md:flex",
        expanded ? "w-[280px]" : "w-[88px]",
        "lg:w-[280px]",
      )}
      aria-label="Dashboard sidebar"
    >
      <SidebarContent expanded={expanded} navigation={navigation} pathname={pathname} />
    </aside>
  )
}

function MobileSidebarTrigger({ navigation }: { navigation: DashboardNavigationItem[] }) {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-md border-[#E5E7EB] bg-white text-[#64748B] hover:bg-[#F8F9FB]"
            aria-label="Open navigation"
          />
        }
      >
        <Menu />
        <span className="sr-only">Open navigation</span>
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
                className="rounded-md text-[#64748B] hover:bg-[#F8F9FB]"
                aria-label="Close navigation"
              />
            }
          >
            <X />
            <span className="sr-only">Close navigation</span>
          </SheetClose>
        </div>
        <SidebarContent expanded mobile navigation={navigation} pathname={pathname} />
      </SheetContent>
    </Sheet>
  )
}

function SidebarContent({
  expanded,
  navigation,
  pathname,
  mobile = false,
}: {
  expanded: boolean
  navigation: DashboardNavigationItem[]
  pathname: string
  mobile?: boolean
}) {
  return (
    <>
      <div className={cn("border-b border-[#E5E7EB] p-5", !expanded && !mobile && "md:px-3 lg:px-5")}>
        <div
          className={cn(
            "flex flex-col items-start gap-3",
            !expanded && !mobile && "md:items-center md:gap-0 lg:items-start lg:gap-3",
          )}
        >
          <OfficialLogoStrip compact={!expanded && !mobile} />

          <div className={cn("min-w-0", !expanded && !mobile && "md:hidden lg:block")}> 
            <p className="truncate text-lg font-semibold leading-6 text-[#111827]">MCS 1</p>
            <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-[#64748B]">{event.theme}</p>
            <p className="mt-1 text-[11px] font-medium leading-4 text-[#64748B]">{event.dateRange}</p>
            <p className="mt-1 truncate text-[11px] font-medium leading-4 text-[#64748B]">{event.school}</p>
          </div>
        </div>

        <div
          className={cn(
            "mt-5 rounded-md border border-[#E5E7EB] bg-white p-3",
            !expanded && !mobile && "md:hidden lg:block",
          )}
        >
          <p className="text-xs font-semibold text-[#111827]">MCS 1</p>
          <p className="mt-1 truncate text-xs font-medium text-[#64748B]">22–25 Juni 2026</p>
          <p className="mt-1 truncate text-[11px] font-medium text-[#64748B]">SMKN 20 Jakarta</p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard navigation">
        <div className="flex flex-col gap-1">
          {navigation.map((item) => (
            <SidebarLink key={item.key} expanded={expanded || mobile} item={item} mobile={mobile} pathname={pathname} />
          ))}
        </div>
      </nav>
    </>
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

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex h-11 min-w-0 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
        active ? "bg-[#F97316] text-white" : "text-slate-500 hover:bg-[#F8F9FB] hover:text-orange-500",
        !expanded && !mobile && "md:justify-center md:px-0 lg:justify-start lg:px-3",
      )}
      aria-current={active ? "page" : undefined}
      title={!expanded && !mobile ? item.label : undefined}
    >
      <Icon
        className={cn("h-[18px] w-[18px] shrink-0", active ? "text-white" : "text-slate-500 group-hover:text-orange-500")}
        strokeWidth={2}
        aria-hidden="true"
      />
      <span className={cn("truncate", !expanded && !mobile && "md:hidden lg:block")}>{item.label}</span>
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
            "relative grid place-items-center rounded-md border border-[#E5E7EB] bg-white",
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

function ProfileMenu({ homePath, roleLabel, user }: { homePath: string; roleLabel: string; user: UserDTO }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const initials = getInitials(user.displayName)
  const divisionLabel = user.divisionIds.length ? user.divisionIds.join(", ") : "No division assigned"

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
        className="inline-flex h-10 items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-2 text-[#111827] transition hover:bg-[#F8F9FB]"
        aria-controls="mcs-profile-menu"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        onClick={() => setMenuOpen((current) => !current)}
      >
        <Avatar size="sm" className="size-7 bg-[#0F172A] text-white after:border-[#0F172A]">
          <AvatarFallback className="bg-[#0F172A] text-xs font-semibold text-white">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-28 truncate text-sm font-semibold text-[#111827] lg:block">
          {user.displayName}
        </span>
        <ChevronDown className="hidden size-4 text-[#64748B] sm:block" aria-hidden="true" />
      </button>

      {menuOpen ? (
        <div
          id="mcs-profile-menu"
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-lg border border-[#E5E7EB] bg-white p-1 text-[#111827] shadow-md ring-1 ring-[#111827]/5"
        >
          <div className="px-2 py-2">
            <span className="block truncate text-sm font-semibold text-[#111827]">{user.displayName}</span>
            <span className="mt-0.5 block truncate text-xs font-medium text-[#64748B]">{user.email}</span>
          </div>
          <div className="-mx-1 my-1 h-px bg-[#E5E7EB]" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-[#111827] outline-none hover:bg-[#F8F9FB] focus:bg-[#F8F9FB]"
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
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-[#111827]"
          >
            <Building2 className="size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Division: {divisionLabel}</span>
          </div>
          <div
            role="menuitem"
            aria-disabled="true"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-[#111827]"
          >
            <ShieldCheck className="size-4 shrink-0 text-[#64748B]" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Role: {roleLabel}</span>
          </div>
          <div className="-mx-1 my-1 h-px bg-[#E5E7EB]" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-[#B91C1C] outline-none hover:bg-[#FEF2F2] focus:bg-[#FEF2F2]"
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
      title: matchedItem.label,
      breadcrumb: [matchedItem.label],
    }
  }

  return {
    title: matchedItem.label,
    breadcrumb: ["Dashboard", matchedItem.label],
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

/* eslint-disable @typescript-eslint/no-unused-vars */
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
