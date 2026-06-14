"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Eye,
  FileText,
  Filter,
  LayoutDashboard,
  Megaphone,
  Menu,
  Paperclip,
  Plus,
  Radio,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react"

import { BrandMark } from "@/components/brand/brand-mark"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { contact, event, majors } from "@/data/mcs"
import { cn } from "@/lib/utils"

type Priority = "Critical" | "Important" | "Normal"
type Category = "General" | "Tournament" | "Operational" | "Emergency" | "Media" | "Ceremony"

type AnnouncementItem = {
  id: string
  title: string
  message: string
  category: Category
  author: string
  timestamp: string
  audience: string[]
  priority: Priority
  reads: number
  pinned?: boolean
}

type ScheduledBroadcast = {
  id: string
  time: string
  title: string
  audience: string
  priority: Priority
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Tournament", icon: Trophy },
  { label: "Live Match", icon: Radio, badge: "Live" },
  { label: "Schedule", icon: CalendarDays },
  { label: "Panitia", icon: Users },
  { label: "Announcements", icon: Megaphone },
  { label: "Media Center", icon: Camera },
  { label: "Attendance", icon: ClipboardCheck },
  { label: "Certificates", icon: ShieldCheck },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
]

const mobileNavItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Tournament", icon: Trophy },
  { label: "Live Match", icon: Radio },
  { label: "Schedule", icon: CalendarDays },
  { label: "Announcements", icon: Megaphone },
  { label: "More", icon: Menu },
]

const categories: Category[] = ["General", "Tournament", "Operational", "Emergency", "Media", "Ceremony"]
const priorities: Priority[] = ["Critical", "Important", "Normal"]

const audienceGroups = [
  { label: "All Panitia", count: 0 },
  { label: "All Jurusan", count: 0 },
  ...majors.map((major) => ({ label: major.name, count: 0 })),
  { label: "Humas", count: 0 },
  { label: "Dokumentasi", count: 0 },
  { label: "Acara", count: 0 },
  { label: "Keamanan", count: 0 },
  { label: "PJ Lomba", count: 0 },
  { label: "Participants", count: 0 },
  { label: "Specific Division", count: 0 },
]

const initialAnnouncements: AnnouncementItem[] = []

const initialScheduledBroadcasts: ScheduledBroadcast[] = []

const communicationTimeline: Array<{ time: string; title: string; meta: string; status: string; tone: string }> = []

const priorityStyle = {
  Critical: {
    badge: "bg-[rgba(195,38,45,0.22)] text-[#ff9ca0] border-[rgba(195,38,45,0.35)]",
    rail: "border-[color:var(--mcs-red)] bg-[rgba(195,38,45,0.1)]",
    icon: "text-[color:var(--mcs-red)]",
  },
  Important: {
    badge: "bg-[rgba(225,180,81,0.2)] text-[color:var(--mcs-gold-soft)] border-[rgba(225,180,81,0.35)]",
    rail: "border-[color:var(--mcs-gold)] bg-[rgba(225,180,81,0.08)]",
    icon: "text-[color:var(--mcs-gold-soft)]",
  },
  Normal: {
    badge: "bg-[rgba(100,181,246,0.14)] text-[#9ccfff] border-[rgba(100,181,246,0.25)]",
    rail: "border-[#64b5f6] bg-[rgba(100,181,246,0.06)]",
    icon: "text-[#9ccfff]",
  },
} satisfies Record<Priority, { badge: string; rail: string; icon: string }>

export function AnnouncementBroadcastScreen() {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [scheduled, setScheduled] = useState(initialScheduledBroadcasts)
  const [selectedAudience, setSelectedAudience] = useState(["All Panitia"])
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [category, setCategory] = useState<Category>("Operational")
  const [priority, setPriority] = useState<Priority>("Critical")
  const [scheduleTime, setScheduleTime] = useState("08:45")
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All")

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase()

    return announcements.filter((announcement) => {
      const matchesPriority = priorityFilter === "All" || announcement.priority === priorityFilter
      const matchesCategory = categoryFilter === "All" || announcement.category === categoryFilter
      const haystack = `${announcement.title} ${announcement.message} ${announcement.author} ${announcement.audience.join(" ")}`.toLowerCase()
      const matchesSearch = !query || haystack.includes(query)

      return matchesPriority && matchesCategory && matchesSearch
    })
  }, [announcements, categoryFilter, priorityFilter, search])

  const overview = useMemo(
    () => [
      { label: "Total Announcements", value: String(announcements.length), helper: "All time", icon: Megaphone, tone: "blue" },
      { label: "Active Broadcasts", value: String(announcements.filter((item) => item.priority !== "Normal").length), helper: "Currently active", icon: Radio, tone: "red" },
      { label: "Scheduled Messages", value: String(scheduled.length), helper: "Upcoming", icon: CalendarDays, tone: "gray" },
      { label: "Read Rate", value: "Data Not Published Yet", helper: "This week", icon: Eye, tone: "green" },
      { label: "Unread Alerts", value: "Coming Soon", helper: "Require attention", icon: Bell, tone: "gold" },
      { label: "Critical Notices", value: String(announcements.filter((item) => item.priority === "Critical").length), helper: "High priority", icon: AlertTriangle, tone: "red" },
    ],
    [announcements, scheduled]
  )

  function toggleAudience(label: string) {
    setSelectedAudience((current) => {
      if (label === "All Panitia") {
        return ["All Panitia"]
      }

      const withoutAll = current.filter((item) => item !== "All Panitia")
      return withoutAll.includes(label)
        ? withoutAll.filter((item) => item !== label)
        : [...withoutAll, label]
    })
  }

  function publishAnnouncement() {
    const finalTitle = title.trim() || "Official Broadcast"
    const finalMessage =
      message.trim() || "Mohon seluruh target audiens memperhatikan update operasional dari Command Center."

    setAnnouncements((current) => [
      {
        id: `announcement-${Date.now()}`,
        title: finalTitle,
        message: finalMessage,
        category,
        author: contact.whatsappOfficial.label,
        timestamp: "Just now",
        audience: selectedAudience.length ? selectedAudience : ["All Panitia"],
        priority,
        reads: 0,
        pinned: priority === "Critical",
      },
      ...current,
    ])
    setTitle("")
    setMessage("")
  }

  function createScheduledMessage() {
    setScheduled((current) => [
      {
        id: `scheduled-${Date.now()}`,
        time: scheduleTime,
        title: title.trim() || "Official Broadcast",
        audience: selectedAudience.join(", ") || "All Panitia",
        priority,
      },
      ...current,
    ])
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_34%_-12%,rgba(195,38,45,0.13),transparent_31%),linear-gradient(180deg,#07111d,#050b13_48%,#03070d)] text-foreground">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] border-r border-white/10 bg-[#050c15] lg:flex lg:flex-col">
          <Sidebar active="Announcements" />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:pl-[272px]">
          <TopBar />

          <main className="flex-1 p-3 pb-24 sm:p-4 lg:pb-5 xl:p-5">
            <div className="mx-auto grid max-w-[1720px] gap-3">
              <MobileHeading onPublish={publishAnnouncement} />
              <BroadcastOverview overview={overview} />

              <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(400px,0.9fr)_minmax(0,1.1fr)_minmax(300px,0.7fr)]">
                <div className="order-3 grid gap-3 xl:order-1">
                  <CreateAnnouncement
                    title={title}
                    message={message}
                    category={category}
                    priority={priority}
                    scheduleTime={scheduleTime}
                    selectedAudience={selectedAudience}
                    onTitle={setTitle}
                    onMessage={setMessage}
                    onCategory={setCategory}
                    onPriority={setPriority}
                    onScheduleTime={setScheduleTime}
                    onAudience={toggleAudience}
                    onPublish={publishAnnouncement}
                    onSchedule={createScheduledMessage}
                  />
                  <AudienceTargeting selectedAudience={selectedAudience} onAudience={toggleAudience} />
                </div>

                <div className="order-1 grid gap-3 xl:order-2">
                  <ActiveAnnouncements
                    announcements={filteredAnnouncements}
                    search={search}
                    priorityFilter={priorityFilter}
                    categoryFilter={categoryFilter}
                    onSearch={setSearch}
                    onPriorityFilter={setPriorityFilter}
                    onCategoryFilter={setCategoryFilter}
                  />
                  <DeliveryAnalytics />
                </div>

                <div className="order-2 grid gap-3 xl:order-3">
                  <ScheduledBroadcasts scheduled={scheduled} onSchedule={createScheduledMessage} />
                  <CommunicationTimeline />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <MobileBottomNav active="Announcements" />
    </div>
  )
}

function Sidebar({ active }: { active: string }) {
  return (
    <>
      <div className="border-b border-white/10 px-4 py-5">
        <BrandMark />
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="font-sport text-xs font-black uppercase tracking-[0.22em] text-white/58">SMKN 20 Jakarta</p>
          <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[color:var(--mcs-gold-soft)]">
            Anniversary Celebration
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-1 font-sport text-[0.62rem] font-black uppercase tracking-[0.2em] text-white/38">
          Main Navigation
        </p>
        {navItems.map((item) => {
          const isActive = active === item.label

          return (
            <button
              key={item.label}
              type="button"
              className={cn(
                "grid h-10 grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-transparent px-3 text-left text-sm font-semibold text-white/66 transition hover:border-white/8 hover:bg-white/7 hover:text-white",
                isActive && "border-white/10 bg-[rgba(195,38,45,0.22)] text-white shadow-[inset_3px_0_0_var(--mcs-red)]"
              )}
            >
              <item.icon className={cn("size-4", isActive ? "text-white" : "text-white/72")} />
              <span className="truncate">{item.label}</span>
              {item.badge ? (
                <span className="rounded-sm bg-[rgba(195,38,45,0.18)] px-1.5 py-0.5 font-sport text-[0.58rem] font-black uppercase text-[#ff9ca0]">
                  {item.badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>

      <div className="relative overflow-hidden border-t border-white/10 p-4">
        <div className="relative rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-3xl leading-none text-[color:var(--mcs-gold-soft)]">MCS 1</p>
              <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/62">
                The Genesis of Excellence
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-md bg-[rgba(195,38,45,0.2)] text-[color:var(--mcs-red)]">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-[0.65rem] uppercase">
            <span className="font-bold text-white/42">Role</span>
            <span className="text-right font-sport font-black text-white">Super Admin</span>
            <span className="font-bold text-white/42">Access</span>
            <span className="text-right font-sport font-black text-[color:var(--mcs-gold-soft)]">Full Ops</span>
          </div>
        </div>
      </div>
    </>
  )
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07111d]/96 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-[1720px] items-center justify-between gap-3 px-3 py-2 sm:px-4 xl:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="border-white/15 !bg-white/5 !text-white hover:!bg-white/10 lg:hidden" />
              }
            >
              <Menu />
              <span className="sr-only">Open navigation</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-[292px] border-white/10 bg-[#050c15] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>MCS navigation</SheetTitle>
                <SheetDescription>Announcement navigation</SheetDescription>
              </SheetHeader>
              <Sidebar active="Announcements" />
            </SheetContent>
          </Sheet>

          <div className="hidden lg:block">
            <p className="font-display text-4xl leading-none text-white">Announcements & Broadcast</p>
            <p className="max-w-[320px] truncate font-sport text-xs font-bold uppercase tracking-[0.14em] text-white/58">
              {event.name}
            </p>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <BrandMark compact />
            <div className="min-w-0">
              <p className="truncate font-sport text-base font-black text-white">Announcements</p>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--mcs-red)]">
                <span className="size-2 rounded-full bg-[color:var(--mcs-red)]" />
                Live
              </p>
            </div>
          </div>
        </div>

        <div className="hidden shrink-0 items-stretch border-x border-white/10 xl:flex">
          <div className="flex items-center gap-3 border-r border-white/10 px-5">
            <span className="size-2 rounded-full bg-[#48c78e]" />
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/52">Delivery Health</p>
              <p className="font-sport text-sm font-black uppercase text-[#7de39b]">Data Not Published Yet</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/52">Read Rate</p>
            <p className="font-mono text-2xl font-black text-white">No Data</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            size="lg"
            className="hidden h-9 rounded-md bg-[color:var(--mcs-red)] font-sport text-xs font-black uppercase text-white hover:bg-[color:var(--mcs-red-dark)] sm:inline-flex"
          >
            <Send data-icon="inline-start" />
            Broadcast Now
          </Button>
          <Button variant="ghost" size="icon" className="relative text-white/72 hover:bg-white/10 hover:text-white">
            <Bell />
            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[color:var(--mcs-red)] text-[0.62rem] font-black text-white">
              0
            </span>
            <span className="sr-only">Notifications</span>
          </Button>
          <div className="hidden items-center gap-3 border-l border-white/10 pl-4 sm:flex">
            <Avatar size="sm">
              <AvatarFallback className="bg-[color:var(--mcs-gold)] text-[#07111d]">SA</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">Admin MCS 1</p>
              <p className="truncate text-xs text-white/50">Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function MobileHeading({ onPublish }: { onPublish: () => void }) {
  return (
    <section className="grid gap-3 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl leading-none text-white">Announcements & Broadcast</h1>
          <p className="text-sm text-white/58">Event Communication Command Center</p>
        </div>
        <Button className="h-9 rounded-md bg-[color:var(--mcs-red)] font-sport font-black uppercase text-white" onClick={onPublish}>
          <Send data-icon="inline-start" />
          Broadcast
        </Button>
      </div>
      <div className="rounded-lg border border-white/10 bg-[#08121f] px-3 py-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
          <div>
            <p className="font-sport text-xs font-black uppercase tracking-[0.14em] text-white/48">Communication Health</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold uppercase text-[#7de39b]">
              <span className="size-2 rounded-full bg-[#48c78e]" />
              Data Not Published Yet
            </p>
          </div>
          <div className="border-l border-white/10 pl-3 text-right">
            <p className="font-sport text-[0.62rem] font-black uppercase text-white/46">Read Rate</p>
            <p className="font-mono text-lg font-black text-[color:var(--mcs-gold-soft)]">No Data</p>
          </div>
          <ChevronRight className="size-4 text-white/34" />
        </div>
      </div>
    </section>
  )
}

function BroadcastOverview({
  overview,
}: {
  overview: Array<{
    label: string
    value: string
    helper: string
    icon: typeof Megaphone
    tone: string
  }>
}) {
  return (
    <section className="hidden rounded-lg border border-white/10 bg-[#08121f] lg:block">
      <PanelHeader number="1" title="Broadcast Overview" />
      <div className="grid gap-2 p-3 xl:grid-cols-6">
        {overview.map((item) => (
          <article key={item.label} className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="grid grid-cols-[44px_1fr] items-center gap-3">
              <div
                className={cn(
                  "grid size-11 place-items-center rounded-md border",
                  item.tone === "red" && "border-[rgba(195,38,45,0.35)] bg-[rgba(195,38,45,0.12)] text-[color:var(--mcs-red)]",
                  item.tone === "gold" && "border-[rgba(225,180,81,0.35)] bg-[rgba(225,180,81,0.12)] text-[color:var(--mcs-gold-soft)]",
                  item.tone === "green" && "border-[rgba(72,199,142,0.32)] bg-[rgba(72,199,142,0.1)] text-[#7de39b]",
                  (item.tone === "blue" || item.tone === "gray") && "border-white/10 bg-white/5 text-white/72"
                )}
              >
                <item.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-sport text-[0.62rem] font-black uppercase tracking-[0.1em] text-white/48">{item.label}</p>
                <p className="mt-1 font-display text-4xl leading-none text-white">{item.value}</p>
                <p className="mt-1 truncate text-xs text-white/50">{item.helper}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function CreateAnnouncement({
  title,
  message,
  category,
  priority,
  scheduleTime,
  selectedAudience,
  onTitle,
  onMessage,
  onCategory,
  onPriority,
  onScheduleTime,
  onAudience,
  onPublish,
  onSchedule,
}: {
  title: string
  message: string
  category: Category
  priority: Priority
  scheduleTime: string
  selectedAudience: string[]
  onTitle: (value: string) => void
  onMessage: (value: string) => void
  onCategory: (value: Category) => void
  onPriority: (value: Priority) => void
  onScheduleTime: (value: string) => void
  onAudience: (label: string) => void
  onPublish: () => void
  onSchedule: () => void
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader number="2" title="Create Announcement" />
      <div className="grid gap-4 p-4">
        <div className="grid gap-2">
          <Label text="Title" required />
          <input
            value={title}
            onChange={(event) => onTitle(event.target.value)}
            placeholder="Enter announcement title"
            className="h-10 rounded-md border border-white/12 bg-[#050c15] px-3 text-sm text-white outline-none placeholder:text-white/34 focus:border-[color:var(--mcs-gold)]"
          />
        </div>
        <div className="grid gap-2">
          <Label text="Message" required />
          <Textarea
            value={message}
            onChange={(event) => onMessage(event.target.value)}
            placeholder="Type your announcement message here..."
            className="min-h-28 rounded-md border-white/12 bg-[#050c15] text-sm text-white placeholder:text-white/34"
          />
          <div className="flex items-center justify-between text-xs text-white/42">
            <span className="flex items-center gap-3">
              <Paperclip className="size-4" />
              Attachments supported
            </span>
            <span>{message.length}/1000</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField label="Category" value={category} options={categories} onChange={(value) => onCategory(value as Category)} />
          <SelectField label="Priority" value={priority} options={priorities} onChange={(value) => onPriority(value as Priority)} />
          <SelectField label="Audience" value={selectedAudience[0] ?? "All Panitia"} options={audienceGroups.map((group) => group.label)} onChange={onAudience} />
        </div>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label text="Schedule Time" />
            <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
              <select
                className="h-10 rounded-md border border-white/12 bg-[#050c15] px-3 text-sm text-white outline-none"
                defaultValue="now"
              >
                <option value="now">Publish immediately</option>
                <option value="later">Schedule broadcast</option>
              </select>
              <input
                value={scheduleTime}
                onChange={(event) => onScheduleTime(event.target.value)}
                type="time"
                className="h-10 rounded-md border border-white/12 bg-[#050c15] px-3 text-sm text-white outline-none"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label text="Attachments" />
            <button
              type="button"
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-dashed border-white/16 bg-white/5 text-sm font-semibold text-white/58 transition hover:border-[color:var(--mcs-gold)] hover:text-white"
            >
              <Paperclip className="size-4" />
              Click to attach files
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="outline" className="h-10 rounded-md border-white/12 !bg-white/5 font-sport font-black uppercase !text-white/76 hover:!bg-white/10 hover:!text-white">
            <Save data-icon="inline-start" />
            Save Draft
          </Button>
          <Button variant="outline" className="h-10 rounded-md border-white/12 !bg-white/5 font-sport font-black uppercase !text-white/76 hover:!bg-white/10 hover:!text-white" onClick={onSchedule}>
            <Clock data-icon="inline-start" />
            Schedule
          </Button>
          <Button className="h-10 rounded-md bg-[color:var(--mcs-red)] font-sport font-black uppercase text-white hover:bg-[color:var(--mcs-red-dark)]" onClick={onPublish}>
            <Send data-icon="inline-start" />
            Publish Now
          </Button>
        </div>
      </div>
    </section>
  )
}

function ActiveAnnouncements({
  announcements,
  search,
  priorityFilter,
  categoryFilter,
  onSearch,
  onPriorityFilter,
  onCategoryFilter,
}: {
  announcements: AnnouncementItem[]
  search: string
  priorityFilter: string
  categoryFilter: string
  onSearch: (value: string) => void
  onPriorityFilter: (value: string) => void
  onCategoryFilter: (value: string) => void
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader number="3" title="Active Announcements" action="View All" />
      <div className="grid gap-3 border-b border-white/10 p-3 sm:grid-cols-[minmax(0,1fr)_150px_150px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/38" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search title, division, sender"
            className="h-9 w-full rounded-md border border-white/12 bg-[#050c15] pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/34"
          />
        </div>
        <SelectInline value={priorityFilter} options={["All", ...priorities]} onChange={onPriorityFilter} />
        <SelectInline value={categoryFilter} options={["All", ...categories]} onChange={onCategoryFilter} />
      </div>
      <div className="grid gap-2 p-3">
        {announcements.map((announcement) => (
          <AnnouncementRow key={announcement.id} announcement={announcement} />
        ))}
        {announcements.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-white/5 p-6 text-center">
            <Filter className="mx-auto size-5 text-white/42" />
            <p className="mt-2 text-sm font-bold text-white">No announcements match the current filters.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function AnnouncementRow({ announcement }: { announcement: AnnouncementItem }) {
  const style = priorityStyle[announcement.priority]

  return (
    <article className={cn("rounded-lg border p-3", style.rail)}>
      <div className="grid grid-cols-[42px_minmax(0,1fr)_auto] gap-3">
        <div className={cn("grid size-10 place-items-center rounded-md border border-white/10 bg-white/5", style.icon)}>
          {announcement.priority === "Critical" ? <Megaphone className="size-5" /> : announcement.priority === "Important" ? <Trophy className="size-5" /> : <FileText className="size-5" />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("rounded-sm font-sport text-[0.62rem] font-black uppercase", style.badge)}>
              {announcement.priority === "Critical" ? "Urgent" : announcement.priority}
            </Badge>
            {announcement.pinned ? (
              <span className="font-sport text-[0.62rem] font-black uppercase tracking-[0.12em] text-[color:var(--mcs-red)]">
                Pinned
              </span>
            ) : null}
            <h3 className="truncate text-sm font-black text-white">{announcement.title}</h3>
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/60">{announcement.message}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/42">
            <span>{announcement.author}</span>
            <span>{announcement.timestamp}</span>
            <span>{announcement.category}</span>
            <span>{announcement.audience.join(", ")}</span>
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <Badge className="rounded-sm bg-[rgba(195,38,45,0.16)] text-[#ff9ca0]">Live</Badge>
          <p className="mt-3 flex items-center justify-end gap-1 font-mono text-xs text-white/48">
            <Eye className="size-3" />
            {announcement.reads}
          </p>
        </div>
      </div>
    </article>
  )
}

function ScheduledBroadcasts({
  scheduled,
  onSchedule,
}: {
  scheduled: ScheduledBroadcast[]
  onSchedule: () => void
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader number="4" title="Scheduled Broadcasts" action="View All" />
      <div className="divide-y divide-white/10">
        {scheduled.slice(0, 5).map((item) => (
          <div key={item.id} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
            <p className="font-mono text-lg font-black text-white">{item.time}</p>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{item.title}</p>
              <p className="text-xs text-white/45">23 Mei 2025</p>
            </div>
            <Badge variant="outline" className={cn("rounded-sm text-[0.62rem]", priorityStyle[item.priority].badge)}>
              {item.audience}
            </Badge>
          </div>
        ))}
      </div>
      <div className="p-3">
        <Button variant="outline" className="h-10 w-full rounded-md border-white/12 !bg-white/5 font-sport font-black uppercase !text-white/76 hover:!bg-white/10 hover:!text-white" onClick={onSchedule}>
          <Plus data-icon="inline-start" />
          Create Scheduled Message
        </Button>
      </div>
    </section>
  )
}

function AudienceTargeting({
  selectedAudience,
  onAudience,
}: {
  selectedAudience: string[]
  onAudience: (label: string) => void
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader number="5" title="Audience Targeting" />
      <div className="grid gap-3 p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {audienceGroups.map((group) => {
            const selected = selectedAudience.includes(group.label)

            return (
              <button
                key={group.label}
                type="button"
                onClick={() => onAudience(group.label)}
                className={cn(
                  "rounded-md border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10",
                  selected && "border-[color:var(--mcs-red)] bg-[rgba(195,38,45,0.16)]"
                )}
              >
                <div className="flex items-center gap-2">
                  <Users className={cn("size-4", selected ? "text-[#ff9ca0]" : "text-white/58")} />
                  <span className="truncate text-sm font-bold text-white">{group.label}</span>
                </div>
                <p className="mt-1 text-xs text-white/48">{group.count ? `${group.count} members` : "Custom selection"}</p>
              </button>
            )
          })}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--mcs-gold-soft)]">
            Selected Audience: {selectedAudience.join(", ") || "None"}
          </p>
          <Button variant="outline" size="sm" className="rounded-md border-white/12 !bg-white/5 font-sport font-black uppercase !text-white/70 hover:!bg-white/10 hover:!text-white">
            Manage Groups
          </Button>
        </div>
      </div>
    </section>
  )
}

function DeliveryAnalytics() {
  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader number="6" title="Delivery Analytics" />
      <div className="grid gap-4 p-4 lg:grid-cols-[170px_1fr]">
        <div className="mx-auto grid size-36 place-items-center rounded-full border-[18px] border-white/10 bg-[#050c15] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
          <div className="text-center">
            <p className="text-xs text-white/48">Total Sent</p>
            <p className="font-display text-5xl leading-none text-white">0</p>
          </div>
        </div>
        <div className="grid gap-3">
          {[
            ["Delivered", "0", "No Data", "#48c78e"],
            ["Read", "0", "No Data", "#64b5f6"],
            ["Unread", "0", "No Data", "#e1b451"],
          ].map(([label, value, percent, color]) => (
            <div key={label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-white/56">
                <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </p>
              <p className="font-mono text-lg font-black text-white">{value}</p>
              <p className="font-mono text-sm text-white/48">{percent}</p>
            </div>
          ))}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-bold uppercase tracking-[0.1em] text-white/48">Engagement Rate</span>
              <span className="font-mono font-black text-[#7de39b]">No Data</span>
            </div>
            <Progress value={0} className="h-2 bg-white/10" />
          </div>
        </div>
      </div>
    </section>
  )
}

function CommunicationTimeline() {
  return (
    <section className="rounded-lg border border-white/10 bg-[#08121f]">
      <PanelHeader number="7" title="Communication Timeline" action="View All" />
      <div className="p-4">
        <div className="relative grid gap-0">
          <span className="absolute bottom-6 left-[50px] top-6 w-px bg-[linear-gradient(180deg,rgba(72,199,142,0.8),rgba(225,180,81,0.84),rgba(195,38,45,0.72))]" />
          {communicationTimeline.length === 0 ? (
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-4 text-sm font-semibold text-white/56">
              Data Not Published Yet
            </div>
          ) : communicationTimeline.map((item) => (
            <div key={`${item.time}-${item.title}`} className="relative grid grid-cols-[42px_20px_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/8 py-3 last:border-b-0">
              <p className="font-mono text-sm text-white/74">{item.time}</p>
              <span
                className={cn(
                  "relative z-10 size-3 rounded-full border-2",
                  item.tone === "green" && "border-[#48c78e] bg-[#48c78e]",
                  item.tone === "gold" && "border-[color:var(--mcs-gold)] bg-[#08121f]",
                  item.tone === "red" && "border-[color:var(--mcs-red)] bg-[#08121f]"
                )}
              />
              <div className="min-w-0">
                <p className="truncate font-sport text-sm font-black uppercase text-white">{item.title}</p>
                <p className="truncate text-xs text-white/52">{item.meta}</p>
              </div>
              <Badge
                className={cn(
                  "rounded-sm",
                  item.status === "Read" && "bg-[rgba(72,199,142,0.16)] text-[#8ce6b5]",
                  item.status === "Partial" && "bg-[rgba(225,180,81,0.18)] text-[color:var(--mcs-gold-soft)]"
                )}
              >
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PanelHeader({
  number,
  title,
  action,
}: {
  number: string
  title: string
  action?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-7 place-items-center rounded-sm bg-[color:var(--mcs-red)] font-sport text-sm font-black text-white">
          {number}
        </span>
        <h2 className="truncate font-display text-2xl leading-none text-white 2xl:text-3xl">{title}</h2>
      </div>
      {action ? (
        <button type="button" className="shrink-0 font-sport text-[0.68rem] font-black uppercase text-[color:var(--mcs-red)] transition hover:text-white">
          {action}
        </button>
      ) : null}
    </div>
  )
}

function Label({ text, required = false }: { text: string; required?: boolean }) {
  return (
    <label className="font-sport text-[0.68rem] font-black uppercase tracking-[0.12em] text-white/52">
      {text} {required ? <span className="text-[color:var(--mcs-red)]">*</span> : null}
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <Label text={label} />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-white/12 bg-[#050c15] px-3 text-sm text-white outline-none focus:border-[color:var(--mcs-gold)]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function SelectInline({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-md border border-white/12 bg-[#050c15] px-3 text-sm text-white outline-none focus:border-[color:var(--mcs-gold)]"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function MobileBottomNav({ active }: { active: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-white/10 bg-[#050c15]/96 px-2 pb-3 pt-2 backdrop-blur-md lg:hidden">
      {mobileNavItems.map((item) => {
        const isActive = active === item.label

        return (
          <button
            key={item.label}
            type="button"
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 py-1 text-[0.68rem] font-semibold text-white/58 transition hover:bg-white/7 hover:text-white",
              isActive && "bg-[rgba(195,38,45,0.1)] text-[color:var(--mcs-red)]"
            )}
          >
            <item.icon className="size-5" />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
