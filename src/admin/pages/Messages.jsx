import { useEffect, useState } from 'react'
import { admin } from '../api'
import { CheckIcon, InboxIcon, MailIcon, PhoneIcon, RefreshIcon, TrashIcon } from '../components/Icons'
import {
  Avatar, Badge, Button, Empty, ErrorState, PageHead, Pagination, SearchInput, Segmented, Skeleton, Textarea, confirmAction, cx,
} from '../components/kit'
import { fmtDateTime, timeAgo, useDebounced, useFilters, useQuery } from '../hooks'
import { toast } from '../store'

const TOPIC = { order: 'Order help', bulk: 'Bulk / corporate', custom: 'Custom candles', other: 'Other' }

function Thread({ m, onUpdate, onDelete }) {
  const [note, setNote] = useState(m.admin_note || '')
  const [busy, setBusy] = useState(false)
  useEffect(() => setNote(m.admin_note || ''), [m.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (data, msg) => {
    setBusy(true)
    try {
      onUpdate(await admin.messages.update(m.id, data))
      toast.ok(msg)
    } catch (e) { toast.bad(e) }
    setBusy(false)
  }
  const subject = encodeURIComponent(`Re: your message to Lumière & Co.`)
  const body = encodeURIComponent(`Hi ${m.name.split(' ')[0]},\n\n\n\n— \nLumière & Co.\n\n> ${m.message.replace(/\n/g, '\n> ')}`)
  const wa = m.phone && `https://wa.me/${m.phone.replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}`

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-adm-line px-6 py-5">
        <div className="flex items-center gap-3">
          <Avatar name={m.name} size={42} />
          <div>
            <p className="font-semibold">{m.name}</p>
            <p className="text-sm text-adm-muted">{m.email}{m.phone ? ` · ${m.phone}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {m.topic && <Badge tone="ember">{TOPIC[m.topic] || m.topic}</Badge>}
          <span className="text-xs text-adm-muted">{fmtDateTime(m.created_at)}</span>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <p className="whitespace-pre-line rounded-2xl rounded-tl-sm bg-adm-soft px-5 py-4 text-[15px] leading-relaxed">{m.message}</p>

        <div className="flex flex-wrap gap-2">
          <a href={`mailto:${m.email}?subject=${subject}&body=${body}`} className="a-btn-primary"><MailIcon /> Reply by email</a>
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="a-btn-ghost">WhatsApp</a>}
          {m.phone && <a href={`tel:${m.phone}`} className="a-btn-ghost"><PhoneIcon /> Call</a>}
        </div>

        <div>
          <label className="a-label" htmlFor="msg-note">Team note</label>
          <Textarea id="msg-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only your team sees this. e.g. “Sent quote for 50 jars on 12 Oct”" />
          {note !== (m.admin_note || '') && (
            <div className="mt-2 flex justify-end"><Button variant="ghost" loading={busy} onClick={() => patch({ admin_note: note }, 'Note saved')}>Save note</Button></div>
          )}
        </div>
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-adm-line px-6 py-3.5">
        <Button variant="quiet" icon={TrashIcon} onClick={() => onDelete(m)}>Delete</Button>
        {m.is_resolved
          ? <Button variant="ghost" icon={RefreshIcon} loading={busy} onClick={() => patch({ is_resolved: false }, 'Moved back to open')}>Reopen</Button>
          : <Button variant="accent" icon={CheckIcon} loading={busy} onClick={() => patch({ is_resolved: true, admin_note: note }, 'Marked as done')}>Mark as done</Button>}
      </footer>
    </div>
  )
}

export default function Messages() {
  const [f, setF] = useFilters({ page: 1, search: '', status: 'open', open: '' })
  const [search, setSearch] = useState(f.search)
  const ds = useDebounced(search)
  useEffect(() => { if (ds !== f.search) setF({ search: ds }) }, [ds]) // eslint-disable-line react-hooks/exhaustive-deps

  const { open, ...params } = f
  const { data, loading, error, reload, setData } = useQuery(() => admin.messages.list(params), [JSON.stringify(params)])
  const rows = data?.results || []
  const current = rows.find((m) => String(m.id) === String(open)) || (window.innerWidth >= 1024 && !open ? rows[0] : null)

  const onUpdate = (m) => {
    const leaves = (f.status === 'open' && m.is_resolved) || (f.status === 'resolved' && !m.is_resolved)
    setData((d) => ({ ...d, results: leaves ? d.results.filter((x) => x.id !== m.id) : d.results.map((x) => (x.id === m.id ? m : x)) }))
    if (leaves) setF({ open: '', page: f.page })
  }
  const onDelete = async (m) => {
    if (!(await confirmAction({ title: 'Delete this message?', text: `${m.name}'s message will be removed for good.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await admin.messages.remove(m.id)
      toast.ok('Message deleted')
      setF({ open: '', page: f.page })
      reload()
    } catch (e) { toast.bad(e) }
  }

  return (
    <>
      <PageHead title="Messages" subtitle="Questions from the contact form: orders, bulk gifting and custom candles." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented value={f.status} onChange={(status) => setF({ status, open: '' })}
          options={[{ value: 'open', label: 'To answer' }, { value: 'resolved', label: 'Done' }, { value: '', label: 'All' }]} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email or message" className="min-w-[220px] flex-1" />
      </div>
      {error && <div className="mb-4"><ErrorState error={error} onRetry={reload} /></div>}

      <section className="a-panel grid overflow-hidden lg:h-[calc(100vh-240px)] lg:min-h-[520px] lg:grid-cols-[360px_1fr]">
        <div className={cx('flex min-h-0 flex-col border-adm-line lg:border-r', current && 'hidden lg:flex')}>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading && !data ? (
              <div className="space-y-4 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : rows.length === 0 ? (
              <Empty icon={InboxIcon} title={f.status === 'open' ? 'All caught up' : 'Nothing here'}
                text={f.status === 'open' ? 'No one is waiting on a reply.' : 'Try another filter.'} />
            ) : (
              <ul className="divide-y divide-adm-line">
                {rows.map((m) => (
                  <li key={m.id}>
                    <button onClick={() => setF({ open: m.id, page: f.page })}
                      className={cx('flex w-full gap-3 px-5 py-4 text-left transition hover:bg-adm-soft',
                        current?.id === m.id && 'bg-ember-light/50 hover:bg-ember-light/60')}>
                      <span className={cx('mt-2 h-2 w-2 shrink-0 rounded-full', m.is_resolved ? 'bg-transparent' : 'bg-ember')} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cx('truncate text-sm', m.is_resolved ? 'text-adm-muted' : 'font-semibold')}>{m.name}</span>
                          <span className="shrink-0 text-xs text-adm-muted">{timeAgo(m.created_at)}</span>
                        </span>
                        {m.topic && <span className="block text-xs text-ember-dark">{TOPIC[m.topic] || m.topic}</span>}
                        <span className="mt-0.5 line-clamp-2 block text-sm text-adm-muted">{m.message}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Pagination page={f.page} count={data?.count || 0} onPage={(page) => setF({ page, open: '' })} />
        </div>
        <div className={cx('min-h-0', !current && 'hidden lg:block')}>
          {current ? (
            <>
              <button onClick={() => setF({ open: '', page: f.page })} className="px-6 pt-4 text-sm text-adm-muted lg:hidden">← All messages</button>
              <Thread m={current} onUpdate={onUpdate} onDelete={onDelete} />
            </>
          ) : (
            <div className="hidden h-full place-items-center lg:grid"><Empty icon={MailIcon} title="Pick a message" text="Open one from the list to read and reply." /></div>
          )}
        </div>
      </section>
    </>
  )
}
