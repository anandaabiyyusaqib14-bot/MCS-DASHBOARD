export type AttendanceStatus = "Present" | "Late" | "Absent" | "Excused"
export type TaskStatus = "In Progress" | "Scheduled" | "Completed" | "Blocked"
export type TaskPriority = "High" | "Medium" | "Low"
export type DivisionStatus = "Stable" | "Watch" | "Attention"

export type PanitiaDivision = {
  id: string
  name: string
  coordinator: string
  members: number
  present: number
  late: number
  absent: number
  excused: number
  activeTasks: number
  completion: number
  responsiveness: number
  status: DivisionStatus
  focus: string
}

export type StaffMember = {
  id: string
  name: string
  division: string
  position: string
  role: string
  attendance: AttendanceStatus
  currentTask: string
  taskStatus: TaskStatus
  contact: string
  checkIn: string
}

export type PanitiaTask = {
  id: string
  title: string
  pic: string
  division: string
  deadline: string
  progress: number
  priority: TaskPriority
  status: TaskStatus
}

export type ActivityItem = {
  id: string
  time: string
  title: string
  detail: string
  division: string
  tone: "success" | "warning" | "danger" | "info"
}

export const panitiaDivisions: PanitiaDivision[] = [
  {
    id: "acara",
    name: "Acara",
    coordinator: "No Data Available",
    members: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    activeTasks: 0,
    completion: 0,
    responsiveness: 0,
    status: "Stable",
    focus: "No Data Available",
  },
  {
    id: "humas",
    name: "Humas",
    coordinator: "No Data Available",
    members: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    activeTasks: 0,
    completion: 0,
    responsiveness: 0,
    status: "Stable",
    focus: "No Data Available",
  },
  {
    id: "dokumentasi",
    name: "Dokumentasi",
    coordinator: "No Data Available",
    members: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    activeTasks: 0,
    completion: 0,
    responsiveness: 0,
    status: "Stable",
    focus: "No Data Available",
  },
  {
    id: "keamanan",
    name: "Keamanan",
    coordinator: "No Data Available",
    members: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    activeTasks: 0,
    completion: 0,
    responsiveness: 0,
    status: "Stable",
    focus: "No Data Available",
  },
  {
    id: "perlengkapan",
    name: "Perlengkapan",
    coordinator: "No Data Available",
    members: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    activeTasks: 0,
    completion: 0,
    responsiveness: 0,
    status: "Stable",
    focus: "No Data Available",
  },
  {
    id: "kebersihan",
    name: "Kebersihan",
    coordinator: "No Data Available",
    members: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    activeTasks: 0,
    completion: 0,
    responsiveness: 0,
    status: "Stable",
    focus: "No Data Available",
  },
  {
    id: "kewirausahaan",
    name: "Kewirausahaan",
    coordinator: "No Data Available",
    members: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    activeTasks: 0,
    completion: 0,
    responsiveness: 0,
    status: "Stable",
    focus: "No Data Available",
  },
  {
    id: "pj-lomba",
    name: "PJ Lomba",
    coordinator: "No Data Available",
    members: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    activeTasks: 0,
    completion: 0,
    responsiveness: 0,
    status: "Stable",
    focus: "No Data Available",
  },
]

export const staffMembers: StaffMember[] = []

export const panitiaTasks: PanitiaTask[] = []

export const activityItems: ActivityItem[] = []
