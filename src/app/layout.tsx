import type { Metadata } from "next"
import { Bebas_Neue, Geist_Mono, Inter, Sora } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
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

export const metadata: Metadata = {
  title: "MCS 1 - Melati Championship Series 1",
  description:
    "Landing page and event operating system for Melati Championship Series 1 at SMK Negeri 20 Jakarta.",
  metadataBase: new URL("https://mcs1.local"),
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
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
