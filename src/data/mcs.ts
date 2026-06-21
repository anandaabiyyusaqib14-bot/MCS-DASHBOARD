export type CompetitionKind =
  | "sport"
  | "esport"
  | "art"
  | "media"

export type Competition = {
  id: string
  name: string
  shortName: string
  kind: CompetitionKind
  category: string
  venue: string
  pj: string[]
}

export type JuknisSection = {
  title: string
  items: string[]
}

export type JuknisDocument = {
  id: string
  competitionId: string
  title: string
  shortName: string
  status: "Published"
  registrationStart: string
  registrationEnd: string
  registrationPeriod: string
  contacts: string[]
  teamFormat: string
  format: string
  summary: string
  sections: JuknisSection[]
  criteria?: string[]
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

export type SponsorPipelineStatus =
  | "Approached"
  | "Negotiation"
  | "Waiting Response"
  | "Confirmed"
  | "Rejected"

export type SponsorRecord = {
  id: string
  name: string
  pipelineStatus: SponsorPipelineStatus
  proposalStatus: "On Going" | "Confirmed" | "Rejected"
  partnershipType: string
  pic: string
  contact: string
  followUpDate: string
  receivedAmount?: number
  receivedDate?: string
}

export type BudgetLineItem = {
  id: string
  item: string
  division: string
  minAmount: number
  maxAmount: number
  status: "Planned"
  source: string
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

export const eventLogo = {
  name: "Logo Melati Championship Series 1",
  src: "/logos/mcs-logo.png",
}

export const brandAssets = [
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

export const sponsorshipPipelineStatuses: SponsorPipelineStatus[] = [
  "Approached",
  "Negotiation",
  "Waiting Response",
  "Confirmed",
  "Rejected",
]

export const sponsorProspects: SponsorRecord[] = [
  {
    id: "synde-ht",
    name: "Synde.HT",
    pipelineStatus: "Waiting Response",
    proposalStatus: "On Going",
    partnershipType: "Sponsor",
    pic: "Humas",
    contact: "Coming Soon",
    followUpDate: "Coming Soon",
  },
  {
    id: "emina",
    name: "Emina",
    pipelineStatus: "Waiting Response",
    proposalStatus: "On Going",
    partnershipType: "Sponsor",
    pic: "Humas",
    contact: "Coming Soon",
    followUpDate: "Coming Soon",
  },
  {
    id: "yup",
    name: "YUP",
    pipelineStatus: "Waiting Response",
    proposalStatus: "On Going",
    partnershipType: "Sponsor",
    pic: "Humas",
    contact: "Coming Soon",
    followUpDate: "Coming Soon",
  },
  {
    id: "sosro",
    name: "Sosro",
    pipelineStatus: "Waiting Response",
    proposalStatus: "On Going",
    partnershipType: "Sponsor",
    pic: "Humas",
    contact: "Coming Soon",
    followUpDate: "Coming Soon",
  },
  {
    id: "pt-campina-aice-industry",
    name: "PT Campina Aice Industry",
    pipelineStatus: "Waiting Response",
    proposalStatus: "On Going",
    partnershipType: "Sponsor",
    pic: "Humas",
    contact: "Coming Soon",
    followUpDate: "Coming Soon",
  },
  {
    id: "pt-cipta-niaga-semesta",
    name: "PT Cipta Niaga Semesta",
    pipelineStatus: "Waiting Response",
    proposalStatus: "On Going",
    partnershipType: "Sponsor",
    pic: "Humas",
    contact: "Coming Soon",
    followUpDate: "Coming Soon",
  },
  {
    id: "pt-sinar-niaga-sejahtera",
    name: "PT Sinar Niaga Sejahtera",
    pipelineStatus: "Waiting Response",
    proposalStatus: "On Going",
    partnershipType: "Sponsor",
    pic: "Humas",
    contact: "Coming Soon",
    followUpDate: "Coming Soon",
  },
  {
    id: "pt-sinar-sosro-gunung-selamat",
    name: "PT Sinar Sosro Gunung Selamat",
    pipelineStatus: "Waiting Response",
    proposalStatus: "On Going",
    partnershipType: "Sponsor",
    pic: "Humas",
    contact: "Coming Soon",
    followUpDate: "Coming Soon",
  },
]

export const budgetLineItems: BudgetLineItem[] = [
  {
    id: "competition-winner-prizes",
    item: "Juara 1, 2, dan 3 setiap bidang kompetisi",
    division: "Acara",
    minAmount: 2000000,
    maxAmount: 2300000,
    status: "Planned",
    source: "RAB MCS 1",
  },
  {
    id: "best-supporter-award",
    item: "Penghargaan Best Supporter",
    division: "Acara",
    minAmount: 100000,
    maxAmount: 100000,
    status: "Planned",
    source: "RAB MCS 1",
  },
  {
    id: "press-conference-backdrop-banner",
    item: "Banner background konferensi pers",
    division: "Humas",
    minAmount: 240000,
    maxAmount: 420000,
    status: "Planned",
    source: "RAB MCS 1",
  },
  {
    id: "mcs-banner",
    item: "Banner MCS 1",
    division: "Humas",
    minAmount: 200000,
    maxAmount: 250000,
    status: "Planned",
    source: "RAB MCS 1",
  },
  {
    id: "closing-ceremony-balloons-confetti",
    item: "500 balon dan konfeti closing ceremony",
    division: "Acara",
    minAmount: 263000,
    maxAmount: 263000,
    status: "Planned",
    source: "RAB MCS 1",
  },
  {
    id: "canvas-drawing-supplies",
    item: "Canvas untuk Canvas Drawing",
    division: "Perlengkapan",
    minAmount: 320000,
    maxAmount: 320000,
    status: "Planned",
    source: "RAB MCS 1",
  },
]

export const budgetSummary = {
  source: "RAB MCS 1",
  totalMinAmount: 3123000,
  totalMaxAmount: 3653000,
}

export const gallery = [
  { src: "/images/mcs-gallery/optimized/basket-01-800.webp", alt: "Pertandingan basket MCS 1" },
  { src: "/images/mcs-gallery/optimized/futsal-01-800.webp", alt: "Pertandingan futsal MCS 1" },
  { src: "/images/mcs-gallery/optimized/tari-800.webp", alt: "Penampilan seni tari MCS 1" },
  { src: "/images/mcs-gallery/optimized/volley-01-800.webp", alt: "Pertandingan voli MCS 1" },
  { src: "/images/mcs-gallery/optimized/mlbb-01-800.webp", alt: "Kompetisi e-sport MCS 1" },
  { src: "/images/mcs-gallery/optimized/suporteer-1-800.webp", alt: "Supporter MCS 1" },
]

export const dashboardFootage = [
  { id: "basket-live", label: "Basket Live Match", type: "Live", meta: "MCS court footage", src: "/images/mcs-gallery/optimized/basket-04-1200.webp", crop: "object-[42%_50%]" },
  { id: "mcs-team-photo", label: "MCS Team Photo", type: "Photo", meta: "Peserta MCS 1", src: "/images/mcs/optimized/foto-ospk-1200.webp", crop: "object-[50%_58%]" },
  { id: "volley-court", label: "Volley Match", type: "Photo", meta: "School court atmosphere", src: "/images/mcs-gallery/optimized/volley-01-1200.webp", crop: "object-[50%_50%]" },
  { id: "mlbb-room", label: "E-Sport Room", type: "Video", meta: "Mobile Legends competition", src: "/images/mcs-gallery/optimized/mlbb-01-1200.webp", crop: "object-[48%_46%]" },
  { id: "art-stage", label: "Art Performance", type: "Photo", meta: "Cultural stage", src: "/images/mcs-gallery/optimized/tari-1200.webp", crop: "object-[50%_45%]" },
  { id: "supporter", label: "Supporter Crowd", type: "Photo", meta: "Student energy", src: "/images/mcs-gallery/optimized/suporteer-1-1200.webp", crop: "object-[50%_50%]" },
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

export type McsNation = {
  className: string
  countryName: string
  countryFlag: string
}

export const mcsNations: McsNation[] = [
  { className: "X MP 1", countryName: "Portugal", countryFlag: "🇵🇹" },
  { className: "X MP 2", countryName: "Argentina", countryFlag: "🇦🇷" },
  { className: "X AK 1", countryName: "France", countryFlag: "🇫🇷" },
  { className: "X AK 2", countryName: "Mexico", countryFlag: "🇲🇽" },
  { className: "X BR", countryName: "Spain", countryFlag: "🇪🇸" },
  { className: "X BD", countryName: "Croatia", countryFlag: "🇭🇷" },
  { className: "X LPS", countryName: "Brazil", countryFlag: "🇧🇷" },
  { className: "X RPL", countryName: "Japan", countryFlag: "🇯🇵" },
  { className: "XI MP 1", countryName: "Switzerland", countryFlag: "🇨🇭" },
  { className: "XI MP 2", countryName: "Morocco", countryFlag: "🇲🇦" },
  { className: "XI AK 1", countryName: "Germany", countryFlag: "🇩🇪" },
  { className: "XI AK 2", countryName: "Netherlands", countryFlag: "🇳🇱" },
  { className: "XI LPS", countryName: "Belgium", countryFlag: "🇧🇪" },
  { className: "XI RPL", countryName: "Uruguay", countryFlag: "🇺🇾" },
  { className: "XI BD", countryName: "England", countryFlag: "🇬🇧" },
  { className: "XI BR", countryName: "Senegal", countryFlag: "🇸🇳" },
]

export const mcsNationBracketSeeds = [
  "Portugal",
  "England",
  "Switzerland",
  "Argentina",
  "France",
  "Senegal",
  "Morocco",
  "Mexico",
  "Spain",
  "Uruguay",
  "Germany",
  "Croatia",
  "Brazil",
  "Belgium",
  "Netherlands",
  "Japan",
]

export function getNationByClassName(className: string) {
  const normalizedClassName = normalizeClassName(className)

  return mcsNations.find((nation) => normalizeClassName(nation.className) === normalizedClassName)
}

export function getNationByCountryName(countryName: string) {
  const normalizedCountryName = countryName.trim().toLowerCase()

  return mcsNations.find((nation) => nation.countryName.toLowerCase() === normalizedCountryName)
}

export function getNationDisplayName(className: string, fallback = className) {
  return getNationByClassName(className)?.countryName ?? fallback
}

export function getNationDisplayFlag(className: string) {
  return getNationByClassName(className)?.countryFlag ?? ""
}

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
    name: "Perlombaan Basket 3x3",
    shortName: "Basket 3x3",
    kind: "sport",
    category: "3x3 Campuran",
    venue: "Lapangan A",
    pj: ["Muhammad Hablil Jidda", "Gladies"],
  },
  {
    id: "volly",
    name: "Perlombaan Voli",
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
    category: "Ganda Campuran",
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
]

export const juknisPdf = {
  title: "JUKNIS Lomba MCS 1",
  href: "/docs/juknis-mcs-1.pdf",
  sourceLabel: "JUKNIS MELATI CHAMPIONSHIP SERIES.pdf",
}

export const competitionJuknis: JuknisDocument[] = [
  {
    id: "juknis-futsal",
    competitionId: "futsal",
    title: "JUKNIS Lomba Futsal",
    shortName: "Futsal",
    status: "Published",
    registrationStart: "31 Mei 2026",
    registrationEnd: "12 Juni 2026",
    registrationPeriod: "31 Mei 2026 - 12 Juni 2026",
    contacts: ["Sayyidina: 0859-6065-4175"],
    teamFormat: "5 pemain inti dan 2 cadangan",
    format: "Sistem gugur",
    summary:
      "Lomba futsal untuk perwakilan resmi kelas, memakai sistem gugur dengan durasi bertahap sampai final.",
    sections: [
      {
        title: "Pendaftaran",
        items: [
          "Peserta merupakan perwakilan resmi dari masing-masing kelas di SMKN 20 Jakarta.",
          "Setiap kelas diperbolehkan mengirim 1 tim futsal.",
          "Pendaftaran dimulai dari tanggal 31 Mei 2026 sampai tanggal 12 Juni 2026.",
          "Pendaftaran dilakukan melalui penanggung jawab lomba.",
        ],
      },
      {
        title: "Ketentuan Peserta",
        items: [
          "Setiap tim terdiri dari 5 orang pemain inti dan 2 cadangan.",
          "Setiap pemain hanya boleh bermain untuk 1 tim atau kelas.",
          "Pemain wajib menggunakan sepatu futsal dan pakaian olahraga yang rapi dan sopan.",
          "Pemain dilarang menggunakan aksesoris berbahaya seperti gelang dan jam tangan.",
          "Seluruh peserta wajib menjaga sportivitas dan nama baik sekolah.",
          "Jika ditemukan pemain tidak sah atau bukan berasal dari tim, tim langsung didiskualifikasi.",
          "Jurusan MP, AK, dan XI BD yang mengalami keterbatasan pemain hanya dapat mendapat bantuan pemain dari jurusan yang sama dengan pengawasan panitia.",
          "Pemain cadangan bantuan tidak boleh bermain sebagai tim inti. Pelanggaran aturan ini berakibat diskualifikasi.",
        ],
      },
      {
        title: "Peraturan Lomba",
        items: [
          "Pertandingan menggunakan peraturan futsal umum yang disesuaikan oleh panitia.",
          "Setiap pertandingan dimainkan oleh 5 pemain di lapangan termasuk kiper.",
          "Sistem pertandingan menggunakan sistem gugur.",
          "Babak 16 besar dimainkan 2 x 7 menit.",
          "Babak 8 besar dimainkan 2 x 10 menit.",
          "Babak semifinal dimainkan 2 x 10 menit.",
          "Babak final dimainkan 2 x 15 menit.",
          "Pergantian pemain dilakukan bebas dengan rolling substitution.",
          "Tim wajib hadir 10 menit sebelum pertandingan dimulai.",
          "Toleransi keterlambatan adalah 5 menit. Jika melewati toleransi, tim dinyatakan WO.",
          "Keputusan wasit dan panitia bersifat mutlak dan tidak dapat diganggu gugat.",
          "Dilarang melakukan provokasi, perkelahian, dan tindakan sejenis.",
          "Pemain yang mendapat 2 kartu kuning langsung diberikan kartu merah.",
        ],
      },
      {
        title: "Teknis Perlombaan",
        items: [
          "Technical meeting dilaksanakan tanggal 22 Mei.",
          "Pengundian jadwal pertandingan dilakukan oleh panitia saat technical meeting.",
          "Jika skor seri hingga waktu selesai, pertandingan dilanjutkan dengan adu pinalti.",
          "Sebelum pertandingan dimulai akan ada konferensi pers di dalam ruangan.",
          "Pemain yang bermain bagus dan berkontribusi penuh dapat memperoleh MOTM dan diwawancarai setelah pertandingan.",
          "Panitia berhak memberhentikan pertandingan jika kondisi tidak kondusif.",
          "Supporter wajib menjaga ketertiban dan keamanan selama perlombaan berlangsung.",
        ],
      },
    ],
  },
  {
    id: "juknis-basket",
    competitionId: "basket",
    title: "JUKNIS Lomba Basket 3x3",
    shortName: "Basket 3x3",
    status: "Published",
    registrationStart: "31 Mei 2026",
    registrationEnd: "12 Juni 2026",
    registrationPeriod: "31 Mei 2026 - 12 Juni 2026",
    contacts: ["Jidda: 0895-3265-11862", "Gladies: 0815-2323-600"],
    teamFormat: "3 pemain inti dan 2 cadangan, minimal 1 pemain perempuan",
    format: "Basket 3x3 sistem gugur",
    summary:
      "Lomba basket dimainkan 3 lawan 3 pada setengah lapangan dengan sistem gugur sampai final.",
    sections: [
      {
        title: "Pendaftaran",
        items: [
          "Lomba bersifat kelompok yang terdiri dari 5 orang per tim, yaitu 3 pemain inti dan 2 cadangan.",
          "Setiap tim wajib memiliki jumlah pemain sesuai ketentuan agar pertandingan berjalan seimbang.",
          "Pendaftaran dimulai dari tanggal 31 Mei 2026 sampai tanggal 12 Juni 2026.",
          "Pendaftaran dilakukan melalui penanggung jawab lomba.",
        ],
      },
      {
        title: "Ketentuan Peserta",
        items: [
          "Dalam satu tim harus memiliki minimal 1 pemain perempuan.",
          "Pemain yang bertanding dan pemain cadangan harus sesuai dengan data nama anggota yang sudah dikirim ke panitia.",
          "Pemain cedera akan ditangani oleh tim PMR.",
        ],
      },
      {
        title: "Peraturan Lomba",
        items: [
          "Pertandingan dilakukan dengan sistem gugur.",
          "Pertandingan terdiri dari kualifikasi, quarter final, semi final, dan final.",
          "Babak kualifikasi sampai semifinal menggunakan waktu 2 x 5 menit.",
          "Babak final menggunakan waktu 2 x 8 menit.",
          "Toleransi keterlambatan peserta adalah 5 menit. Jika melebihi waktu, peserta dinyatakan kalah dan lawan mendapat kemenangan WO.",
          "Peserta tidak diperkenankan menggunakan aksesoris berbahaya seperti jam tangan dan cincin, serta tidak diperbolehkan memiliki kuku panjang.",
          "Peserta dilarang bermain menggunakan kekerasan yang menyebabkan offensive foul atau defensive foul.",
          "Peserta wajib memahami dan mengikuti peraturan dasar basket 3x3 seperti traveling, double dribble, foul, dan out ball.",
          "Keputusan wasit dan panitia bersifat mutlak dan tidak dapat diganggu gugat.",
          "Setiap tim wajib menjaga sportivitas selama pertandingan berlangsung.",
        ],
      },
      {
        title: "Teknis Perlombaan",
        items: [
          "Khusus kelas AK dan MP, pemain yang diperbolehkan membantu kelas sejurusan hanya pemain cadangan.",
          "Konferensi pers bidang olahraga basket dilaksanakan sebelum pertandingan dimulai.",
          "Pertandingan menggunakan sistem 3 lawan 3 pada setengah lapangan basket.",
          "Pergantian pemain hanya dapat dilakukan saat dead ball atau sebelum check ball.",
          "Permainan dimulai dengan coin toss atau suit untuk menentukan penguasaan bola pertama.",
          "Setelah terjadi poin, permainan dilanjutkan oleh tim lawan dari bawah ring tanpa check ball.",
          "Setelah rebound atau steal, bola wajib dibawa keluar garis two point sebelum tim dapat melakukan serangan.",
          "Tembakan di dalam garis two point bernilai 1 poin.",
          "Tembakan di luar garis two point bernilai 2 poin.",
          "Tim yang mencapai 12 poin sebelum waktu pertandingan berakhir langsung dinyatakan menang.",
          "Jika skor imbang pada akhir pertandingan, overtime dilakukan sampai tim pertama memperoleh 2 poin.",
          "Setiap tim diperbolehkan meminta 1 kali time out selama pertandingan.",
          "Team foul dihitung dan jika mencapai batas foul akan diberlakukan free throw sesuai peraturan basket 3x3.",
          "Tindakan tidak sportif, kekerasan, atau protes berlebihan dapat dikenakan technical foul hingga diskualifikasi.",
        ],
      },
    ],
  },
  {
    id: "juknis-volly",
    competitionId: "volly",
    title: "JUKNIS Lomba Voli",
    shortName: "Voli",
    status: "Published",
    registrationStart: "31 Mei 2026",
    registrationEnd: "12 Juni 2026",
    registrationPeriod: "31 Mei 2026 - 12 Juni 2026",
    contacts: ["Gilang: 0821-2537-7283", "Zahira: 0899-7556-403"],
    teamFormat: "6 pemain inti dan 2 cadangan, minimal 1 pemain perempuan",
    format: "Sistem gugur",
    summary:
      "Lomba voli dimainkan per kelas dengan sistem gugur, 1 set pada penyisihan sampai semifinal dan 2 sampai 3 set pada final.",
    sections: [
      {
        title: "Pendaftaran",
        items: [
          "Satu tim terdiri dari 1 kelas.",
          "Lomba bersifat kelompok yang terdiri dari 8 orang per tim, yaitu 6 pemain inti dan 2 cadangan.",
          "Pendaftaran dimulai dari tanggal 31 Mei 2026 sampai tanggal 12 Juni 2026.",
          "Pendaftaran dilakukan melalui PJ lomba.",
        ],
      },
      {
        title: "Ketentuan Peserta",
        items: [
          "Dalam 1 tim harus memiliki minimal 1 pemain perempuan.",
          "Pemain yang bertanding dan pemain cadangan harus sesuai dengan data nama anggota yang sudah dikirim ke panitia.",
          "Peserta tidak diperkenankan menggunakan aksesoris yang membahayakan diri sendiri atau orang lain, seperti jam tangan dan cincin.",
        ],
      },
      {
        title: "Peraturan Lomba",
        items: [
          "Pertandingan dilaksanakan dengan sistem gugur.",
          "Babak penyisihan sampai semifinal dilaksanakan 1 set.",
          "Babak final dilaksanakan 2 set. Jika seri, ditambahkan 1 set sebagai babak penentuan.",
          "Babak penyisihan 1 set mencapai 25 poin dengan durasi 15 menit.",
          "Babak final 2 sampai 3 set, masing-masing set 25 poin dengan durasi 15 menit.",
          "Jika final seri sampai set kedua, set ketiga dimainkan sampai 15 poin.",
          "Jika waktu habis dan poin belum mencapai ketentuan, tim dengan poin tertinggi dinyatakan sebagai pemenang.",
        ],
      },
      {
        title: "Teknis Perlombaan",
        items: [
          "Setiap tim maksimal menyentuh bola sebanyak 3 kali sebelum dikembalikan ke lawan.",
          "Pemain tidak boleh menyentuh net, melewati garis tengah, atau melakukan double.",
          "Pergantian pemain maksimal 6 kali dalam satu set.",
          "Servis dilakukan dari belakang garis lapangan. Menyentuh garis saat servis otomatis menjadi poin untuk lawan.",
          "Jika tim penerima servis mendapatkan poin, tim tersebut berpindah servis dan melakukan rotasi searah jarum jam.",
          "Posisi pemain harus sesuai urutan rotasi saat servis dilakukan.",
          "Bola dinyatakan masuk jika menyentuh garis lapangan.",
          "Bola keluar jika jatuh di luar garis lapangan atau menyentuh benda di luar area permainan.",
        ],
      },
    ],
  },
  {
    id: "juknis-badminton",
    competitionId: "badminton",
    title: "JUKNIS Lomba Badminton",
    shortName: "Badminton",
    status: "Published",
    registrationStart: "31 Mei 2026",
    registrationEnd: "12 Juni 2026",
    registrationPeriod: "31 Mei 2026 - 12 Juni 2026",
    contacts: ["Abiyyu: 0856-5908-5578", "Naura: 0881-0240-06703"],
    teamFormat: "1 putra dan 1 putri sebagai tim ganda campuran",
    format: "Ganda campuran sistem gugur",
    summary:
      "Lomba badminton memakai format ganda campuran dengan sistem gugur dan best of 3 set.",
    sections: [
      {
        title: "Pendaftaran",
        items: [
          "Setiap kelas hanya diperbolehkan mengirim 1 putri dan 1 putra sebagai 1 tim ganda campuran.",
          "Pendaftaran dilakukan melalui panitia classmeet sesuai jadwal yang ditentukan.",
          "Peserta wajib mengisi formulir pendaftaran dengan lengkap.",
          "Tidak diperbolehkan mengganti pemain setelah technical meeting berlangsung.",
          "Untuk kelas AK, MP, dan XI BD, pemain yang diperbolehkan membantu kelas sejurusan hanya pemain cadangan.",
          "Waktu pendaftaran 31 Mei sampai 12 Juni.",
        ],
      },
      {
        title: "Ketentuan Peserta",
        items: [
          "Peserta wajib memakai baju olahraga dan sepatu olahraga.",
          "Peserta harus hadir 15 menit sebelum pertandingan dimulai.",
          "Pemain wajib menjaga sportivitas selama pertandingan berlangsung.",
          "Dilarang berkata kasar, mengejek lawan, atau membuat keributan.",
          "Peserta yang terlambat lebih dari 10 menit dinyatakan WO.",
          "Keputusan wasit dan panitia bersifat mutlak dan tidak dapat diganggu gugat.",
        ],
      },
      {
        title: "Peraturan Lomba",
        items: [
          "Sistem pertandingan menggunakan sistem gugur.",
          "Pertandingan dimainkan dalam format ganda campuran.",
          "Setiap pertandingan menggunakan 21 poin rally point.",
          "Setiap pertandingan menggunakan best of 3 set.",
          "Jika skor 20-20, berlaku deuce hingga selisih 2 poin.",
          "Shuttlecock disediakan oleh panitia.",
          "Peserta wajib menjaga kebersihan area pertandingan.",
        ],
      },
      {
        title: "Teknis Perlombaan",
        items: [
          "Undian pertandingan dilakukan saat technical meeting.",
          "Pemanasan maksimal 3 menit sebelum pertandingan dimulai.",
          "Pergantian lapangan dilakukan sesuai aturan badminton.",
          "Jika terjadi cedera, pemain diberikan waktu istirahat maksimal 5 menit.",
          "Tim atau pemain yang melakukan kecurangan akan didiskualifikasi.",
          "Juara ditentukan berdasarkan hasil akhir pertandingan.",
        ],
      },
    ],
  },
  {
    id: "juknis-mobile-legends",
    competitionId: "mobile-legends",
    title: "JUKNIS Lomba Mobile Legends",
    shortName: "Mobile Legends",
    status: "Published",
    registrationStart: "30 Mei 2026",
    registrationEnd: "12 Juni 2026",
    registrationPeriod: "30 Mei 2026 - 12 Juni 2026",
    contacts: ["Adly: 0812-6218-2408", "Zalva: 0858-9029-7648"],
    teamFormat: "5 pemain inti dan 1 cadangan",
    format: "Sistem gugur BO1, BO3, dan BO5",
    summary:
      "Lomba Mobile Legends memakai sistem gugur dengan format BO1 sampai 8 besar, BO3 pada semifinal dan perebutan juara 3, serta BO5 pada final.",
    sections: [
      {
        title: "Pendaftaran",
        items: [
          "Pendaftaran dibuka pada tanggal 30 Mei 2026 sampai 12 Juni 2026.",
          "Satu tim terdiri dari 1 kelas.",
          "Setiap kelas harus mengirim anggota inti dan cadangan.",
          "Pendaftaran dilakukan melalui penanggung jawab lomba.",
        ],
      },
      {
        title: "Ketentuan Peserta",
        items: [
          "Setiap kelas atau tim wajib mengirim 5 anggota tim inti dan 1 anggota tim cadangan.",
          "Pemain inti dan cadangan yang bertanding harus sesuai dengan data yang dikirim ke penanggung jawab lomba.",
          "Pemain dilarang keras menggunakan cheat atau perbuatan curang lain. Jika terbukti curang, tim langsung didiskualifikasi.",
        ],
      },
      {
        title: "Peraturan Lomba",
        items: [
          "Dalam 1 game, masing-masing tim mendapat hak meminta pause game sebanyak 3 kali.",
          "Pergantian pemain hanya diizinkan 1 kali dalam 1 match dan pemain pengganti harus sesuai data panitia.",
          "Pemain dilarang melakukan chat all.",
          "Taunting diizinkan selama tidak berlebihan seperti provokasi, berkata kasar, atau mengejek SARA.",
          "Taunting berlebihan diberikan peringatan. Jika peringatan mencapai 3 kali, tim didiskualifikasi.",
          "Keputusan panitia atau penanggung jawab perlombaan bersifat mutlak dan tidak dapat diganggu gugat.",
          "Panitia berhak mengubah peraturan jika diperlukan dalam kondisi tertentu.",
          "Pemain harus mempunyai akses internet sendiri karena panitia tidak menyediakan akses internet.",
          "Pemain harus memastikan baterai handphone tidak lowbat saat digunakan bertanding.",
          "Tim yang terlambat hadir diberikan waktu tambahan selama 2 menit.",
          "Jika tim terlambat atau anggota belum lengkap sampai waktu yang ditentukan, kemenangan diberikan kepada lawan dengan sistem WO.",
        ],
      },
      {
        title: "Teknis Perlombaan",
        items: [
          "Aplikasi yang digunakan adalah Mobile Legends: Bang Bang.",
          "Pertandingan dilaksanakan dengan sistem gugur: penyisihan, 8 besar, semifinal, perebutan juara 3, dan final.",
          "Babak penyisihan sampai 8 besar menggunakan sistem BO1.",
          "Babak semifinal dan perebutan juara 3 menggunakan sistem BO3.",
          "Babak final menggunakan sistem BO5.",
          "Pemenang adalah tim yang pertama kali menghancurkan base lawan.",
          "Suporter yang menonton pertandingan wajib menjaga ketertiban, keamanan, dan kebersihan ruangan.",
          "Suporter dari tim yang sedang bertanding lebih diprioritaskan.",
          "MVP Final diberikan kepada satu pemain dari tim pemenang final yang menunjukkan performa luar biasa, tidak hanya dinilai dari skor.",
        ],
      },
    ],
  },
  {
    id: "juknis-canvas-drawing",
    competitionId: "canvas-drawing",
    title: "JUKNIS Lomba Canvas Drawing",
    shortName: "Canvas Drawing",
    status: "Published",
    registrationStart: "31 Mei 2026",
    registrationEnd: "12 Juni 2026",
    registrationPeriod: "31 Mei 2026 - 12 Juni 2026",
    contacts: ["Grace: +62 889-0587-5208", "Asyila: +62 877-8122-1080"],
    teamFormat: "1 peserta per kelas",
    format: "Penilaian karya",
    summary:
      "Lomba canvas drawing diikuti 1 perwakilan kelas dengan karya pada media talenan sesuai tema yang ditentukan panitia.",
    sections: [
      {
        title: "Pendaftaran",
        items: [
          "Pendaftaran dimulai dari tanggal 31 Mei 2026 sampai tanggal 12 Juni 2026.",
          "Pendaftaran dapat melalui PJ lomba Canvas Drawing.",
        ],
      },
      {
        title: "Ketentuan Peserta",
        items: [
          "Tiap kelas wajib mengirimkan 1 perwakilan untuk mengikuti lomba canvas drawing.",
          "Peserta wajib melukis menggunakan alat dan bahan pribadi berupa kuas, pensil, penghapus, dan cat akrilik.",
          "Peserta tidak diperkenankan meminjam alat ke peserta lainnya.",
          "Peserta wajib menggambar sesuai tema yang ditentukan panitia.",
          "Peserta diperkenankan membawa sarung tangan atau celemek agar baju tidak terkena noda.",
        ],
      },
      {
        title: "Peraturan Lomba",
        items: [
          "Peserta wajib hadir di ruang lomba, yaitu ruang 201 lantai 2.",
          "Peserta wajib hadir maksimal 5 menit sebelum lomba dimulai.",
          "Waktu melukis adalah 1 jam 30 menit.",
          "Peserta wajib melukis di media canvas yang ditentukan panitia, yaitu talenan, sesuai tema melukis hal bernuansa maskot.",
          "Peserta diperbolehkan menggambar sketsa terlebih dahulu menggunakan pensil.",
          "Peserta wajib melukis menggunakan kuas dan cat akrilik.",
          "Peserta tidak boleh meniru atau menjiplak karya milik orang lain.",
          "Setiap peserta wajib memberikan pesan atau makna dari lukisan.",
          "Hasil karya harus segera dikumpulkan ketika waktu habis dan tidak ada tambahan waktu.",
        ],
      },
      {
        title: "Teknis Perlombaan",
        items: [
          "Peserta memasuki ruang 201 dengan membawa peralatan lukis dan duduk sesuai tempat yang ditentukan PJ lomba.",
          "Peserta tidak diperkenankan melihat referensi melalui Google maupun alat bantu otomatis selama perlombaan berlangsung.",
          "Peserta mulai melukis pada media talenan setelah diberi aba-aba oleh PJ lomba.",
          "Setelah 1 jam 30 menit, peserta harus mengumpulkan hasil karya tanpa tambahan waktu.",
        ],
      },
    ],
    criteria: [
      "Kesesuaian karya dengan tema yang ditentukan.",
      "Kreativitas dan orisinalitas.",
      "Teknik dan kerapihan.",
      "Komposisi dan warna.",
      "Pesan atau makna karya.",
    ],
  },
  {
    id: "juknis-solo-vokal",
    competitionId: "solo-vokal",
    title: "JUKNIS Lomba Solo Vokal",
    shortName: "Solo Vokal",
    status: "Published",
    registrationStart: "31 Mei 2026",
    registrationEnd: "12 Juni 2026",
    registrationPeriod: "31 Mei 2026 - 12 Juni 2026",
    contacts: ["Farrizqi: 088212217103", "Chika: 0818-1818-2325"],
    teamFormat: "1 peserta per kelas",
    format: "Penilaian penampilan vokal",
    summary:
      "Lomba solo vokal diikuti 1 perwakilan kelas dengan 1 lagu pilihan dan penilaian vokal, teknik, interpretasi, serta penampilan.",
    sections: [
      {
        title: "Pendaftaran",
        items: [
          "Pendaftaran dimulai dari tanggal 31 Mei 2026 sampai tanggal 12 Juni 2026.",
          "Pendaftaran dapat melalui PJ lomba Solo Vokal.",
        ],
      },
      {
        title: "Ketentuan Peserta",
        items: [
          "Setiap kelas wajib mengirimkan 1 orang perwakilan, putra atau putri.",
          "Peserta wajib mendaftarkan diri kepada PJ dengan mencantumkan judul lagu yang akan dibawakan.",
        ],
      },
      {
        title: "Peraturan Lomba",
        items: [
          "Peserta membawakan 1 lagu pilihan dengan genre bebas.",
          "Lirik lagu tidak boleh mengandung unsur SARA atau kata-kata kasar.",
          "Peserta diperbolehkan menggunakan instrumen sendiri seperti gitar atau keyboard.",
          "Jika menggunakan backing track, file harus dikumpulkan kepada PJ maksimal H-3 lomba dalam format MP3.",
          "Keputusan dewan juri bersifat mutlak dan tidak dapat diganggu gugat.",
          "Jika menggunakan alat musik, peserta membawa alat teknis sendiri seperti kabel jack dan mixer.",
        ],
      },
      {
        title: "Teknis Perlombaan",
        items: [
          "Lomba diikuti oleh individu.",
          "Peserta wajib hadir 15 sampai 20 menit sebelum lomba.",
          "Durasi lagu minimal 3 menit sampai 4 menit 30 detik.",
          "Urutan tampil ditentukan melalui undian.",
          "Peserta yang tidak hadir setelah dipanggil 3 kali dianggap gugur.",
        ],
      },
    ],
    criteria: [
      "Sistem nilai mulai 0 sampai 100.",
      "Materi vokal meliputi karakter suara, kejernihan, power, pernapasan, vibrasi, dan artikulasi.",
      "Teknik dan ketepatan meliputi ketepatan nada dan tempo dengan musik iringan.",
      "Interpretasi lagu meliputi pendalaman lirik, ekspresi, dinamika, dan pemenggalan kalimat.",
      "Penampilan meliputi kepercayaan diri, penguasaan panggung, interaksi penonton, kesesuaian kostum, dan kesopanan.",
    ],
  },
  {
    id: "juknis-best-news-card",
    competitionId: "best-news-card",
    title: "JUKNIS Lomba Best News Card",
    shortName: "Best News Card",
    status: "Published",
    registrationStart: "30 Mei 2026",
    registrationEnd: "12 Juni 2026",
    registrationPeriod: "30 Mei 2026 - 12 Juni 2026",
    contacts: [
      "Novita: 089606887132",
      "Frazier: 087787655640",
      "Stefani: 0813-8687-9922",
      "Alif: 0815-1420-5591",
    ],
    teamFormat: "1 tim beranggotakan 5 orang per kelas",
    format: "Karya news card dan caption berita",
    summary:
      "Best News Card adalah lomba media tim dengan karya square 1:1 dan caption berita yang relevan dari dokumentasi acara.",
    sections: [
      {
        title: "Pendaftaran",
        items: [
          "Pendaftaran dimulai pada tanggal 30 Mei 2026 sampai 12 Juni 2026.",
          "Pendaftaran lomba dapat melalui penanggung jawab Media Team Competition.",
        ],
      },
      {
        title: "Ketentuan Peserta",
        items: [
          "Setiap kelas wajib mengirimkan 1 tim beranggotakan 5 orang sebagai perwakilan.",
          "Peserta merupakan siswa atau siswi kelas X dan XI.",
          "Peserta diperbolehkan terdiri dari laki-laki dan perempuan atau campuran.",
        ],
      },
      {
        title: "Peraturan Lomba",
        items: [
          "Karya tidak mengandung unsur SARA, pornografi, atau politik.",
          "Peserta dilarang menggunakan template instan.",
          "Akun sosial media peserta merupakan public account, bukan private.",
          "Keputusan dewan juri bersifat mutlak dan tidak dapat diganggu gugat.",
          "Peserta tidak dapat digantikan setelah technical meeting berlangsung.",
        ],
      },
      {
        title: "Teknis Perlombaan",
        items: [
          "Selama 2 hari peserta diberikan akses untuk mengambil gambar saat acara berjalan.",
          "Pada hari ke-3 peserta melakukan kegiatan pengeditan gambar dan pengumpulan karya.",
          "Format postingan berbentuk square atau 1:1.",
          "Postingan terdiri dari 1 slide gambar dan caption berita yang relevan di kolom deskripsi.",
          "Caption memuat berita yang diangkat dari foto atau postingan yang diupload.",
          "Pengumpulan karya dilakukan melalui akun sosial media salah satu peserta dalam tim dan Google Form dari penanggung jawab.",
          "Karya desain dan caption harus buatan sendiri, bukan hasil plagiasi atau copy-paste dari media lain.",
          "Akun sosial media peserta merupakan public account, bukan private.",
          "Pengumpulan karya paling lambat tanggal 24 pukul 23.59 WIB.",
        ],
      },
    ],
    criteria: [
      "Kreativitas desain, perpaduan warna, dan pemilihan font agar pesan mudah dibaca.",
      "Kelengkapan informasi berita dan gaya bahasa caption yang menarik.",
      "Kemampuan membuat judul yang kuat, padat, dan menarik perhatian di dalam desain.",
      "Kesinambungan informasi antara gambar dan caption.",
      "Like, komentar, dan share dapat menjadi pertimbangan juri dalam penilaian.",
    ],
  },
  {
    id: "juknis-best-news-video",
    competitionId: "best-news-video",
    title: "JUKNIS Lomba Best News Video",
    shortName: "Best News Video",
    status: "Published",
    registrationStart: "30 Mei 2026",
    registrationEnd: "12 Juni 2026",
    registrationPeriod: "30 Mei 2026 - 12 Juni 2026",
    contacts: [
      "Novita: 089606887132",
      "Frazier: 087787655640",
      "Stefani: 0813-8687-9922",
      "Alif: 0815-1420-5591",
    ],
    teamFormat: "1 tim beranggotakan 5 orang per kelas",
    format: "Video berita rasio 9:16",
    summary:
      "Best News Video adalah lomba media tim untuk membuat video liputan acara dengan rasio wajib 9:16.",
    sections: [
      {
        title: "Pendaftaran",
        items: [
          "Pendaftaran dimulai pada tanggal 30 Mei 2026 sampai 12 Juni 2026.",
          "Pendaftaran lomba dapat melalui penanggung jawab Media Team Competition.",
        ],
      },
      {
        title: "Ketentuan Peserta",
        items: [
          "Setiap kelas wajib mengirimkan 1 tim beranggotakan 5 orang sebagai perwakilan.",
          "Peserta merupakan siswa atau siswi kelas X dan XI.",
          "Peserta diperbolehkan terdiri dari laki-laki dan perempuan atau campuran.",
        ],
      },
      {
        title: "Peraturan Lomba",
        items: [
          "Peserta harus standby ketika kelasnya sedang melaksanakan perlombaan.",
          "Jika ada perlombaan yang berbarengan, peserta diperbolehkan memilih untuk meliput salah satunya.",
          "Pengambilan video dilakukan di backdrop khusus konferensi pers.",
          "Peserta boleh mengambil video saat lomba berlangsung.",
          "Pengambilan video tidak boleh mengganggu pemain dan peserta lain.",
          "Tidak ada durasi maksimal.",
          "Rasio wajib 9:16.",
          "Pada hari ke-3 peserta mulai mengedit dan mengumpulkan karya.",
        ],
      },
      {
        title: "Teknis Perlombaan",
        items: [
          "Pengambilan video dilakukan di backdrop khusus konferensi pers.",
          "Peserta boleh mengambil video saat lomba berlangsung.",
          "Pengambilan video tidak boleh mengganggu pemain dan peserta lain.",
          "Pengumpulan karya paling lambat tanggal 24 pukul 23.59 WIB.",
        ],
      },
    ],
    criteria: ["Kehadiran peserta.", "Kreativitas.", "Penyajian."],
  },
]

export const supporterGuidelines = [
  "Seluruh penonton dan supporter wajib menjaga ketertiban dan keamanan selama kompetisi berlangsung.",
  "Penonton dan supporter wajib berada di area penonton yang disediakan dan dilarang melewati batas area pertandingan.",
  "Penonton dan supporter dilarang mengganggu jalannya pertandingan.",
  "Penonton dan supporter wajib menjaga sikap dan tutur kata yang sopan.",
  "Dilarang berkata kasar, mengejek, menghina, atau melakukan tindakan provokatif kepada tim atau kelas lain.",
  "Dilarang membuat keributan, adu mulut, atau tindakan yang dapat memicu konflik antar supporter.",
  "Penonton dan supporter diperbolehkan membawa atribut kelas selama tidak mengganggu pertandingan dan tidak membahayakan.",
  "Penonton dan supporter wajib menjaga kebersihan area pertandingan dan dilarang membuang sampah sembarangan.",
  "Penonton dan supporter wajib mematuhi arahan panitia dan keputusan wasit selama kompetisi berlangsung.",
  "Apabila terdapat penonton atau supporter yang melanggar aturan, panitia akan memberikan teguran tegas.",
]

export const landingStats = [
  { value: "2025/2026", label: "Anniversary" },
  { value: "9", label: "Competition Categories" },
  { value: "Coming Soon", label: "Committee Members" },
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
    focus: "Opening Ceremony, Futsal, Mobile Legends, Voli, Solo Vokal, Basket 3x3",
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
        title: "Voli Round of 16",
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
        title: "Basket 3x3 Round of 16 & Quarter Final",
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
    focus: "Badminton, Canvas Drawing, Voli Quarter Final, Mobile Legends, Futsal",
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
        title: "Voli Quarter Final",
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
        title: "Voli Semifinal",
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
        title: "Basket 3x3 Semifinal",
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
        title: "Voli Final",
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
        title: "Basket 3x3 Final",
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

export const initialLiveMatches: LiveMatch[] = []

export const tasks: TaskItem[] = []

export const announcements: Announcement[] = []

export const mediaItems: MediaItem[] = []

export const committee = [
  { role: "Penanggung Jawab", names: ["Drs. Indah Sri W., M.Pd", "Arsudin, S.E", "Anggara Elsa Bakhtiar, S.Pd"] },
  { role: "Ketua Pelaksana", names: ["Fadhlan Dzilikram"] },
  { role: "Wakil Pelaksana", names: ["Elmaliq Safatoriq Akbar"] },
  { role: "Sekretaris", names: ["Ahmad Farhan", "Grace Angela"] },
  { role: "Bendahara", names: ["Feby Riski Susanti", "Keisha Farras Naurasyifa"] },
  { role: "Sie. Acara", names: ["Reza Fadillah", "Delfina Azaria", "Ahmad Ziyad", "Baroqah Gieslatif"] },
  { role: "Sie. Humas", names: ["Ilham Nur Rifai", "Keisha Farras Naurasyifa", "Ananda Abiyyu Saqib"] },
  { role: "Sie. Dokumentasi", names: ["Devina Sahrani", "Ahmad Aliffansyah", "Bagas Pratama", "Lakeisha Ariana"] },
]

function normalizeClassName(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase()
}

export interface Partner {
  id: string
  name: string
  role: string
  logo: string
  category: "official" | "f&b"
}

export const partners: Partner[] = [
  {
    id: "yup",
    name: "YUP",
    role: "Official Digital Payment Partner",
    logo: "/images/sponsors/yup.png",
    category: "official",
  },
  {
    id: "synde-ht",
    name: "Synde HT",
    role: "Official Communication Partner",
    logo: "/images/sponsors/synde.png",
    category: "official",
  },
  {
    id: "yummy-coin",
    name: "Yummy Coin",
    role: "Official Food Partner",
    logo: "/images/sponsors/yummy-coin.png",
    category: "f&b",
  },
  {
    id: "campina",
    name: "Campina",
    role: "Official Ice Cream Partner",
    logo: "/images/sponsors/campina.png",
    category: "f&b",
  },
  {
    id: "hop-hop",
    name: "Hop Hop",
    role: "Official Beverage Partner",
    logo: "/images/sponsors/hop-hop.png",
    category: "f&b",
  },
]

export const partnerMetadata = {
  title: "Official Partners MCS 1",
  description: "Official Partners MCS 1: YUP, Synde HT, Yummy Coin, Campina, Hop Hop.",
  names: partners.map((partner) => partner.name),
}
