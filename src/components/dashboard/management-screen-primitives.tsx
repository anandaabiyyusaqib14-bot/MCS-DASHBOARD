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
  primary: "border-[#0F172A] bg-[#0F172A] text-white hover:bg-[#1E293B]",
  secondary: "border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F8F9FB]",
  danger: "border-[#FEE2E2] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]",
}

const statusToneClasses: Record<StatusTone, string> = {
  neutral: "border-[#E5E7EB] bg-[#F8F9FB] text-[#64748B]",
  info: "border-[#DBEAFE] bg-[#EFF6FF] text-[#1D4ED8]",
  success: "border-[#DCFCE7] bg-[#F0FDF4] text-[#16A34A]",
  warning: "border-[#FEF3C7] bg-[#FFFBEB] text-[#D97706]",
  danger: "border-[#FEE2E2] bg-[#FEF2F2] text-[#DC2626]",
  navy: "border-[#0F172A] bg-[#0F172A] text-white",
  gold: "border-[#FEF3C7] bg-[#FFFBEB] text-[#92400E]",
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
    <section className="flex flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-normal text-[#111827]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#64748B]">{subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2">
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
        "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/20 disabled:pointer-events-none disabled:opacity-50",
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
    <section className="grid min-w-0 gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-5">
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
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</span>
      <select
        className="h-10 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10"
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
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</span>
      <span className="relative">
        {type === "search" ? (
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
        ) : null}
        <input
          type={type}
          className={cn(
            "h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-[#111827] outline-none transition placeholder:text-[#94A3B8] focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10",
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
    <section className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E5E7EB] p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
          {description ? <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">{description}</p> : null}
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
        "inline-flex h-7 w-fit items-center rounded-full border px-2.5 text-xs font-semibold",
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
    <div className="grid min-h-40 place-items-center px-4 py-10 text-center">
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-[#111827]">{title}</p>
        <p className="mt-1 text-sm font-medium text-[#64748B]">{description}</p>
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
        <div key={item.label} className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-[#64748B]">{item.label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-2xl font-semibold tracking-normal text-[#111827]">{item.value}</p>
            <span
              className={cn(
                "mb-1 size-2.5 rounded-full",
                item.tone === "success"
                  ? "bg-[#16A34A]"
                  : item.tone === "warning"
                    ? "bg-[#D97706]"
                    : item.tone === "danger"
                      ? "bg-[#DC2626]"
                      : item.tone === "gold"
                        ? "bg-[#D4A017]"
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
        "inline-flex h-7 items-center justify-center rounded-md border px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/20 disabled:pointer-events-none disabled:opacity-50",
        tone === "danger"
          ? "border-[#FEE2E2] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]"
          : "border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F8F9FB]",
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
      className="fixed inset-0 z-50 grid place-items-center bg-[#0F172A]/20 px-4 py-6 backdrop-blur-sm"
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
        className="max-h-[calc(100vh-48px)] w-full max-w-2xl overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-xl"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] p-5">
          <div className="min-w-0">
            <h3 id={titleId} className="text-lg font-semibold text-[#111827]">
              {title}
            </h3>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm font-medium leading-6 text-[#64748B]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-md border border-[#E5E7EB] bg-white text-[#64748B] transition hover:bg-[#F8F9FB]"
            aria-label="Close modal"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-5">{children}</div>
        {footer ? <div className="border-t border-[#E5E7EB] bg-[#F8F9FB] p-4">{footer}</div> : null}
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
      <span className="text-sm font-semibold text-[#111827]">{label}</span>
      <input
        type={type}
        className="h-10 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-[#111827] outline-none transition placeholder:text-[#94A3B8] focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10"
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
      <span className="text-sm font-semibold text-[#111827]">{label}</span>
      <select
        className="h-10 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10"
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
      <span className="text-sm font-semibold text-[#111827]">{label}</span>
      <textarea
        className="min-h-28 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#111827] outline-none transition placeholder:text-[#94A3B8] focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10"
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
        className="inline-flex h-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] transition hover:bg-[#F8F9FB]"
        onClick={onClose}
      >
        {secondaryLabel}
      </button>
      <button
        type="button"
        className="inline-flex h-9 items-center justify-center rounded-md border border-[#0F172A] bg-[#0F172A] px-3 text-sm font-semibold text-white transition hover:bg-[#1E293B]"
        onClick={onClose}
      >
        {primaryLabel}
      </button>
    </div>
  )
}
