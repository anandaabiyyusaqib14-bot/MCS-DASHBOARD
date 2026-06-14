import type { Metadata } from "next"

import { ScoreboardPageContent } from "@/components/site/live-score-center"

export const metadata: Metadata = {
  title: "Live Score Center - MCS 1",
  description: "Scoreboard publik Melati Championship Series 1.",
}

export const dynamic = "force-dynamic"

export default function ScoreboardPage() {
  return <ScoreboardPageContent />
}
