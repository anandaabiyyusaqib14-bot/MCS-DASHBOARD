import type { Metadata } from "next"

import { MatchDetailContent } from "@/components/site/live-score-center"

export const metadata: Metadata = {
  title: "Detail Match - MCS 1",
  description: "Detail pertandingan Live Score Center MCS 1.",
}

export const dynamic = "force-dynamic"

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <MatchDetailContent matchId={id} />
}
