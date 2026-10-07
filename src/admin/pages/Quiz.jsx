import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { admin } from '../api'
import { CloseIcon, ExternalIcon, PlusIcon, SparkIcon } from '../components/Icons'
import { Button, Empty, ErrorState, Field, IconButton, Input, PageHead, Panel, Select, Skeleton } from '../components/kit'
import { useQuery } from '../hooks'
import { toast } from '../store'

// Each quiz question filters products by one kind of tag
const SOURCE = {
  mood: { kind: 'moods', label: 'mood' },
  category: { kind: 'categories', label: 'scent family' },
  occasion: { kind: 'occasions', label: 'occasion' },
}

function QuestionCard({ q, index, tags, onSaved }) {
  const [form, setForm] = useState(q)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  useEffect(() => setForm(q), [q])
  const dirty = JSON.stringify(form) !== JSON.stringify(q)
  const src = SOURCE[q.key]
  const used = form.options.map((o) => o.value)

  const setOpt = (i, patch) => setForm((f) => ({ ...f, options: f.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) }))
  const addOpt = () => {
    const free = tags.find((t) => !used.includes(t.slug))
    setForm((f) => ({ ...f, options: [...f.options, { value: free?.slug || '', label: free?.name || '' }] }))
  }
  const save = async () => {
    setBusy(true)
    setErrors({})
    try {
      onSaved(await admin.quiz.update(q.id, { question: form.question, options: form.options.filter((o) => o.label.trim()) }))
      toast.ok('Quiz updated. Shoppers see it right away.')
    } catch (e) {
      setErrors(e.fields || {})
      toast.bad(e)
    } finally { setBusy(false) }
  }

  return (
    <Panel title={<span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-ember-light text-xs font-semibold text-ember-dark">{index + 1}</span> Question {index + 1}</span>}
      action={src && <span className="text-xs text-adm-muted">Answers pick a {src.label}</span>}>
      <div className="space-y-4">
        <Field label="Question" error={errors.question}>
          <Input value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} />
        </Field>
        <div>
          <p className="a-label">Answers</p>
          <ul className="space-y-2">
            {form.options.map((o, i) => (
              <li key={i} className="flex items-center gap-2">
                <Input value={o.label} onChange={(e) => setOpt(i, { label: e.target.value })} placeholder="What shoppers see" className="flex-1" />
                {tags.length ? (
                  <Select value={o.value} onChange={(e) => setOpt(i, { value: e.target.value })} className="w-44 shrink-0" aria-label="Matches">
                    <option value="">Matches…</option>
                    {tags.map((t) => <option key={t.slug} value={t.slug} disabled={t.slug !== o.value && used.includes(t.slug)}>{t.name}</option>)}
                  </Select>
                ) : (
                  <Input value={o.value} onChange={(e) => setOpt(i, { value: e.target.value })} placeholder="value" className="w-44 shrink-0" />
                )}
                <IconButton icon={CloseIcon} label="Remove answer" disabled={form.options.length <= 2}
                  onClick={() => setForm((f) => ({ ...f, options: f.options.filter((_, j) => j !== i) }))} className="disabled:opacity-30" />
              </li>
            ))}
          </ul>
          {errors.options && <p className="mt-2 text-xs text-bad">{errors.options}</p>}
          <Button variant="quiet" icon={PlusIcon} className="mt-2" onClick={addOpt} disabled={tags.length > 0 && used.length >= tags.length}>Add answer</Button>
        </div>
        {dirty && (
          <div className="flex justify-end gap-2 border-t border-adm-line pt-4">
            <Button variant="ghost" onClick={() => setForm(q)}>Discard</Button>
            <Button variant="accent" loading={busy} onClick={save}>Save question</Button>
          </div>
        )}
      </div>
    </Panel>
  )
}

export default function Quiz() {
  const { data, loading, error, reload, setData } = useQuery(() => admin.quiz.list(), [])
  const tags = useQuery(() => Promise.all([admin.moods.list(), admin.categories.list(), admin.occasions.list()])
    .then(([moods, categories, occasions]) => ({ mood: moods, category: categories, occasion: occasions })), [])

  return (
    <>
      <PageHead title="Scent quiz" subtitle="The three quick questions that suggest a candle. Each answer points to a mood, scent family or occasion."
        actions={<a href="/quiz" target="_blank" rel="noreferrer" className="a-btn-ghost"><ExternalIcon /> Try it</a>} />
      {error && <div className="mb-4"><ErrorState error={error} onRetry={reload} /></div>}
      {loading && !data ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : !data?.length ? (
        <section className="a-panel"><Empty icon={SparkIcon} title="No quiz questions" text="Run python manage.py seed_store on the server to load the default quiz." /></section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {data.map((q, i) => (
            <QuestionCard key={q.id} q={q} index={i} tags={tags.data?.[q.key] || []}
              onSaved={(saved) => setData((d) => d.map((x) => (x.id === saved.id ? saved : x)))} />
          ))}
          <p className="text-sm text-adm-muted xl:col-span-2">
            Missing an answer you want? Add it first in <Link to="/admin/collections?tab=moods" className="font-medium text-ember-dark hover:underline">Collections</Link>, then tag some candles with it.
          </p>
        </div>
      )}
    </>
  )
}
