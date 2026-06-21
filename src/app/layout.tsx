import type { Metadata, Viewport } from "next"
import { Bebas_Neue, Geist_Mono, Inter, Sora } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PwaRegister } from "@/components/pwa-register"
import { partnerMetadata } from "@/data/mcs"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
})

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const getMetadataBase = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return new URL(process.env.NEXT_PUBLIC_APP_URL)
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`)
  }
  return new URL("https://mcs-dashboard.vercel.app")
}

export const metadata: Metadata = {
  title: "MCS 1 - Melati Championship Series 1",
  description:
    "Landing page and event operating system for Melati Championship Series 1 at SMK Negeri 20 Jakarta.",
  keywords: [
    "Melati Championship Series 1",
    "MCS 1",
    "Official Partners MCS 1",
    ...partnerMetadata.names,
  ],
  metadataBase: getMetadataBase(),
  other: {
    "official-partners": partnerMetadata.description,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MCS 1",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: "#081C3A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${sora.variable} ${bebas.variable} ${geistMono.variable} dark h-full`}
    >
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <TooltipProvider>
          <PwaRegister />
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
