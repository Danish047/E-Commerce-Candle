export function Stars({ value = 0, size = 'text-sm' }) {
  return (
    <span className={`inline-flex ${size} leading-none`} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? 'text-ember' : 'text-sand'}>★</span>
      ))}
    </span>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-cocoa-soft">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-sand border-t-ember" />
      {label}
    </div>
  )
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {error?.message || 'Something went wrong.'}
      {onRetry && (
        <button onClick={onRetry} className="ml-3 font-semibold underline">Try again</button>
      )}
    </div>
  )
}

export function Badge({ children, tone = 'ember' }) {
  const tones = {
    ember: 'bg-ember text-white',
    dark: 'bg-cocoa text-cream',
    light: 'bg-cream text-cocoa',
    sage: 'bg-sage text-white',
  }
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]}`}>{children}</span>
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cocoa">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-cocoa-soft">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="bg-wax py-12 text-center sm:py-16">
      {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ember">{eyebrow}</p>}
      <h1 className="font-serif text-4xl font-semibold text-cocoa sm:text-5xl">{title}</h1>
      {subtitle && <p className="mx-auto mt-3 max-w-xl px-4 text-cocoa-soft">{subtitle}</p>}
    </div>
  )
}
