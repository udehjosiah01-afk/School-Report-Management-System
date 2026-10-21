import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowUpRight, ArrowRight, LayoutDashboard, GraduationCap, BookOpen, ClipboardList, FileText, ChevronDown, Search, Bell, Check, Plus, Download, X, HelpCircle, Sprout, Users, TrendingUp, CalendarDays, Printer, Menu } from 'lucide-react'
import { classes, terms, subjects, names, initialScores } from '../data/fixtures'
import { calculateCompetitionRanks, calculateOverallAverage, calculateOverallGrade, calculateSubjectGrade, calculateSubjectRemark, calculateSubjectTotal, calculateThirdTermAverage, EXAM_MAX, isAssessmentScoreValid, isResultTerm, ordinal, TEST_MAX, type ResultTerm } from '../data/workbook-calculations'
export const Route = createFileRoute('/')({ component: Home })
type Page = 'Overview' | 'Score sheet' | 'Report cards'
function Home() {
  const [page, setPage] = useState<Page>('Overview')
  const [term, setTerm] = useState<ResultTerm>(terms[0])
  const [schoolClass, setClass] = useState(classes[0])
  const [subject, setSubject] = useState(subjects[0])
  const [scores, setScores] = useState(initialScores)
  const [search, setSearch] = useState('')
  const [student, setStudent] = useState(0)
  const [notice, setNotice] = useState('')
  const [help, setHelp] = useState(false)
  const [menu, setMenu] = useState(false)
  const pair = (i: number, s: string, c = schoolClass, t: ResultTerm = term) => scores[`${c}/${t}/${i}/${s}`]
  const total = (i: number, s: string, c = schoolClass, t: ResultTerm = term) => calculateSubjectTotal(...pair(i, s, c, t))
  const result = (i: number, s: string, c = schoolClass) => term === 'Third Term'
    ? calculateThirdTermAverage(total(i, s, c, 'First Term'), total(i, s, c, 'Second Term'), total(i, s, c, 'Third Term'))
    : total(i, s, c)
  const avg = (i: number, c = schoolClass) => calculateOverallAverage(subjects.map(s => result(i, s, c)))
  const classAvg = (c: string) => names.reduce((a, _, i) => a + avg(i, c), 0) / names.length
  const rank = (i: number) => calculateCompetitionRanks(names.map((_, j) => avg(j)))[i]
  const subjectRank = (i: number, s: string) => calculateCompetitionRanks(names.map((_, j) => result(j, s)))[i]
  const ranked = names.map((name, i) => ({ name, i, average: avg(i) })).sort((a, b) => b.average - a.average)
  const selectedStudentRank = rank(student)
  const chartMax = Math.max(100, Math.ceil(Math.max(...classes.map(classAvg)) / 25) * 25)
  const chartTicks = Array.from({ length: 5 }, (_, i) => chartMax * (4 - i) / 4)
  const navigate = (p: Page) => { setPage(p); setSearch(''); setMenu(false) }
  const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const exportCsv = () => {
    const headings = term === 'Third Term'
      ? ['Student', 'Admission number', 'First term total', 'Second term total', 'Third term total', 'Third term average', 'Grade / remark', 'Position']
      : ['Student', 'Admission number', 'Test', 'Examination', 'Total', 'Grade', 'Position', 'Remark']
    const rows = names.map((name, i) => term === 'Third Term'
      ? [name, `KIS/${String(i + 1).padStart(3, '0')}`, total(i, subject, schoolClass, 'First Term'), total(i, subject, schoolClass, 'Second Term'), total(i, subject, schoolClass, 'Third Term'), result(i, subject), calculateSubjectGrade(term, result(i, subject)), subjectRank(i, subject) ?? '']
      : [name, `KIS/${String(i + 1).padStart(3, '0')}`, ...pair(i, subject), total(i, subject), calculateSubjectGrade(term, total(i, subject)), subjectRank(i, subject) ?? '', calculateSubjectRemark(term, subject, total(i, subject)) ?? ''])
    const content = [headings, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${schoolClass}-${term}-${subject}.csv`
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <div className="app-shell">
    <aside className={`sidebar ${menu ? 'open' : ''}`}>
      <a className="brand" href="/" aria-label="Classfolio home"><span className="brand-icon"><BookOpen size={23}/></span>classfolio<span className="brand-dot">.</span></a>
      <div className="school"><span className="school-crest"><GraduationCap size={23}/></span><div><strong>Your school workspace</strong><small>Senior secondary school</small></div><ChevronDown size={14}/></div>
      <span className="nav-label">WORKSPACE</span>
      <nav>{([{ name: 'Overview', icon: LayoutDashboard }, { name: 'Score sheet', icon: ClipboardList }, { name: 'Report cards', icon: FileText }] as const).map(item => <button key={item.name} onClick={() => navigate(item.name)} className={page === item.name ? 'nav-item active' : 'nav-item'}><item.icon size={19}/>{item.name}{page === item.name && <span className="nav-dot"/>}</button>)}<a className="nav-item" href="/login"><Users size={19}/>Staff sign in</a></nav>
      <div className="sidebar-note"><Sprout size={25}/><strong>A little less paperwork.</strong><p>A little more time for what matters. Your students.</p><button onClick={() => setHelp(true)}>Explore your workspace <ArrowUpRight size={15}/></button></div>
      <div className="sidebar-bottom"><button onClick={() => setHelp(true)}><HelpCircle size={18}/> Help & getting started <ArrowUpRight size={14}/></button><div className="profile"><span className="avatar">SA</span><div><strong>School Administrator</strong><small>Demo workspace</small></div></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} onClick={() => setMenu(!menu)}><Menu size={20}/></button><span>Workspace</span><span>/</span><strong>{page}</strong></div><div className="top-actions"><span className="demo-badge"><i/> Preview · not saved</span><button className="icon-button notification" aria-label="View notifications" onClick={() => setNotice('You’re all caught up. This preview has no new notifications.')}><Bell size={19}/><i/></button><span className="avatar small">SA</span></div></header>
      <main>
        <div className="heading-row"><div><div className="eyebrow">A CLEARER PICTURE OF PROGRESS</div><h1>{page === 'Overview' ? 'Your school, at a glance.' : page === 'Score sheet' ? 'Goodbye, manual calculations.' : 'Every student. Every achievement.'}</h1><p>{page === 'Overview' ? 'From the first test to the final report. Everything comes together here.' : page === 'Score sheet' ? 'Enter scores and watch totals, grades, and positions come together.' : 'A complete picture of each student’s term, ready to print.'}</p></div><button className="primary" onClick={() => page === 'Report cards' ? window.print() : navigate('Score sheet')}>{page === 'Report cards' ? <Printer size={17}/> : <Plus size={17}/>} {page === 'Report cards' ? 'Print report' : 'Enter scores'}</button></div>
        <div className="context-bar"><div className="context-title"><CalendarDays size={17}/><strong>2025 / 2026</strong><span>Academic session</span></div><div className="filters"><label className="select-wrap"><select aria-label="Select term" value={term} onChange={e => { if (isResultTerm(e.target.value)) setTerm(e.target.value) }}>{terms.map(t => <option key={t}>{t}</option>)}</select><ChevronDown size={14}/></label><label className="select-wrap"><select aria-label="Select class" value={schoolClass} onChange={e => setClass(e.target.value)}>{classes.map(c => <option key={c}>{c}</option>)}</select><ChevronDown size={14}/></label></div></div>
        {page === 'Overview' ? <>
          <div className="stats-grid">{[{ label: 'Students enrolled', value: '48', icon: Users, foot: 'Across 3 senior classes', tint: 'sage' }, { label: 'Subjects offered', value: String(subjects.length), icon: BookOpen, foot: 'A well-rounded curriculum', tint: 'sand' }, { label: 'Class average · workbook scale', value: classAvg(schoolClass).toFixed(1), icon: TrendingUp, foot: `${schoolClass} · ${term.toLowerCase()}`, tint: 'blue' }, { label: 'Reports ready to preview', value: '16', icon: FileText, foot: 'Explore sample report cards', tint: 'lilac' }].map(item => <article className="stat-card" key={item.label}><div className="stat-top"><span>{item.label}</span><span className={`stat-icon ${item.tint}`}><item.icon size={18}/></span></div><strong className="stat-value">{item.value}</strong><small>{item.foot}</small></article>)}</div>
          <div className="middle-grid"><section className="panel performance"><div className="panel-heading"><div><h2>Performance overview</h2><p>A closer look at your classes this term.</p></div><span className="legend"><i/> Class average · workbook scale</span></div><div className="bar-chart"><div className="y-labels">{chartTicks.map(v => <span key={v}>{v}</span>)}</div><div className="plot"><div className="grid-lines">{[0, 1, 2, 3, 4].map(i => <i key={i}/>)}</div><div className="bars">{classes.map((c, i) => <button key={c} className={`bar-group ${c === schoolClass ? 'selected' : ''}`} onClick={() => setClass(c)} aria-label={`Select ${c}, average ${classAvg(c).toFixed(1)} on the workbook scale`}><span className="bar-value">{classAvg(c).toFixed(1)}</span><div className={`bar bar-${i}`} style={{ height: `${classAvg(c) * 165 / chartMax}px` }}/><span className="bar-label">{c}</span></button>)}</div></div></div><div className="chart-footer"><span><span className="green-dot"/> Every score tells a story.</span><button className="text-button" onClick={() => navigate('Score sheet')}>Explore score sheet <ArrowRight size={15}/></button></div></section>
          <section className="report-callout"><span className="pill">FROM SCORES TO STORIES</span><h2>Great progress.<br/>Beautifully reported.</h2><p>Turn a term of hard work into report cards that parents can understand.</p><div className="paper-art" aria-hidden="true"><div className="paper-stamp"><GraduationCap size={19}/></div><div className="paper-heading"/><div className="paper-subtitle"/><div className="paper-rule"/><div className="paper-line"><i/><b/></div><div className="paper-line"><i/><b/></div><div className="paper-line"><i/><b/></div><div className="paper-line"><i/><b/></div><span className="paper-seal"><Check size={17}/></span></div><button onClick={() => navigate('Report cards')}>Preview report cards <ArrowUpRight size={17}/></button></section></div>
          <section className="panel class-panel"><div className="panel-heading"><div><h2>Your classes</h2><p>One place to keep every class moving forward.</p></div><span className="count-tag">3 classes</span></div><div className="table-scroll"><table><thead><tr><th>CLASS</th><th>STUDENTS</th><th>SUBJECTS</th><th>CLASS AVERAGE</th><th>SCORE COVERAGE</th><th/></tr></thead><tbody>{classes.map((c, i) => <tr key={c}><td><span className={`class-symbol symbol-${i}`}><GraduationCap size={18}/></span><strong>{c}</strong><small className="inline-secondary">Senior secondary {i + 1}</small></td><td>16 <span className="muted">students</span></td><td>{subjects.length} <span className="muted">subjects</span></td><td><strong>{classAvg(c).toFixed(1)}</strong></td><td><span className="status"><Check size={12}/> Sample scores complete</span></td><td><button className="row-action" onClick={() => { setClass(c); navigate('Score sheet') }}>Open class <ArrowRight size={15}/></button></td></tr>)}</tbody></table></div></section>
          <div className="bottom-note"><span><Sprout size={15}/> Built around your school. Designed for your everyday.</span><span>Sample data · Explore freely</span></div>
        </> : page === 'Score sheet' ? (
          <section className="panel score-panel">
            <div className="panel-heading">
              <div>
                <h2>{schoolClass} score sheet</h2>
                <p>Preview edits reset on refresh. Test / 40 · Examination / 60.</p>
              </div>
              <button className="secondary" onClick={exportCsv}><Download size={16}/> Export CSV</button>
            </div>
            <div className="table-tools">
              <label className="search"><Search size={17}/><input placeholder="Find a student…" value={search} onChange={e => setSearch(e.target.value)}/></label>
              <label className="select-wrap"><select aria-label="Subject" value={subject} onChange={e => setSubject(e.target.value)}>{subjects.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={14}/></label>
            </div>
            <div className="table-scroll">
              <table className="score-table">
                <thead>
                  <tr><th>STUDENT</th><th>TEST / 40</th><th>EXAM / 60</th><th>{term === 'Third Term' ? 'TERM AVG.' : 'TOTAL / 100'}</th><th>{term === 'Third Term' ? 'GRADE / REMARK' : 'GRADE'}</th><th>POSITION</th>{term !== 'Third Term' && <th>REMARK</th>}</tr>
                </thead>
                <tbody>
                  {names.map((n, i) => ({ n, i })).filter(({ n }) => n.toLowerCase().includes(search.toLowerCase())).map(({ n, i }) => {
                    const currentTotal = total(i, subject)
                    const subjectResult = result(i, subject)
                    const subjectGrade = calculateSubjectGrade(term, subjectResult)
                    const position = subjectRank(i, subject)

                    return <tr key={i}>
                      <td><strong>{n}</strong><small className="student-id">KIS/{String(i + 1).padStart(3, '0')}</small></td>
                      {[0, 1].map(k => {
                        const maximum = k === 0 ? TEST_MAX : EXAM_MAX
                        const key = `${schoolClass}/${term}/${i}/${subject}`

                        return <td key={k}><input
                          className="score-input"
                          aria-label={`${n} ${k === 0 ? 'test' : 'examination'} score`}
                          type="number"
                          min={0}
                          max={maximum}
                          value={pair(i, subject)[k]}
                          onChange={e => {
                            const value = Number(e.target.value)
                            if (!isAssessmentScoreValid(value, maximum)) return
                            setScores(current => {
                              const next: [number, number] = [...current[key]]
                              next[k] = value
                              return { ...current, [key]: next }
                            })
                          }}
                        /></td>
                      })}
                      <td><strong>{term === 'Third Term' ? subjectResult.toFixed(1) : currentTotal}</strong></td>
                      <td><span className={`grade grade-${subjectGrade.charAt(0)}`}>{subjectGrade}</span></td>
                      <td>{position === null ? '—' : ordinal(position)}</td>
                      {term !== 'Third Term' && <td>{calculateSubjectRemark(term, subject, currentTotal)}</td>}
                    </tr>
                  })}
                </tbody>
              </table>
              {!names.some(n => n.toLowerCase().includes(search.toLowerCase())) && <div className="empty">No students match “{search}”. Try a different name.</div>}
            </div>
            <div className="score-foot">
              {term === 'Third Term'
                ? 'Third-term subject results average all three term totals and round to one decimal place.'
                : 'Subject grades and remarks use the selected term’s workbook rules.'}
              {' '}Overall average: 13 subject results divided by 10.
            </div>
          </section>
        ) : (
          <div className="report-layout">
            <section className="panel student-picker">
              <div className="panel-heading"><div><h2>Class ranking</h2><p>{schoolClass} · {names.length} students</p></div></div>
              {ranked.map(({ name, i, average }) => {
                const position = rank(i)
                return <button key={i} className={student === i ? 'student-choice chosen' : 'student-choice'} onClick={() => setStudent(i)}>
                  <span className="rank-number">{position === null ? '—' : position}</span>
                  <span><strong>{name}</strong><small>KIS/{String(i + 1).padStart(3, '0')}</small></span>
                  <b>{average.toFixed(1)}</b>
                </button>
              })}
            </section>
            <section className="report-paper">
              <div className="report-brand"><span className="brand-icon"><BookOpen size={24}/></span><div><h2>STUDENT REPORT CARD</h2><p>Senior Secondary School · 2025 / 2026</p></div></div>
              <div className="report-student">
                <div><small>STUDENT NAME</small><h2>{names[student]}</h2><p>KIS/{String(student + 1).padStart(3, '0')} · {schoolClass} · {term}</p></div>
                <span className="report-position"><b>{selectedStudentRank === null ? '—' : ordinal(selectedStudentRank)}</b>of 16 students</span>
              </div>
              <table>
                <thead>
                  {term === 'Third Term'
                    ? <tr><th>SUBJECT</th><th>FIRST TERM</th><th>SECOND TERM</th><th>THIRD TERM</th><th>AVERAGE</th><th>GRADE / REMARK</th></tr>
                    : <tr><th>SUBJECT</th><th>TEST</th><th>EXAM</th><th>TOTAL</th><th>GRADE</th><th>REMARK</th></tr>}
                </thead>
                <tbody>{subjects.map(s => {
                  const subjectResult = result(student, s)
                  return <tr key={s}>
                    <td>{s}</td>
                    {term === 'Third Term'
                      ? <><td>{total(student, s, schoolClass, 'First Term')}</td><td>{total(student, s, schoolClass, 'Second Term')}</td><td>{total(student, s, schoolClass, 'Third Term')}</td><td>{subjectResult.toFixed(1)}</td><td>{calculateSubjectGrade(term, subjectResult)}</td></>
                      : <><td>{pair(student, s)[0]}</td><td>{pair(student, s)[1]}</td><td><strong>{total(student, s)}</strong></td><td>{calculateSubjectGrade(term, subjectResult)}</td><td>{calculateSubjectRemark(term, s, subjectResult)}</td></>}
                  </tr>
                })}</tbody>
              </table>
              <div className="report-summary">
                <span>Overall average <b>{avg(student).toFixed(1)}</b></span>
                <span>Class average <b>{classAvg(schoolClass).toFixed(1)}</b></span>
                <span>Overall grade <b>{calculateOverallGrade(avg(student))}</b></span>
              </div>
              <p className="report-disclaimer">SAMPLE REPORT · Preview only · Based on demonstration scores</p>
            </section>
          </div>
        )}
      </main>
    </div>
    {notice && <div className="toast" role="status"><Check size={17}/>{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={16}/></button></div>}
    {help && <div className="modal-backdrop" onClick={() => setHelp(false)}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={e => e.stopPropagation()}><button className="modal-close icon-button" aria-label="Close help" onClick={() => setHelp(false)}><X size={20}/></button><span className="brand-icon"><BookOpen size={25}/></span><h2 id="help-title">Welcome to Classfolio.</h2><p>Your school’s results, with room to breathe.</p><ol><li><strong>Choose a term and class.</strong> Explore the overview with sample records.</li><li><strong>Open the score sheet.</strong> Change test and exam scores; totals and positions update instantly.</li><li><strong>Preview a report.</strong> Select a student and print their term report.</li></ol><p className="help-note">This is an interactive product preview. Edits reset on refresh. School setup, saved records, staff accounts, and publishing are the next milestones.</p><button className="primary" onClick={() => { setHelp(false); navigate('Score sheet') }}>Try the score sheet <ArrowRight size={16}/></button></section></div>}
  </div>
}
