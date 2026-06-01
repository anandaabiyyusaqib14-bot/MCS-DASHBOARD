export type CompetitionKind =
  | "sport"
  | "esport"
  | "art"
  | "media"
  | "supporter"

export type Competition = {
  id: string
  name: string
  shortName: string
  kind: CompetitionKind
  category: string
  venue: string
  pj: string[]
}

export type ScheduleItem = {
  time: string
  duration: string
  title: string
  venue: string
  pic: string
  type: "ceremony" | "match" | "break" | "operation"
}

export type ScheduleDay = {
  id: string
  date: string
  label: string
  dayName: string
  focus: string
  items: ScheduleItem[]
}

export type LiveMatch = {
  id: string
  sport: string
  category: string
  round: string
  venue: string
  time: string
  teamA: string
  teamB: string
  scoreA: number
  scoreB: number
  status: "live" | "scheduled" | "final"
  clock: string
}

export type TaskItem = {
  id: string
  title: string
  division: string
  time: string
  priority: "high" | "medium" | "done" | "pending"
}

export type Announcement = {
  id: string
  title: string
  body: string
  time: string
}

export type MediaItem = {
  id: string
  title: string
  type: "Live" | "Highlight" | "Photo" | "Video"
  meta: string
  views: string
}

export type TimelineItem = {
  date: string
  label: string
  title: string
  description: string
}

export const event = {
  name: "Melati Championship Series 1",
  shortName: "MCS 1",
  theme: "The Genesis of Excellence",
  slogan: "Every Play is a Story, Every Student is a Star.",
  school: "SMK Negeri 20 Jakarta",
  location: "Jl. Melati No.24, Cilandak Barat, Jakarta Selatan",
  dateRange: "22-25 Juni 2026",
  startDate: "2026-06-22",
  endDate: "2026-06-25",
  proposalDate: "27 April 2026",
  audience: "Seluruh siswa SMKN 20 Jakarta",
  organizer: "OSIS & MPK SMKN 20 Jakarta",
  chair: "Fadhlan Dzilikram",
  viceChair: "Elmaliq Safatoriq Akbar",
}

export const brandColors = {
  primary: "#081C3A",
  secondary: "#A61D2D",
  accent: "#D8B15A",
  neutral: "#FFFFFF",
  lightGray: "#E6EAF0",
}

export const brandAssets = [
  {
    name: "Logo MCS 1",
    src: "/logos/mcs-logo.svg",
  },
  {
    name: "Logo SMKN 20 Jakarta",
    src: "/logos/smkn20.png",
  },
  {
    name: "Logo OSIS SMKN 20 Jakarta",
    src: "/logos/osis-smkn20.png",
  },
  {
    name: "Logo MPK SMKN 20 Jakarta",
    src: "/logos/mpk-smkn20.png",
  },
]

export const contact = {
  whatsappOfficial: {
    label: "Abiyyu (Humas)",
    number: "+62 856-5908-5578",
    href: "https://wa.me/6285659085578",
  },
  chairperson: {
    label: "Fadhlan Dzilikram (Ketua Pelaksana)",
    number: "+62 877-3215-3938",
    href: "https://wa.me/6287732153938",
  },
  instagram: "https://instagram.com/osismpk20",
  instagramLabel: "@osismpk20",
  tiktok: "https://www.tiktok.com/@osismpk20",
  tiktokLabel: "@osismpk20",
}

export const eventDescriptions = {
  hero:
    "Melati Championship Series 1 menghadirkan pengalaman kompetisi olahraga dan seni dengan atmosfer profesional, modern, dan penuh energi di SMKN 20 Jakarta.",
  formal:
    "Melati Championship Series 1 (MCS 1) merupakan ajang kompetisi olahraga dan seni yang diselenggarakan dalam rangka perayaan Anniversary SMKN 20 Jakarta Tahun 2025/2026. MCS 1 hadir sebagai bentuk transformasi kegiatan kompetisi sekolah menjadi sebuah event yang lebih modern, profesional, dan terorganisir dengan menghadirkan atmosfer pertandingan layaknya liga profesional.",
  modern:
    "Melati Championship Series 1 (MCS 1) adalah platform kompetisi olahraga dan seni terbesar di SMKN 20 Jakarta yang dikemas dengan konsep modern championship experience. Menggabungkan semangat kompetisi, kreativitas, media, dan entertainment, MCS 1 menghadirkan pengalaman event sekolah dengan atmosfer profesional dan energi generasi muda.",
}

export const gallery = [
  { src: "/images/mcs-gallery/basket-01.jpg", alt: "Pertandingan basket MCS 1" },
  { src: "/images/mcs-gallery/futsal-01.jpg", alt: "Pertandingan futsal MCS 1" },
  { src: "/images/mcs-gallery/tari-01.jpg", alt: "Penampilan seni tari MCS 1" },
  { src: "/images/mcs-gallery/volley-01.jpg", alt: "Pertandingan voli MCS 1" },
  { src: "/images/mcs-gallery/mlbb-01.jpg", alt: "Kompetisi e-sport MCS 1" },
  { src: "/images/mcs-gallery/supporter-01.jpg", alt: "Supporter MCS 1" },
]

export const dashboardFootage = [
  { id: "basket-live", label: "Basket Live Match", type: "Live", meta: "MCS court footage", src: "/images/mcs-gallery/basket-04.jpg", crop: "object-[42%_50%]" },
  { id: "futsal-live", label: "Futsal Court", type: "Photo", meta: "Lapangan utama", src: "/images/mcs-gallery/futsal-02.jpg", crop: "object-[45%_50%]" },
  { id: "volley-court", label: "Volley Match", type: "Photo", meta: "School court atmosphere", src: "/images/mcs-gallery/volley-01.jpg", crop: "object-[50%_50%]" },
  { id: "mlbb-room", label: "E-Sport Room", type: "Video", meta: "Mobile Legends competition", src: "/images/mcs-gallery/mlbb-01.jpg", crop: "object-[48%_46%]" },
  { id: "art-stage", label: "Art Performance", type: "Photo", meta: "Cultural stage", src: "/images/mcs-gallery/tari-01.jpg", crop: "object-[50%_45%]" },
  { id: "supporter", label: "Supporter Crowd", type: "Photo", meta: "Student energy", src: "/images/mcs-gallery/supporter-01.jpg", crop: "object-[50%_50%]" },
]

export const majors = [
  {
    name: "Bisnis Digital",
    description:
      "Mempelajari strategi pemasaran modern berbasis teknologi dan internet, mulai dari digital marketing, branding, social media management, e-commerce, hingga pembuatan konten digital.",
    fit: "Cocok untuk siswa yang tertarik pada bisnis kreatif, media sosial, content creation, dan entrepreneurship digital.",
    materials: [
      "Digital Marketing",
      "Social Media Strategy",
      "Content Creation",
      "E-Commerce",
      "Branding",
      "Marketplace Management",
      "Advertising",
      "Kewirausahaan Digital",
    ],
    careers: [
      "Digital Marketer",
      "Social Media Specialist",
      "Content Creator",
      "Online Shop Manager",
      "Entrepreneur",
      "Creative Marketing Staff",
    ],
  },
  {
    name: "Rekayasa Perangkat Lunak (RPL)",
    description:
      "Berfokus pada pengembangan teknologi dan pemrograman komputer. Siswa mempelajari pembuatan aplikasi, website, sistem digital, dan dasar software engineering modern.",
    fit: "Cocok untuk siswa yang tertarik pada coding, teknologi, pengembangan aplikasi, dan dunia IT.",
    materials: [
      "Pemrograman Dasar",
      "Web Development",
      "Mobile App Development",
      "Database",
      "UI/UX Design",
      "Software Engineering",
      "Networking Basic",
      "System Development",
    ],
    careers: ["Software Developer", "Web Developer", "UI/UX Designer", "Mobile Developer", "IT Support", "Startup Developer"],
  },
  {
    name: "Manajemen Perkantoran",
    description:
      "Mempelajari administrasi modern dan pengelolaan kegiatan perkantoran secara profesional, termasuk komunikasi, pengarsipan, pelayanan, dokumen, dan administrasi perusahaan.",
    fit: "Cocok untuk siswa yang teliti, komunikatif, dan memiliki kemampuan organisasi yang baik.",
    materials: [
      "Administrasi Perkantoran",
      "Kearsipan",
      "Public Relations",
      "Komunikasi Bisnis",
      "Pengelolaan Dokumen",
      "Microsoft Office",
      "Pelayanan Pelanggan",
      "Manajemen Agenda",
    ],
    careers: [
      "Staff Administrasi",
      "Sekretaris",
      "Front Office",
      "Customer Service",
      "Administrative Assistant",
      "Office Management Staff",
    ],
  },
  {
    name: "Akuntansi",
    description:
      "Mempelajari pengelolaan dan pencatatan keuangan perusahaan maupun lembaga, termasuk analisis keuangan, pembukuan, laporan keuangan, dan software akuntansi.",
    fit: "Cocok untuk siswa yang teliti, logis, dan tertarik pada dunia keuangan serta bisnis.",
    materials: [
      "Akuntansi Dasar",
      "Pembukuan",
      "Laporan Keuangan",
      "Perpajakan",
      "Spreadsheet Keuangan",
      "Software Akuntansi",
      "Analisis Keuangan",
      "Administrasi Pajak",
    ],
    careers: ["Staff Accounting", "Finance Staff", "Tax Administration", "Bookkeeper", "Auditor Assistant", "Cashier Supervisor"],
  },
  {
    name: "Bisnis Retail",
    description:
      "Mempelajari strategi penjualan dan pengelolaan bisnis retail modern, baik offline maupun online, termasuk pelayanan pelanggan, visual merchandising, pemasaran produk, dan manajemen toko.",
    fit: "Cocok untuk siswa yang aktif, komunikatif, dan tertarik pada dunia bisnis dan penjualan.",
    materials: [
      "Retail Management",
      "Customer Service",
      "Product Display",
      "Sales Strategy",
      "Merchandising",
      "Cashier System",
      "Inventory Management",
      "Business Communication",
    ],
    careers: ["Retail Staff", "Store Supervisor", "Sales Promotion", "Merchandiser", "Entrepreneur", "Store Manager"],
  },
  {
    name: "Layanan Perbankan Syariah",
    description:
      "Mempelajari sistem keuangan dan layanan perbankan berbasis prinsip syariah, termasuk administrasi keuangan, pelayanan nasabah, transaksi, dan operasional bank syariah.",
    fit: "Cocok untuk siswa yang tertarik pada dunia keuangan, pelayanan, dan industri perbankan modern berbasis syariah.",
    materials: [
      "Dasar Perbankan",
      "Operasional Bank Syariah",
      "Akuntansi Perbankan",
      "Pelayanan Nasabah",
      "Administrasi Keuangan",
      "Transaksi Perbankan",
      "Etika Pelayanan",
      "Produk Keuangan Syariah",
    ],
    careers: [
      "Teller",
      "Customer Service Bank",
      "Staff Administrasi Bank",
      "Staff Keuangan",
      "Back Office Perbankan",
      "Layanan Keuangan Syariah",
    ],
  },
]

export const objectives = [
  "Meningkatkan standar kompetisi sekolah menjadi ajang olahraga prestisius dengan atmosfer liga profesional.",
  "Memberikan pengalaman pertandingan elit melalui seremoni resmi, announcer, dan manajemen pertandingan terstruktur.",
  "Menyediakan ruang sinergi strategis bagi mitra eksternal untuk berinteraksi dengan audiens muda.",
  "Menumbuhkan profesionalisme, tanggung jawab, dan sportivitas dalam ekosistem kompetisi yang sehat.",
]

export const competitions: Competition[] = [
  {
    id: "futsal",
    name: "Perlombaan Futsal",
    shortName: "Futsal",
    kind: "sport",
    category: "Putra",
    venue: "Lapangan A",
    pj: ["Sayyidina Rhafa", "Fawas"],
  },
  {
    id: "basket",
    name: "Perlombaan Basket",
    shortName: "Basket",
    kind: "sport",
    category: "Putra",
    venue: "Lapangan A",
    pj: ["Muhammad Hablil Jidda", "Gladies"],
  },
  {
    id: "volly",
    name: "Perlombaan Volly",
    shortName: "Voli",
    kind: "sport",
    category: "Putra/Putri",
    venue: "Lapangan B",
    pj: ["Gilang Ilham Ibrahim", "Zahira"],
  },
  {
    id: "mobile-legends",
    name: "Perlombaan Mobile Legends",
    shortName: "Mobile Legends",
    kind: "esport",
    category: "Open",
    venue: "Connecting Room",
    pj: ["Muhamad Adly Alfattah", "Zalfa"],
  },
  {
    id: "badminton",
    name: "Perlombaan Badminton",
    shortName: "Badminton",
    kind: "sport",
    category: "Ganda Putra",
    venue: "Lapangan B",
    pj: ["Ananda Abiyyu Saqib", "Naura"],
  },
  {
    id: "solo-vokal",
    name: "Perlombaan Solo Vokal",
    shortName: "Solo Vokal",
    kind: "art",
    category: "Open",
    venue: "R. Avis",
    pj: ["Farrizqi Ichsan Maulana", "Maria Lucia"],
  },
  {
    id: "canvas-drawing",
    name: "Perlombaan Canvas Drawing",
    shortName: "Canvas Drawing",
    kind: "art",
    category: "Open",
    venue: "R.201",
    pj: ["Grace Angela", "Asyila Ilmi Ramadhani"],
  },
  {
    id: "best-news-card",
    name: "Perlombaan Best News Card",
    shortName: "Best News Card",
    kind: "media",
    category: "Media",
    venue: "Media Center",
    pj: ["Frazier Beltsazar", "Novita"],
  },
  {
    id: "best-news-video",
    name: "Perlombaan Best News Video",
    shortName: "Best News Video",
    kind: "media",
    category: "Media",
    venue: "Media Center",
    pj: ["Stefani Octa", "Alif"],
  },
  {
    id: "best-supporter",
    name: "Perlombaan Best Supporter",
    shortName: "Best Supporter",
    kind: "supporter",
    category: "Supporter",
    venue: "Lapangan Utama",
    pj: ["Tiara Oktavia", "Elmo Alvian"],
  },
]

export const landingStats = [
  { value: "2025/2026", label: "Anniversary" },
  { value: "10", label: "Competition Categories" },
  { value: "55+", label: "Committee Members" },
]

export const timeline: TimelineItem[] = [
  {
    date: "22 June 2026",
    label: "Day 01",
    title: "Opening Ceremony",
    description: "Opening ceremony and first competition blocks begin the MCS 1 championship atmosphere.",
  },
  {
    date: "23 June 2026",
    label: "Day 02",
    title: "Quarter Final",
    description: "Main tournament routes continue with quarter final fixtures and arts competition sessions.",
  },
  {
    date: "24 June 2026",
    label: "Day 03",
    title: "Semi Final",
    description: "Semi final day, featured matchups, media coverage, and the Mobile Legends final window.",
  },
  {
    date: "25 June 2026",
    label: "Day 04",
    title: "Grand Final & Closing Ceremony",
    description: "Final matches, champions announcement, awards, and closing ceremony for MCS 1.",
  },
]

export const scheduleDays: ScheduleDay[] = [
  {
    id: "day-1",
    date: "2026-06-22",
    label: "22 Juni",
    dayName: "Senin",
    focus: "Opening Ceremony, Futsal, Mobile Legends, Volly, Solo Vokal, Basket",
    items: [
      {
        time: "06.30",
        duration: "10 menit",
        title: "Persiapan OSPK",
        venue: "Lapangan",
        pic: "OSPK",
        type: "operation",
      },
      {
        time: "06.45",
        duration: "55 menit",
        title: "Opening Ceremony",
        venue: "Lapangan",
        pic: "MC",
        type: "ceremony",
      },
      {
        time: "08.00",
        duration: "120 menit",
        title: "Futsal Round of 16",
        venue: "Lapangan A",
        pic: "Sayyid & Fawas",
        type: "match",
      },
      {
        time: "08.00",
        duration: "70 menit",
        title: "Mobile Legends Penyisihan",
        venue: "Connecting Room",
        pic: "Adly & Zalfa",
        type: "match",
      },
      {
        time: "09.35",
        duration: "100 menit",
        title: "Solo Vokal",
        venue: "R. Avis",
        pic: "Farrizqi & Lucia",
        type: "match",
      },
      {
        time: "10.00",
        duration: "100 menit",
        title: "Volly Round of 16",
        venue: "Lapangan B",
        pic: "Gilang & Zahira",
        type: "match",
      },
      {
        time: "11.40",
        duration: "80 menit",
        title: "ISHOMA",
        venue: "Area sekolah",
        pic: "Panitia",
        type: "break",
      },
      {
        time: "13.00",
        duration: "100 menit",
        title: "Basket Round of 16 & Quarter Final",
        venue: "Lapangan A",
        pic: "Jidda & Gladies",
        type: "match",
      },
      {
        time: "14.40",
        duration: "5 menit",
        title: "Operasi Semut",
        venue: "Area sekolah",
        pic: "Sie. Kebersihan",
        type: "operation",
      },
    ],
  },
  {
    id: "day-2",
    date: "2026-06-23",
    label: "23 Juni",
    dayName: "Selasa",
    focus: "Badminton, Canvas Drawing, Volly Quarter Final, Mobile Legends, Futsal",
    items: [
      {
        time: "06.30",
        duration: "20 menit",
        title: "Pembiasaan Pagi",
        venue: "Kelas",
        pic: "Pengurus Kelas",
        type: "operation",
      },
      {
        time: "07.20",
        duration: "160 menit",
        title: "Badminton Round of 16",
        venue: "Lapangan B",
        pic: "Abiyyu & Naura",
        type: "match",
      },
      {
        time: "07.28",
        duration: "90 menit",
        title: "Canvas Drawing",
        venue: "R.201",
        pic: "Grace & Asyila",
        type: "match",
      },
      {
        time: "10.40",
        duration: "60 menit",
        title: "Volly Quarter Final",
        venue: "Lapangan B",
        pic: "Gilang & Zahira",
        type: "match",
      },
      {
        time: "13.10",
        duration: "80 menit",
        title: "Mobile Legends Penyisihan",
        venue: "Connecting Room",
        pic: "Adly & Zalfa",
        type: "match",
      },
      {
        time: "13.10",
        duration: "90 menit",
        title: "Futsal Quarter Final",
        venue: "Lapangan A",
        pic: "Sayyid & Fawas",
        type: "match",
      },
    ],
  },
  {
    id: "day-3",
    date: "2026-06-24",
    label: "24 Juni",
    dayName: "Rabu",
    focus: "Fun Match, semifinal day, Mobile Legends final",
    items: [
      {
        time: "07.20",
        duration: "75 menit",
        title: "Fun Match OSPK vs Guru",
        venue: "Lapangan B",
        pic: "Sie. Acara",
        type: "match",
      },
      {
        time: "08.35",
        duration: "60 menit",
        title: "Volly Semifinal",
        venue: "Lapangan A",
        pic: "Gilang & Zahira",
        type: "match",
      },
      {
        time: "09.00",
        duration: "120 menit",
        title: "Mobile Legends Semifinal",
        venue: "Connecting Room",
        pic: "Adly & Zalfa",
        type: "match",
      },
      {
        time: "09.35",
        duration: "90 menit",
        title: "Badminton Quarter & Semifinal",
        venue: "Lapangan B",
        pic: "Abiyyu & Naura",
        type: "match",
      },
      {
        time: "13.00",
        duration: "75 menit",
        title: "Mobile Legends Final",
        venue: "Connecting Room",
        pic: "Adly & Zalfa",
        type: "match",
      },
      {
        time: "13.00",
        duration: "75 menit",
        title: "Futsal Semifinal",
        venue: "Lapangan B",
        pic: "Sayyid & Fawas",
        type: "match",
      },
      {
        time: "13.00",
        duration: "30 menit",
        title: "Basket Semifinal",
        venue: "Lapangan A",
        pic: "Jidda & Gladies",
        type: "match",
      },
    ],
  },
  {
    id: "day-4",
    date: "2026-06-25",
    label: "25 Juni",
    dayName: "Kamis",
    focus: "Finals, champions announcement, closing ceremony",
    items: [
      {
        time: "07.15",
        duration: "45 menit",
        title: "Badminton Final",
        venue: "Lapangan B",
        pic: "Abiyyu & Naura",
        type: "match",
      },
      {
        time: "08.00",
        duration: "45 menit",
        title: "Volly Final",
        venue: "Lapangan B",
        pic: "Gilang & Zahira",
        type: "match",
      },
      {
        time: "08.45",
        duration: "45 menit",
        title: "Futsal Final",
        venue: "Lapangan A",
        pic: "Sayyid & Fawas",
        type: "match",
      },
      {
        time: "09.30",
        duration: "45 menit",
        title: "Basket Final",
        venue: "Lapangan A",
        pic: "Jidda & Gladies",
        type: "match",
      },
      {
        time: "10.15",
        duration: "60 menit",
        title: "Pengumuman Juara",
        venue: "Lapangan B",
        pic: "PJ Lomba",
        type: "ceremony",
      },
      {
        time: "12.40",
        duration: "100 menit",
        title: "Closing Ceremony",
        venue: "Lapangan",
        pic: "Panitia Inti",
        type: "ceremony",
      },
      {
        time: "14.20",
        duration: "40 menit",
        title: "Operasi Semut & Piket Kelas",
        venue: "Area sekolah",
        pic: "Sie. Kebersihan",
        type: "operation",
      },
    ],
  },
]

export const initialLiveMatches: LiveMatch[] = [
  {
    id: "basket-xi-tkj-rpl",
    sport: "Basket",
    category: "Putra",
    round: "Round of 16",
    venue: "Lapangan A",
    time: "13.00",
    teamA: "XI TKJ 1",
    teamB: "XI RPL 2",
    scoreA: 45,
    scoreB: 38,
    status: "live",
    clock: "Q3",
  },
  {
    id: "futsal-x-tkr-tbsm",
    sport: "Futsal",
    category: "Putra",
    round: "Round of 16",
    venue: "Lapangan A",
    time: "08.00",
    teamA: "X TKR 1",
    teamB: "X TBSM 2",
    scoreA: 2,
    scoreB: 1,
    status: "live",
    clock: "HT",
  },
  {
    id: "volly-xi-mplb-akl",
    sport: "Volly",
    category: "Putri",
    round: "Round of 16",
    venue: "Lapangan B",
    time: "10.00",
    teamA: "XI MPLB 1",
    teamB: "XI AKL 1",
    scoreA: 24,
    scoreB: 18,
    status: "live",
    clock: "Set 2",
  },
  {
    id: "mlbb-xii-mm-dkv",
    sport: "Mobile Legends",
    category: "Open",
    round: "Penyisihan",
    venue: "Connecting Room",
    time: "08.00",
    teamA: "XII MM 1",
    teamB: "XII DKV 1",
    scoreA: 8,
    scoreB: 5,
    status: "live",
    clock: "Game 1",
  },
  {
    id: "badminton-final-demo",
    sport: "Badminton",
    category: "Ganda Putra",
    round: "Final",
    venue: "Lapangan B",
    time: "07.15",
    teamA: "R. Ardhian",
    teamB: "M. Farrel",
    scoreA: 21,
    scoreB: 16,
    status: "scheduled",
    clock: "R16",
  },
]

export const tasks: TaskItem[] = [
  {
    id: "venue-check",
    title: "Venue check - Lapangan Basket A",
    division: "Div. Sarpras",
    time: "09.12",
    priority: "high",
  },
  {
    id: "medical-futsal",
    title: "Medical standby - Futsal",
    division: "Div. Kesehatan",
    time: "09.05",
    priority: "medium",
  },
  {
    id: "score-volly",
    title: "Score input - Volly Putri",
    division: "Div. Pertandingan",
    time: "09.03",
    priority: "done",
  },
  {
    id: "broadcast-siang",
    title: "Announcement - Jadwal Siang",
    division: "Div. Humas",
    time: "08.58",
    priority: "pending",
  },
  {
    id: "wasit-badminton",
    title: "Perlengkapan wasit Badminton",
    division: "Div. Perlengkapan",
    time: "08.50",
    priority: "medium",
  },
]

export const announcements: Announcement[] = [
  {
    id: "opening",
    title: "Opening Ceremony",
    body: "Peserta hadir di Lapangan Utama pukul 06.45 WIB dengan atribut kelas.",
    time: "06.30",
  },
  {
    id: "scoredesk",
    title: "Score desk aktif",
    body: "PJ lomba wajib mengirim hasil pertandingan maksimal 3 menit setelah selesai.",
    time: "08.15",
  },
  {
    id: "clean-zone",
    title: "Zona bebas sampah",
    body: "Operasi Semut dilakukan setelah sesi pertandingan siang.",
    time: "14.40",
  },
]

export const mediaItems: MediaItem[] = [
  {
    id: "live-basket",
    title: "LIVE - Basket A",
    type: "Live",
    meta: "XI TKJ 1 vs XI RPL 2",
    views: "256",
  },
  {
    id: "live-futsal",
    title: "LIVE - Futsal",
    type: "Live",
    meta: "X TKR 1 vs X TBSM 2",
    views: "142",
  },
  {
    id: "volly-day",
    title: "Highlight Volly",
    type: "Highlight",
    meta: "Best plays day 1",
    views: "1.2K",
  },
  {
    id: "opening-gallery",
    title: "Opening Gallery",
    type: "Photo",
    meta: "Ceremony set",
    views: "86",
  },
  {
    id: "mlbb-room",
    title: "E-Sports Arena",
    type: "Video",
    meta: "Mobile Legends room",
    views: "1.8K",
  },
]

export const committee = [
  { role: "Penanggung Jawab", names: ["Drs. Indah Sri W, M.P", "Arsudin, S.E", "Anggara Elsa Bakhtiar, S.Pd"] },
  { role: "Ketua Pelaksana", names: ["Fadhlan Dzilikram"] },
  { role: "Wakil Pelaksana", names: ["Elmaliq Safatoriq Akbar"] },
  { role: "Sekretaris", names: ["Ahmad Farhan", "Grace Angela"] },
  { role: "Bendahara", names: ["Feby Riski Susanti", "Keisha Farras Naurasyifa"] },
  { role: "Sie. Acara", names: ["Reza Fadillah", "Delfina Azaria", "Ahmad Ziyad", "Baroqah Gieslatif"] },
  { role: "Sie. Humas", names: ["Ilham Nur Rifai", "Keisha Farras Naurasyifa", "Ananda Abiyyu Saqib"] },
  { role: "Sie. Dokumentasi", names: ["Devina Sahrani", "Ahmad Aliffansyah", "Bagas Pratama", "Lakeisha Ariana"] },
]
