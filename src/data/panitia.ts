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
    coordinator: "Rangga Dwi Pratama",
    members: 9,
    present: 7,
    late: 1,
    absent: 1,
    excused: 0,
    activeTasks: 8,
    completion: 82,
    responsiveness: 91,
    status: "Stable",
    focus: "Rundown, ceremony, briefing stage",
  },
  {
    id: "humas",
    name: "Humas",
    coordinator: "Nabila Azzahra",
    members: 7,
    present: 5,
    late: 1,
    absent: 1,
    excused: 0,
    activeTasks: 6,
    completion: 68,
    responsiveness: 86,
    status: "Watch",
    focus: "Announcement, liaison, guest flow",
  },
  {
    id: "dokumentasi",
    name: "Dokumentasi",
    coordinator: "Fikri Hamdani",
    members: 8,
    present: 7,
    late: 0,
    absent: 1,
    excused: 0,
    activeTasks: 7,
    completion: 88,
    responsiveness: 89,
    status: "Stable",
    focus: "Photo, video, highlight upload",
  },
  {
    id: "keamanan",
    name: "Keamanan",
    coordinator: "Bima Setiawan",
    members: 8,
    present: 6,
    late: 1,
    absent: 1,
    excused: 0,
    activeTasks: 7,
    completion: 74,
    responsiveness: 90,
    status: "Stable",
    focus: "Gate control, field boundary, crowd flow",
  },
  {
    id: "perlengkapan",
    name: "Perlengkapan",
    coordinator: "Dewi Lestari",
    members: 9,
    present: 6,
    late: 2,
    absent: 1,
    excused: 0,
    activeTasks: 10,
    completion: 61,
    responsiveness: 78,
    status: "Attention",
    focus: "Court setup, sound, match tools",
  },
  {
    id: "kebersihan",
    name: "Kebersihan",
    coordinator: "Siti Nurhaliza",
    members: 6,
    present: 5,
    late: 0,
    absent: 0,
    excused: 1,
    activeTasks: 4,
    completion: 92,
    responsiveness: 84,
    status: "Stable",
    focus: "Clean zone, waste points, post-session sweep",
  },
  {
    id: "kewirausahaan",
    name: "Kewirausahaan",
    coordinator: "Yoga Pratama",
    members: 6,
    present: 4,
    late: 1,
    absent: 1,
    excused: 0,
    activeTasks: 5,
    completion: 58,
    responsiveness: 72,
    status: "Attention",
    focus: "Booth, payment log, sponsor stock",
  },
  {
    id: "pj-lomba",
    name: "PJ Lomba",
    coordinator: "Andre Kurniawan",
    members: 11,
    present: 9,
    late: 1,
    absent: 1,
    excused: 0,
    activeTasks: 12,
    completion: 79,
    responsiveness: 93,
    status: "Stable",
    focus: "Score desk, match reports, referee handoff",
  },
]

export const staffMembers: StaffMember[] = [
  {
    id: "rangga",
    name: "Rangga Dwi Pratama",
    division: "Acara",
    position: "Koordinator",
    role: "Division Coordinator",
    attendance: "Present",
    currentTask: "Opening ceremony final check",
    taskStatus: "In Progress",
    contact: "0812-3456-7890",
    checkIn: "06:41",
  },
  {
    id: "ahmad-fauzi",
    name: "Ahmad Fauzi",
    division: "Acara",
    position: "Anggota",
    role: "Staff",
    attendance: "Present",
    currentTask: "Briefing MC and stage crew",
    taskStatus: "Scheduled",
    contact: "0813-2010-7781",
    checkIn: "06:48",
  },
  {
    id: "putri-ananda",
    name: "Putri Ananda",
    division: "Acara",
    position: "Anggota",
    role: "Staff",
    attendance: "Present",
    currentTask: "Rundown board update",
    taskStatus: "Completed",
    contact: "0812-9901-4421",
    checkIn: "06:52",
  },
  {
    id: "nabila",
    name: "Nabila Azzahra",
    division: "Humas",
    position: "Koordinator",
    role: "Division Coordinator",
    attendance: "Present",
    currentTask: "Publish venue announcement",
    taskStatus: "In Progress",
    contact: "0813-2345-6789",
    checkIn: "06:58",
  },
  {
    id: "ilham",
    name: "Ilham Nur Rifai",
    division: "Humas",
    position: "Anggota",
    role: "Staff",
    attendance: "Late",
    currentTask: "Guest liaison desk",
    taskStatus: "In Progress",
    contact: "0812-7800-1515",
    checkIn: "07:18",
  },
  {
    id: "fikri",
    name: "Fikri Hamdani",
    division: "Dokumentasi",
    position: "Koordinator",
    role: "Division Coordinator",
    attendance: "Present",
    currentTask: "Photo drop opening ceremony",
    taskStatus: "Completed",
    contact: "0812-8765-4321",
    checkIn: "06:39",
  },
  {
    id: "devina",
    name: "Devina Sahrani",
    division: "Dokumentasi",
    position: "Videographer",
    role: "Staff",
    attendance: "Present",
    currentTask: "Court B highlight reel",
    taskStatus: "In Progress",
    contact: "0813-8011-9022",
    checkIn: "06:44",
  },
  {
    id: "bagas",
    name: "Bagas Pratama",
    division: "Dokumentasi",
    position: "Photographer",
    role: "Staff",
    attendance: "Absent",
    currentTask: "Media backup upload",
    taskStatus: "Blocked",
    contact: "0812-4411-0933",
    checkIn: "-",
  },
  {
    id: "bima",
    name: "Bima Setiawan",
    division: "Keamanan",
    position: "Koordinator",
    role: "Division Coordinator",
    attendance: "Present",
    currentTask: "Gate B crowd control",
    taskStatus: "In Progress",
    contact: "0813-7654-3210",
    checkIn: "06:36",
  },
  {
    id: "rizky",
    name: "Rizky Maulana",
    division: "Keamanan",
    position: "Anggota",
    role: "Staff",
    attendance: "Late",
    currentTask: "Lapangan utama perimeter",
    taskStatus: "In Progress",
    contact: "0812-3390-7788",
    checkIn: "07:21",
  },
  {
    id: "dewi",
    name: "Dewi Lestari",
    division: "Perlengkapan",
    position: "Koordinator",
    role: "Division Coordinator",
    attendance: "Late",
    currentTask: "Sound check lapangan utama",
    taskStatus: "In Progress",
    contact: "0812-1111-2222",
    checkIn: "07:12",
  },
  {
    id: "farhan",
    name: "Fajar Ramadhan",
    division: "Perlengkapan",
    position: "Anggota",
    role: "Staff",
    attendance: "Late",
    currentTask: "Move badminton net",
    taskStatus: "Scheduled",
    contact: "0812-3000-4411",
    checkIn: "07:28",
  },
  {
    id: "siti",
    name: "Siti Nurhaliza",
    division: "Kebersihan",
    position: "Koordinator",
    role: "Division Coordinator",
    attendance: "Present",
    currentTask: "Clean zone checkpoint",
    taskStatus: "Completed",
    contact: "0813-8900-1200",
    checkIn: "06:50",
  },
  {
    id: "yoga",
    name: "Yoga Pratama",
    division: "Kewirausahaan",
    position: "Koordinator",
    role: "Division Coordinator",
    attendance: "Present",
    currentTask: "Booth inventory recap",
    taskStatus: "Scheduled",
    contact: "0813-5656-7700",
    checkIn: "06:55",
  },
  {
    id: "andre",
    name: "Andre Kurniawan",
    division: "PJ Lomba",
    position: "Koordinator",
    role: "Division Coordinator",
    attendance: "Present",
    currentTask: "Score desk supervision",
    taskStatus: "In Progress",
    contact: "0812-8080-1010",
    checkIn: "06:31",
  },
  {
    id: "naura",
    name: "Naura Putri",
    division: "PJ Lomba",
    position: "Badminton Desk",
    role: "PJ Lomba",
    attendance: "Excused",
    currentTask: "Referee result validation",
    taskStatus: "Scheduled",
    contact: "0812-7001-2200",
    checkIn: "-",
  },
]

export const panitiaTasks: PanitiaTask[] = [
  {
    id: "opening-setup",
    title: "Setup panggung pembukaan",
    pic: "Rangga Dwi Pratama",
    division: "Acara",
    deadline: "08:00",
    progress: 68,
    priority: "High",
    status: "In Progress",
  },
  {
    id: "documentation-upload",
    title: "Upload dokumentasi opening ceremony",
    pic: "Fikri Hamdani",
    division: "Dokumentasi",
    deadline: "10:30",
    progress: 100,
    priority: "Medium",
    status: "Completed",
  },
  {
    id: "briefing-pj",
    title: "Briefing PJ lomba semifinal",
    pic: "Andre Kurniawan",
    division: "PJ Lomba",
    deadline: "11:00",
    progress: 46,
    priority: "High",
    status: "In Progress",
  },
  {
    id: "announcement",
    title: "Publikasi perubahan jadwal",
    pic: "Nabila Azzahra",
    division: "Humas",
    deadline: "11:15",
    progress: 55,
    priority: "High",
    status: "In Progress",
  },
  {
    id: "certificate-final",
    title: "Validasi sertifikat final",
    pic: "Putri Ananda",
    division: "Acara",
    deadline: "13:00",
    progress: 24,
    priority: "Medium",
    status: "Scheduled",
  },
  {
    id: "field-sweep",
    title: "Operasi semut area lapangan",
    pic: "Siti Nurhaliza",
    division: "Kebersihan",
    deadline: "14:20",
    progress: 0,
    priority: "Low",
    status: "Scheduled",
  },
]

export const activityItems: ActivityItem[] = [
  {
    id: "photo-upload",
    time: "08:00",
    title: "Dokumentasi uploaded Opening Ceremony photos",
    detail: "32 photo files masuk ke media center.",
    division: "Dokumentasi",
    tone: "success",
  },
  {
    id: "badminton-result",
    time: "08:15",
    title: "Badminton Division updated semifinal results",
    detail: "Score desk PJ Lomba mengirim hasil awal.",
    division: "PJ Lomba",
    tone: "info",
  },
  {
    id: "humas-announcement",
    time: "08:20",
    title: "Humas published announcement",
    detail: "Briefing peserta dipindah ke aula.",
    division: "Humas",
    tone: "success",
  },
  {
    id: "attendance-checkin",
    time: "08:30",
    title: "Attendance system recorded 49 check-ins",
    detail: "QR scan gerbang utama stabil.",
    division: "Attendance",
    tone: "info",
  },
  {
    id: "equipment-delay",
    time: "08:42",
    title: "Perlengkapan flagged sound check delay",
    detail: "Mic cadangan sedang dipindahkan ke lapangan.",
    division: "Perlengkapan",
    tone: "warning",
  },
]
