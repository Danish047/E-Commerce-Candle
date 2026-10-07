import { useState } from 'react'
import { Link } from 'react-router-dom'
import { admin } from '../api'
import { ArrowDown, ArrowUp, EditIcon, LayersIcon, PlusIcon, TrashIcon } from '../components/Icons'
import {
  Button, Empty, ErrorState, Field, IconButton, Input, Modal, PageHead, Segmented, TableSkeleton, Textarea, confirmAction,
} from '../components/kit'
import { useFilters, useQuery } from '../hooks'
import { toast } from '../store'

const KINDS = {
  categories: { label: 'Scent families', one: 'scent family', filter: 'category', hint: 'The main groups on the Shop page, like Floral or Woody.' },
  moods: { label: 'Moods', one: 'mood', filter: 'mood', hint: 'How a candle makes you feel. Used by filters and the scent quiz.' },
  occasions: { label: 'Occasions', one: 'occasion', filter: 'occasion', hint: 'Who or what it’s for: birthdays, Diwali, self-care…' },
}
const slugify = (s) => s.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function EditModal({ kind, item, onClose, onSaved }) {
  const k = KINDS[kind]
  const [form, setForm] = useState(item || { name: '', slug: '', description: '' })
  const [slugTouched, setSlugTouched] = useState(!!item)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    setErrors({})
    const body = { name: form.name.trim(), slug: form.slug || slugify(form.name) }
    if (kind === 'categories') body.description = form.description || ''
    try {
      item ? await admin[kind].update(item.id, body) : await admin[kind].create(body)
      toast.ok(item ? `${body.name} updated` : `${body.name} added`)
      onSaved()
    } catch (e) {
      setErrors(e.fields || {})
      toast.bad(e)
    } finally { setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} title={item ? `Edit ${item.name}` : `New ${k.one}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="accent" loading={busy} onClick={save}>{item ? 'Save' : 'Add'}</Button></>}>
      <div className="space-y-4">
        <Field label="Name" required error={errors.name}>
          <Input autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))} />
        </Field>
        <Field label="Short name for links" hint={item ? 'Changing it can break links that were already shared.' : 'Filled in for you.'} error={errors.slug}>
          <Input value={form.slug} onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })) }} />
        </Field>
        {kind === 'categories' && (
          <Field label="Description" hint="Optional, one line." error={errors.description}>
            <Textarea rows={2} value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
        )}
      </div>
    </Modal>
  )
}

export default function Collections() {
  const [f, setF] = useFilters({ tab: 'categories' })
  const kind = KINDS[f.tab] ? f.tab : 'categories'
  const k = KINDS[kind]
  const { data, loading, error, reload, setData } = useQuery(() => admin[kind].list(), [kind])
  const [editing, setEditing] = useState(null)
  const rows = data || []

  const move = async (i, dir) => {
    const next = [...rows]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    setData(next)
    try {
      await Promise.all(next.map((r, idx) => (r.sort_order !== idx ? admin[kind].update(r.id, { sort_order: idx }) : null)))
      setData(next.map((r, idx) => ({ ...r, sort_order: idx })))
    } catch (e) { toast.bad(e); reload() }
  }
  const remove = async (r) => {
    if (!(await confirmAction({ title: `Delete ${r.name}?`, text: !r.product_count ? 'No products use it.' : kind === 'categories' ? `${r.product_count} product(s) are in it. Move them to another family first.` : `${r.product_count} product(s) use it. They'll lose this tag.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await admin[kind].remove(r.id)
      toast.ok(`${r.name} deleted`)
      reload()
    } catch (e) { toast.bad(e) }
  }

  return (
    <>
      <PageHead title="Collections" subtitle="How candles are grouped on the store: filters, menus and quiz answers."
        actions={<Button variant="accent" icon={PlusIcon} onClick={() => setEditing('new')}>New {k.one}</Button>} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented value={kind} onChange={(tab) => setF({ tab })} options={Object.entries(KINDS).map(([value, x]) => ({ value, label: x.label }))} />
        <p className="text-sm text-adm-muted">{k.hint}</p>
      </div>

      {error && <div className="mb-4"><ErrorState error={error} onRetry={reload} /></div>}
      <section className="a-panel overflow-hidden">
        {loading && !data ? <TableSkeleton rows={5} cols={3} /> : rows.length === 0 ? (
          <Empty icon={LayersIcon} title={`No ${k.label.toLowerCase()} yet`} action={<Button variant="accent" icon={PlusIcon} onClick={() => setEditing('new')}>New {k.one}</Button>} />
        ) : (
          <ul className="divide-y divide-adm-line">
            {rows.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col">
                  <button className="text-adm-muted hover:text-adm-ink disabled:opacity-20" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button className="text-adm-muted hover:text-adm-ink disabled:opacity-20" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.name}</p>
                  <p className="truncate text-xs text-adm-muted">/{r.slug}{r.description ? ` · ${r.description}` : ''}</p>
                </div>
                {kind === 'categories' ? (
                  <Link to={`/admin/products?category=${r.id}`}
                    className="tabular hidden rounded-full bg-adm-ink/[.05] px-2.5 py-0.5 text-xs text-adm-muted hover:text-adm-ink sm:inline">
                    {r.product_count} product{r.product_count === 1 ? '' : 's'}
                  </Link>
                ) : (
                  <span className="tabular hidden rounded-full bg-adm-ink/[.05] px-2.5 py-0.5 text-xs text-adm-muted sm:inline">
                    {r.product_count} product{r.product_count === 1 ? '' : 's'}
                  </span>
                )}
                <IconButton icon={EditIcon} label="Edit" onClick={() => setEditing(r)} />
                <IconButton icon={TrashIcon} label="Delete" onClick={() => remove(r)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && <EditModal kind={kind} item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
    </>
  )
}
