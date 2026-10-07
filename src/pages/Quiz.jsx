import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../utils/helpers'
import ProductCard from '../components/ProductCard'
import { ErrorBox, Spinner } from '../components/ui'

export default function Quiz() {
  const { data, loading, error, reload } = useApi(() => api.quiz.questions(), [])
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  if (loading) return <Spinner />
  if (error) return <div className="container-x py-16"><ErrorBox error={error} onRetry={reload} /></div>

  const questions = data.questions
  const q = questions[step]

  const pick = async (value) => {
    const next = { ...answers, [q.id]: value }
    setAnswers(next)
    if (step < questions.length - 1) return setStep(step + 1)
    setBusy(true)
    setErr(null)
    try {
      setResult(await api.quiz.recommend(next))
    } catch (e) {
      setErr(e)
    } finally {
      setBusy(false)
    }
  }

  const restart = () => { setStep(0); setAnswers({}); setResult(null) }

  if (busy) return <Spinner label="Finding your perfect scent…" />

  if (result) {
    return (
      <div className="container-x py-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Your scent match</p>
          <h1 className="mt-2 font-serif text-5xl font-semibold">We think you'll love these</h1>
          <p className="mt-3 text-cocoa-soft">Picked just for your mood and taste.</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
          {result.products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        <div className="mt-12 flex justify-center gap-3">
          <button onClick={restart} className="btn-outline">Retake quiz</button>
          <Link to="/shop" className="btn-primary">Shop all candles</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-x flex min-h-[70vh] flex-col items-center justify-center py-16">
      <div className="mb-10 flex w-full max-w-xl gap-2">
        {questions.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-ember' : 'bg-sand'}`} />
        ))}
      </div>
      <p className="text-sm text-cocoa-soft">Question {step + 1} of {questions.length}</p>
      <h1 className="mt-3 max-w-2xl text-center font-serif text-4xl font-semibold sm:text-5xl">{q.question}</h1>
      <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-2">
        {q.options.map((o) => (
          <button key={o.value} onClick={() => pick(o.value)}
            className={`rounded-2xl border-2 p-5 text-left text-lg font-medium transition hover:border-ember hover:bg-ember-light ${answers[q.id] === o.value ? 'border-ember bg-ember-light' : 'border-sand bg-white'}`}>
            {o.label}
          </button>
        ))}
      </div>
      {err && <div className="mt-6"><ErrorBox error={err} /></div>}
      {step > 0 && <button onClick={() => setStep(step - 1)} className="mt-8 text-sm underline">Back</button>}
    </div>
  )
}
