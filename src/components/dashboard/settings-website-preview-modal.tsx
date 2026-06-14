"use client"

import { X } from "lucide-react"

export function SettingsWebsitePreviewModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] bg-[#07111D] p-3 text-white sm:p-5" role="dialog" aria-modal="true">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/12 bg-[#0B1626] shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">Preview Website MCS 1</p>
            <p className="truncate text-xs font-semibold text-white/52">Realtime dari draft Settings Center di browser ini.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/12 bg-white/8 text-white transition hover:bg-white/14"
            aria-label="Tutup preview"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>
        <iframe src="/" title="Preview Website MCS 1" className="h-full w-full flex-1 border-0 bg-white" />
      </div>
    </div>
  )
}
