"use client"

import { useEffect, useId, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

export type SelectOption = {
  label: string
  value: string
}

export type HeaderAction = {
  label: string
  icon: LucideIcon
  onClick?: () => void
  disabled?: boolean
  tone?: "primary" | "secondary" | "danger"
}

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "navy" | "gold"

const actionToneClasses: Record<NonNullable<HeaderAction["tone"]>, string> = {
  primary: "border-[#F97316] bg-[#F97316] text-white shadow-[2px_2px_0_rgba(17,24,39,0.18)] hover:bg-[#EA580C]",
  secondary: "border-[#111827]/12 bg-white text-[#111827] shadow-[2px_2px_0_rgba(17,24,39,0.06)] hover:bg-[#FFF7ED]",
  danger: "border-[#FEE2E2] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]",
}

const statusToneClasses: Record<StatusTone, string> = {
  neutral: "border-[#E5E7EB] bg-[#FFFDF8] text-[#6B7280]",
  info: "border-[#BAE6FD] bg-[#F0F9FF] text-[#0369A1]",
  success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
  warning: "border-[#FEF3C7] bg-[#FFFBEB] text-[#D97706]",
  danger: "border-[#FEE2E2] bg-[#FEF2F2] text-[#DC2626]",
  navy: "border-[#111827] bg-[#111827] text-white",
  gold: "border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C]",
}

export function ManagementPageHeader({
  actions,
  subtitle,
  title,
}: {
  actions: HeaderAction[]
  subtitle: string
  title: string
}) {
  return (
    <section className="mcs-soft-surface mcs-starburst flex flex-col gap-4 overflow-hidden rounded-lg p-5 after:-right-5 after:top-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="relative z-10 min-w-0">
        <h2 className="font-heading text-2xl font-bold leading-tight tracking-normal text-[#111827]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#6B7280]">{subtitle}</p>
      </div>

      <div className="relative z-10 flex flex-wrap gap-2">
        {actions.map((action) => (
          <ActionButton
            key={action.label}
            disabled={action.disabled}
            icon={action.icon}
            label={action.label}
            tone={action.tone ?? "secondary"}
            onClick={action.onClick}
          />
        ))}
      </div>
    </section>
  )
}

export function ActionButton({
  className,
  disabled,
  icon: Icon,
  label,
  onClick,
  tone = "secondary",
  type = "button",
}: HeaderAction & {
  className?: string
  type?: "button" | "submit"
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/25 disabled:pointer-events-none disabled:opacity-50",
        actionToneClasses[tone],
        className,
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}

export function FilterPanel({ children }: { children: ReactNode }) {
  return (
    <section className="mcs-surface grid min-w-0 gap-4 rounded-lg p-4 sm:grid-cols-2 xl:grid-cols-5">
      {children}
    </section>
  )
}

export function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</span>
      <select
        className="h-10 rounded-lg border border-[#111827]/12 bg-white px-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function FilterInput({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string
  placeholder?: string
  type?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#6B7280]">{label}</span>
      <span className="relative">
        {type === "search" ? (
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
        ) : null}
        <input
          type={type}
          className={cn(
            "h-10 w-full rounded-lg border border-[#111827]/12 bg-white px-3 text-sm font-medium text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20",
            type === "search" ? "pl-9" : "",
          )}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  )
}

export function SectionPanel({
  action,
  children,
  description,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  description?: string
  title: string
}) {
  return (
    <section className="mcs-surface min-w-0 overflow-hidden rounded-lg">
      <div className="flex flex-col gap-3 border-b border-[#111827]/10 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-heading text-base font-bold text-[#111827]">{title}</h3>
          {description ? <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-fit items-center rounded-md border px-2.5 text-xs font-bold",
        statusToneClasses[tone],
      )}
    >
      {label}
    </span>
  )
}

export function EmptyState({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <div className="mcs-inset-panel grid min-h-40 place-items-center rounded-lg border-dashed px-4 py-10 text-center">
      <div className="max-w-sm">
        <span className="mcs-empty-mark" aria-hidden="true">
          <span />
          <i />
        </span>
        <p className="text-sm font-bold text-[#111827]">{title}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">{description}</p>
      </div>
    </div>
  )
}

export function StatGrid({
  items,
}: {
  items: Array<{
    label: string
    value: number | string
    tone?: StatusTone
  }>
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="mcs-neo-card rounded-lg p-4">
          <p className="text-sm font-semibold text-[#6B7280]">{item.label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="font-heading text-2xl font-bold tracking-normal text-[#111827]">{item.value}</p>
            <span
              className={cn(
                "mb-1 size-2.5 rounded-full",
                item.tone === "success"
                  ? "bg-[#22C55E]"
                  : item.tone === "warning"
                    ? "bg-[#F97316]"
                    : item.tone === "danger"
                      ? "bg-[#DC2626]"
                      : item.tone === "gold"
                        ? "bg-[#F97316]"
                        : item.tone === "info"
                          ? "bg-[#0EA5E9]"
                          : "bg-[#CBD5E1]",
              )}
            />
          </div>
        </div>
      ))}
    </section>
  )
}

export function RowActionButton({
  children,
  disabled,
  onClick,
  tone = "secondary",
}: {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  tone?: "secondary" | "danger"
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/25 disabled:pointer-events-none disabled:opacity-50",
        tone === "danger"
          ? "border-[#FEE2E2] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]"
          : "border-[#111827]/12 bg-white text-[#111827] hover:bg-[#FFF7ED]",
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function ManagementModal({
  children,
  description,
  footer,
  open,
  title,
  onClose,
}: {
  children: ReactNode
  description?: string
  footer?: ReactNode
  open: boolean
  title: string
  onClose: () => void
}) {
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#111827]/28 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="max-h-[calc(100vh-48px)] w-full max-w-2xl overflow-hidden rounded-lg border border-[#111827]/12 bg-white shadow-[5px_5px_0_rgba(249,115,22,0.18),0_24px_60px_rgba(17,24,39,0.18)]"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#111827]/10 p-5">
          <div className="min-w-0">
            <h3 id={titleId} className="font-heading text-lg font-bold text-[#111827]">
              {title}
            </h3>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm font-medium leading-6 text-[#6B7280]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#111827]/12 bg-white text-[#6B7280] transition hover:bg-[#FFF7ED]"
            aria-label="Close modal"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-5">{children}</div>
        {footer ? <div className="border-t border-[#111827]/10 bg-[#FFF7ED] p-4">{footer}</div> : null}
      </section>
    </div>
  )
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}

export function FormField({
  label,
  placeholder,
  type = "text",
  value,
}: {
  label: string
  placeholder?: string
  type?: string
  value?: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <input
        type={type}
        className="h-10 rounded-lg border border-[#111827]/12 bg-white px-3 text-sm font-medium text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
        placeholder={placeholder}
        defaultValue={value}
      />
    </label>
  )
}

export function FormSelect({
  label,
  options,
  value,
}: {
  label: string
  options: SelectOption[]
  value?: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <select
        className="h-10 rounded-lg border border-[#111827]/12 bg-white px-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
        defaultValue={value ?? options[0]?.value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function FormTextarea({
  label,
  placeholder,
  value,
}: {
  label: string
  placeholder?: string
  value?: string
}) {
  return (
    <label className="grid gap-1.5 sm:col-span-2">
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <textarea
        className="min-h-28 rounded-lg border border-[#111827]/12 bg-white px-3 py-2 text-sm font-medium text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
        placeholder={placeholder}
        defaultValue={value}
      />
    </label>
  )
}

export function ModalFooter({
  primaryLabel,
  secondaryLabel = "Cancel",
  onClose,
}: {
  primaryLabel: string
  secondaryLabel?: string
  onClose: () => void
}) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        className="mcs-button-secondary inline-flex h-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition"
        onClick={onClose}
      >
        {secondaryLabel}
      </button>
      <button
        type="button"
        className="mcs-button-primary inline-flex h-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition"
        onClick={onClose}
      >
        {primaryLabel}
      </button>
    </div>
  )
}
