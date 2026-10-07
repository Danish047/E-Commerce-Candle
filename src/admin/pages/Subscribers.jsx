import { useEffect, useState } from 'react'
import { admin } from '../api'
import { CopyIcon, DownloadIcon, MailIcon, TrashIcon } from '../components/Icons'
import {
  Badge, Button, Empty, ErrorState, IconButton, PageHead, Pagination, SearchInput, TableSkeleton, confirmAction, cx,
} from '../components/kit'
import { fmtDate, useDebounced, useFilters, useQuery } from '../hooks'
import { toast } from '../store'

export default function Subscribers() {
  const [f, setF] = useFilters({ page: 1, search: '' })
  const [search, setSearch] = useState(f.search)
  const ds = useDebounced(search)
  useEffect(() => { if (ds !== f.search) setF({ search: ds }) }, [ds]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data, loading, error, reload, setData } = useQuery(() => admin.subscribers.list(f), [JSON.stringify(f)])
  const [exporting, setExporting] = useState(false)
  const rows = data?.results || []

  const exportCsv = async () => {
    setExporting(true)
    try { await admin.subscribers.export() } catch (e) { toast.bad(e) }
    setExporting(false)
  }
  const copyPage = () => {
    const list = rows.filter((r) => r.is_active).map((r) => r.email).join(', ')
    navigator.clipboard?.writeText(list).then(() => toast.ok('Emails on this page copied, ready to paste into BCC'))
  }
  const toggle = async (s) => {
    setData((d) => ({ ...d, results: d.results.map((x) => (x.id === s.id ? { ...x, is_active: !s.is_active } : x)) }))
    try {
      await admin.subscribers.update(s.id, { is_active: !s.is_active })
      toast.ok(s.is_active ? `${s.email} unsubscribed` : `${s.email} subscribed again`)
    } catch (e) { toast.bad(e); reload() }
  }
  const remove = async (s) => {
    if (!(await confirmAction({ title: 'Remove this email?', text: `${s.email} will be deleted from the list.`, confirmLabel: 'Remove', danger: true }))) return
    try {
      await admin.subscribers.remove(s.id)
      toast.ok('Removed')
      reload()
    } catch (e) { toast.bad(e) }
  }

  return (
    <>
      <PageHead title="Newsletter" subtitle={data ? `${data.count} people signed up from the store footer.` : 'People who signed up from the store footer.'}
        actions={<>
          <Button variant="ghost" icon={CopyIcon} onClick={copyPage} disabled={!rows.length}>Copy emails</Button>
          <Button variant="ghost" icon={DownloadIcon} loading={exporting} onClick={exportCsv}>Export CSV</Button>
        </>} />

      {error && <div className="mb-4"><ErrorState error={error} onRetry={reload} /></div>}
      <section className="a-panel overflow-hidden">
        <div className="border-b border-adm-line p-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search email" />
        </div>
        {loading && !data ? <TableSkeleton cols={3} /> : rows.length === 0 ? (
          <Empty icon={MailIcon} title={f.search ? 'No match' : 'No subscribers yet'} text={f.search ? 'Try another email.' : 'Sign-ups from the store footer will land here.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead><tr><th className="a-th">Email</th><th className="a-th">Joined</th><th className="a-th">Status</th><th className="a-th" /></tr></thead>
              <tbody className={cx(loading && 'opacity-60')}>
                {rows.map((s) => (
                  <tr key={s.id} className="a-row">
                    <td className="a-td font-medium">{s.email}</td>
                    <td className="a-td text-adm-muted">{fmtDate(s.created_at)}</td>
                    <td className="a-td">
                      <button onClick={() => toggle(s)} title="Click to change">
                        {s.is_active ? <Badge tone="ok" dot>Subscribed</Badge> : <Badge dot>Unsubscribed</Badge>}
                      </button>
                    </td>
                    <td className="a-td text-right"><IconButton icon={TrashIcon} label="Remove" onClick={() => remove(s)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={f.page} count={data?.count || 0} onPage={(page) => setF({ page })} />
      </section>
    </>
  )
}
