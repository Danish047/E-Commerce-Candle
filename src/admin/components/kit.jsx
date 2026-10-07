import { forwardRef, useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import { Link } from 'react-router-dom'
import { useToasts } from '../store'
import { AlertIcon, ArrowLeft, CheckIcon, ChevronLeft, ChevronRight, CloseIcon, SearchIcon } from './Icons'

const cx = (...c) => c.filter(Boolean).join(' ')
export { cx }

// ─── Buttons ───────────────────────────────────────────────────────
export function Spin({ className = 'h-4 w-4' }) {
  return <span className={cx('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', className)} aria-hidden="true" />
}

// Literal class names so Tailwind keeps every variant in the build
const BTN = { primary: 'a-btn-primary', accent: 'a-btn-accent', ghost: 'a-btn-ghost', quiet: 'a-btn-quiet', danger: 'a-btn-danger' }
export function Button({ variant = 'primary', loading, icon: Icon, children, className, ...props }) {
  return (
    <button type="button" className={cx(BTN[variant] || BTN.primary, className)} disabled={loading || props.disabled} {...props}>
      {loading ? <Spin /> : Icon && <Icon />}
      {children}
    </button>
  )
}

export function IconButton({ icon: Icon, label, className, ...props }) {
  return (
    <button type="button" aria-label={label} title={label}
      className={cx('grid h-9 w-9 place-items-center rounded-[10px] text-adm-muted transition hover:bg-adm-ink/5 hover:text-adm-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ember/30', className)}
      {...props}>
      <Icon />
    </button>
  )
}

// ─── Layout pieces ─────────────────────────────────────────────────
export function PageHead({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link to={back.to} className="mb-2 inline-flex items-center gap-1.5 text-sm text-adm-muted hover:text-adm-ink">
            <ArrowLeft className="h-4 w-4" /> {back.label}
          </Link>
        )}
        <h1 className="font-serif text-[2.1rem] font-semibold leading-none text-adm-ink">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-adm-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, action, children, className, bodyClass = 'p-5' }) {
  return (
    <section className={cx('a-panel', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-adm-line px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-adm-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  )
}

// ─── Form controls ────────────────────────────────────────────────
export function Field({ label, error, hint, children, className, required }) {
  return (
    <label className={cx('block', className)}>
      {label && (
        <span className="a-label">
          {label}
          {required && <span className="text-ember"> *</span>}
        </span>
      )}
      {children}
      {error ? <span className="mt-1 block text-xs text-bad">{error}</span>
        : hint && <span className="mt-1 block text-xs text-adm-muted">{hint}</span>}
    </label>
  )
}

export const Input = forwardRef(function Input({ error, className, prefix, ...p }, ref) {
  if (prefix) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-adm-muted">{prefix}</span>
        <input ref={ref} className={cx('a-input tabular pl-7', error && 'a-input-error', className)} {...p} />
      </div>
    )
  }
  return <input ref={ref} className={cx('a-input', error && 'a-input-error', className)} {...p} />
})

export const Textarea = forwardRef(function Textarea({ error, className, rows = 4, ...p }, ref) {
  return <textarea ref={ref} rows={rows} className={cx('a-input resize-y leading-relaxed', error && 'a-input-error', className)} {...p} />
})

export function Select({ error, className, children, ...p }) {
  return (
    <select className={cx('a-input cursor-pointer appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9', error && 'a-input-error', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236F665E' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...p}>
      {children}
    </select>
  )
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label className={cx('flex items-start justify-between gap-4', disabled ? 'opacity-60' : 'cursor-pointer')}>
      {(label || description) && (
        <span>
          <span className="block text-sm font-medium text-adm-ink">{label}</span>
          {description && <span className="mt-0.5 block text-xs text-adm-muted">{description}</span>}
        </span>
      )}
      <span className="relative mt-0.5 shrink-0">
        <input type="checkbox" className="peer sr-only" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="block h-[22px] w-[38px] rounded-full bg-[#d6d8cf] transition peer-checked:bg-ok peer-focus-visible:ring-[3px] peer-focus-visible:ring-ember/30" />
        <span className="absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4" />
      </span>
    </label>
  )
}

export function Checkbox({ checked, onChange, label, indeterminate }) {
  const ref = useRef()
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate
  }, [indeterminate])
  return (
    <input ref={ref} type="checkbox" aria-label={label} checked={!!checked} onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 cursor-pointer rounded border-adm-line accent-[#231B16]" />
  )
}

// Comma/enter separated chips, used for fragrance notes
export function TagInput({ value = [], onChange, placeholder }) {
  const [draft, setDraft] = useState('')
  const add = (raw) => {
    const parts = raw.split(',').map((x) => x.trim()).filter(Boolean)
    if (parts.length) onChange([...value, ...parts.filter((p) => !value.includes(p))])
    setDraft('')
  }
  return (
    <div className="a-input flex min-h-[40px] flex-wrap items-center gap-1.5 py-1.5">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-adm-soft px-2 py-0.5 text-[13px] ring-1 ring-adm-line">
          {t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="text-adm-muted hover:text-bad">
            <CloseIcon className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input value={draft} placeholder={value.length ? '' : placeholder}
        onChange={(e) => (e.target.value.includes(',') ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); add(draft) }
          if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
        }}
        onBlur={() => draft && add(draft)}
        className="min-w-[90px] flex-1 bg-transparent text-sm outline-none placeholder:text-adm-muted/60" />
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search', className }) {
  return (
    <div className={cx('relative', className)}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-adm-muted" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="a-input pl-9" />
    </div>
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-adm-ink/[.05] p-1" role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cx('flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition',
            value === o.value ? 'bg-white text-adm-ink shadow-[0_1px_2px_rgba(35,27,22,.12)]' : 'text-adm-muted hover:text-adm-ink')}>
          {o.label}
          {o.count !== undefined && <span className="tabular text-xs text-adm-muted">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

// ─── Status & identity ────────────────────────────────────────────
const TONES = {
  ok: 'bg-ok-soft text-ok', warn: 'bg-warn-soft text-warn', bad: 'bg-bad-soft text-bad', info: 'bg-info-soft text-info',
  neutral: 'bg-adm-ink/[.06] text-adm-muted', ember: 'bg-ember-light text-ember-dark',
}
export function Badge({ tone = 'neutral', children, dot, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export const ORDER_STATUS = {
  pending: { label: 'Awaiting payment', tone: 'warn' },
  processing: { label: 'To ship', tone: 'ember' },
  shipped: { label: 'Shipped', tone: 'info' },
  delivered: { label: 'Delivered', tone: 'ok' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}
export const PAYMENT_STATUS = {
  pending: { label: 'Unpaid', tone: 'warn' },
  paid: { label: 'Paid', tone: 'ok' },
  failed: { label: 'Failed', tone: 'bad' },
  refunded: { label: 'Refunded', tone: 'neutral' },
}
export function StatusBadge({ status, kind = 'order' }) {
  const m = (kind === 'order' ? ORDER_STATUS : PAYMENT_STATUS)[status] || { label: status, tone: 'neutral' }
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}

// Product thumbnail: photo if there is one, otherwise a small jar in the product colour
export function Jar({ color = '#C99A6B', image, size = 40, className }) {
  if (image) return <img src={image} alt="" className={cx('shrink-0 rounded-lg object-cover ring-1 ring-adm-line', className)} style={{ width: size, height: size }} />
  return (
    <span className={cx('grid shrink-0 place-items-center rounded-lg bg-adm-soft ring-1 ring-adm-line', className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 44" style={{ width: size * 0.62 }} aria-hidden="true">
        <path d="M20 2c2.4 3.4 3.4 5.4 3.4 7.4a3.4 3.4 0 0 1-6.8 0c0-2 1-4 3.4-7.4z" fill="#F4A340" />
        <rect x="6" y="15" width="28" height="27" rx="5" fill="#fff" opacity=".7" />
        <rect x="8" y="17" width="24" height="23" rx="4" fill={color} />
        <rect x="12" y="25" width="16" height="8" rx="1.5" fill="#FBF7F1" />
      </svg>
    </span>
  )
}

const AVATAR_BG = ['#C8763B', '#5B7A52', '#4D6B88', '#9E4F5A', '#B7801C', '#6F665E']
export function Avatar({ name = '', size = 32 }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
  const bg = AVATAR_BG[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_BG.length]
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-semibold text-white" style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}>
      {initials}
    </span>
  )
}

export function Stars({ value }) {
  return (
    <span className="inline-flex text-sm leading-none" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= Math.round(value) ? 'text-ember' : 'text-adm-line'}>★</span>)}
    </span>
  )
}

export function Delta({ value, invert }) {
  if (value === null || value === undefined) return <span className="text-xs text-adm-muted">no earlier data</span>
  const good = invert ? value < 0 : value >= 0
  return (
    <span className={cx('tabular text-xs font-semibold', good ? 'text-ok' : 'text-bad')}>
      {value >= 0 ? '+' : ''}{value}%
    </span>
  )
}

// ─── States ───────────────────────────────────────────────────────
export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-adm-soft text-adm-muted ring-1 ring-adm-line"><Icon className="h-5 w-5" /></span>}
      <p className="font-semibold text-adm-ink">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-adm-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{error?.message || 'Something went wrong.'}</div>
      {onRetry && <button onClick={onRetry} className="font-semibold underline underline-offset-2">Try again</button>}
    </div>
  )
}

export function Skeleton({ className }) {
  return <span className={cx('block animate-pulse rounded-md bg-adm-ink/[.07]', className)} />
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="divide-y divide-adm-line/70">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: cols }).map((_, c) => <Skeleton key={c} className={cx('h-3.5', c === 0 ? 'w-40' : 'flex-1')} />)}
        </div>
      ))}
    </div>
  )
}

export function Pagination({ page, count, pageSize = 20, onPage }) {
  const pages = Math.max(1, Math.ceil(count / pageSize))
  page = Number(page) || 1
  if (count <= pageSize) return count ? <p className="px-4 py-3 text-xs text-adm-muted">{count} {count === 1 ? 'result' : 'results'}</p> : null
  const from = (page - 1) * pageSize + 1
  return (
    <div className="flex items-center justify-between gap-3 border-t border-adm-line px-4 py-3 text-sm">
      <span className="tabular text-xs text-adm-muted">{from}–{Math.min(page * pageSize, count)} of {count}</span>
      <div className="flex items-center gap-1">
        <IconButton icon={ChevronLeft} label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} className="disabled:opacity-30" />
        <span className="tabular px-2 text-xs text-adm-muted">Page {page} of {pages}</span>
        <IconButton icon={ChevronRight} label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)} className="disabled:opacity-30" />
      </div>
    </div>
  )
}

// ─── Overlays ─────────────────────────────────────────────────────
function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'max-w-lg' }) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-adm-side/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cx('relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl animate-rise sm:rounded-2xl', size)}>
        <header className="flex items-start justify-between gap-4 border-b border-adm-line px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-adm-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-adm-muted">{subtitle}</p>}
          </div>
          <IconButton icon={CloseIcon} label="Close" onClick={onClose} className="-mr-2 -mt-1" />
        </header>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-adm-line bg-adm-soft/60 px-6 py-3.5">{footer}</footer>}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-xl' }) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-adm-side/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className={cx('absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl', width)} style={{ animation: 'rise .2s ease-out' }}>
        <header className="flex items-start justify-between gap-4 border-b border-adm-line px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-adm-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-adm-muted">{subtitle}</p>}
          </div>
          <IconButton icon={CloseIcon} label="Close" onClick={onClose} className="-mr-2" />
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-adm-line px-6 py-3.5">{footer}</footer>}
      </aside>
    </div>
  )
}

// Imperative confirm: if (await confirmAction({ title, text, confirmLabel, danger: true })) { … }
const useConfirm = create((set) => ({ req: null, set }))
export const confirmAction = (opts) =>
  new Promise((resolve) => useConfirm.getState().set({ req: { ...opts, resolve } }))

export function ConfirmHost() {
  const { req, set } = useConfirm()
  const close = (v) => {
    req?.resolve(v)
    set({ req: null })
  }
  return (
    <Modal open={!!req} onClose={() => close(false)} title={req?.title} size="max-w-md"
      footer={<>
        <Button variant="ghost" onClick={() => close(false)}>{req?.cancelLabel || 'Keep it'}</Button>
        <Button variant={req?.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>{req?.confirmLabel || 'Confirm'}</Button>
      </>}>
      <p className="text-sm leading-relaxed text-adm-muted">{req?.text}</p>
    </Modal>
  )
}

export function Toaster() {
  const { items, dismiss } = useToasts()
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-xl bg-adm-side px-4 py-3 text-sm text-white shadow-xl animate-rise">
          <span className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full', t.tone === 'bad' ? 'bg-bad' : 'bg-ok')}>
            {t.tone === 'bad' ? <AlertIcon className="h-3 w-3" /> : <CheckIcon className="h-3 w-3" />}
          </span>
          <span className="flex-1 leading-snug">{t.text}</span>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-white/50 hover:text-white"><CloseIcon className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  )
}

// Small popover menu: <Menu trigger={<button/>} items={[{ label, onClick, danger }]} />
export function Menu({ trigger, items, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      {open && (
        <div className={cx('absolute top-full z-40 mt-1 min-w-[190px] rounded-xl border border-adm-line bg-white p-1 shadow-xl animate-rise', align === 'right' ? 'right-0' : 'left-0')}>
          {items.filter(Boolean).map((it) => (
            <button key={it.label} type="button" onClick={() => { setOpen(false); it.onClick() }}
              className={cx('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-adm-soft', it.danger ? 'text-bad' : 'text-adm-ink')}>
              {it.icon && <it.icon className="h-4 w-4" />}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
