import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Flag, ShieldCheck } from 'lucide-react'
import './cbt.css'

export const Route = createFileRoute('/cbt')({ component: CbtPage })

type CbtQuestion = { id: string; q: string; options: string[] }
type VerifiedStudent = { fullName: string; admissionNumber: string; classLevel: string }
type ExamReview = { question: string; selectedAnswer: string; correctAnswer?: string; correct: boolean }
type GradeResult = { score: number; total: number; review: ExamReview[] }

const API_BASE = (import.meta.env.VITE_CBT_API_URL ?? '').replace(/\/$/, '')
const API = {
  start: `${API_BASE}/api/start-exam`,
  grade: `${API_BASE}/api/grade`,
}
const EXAM = { subject: 'Mathematics', classLevel: 'SS1', term: 'First Term', durationSeconds: 30 * 60 }

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const result = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) throw new Error(result.error || 'The CBT service could not complete the request.')
  return result
}

function CbtPage() {
  const [studentCode, setStudentCode] = useState('')
  const [student, setStudent] = useState<VerifiedStudent | null>(null)
  const [questions, setQuestions] = useState<CbtQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [remaining, setRemaining] = useState(EXAM.durationSeconds)
  const [result, setResult] = useState<GradeResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [confirmFinish, setConfirmFinish] = useState(false)
  const submitting = useRef(false)
  const answersRef = useRef<Record<string, string>>({})
  const attemptTokenRef = useRef('')
  const tabSwitchesRef = useRef(0)
  const finished = result !== null
  const active = student !== null && questions.length > 0 && !finished
  const question = questions[current]
  const answeredCount = Object.keys(answers).length
  const timeLabel = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`

  async function beginExam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setWarning('')
    const code = studentCode.trim().toUpperCase()
    try {
      const started = await requestJson<{
        valid: boolean
        student: VerifiedStudent
        attemptToken: string
        durationSeconds: number
        questions: CbtQuestion[]
      }>(API.start, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCode: code,
          subject: EXAM.subject,
          classLevel: EXAM.classLevel,
          term: EXAM.term,
        }),
      })
      if (!started.valid || !started.student || !started.attemptToken) throw new Error('That student code is not valid.')
      if (!Number.isInteger(started.durationSeconds) || started.durationSeconds <= 0) throw new Error('The CBT service returned an invalid exam duration.')
      if (!Array.isArray(started.questions) || started.questions.length === 0) throw new Error(`No ${EXAM.classLevel} ${EXAM.subject} questions are available for ${EXAM.term}.`)
      const shuffledQuestions = started.questions.map(item => {
        if (!item.id || typeof item.q !== 'string' || !Array.isArray(item.options) || !item.options.every(option => typeof option === 'string')) throw new Error('The CBT service returned an invalid question.')
        return { ...item, options: shuffle(item.options) }
      })
      setQuestions(shuffle(shuffledQuestions))
      setStudent(started.student)
      setStudentCode(code)
      attemptTokenRef.current = started.attemptToken
      setAnswers({})
      answersRef.current = {}
      setCurrent(0)
      setRemaining(started.durationSeconds)
      tabSwitchesRef.current = 0
      setResult(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The exam could not be started.')
    } finally {
      setBusy(false)
    }
  }

  async function submitExam() {
    if (submitting.current || !student || questions.length === 0 || !attemptTokenRef.current) return
    submitting.current = true
    setBusy(true)
    setError('')
    try {
      const graded = await requestJson<GradeResult>(API.grade, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptToken: attemptTokenRef.current,
          answers: questions.map(item => ({ id: item.id, answer: answersRef.current[item.id] ?? '' })),
        }),
      })
      if (typeof graded.score !== 'number' || typeof graded.total !== 'number' || !Array.isArray(graded.review)) throw new Error('The CBT service returned an invalid result.')
      setResult(graded)
      setConfirmFinish(false)
    } catch (reason) {
      submitting.current = false
      setError(reason instanceof Error ? reason.message : 'The exam could not be submitted. Your answers are still available; try again.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!active) return
    if (remaining <= 0) {
      void submitExam()
      return
    }
    const timer = window.setTimeout(() => setRemaining(value => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [active, remaining])

  useEffect(() => {
    if (!active) return
    function onVisibilityChange() {
      if (!document.hidden) return
      tabSwitchesRef.current += 1
      const next = tabSwitchesRef.current
      setWarning(next >= 3
        ? 'The exam is being submitted after three tab switches.'
        : `Tab switch detected (${next} of 3). Return to the exam; it will be submitted after three switches.`)
      if (next >= 3) window.setTimeout(() => void submitExam(), 0)
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [active])

  function selectAnswer(option: string) {
    if (!question) return
    const updatedAnswers = { ...answersRef.current, [question.id]: option }
    answersRef.current = updatedAnswers
    setAnswers(updatedAnswers)
  }

  function finish() {
    if (answeredCount < questions.length) {
      setError(`You have ${questions.length - answeredCount} unanswered question${questions.length - answeredCount === 1 ? '' : 's'}. You can still submit if you are ready.`)
      setConfirmFinish(true)
      return
    }
    setConfirmFinish(true)
  }

  function restart() {
    setStudent(null)
    setQuestions([])
    setAnswers({})
    setResult(null)
    setStudentCode('')
    attemptTokenRef.current = ''
    answersRef.current = {}
    tabSwitchesRef.current = 0
    setError('')
    setWarning('')
    setRemaining(EXAM.durationSeconds)
    submitting.current = false
  }

  return <main className="records-page cbt-page">
    <header className="records-header cbt-header">
      <a className="records-school-brand" href="/">
        <span className="records-school-seal"><BookOpen size={22}/></span>
        <span><strong>SiHive CBT</strong><small>Separate computer-based examination system</small></span>
      </a>
      <a className="secondary" href="/school-data">School workspace</a>
    </header>

    <div className="records-content cbt-content">
      <div className="eyebrow">COMPUTER-BASED TEST</div>
      <h1>{finished ? 'Examination result' : active ? 'Examination in progress' : 'Student examination access'}</h1>
      <p>{finished ? 'Your exam has been submitted and graded.' : 'Enter your student code to load the exam assigned by your school.'}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {warning && <p className="form-notice cbt-warning" role="status">{warning}</p>}

      {!student && <section className="records-section cbt-panel">
        <div className="cbt-panel-heading"><span className="cbt-icon"><ShieldCheck size={22}/></span><div><h2>Start your exam</h2><p>Student identity and exam questions are verified by the CBT service.</p></div></div>
        <form className="record-form cbt-login-form" onSubmit={beginExam}>
          <label>Student code<input required autoComplete="off" value={studentCode} onChange={event => setStudentCode(event.target.value)} placeholder="e.g. STU101" /></label>
          <div className="cbt-exam-details"><span>{EXAM.subject}</span><span>{EXAM.classLevel}</span><span>{EXAM.term}</span><span>30 minutes</span></div>
          <button className="primary" disabled={busy}>{busy ? 'Verifying and loading exam…' : 'Start examination'}<ArrowRight size={16}/></button>
          <p className="cbt-service-note">Exam access and grading are handled by the separate CBT service. Configure <code>VITE_CBT_API_URL</code> when the service is hosted separately.</p>
        </form>
      </section>}

      {active && question && <>
        <section className="cbt-exam-summary">
          <div><small>LEARNER</small><strong>{student.fullName}</strong><span>{student.admissionNumber} · {student.classLevel}</span></div>
          <div className={`cbt-timer ${remaining < 300 ? 'urgent' : ''}`} aria-live="polite"><Clock3 size={18}/><span>{timeLabel}</span><small>remaining</small></div>
        </section>
        <div className="cbt-progress-track" aria-label={`${current + 1} of ${questions.length} questions`}><span style={{ width: `${((current + 1) / questions.length) * 100}%` }}/></div>
        <section className="records-section cbt-question-card">
          <div className="cbt-question-meta"><span>QUESTION {current + 1} OF {questions.length}</span><span>{answeredCount} answered</span></div>
          <h2>{question.q}</h2>
          <fieldset className="cbt-options"><legend className="sr-only">Choose an answer</legend>{question.options.map((option, index) => <label key={`${question.id}-${index}`} className={`cbt-option ${answers[question.id] === option ? 'selected' : ''}`}>
            <input type="radio" name={`answer-${question.id}`} checked={answers[question.id] === option} onChange={() => selectAnswer(option)} />
            <span className="cbt-option-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>
          </label>)}</fieldset>
          <div className="cbt-question-actions">
            <button type="button" className="secondary" disabled={current === 0} onClick={() => setCurrent(value => Math.max(0, value - 1))}><ArrowLeft size={16}/> Previous</button>
            {current < questions.length - 1
              ? <button type="button" className="primary" onClick={() => setCurrent(value => Math.min(questions.length - 1, value + 1))}>Next question <ArrowRight size={16}/></button>
              : <button type="button" className="primary" onClick={finish}><Flag size={16}/> Finish exam</button>}
          </div>
        </section>
        <section className="records-section cbt-palette-section"><div className="cbt-palette-heading"><h2>Question navigator</h2><span><i/> Answered</span></div><div className="cbt-palette">{questions.map((item, index) => <button key={item.id} type="button" aria-label={`Go to question ${index + 1}${answers[item.id] ? ', answered' : ', unanswered'}`} aria-current={index === current ? 'step' : undefined} className={`${index === current ? 'current ' : ''}${answers[item.id] ? 'answered' : ''}`} onClick={() => setCurrent(index)}>{index + 1}</button>)}</div></section>
      </>}

      {confirmFinish && active && <div className="cbt-confirm-backdrop" role="presentation"><section className="cbt-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="finish-title"><h2 id="finish-title">Submit this examination?</h2><p>{questions.length - answeredCount ? `${questions.length - answeredCount} question(s) are unanswered. ` : 'All questions have been answered. '}You cannot change your answers after submitting.</p><div><button type="button" className="secondary" disabled={busy} onClick={() => { setConfirmFinish(false); setError('') }}>Continue exam</button><button type="button" className="primary" disabled={busy} onClick={() => void submitExam()}>{busy ? 'Submitting…' : 'Submit exam'}</button></div></section></div>}

      {finished && result && <section className="records-section cbt-results">
        <div className="cbt-score"><CheckCircle2 size={26}/><div><small>FINAL SCORE</small><strong>{result.score} <span>/ {result.total}</span></strong></div></div>
        <div className="cbt-result-student"><strong>{student?.fullName}</strong><span>{student?.admissionNumber} · {student?.classLevel} · {EXAM.subject}</span></div>
        <h2>Answer review</h2>
        {result.review.map((item, index) => <article className="cbt-review-item" key={`${index}-${item.question}`}><strong>Question {index + 1}: {item.question}</strong><p>Your answer: <span className={item.correct ? 'correct' : 'incorrect'}>{item.selectedAnswer || 'Not answered'}</span></p><p>Correct answer: <span className="correct">{item.correctAnswer || 'Not provided'}</span></p></article>)}
        <button type="button" className="secondary" onClick={restart}>Return to student code</button>
      </section>}
    </div>
  </main>
}

function shuffle<T>(values: T[]): T[] {
  const shuffled = [...values]
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]]
  }
  return shuffled
}
