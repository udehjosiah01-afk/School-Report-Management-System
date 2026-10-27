import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, ArrowUpRight, BookOpen, ChevronDown, ClipboardList, FileText, GraduationCap, HelpCircle, LayoutDashboard, Menu, Plus, Printer, Sprout, Users, X } from 'lucide-react'
import { classes, subjectsByClass } from '../data/fixtures'
import { getReportTemplateId, getReportTemplateSubjects } from '../data/report-templates'
import { isResultTerm } from '../data/workbook-calculations'
import type { ResultTerm } from '../data/workbook-calculations'
import { SchoolReportTemplate } from '../components/school-report-template'

export const Route = createFileRoute('/workspace')({ component: WorkspacePreview })

type Page = 'Overview' | 'Score sheet' | 'Report cards'

function WorkspacePreview() {
  const [page, setPage] = useState<Page>('Overview')
  const [help, setHelp] = useState(false)
  const [menu, setMenu] = useState(false)
  const [reportClassName, setReportClassName] = useState('JSS 1')
  const [reportTerm, setReportTerm] = useState<ResultTerm>('Third Term')
  const reportTemplateId = getReportTemplateId(reportClassName, reportTerm)
  const reportTemplateSubjects = getReportTemplateSubjects(reportClassName)

  const navigate = (nextPage: Page) => {
    setPage(nextPage)
    setMenu(false)
  }

  return <div className="app-shell">
    <aside className={`sidebar ${menu ? 'open' : ''}`}>
      <a className="brand" href="/" aria-label="Classfolio home"><span className="brand-icon"><BookOpen size={23}/></span>classfolio<span className="brand-dot">.</span></a>
      <div className="school"><span className="school-crest"><GraduationCap size={23}/></span><div><strong>Workspace preview</strong><small>Set up a school to begin</small></div><ChevronDown size={14}/></div>
      <span className="nav-label">WORKSPACE</span>
      <nav>
        {([
          { name: 'Overview', icon: LayoutDashboard },
          { name: 'Score sheet', icon: ClipboardList },
          { name: 'Report cards', icon: FileText },
        ] as const).map(item => <button key={item.name} onClick={() => navigate(item.name)} className={page === item.name ? 'nav-item active' : 'nav-item'}>
          <item.icon size={19}/>{item.name}{page === item.name && <span className="nav-dot"/>}
        </button>)}
        <a className="nav-item" href="/login"><Users size={19}/>Staff sign in</a>
      </nav>
      <div className="sidebar-note"><Sprout size={25}/><strong>Start with your school.</strong><p>Set up your classes and records in a private school workspace.</p><button onClick={() => setHelp(true)}>See how setup works <ArrowUpRight size={15}/></button></div>
      <div className="sidebar-bottom">
        <button onClick={() => setHelp(true)}><HelpCircle size={18}/> Help & getting started <ArrowUpRight size={14}/></button>
        <div className="profile"><span className="avatar">CF</span><div><strong>Workspace preview</strong><small>No school data loaded</small></div></div>
      </div>
    </aside>

    <div className="main-shell">
      <header className="topbar">
        <div className="breadcrumb">
          <button className="mobile-menu icon-button" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} onClick={() => setMenu(!menu)}><Menu size={20}/></button>
          <span>Workspace preview</span><span>/</span><strong>{page}</strong>
        </div>
        <div className="top-actions">
          <span className="demo-badge"><i/> No school records loaded</span>
          <span className="avatar small">CF</span>
        </div>
      </header>

      <main>
        <div className="heading-row">
          <div>
            <div className="eyebrow">SCHOOL RECORDS MANAGEMENT</div>
            <h1>{page === 'Overview' ? 'School workspace overview' : page === 'Score sheet' ? 'Score sheet' : 'Report card template preview'}</h1>
            <p>{page === 'Overview' ? 'Review the available workspace areas and sign in to view your school’s records.' : page === 'Score sheet' ? 'Score entry is available to authorised staff in their school workspace.' : 'Blank, printable layouts are shown for supported class and term combinations.'}</p>
          </div>
          {page === 'Report cards'
            ? <div className="report-preview-actions">
                <label>Class<select value={reportClassName} onChange={event => setReportClassName(event.target.value)}>
                  {classes.map(schoolClass => <option key={schoolClass}>{schoolClass}</option>)}
                </select></label>
                <label>Term<select value={reportTerm} onChange={event => {
                  if (isResultTerm(event.target.value)) setReportTerm(event.target.value)
                }}>
                  <option>First Term</option><option>Second Term</option><option>Third Term</option>
                </select></label>
                {reportTemplateId && <button className="primary" onClick={() => window.print()}><Printer size={17}/> Print blank template</button>}
              </div>
            : <a className="primary" href="/signup"><Plus size={17}/> Set up your school</a>}
        </div>

        {page === 'Overview' ? <>
          <div className="workspace-overview-grid">
            <section className="panel overview-status">
              <div className="panel-heading"><div><h2>School records</h2><p>Private school data is available after staff sign in.</p></div></div>
              <div className="overview-empty"><Users size={22}/><p>No school records are loaded in this public preview.</p><a className="primary" href="/login">Staff sign in <ArrowRight size={16}/></a></div>
            </section>
            <section className="panel overview-status">
              <div className="panel-heading"><div><h2>Reports ready to print</h2><p>Report cards must be generated from saved results.</p></div></div>
              <div className="overview-empty"><FileText size={22}/><p>No reports are ready to print. Saved-result report generation is not connected yet.</p><button className="secondary" onClick={() => navigate('Report cards')}>View blank template</button></div>
            </section>
          </div>
          <section className="panel class-panel">
            <div className="panel-heading"><div><h2>Starting class catalogue</h2><p>Starter subject suggestions; each school can choose or add subjects.</p></div></div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>CLASS LEVEL</th><th>STARTER SUBJECTS</th><th>STATUS</th><th/></tr></thead>
                <tbody>{classes.map((schoolClass, index) => <tr key={schoolClass}>
                  <td><span className={`class-symbol symbol-${index % 3}`}><GraduationCap size={18}/></span><strong>{schoolClass}</strong><small className="inline-secondary">{schoolClass.startsWith('JSS') ? 'Junior secondary' : 'Senior secondary'}</small></td>
                  <td>{subjectsByClass[schoolClass].length ? `${subjectsByClass[schoolClass].length} suggested subjects` : 'Choose subjects during setup'}</td>
                  <td><span className="status">School setup required</span></td>
                  <td><a className="row-action" href="/signup">School setup <ArrowRight size={15}/></a></td>
                </tr>)}</tbody>
              </table>
            </div>
          </section>
          <div className="bottom-note"><span>Public preview only</span><span>No student identities, scores, or performance charts shown</span></div>
        </> : page === 'Report cards'
          ? reportTemplateId && reportTemplateSubjects
            ? <SchoolReportTemplate className={reportClassName} term={reportTerm} subjects={reportTemplateSubjects}/>
            : <section className="panel empty workspace-empty" role="status">
                <h2>Report template not uploaded</h2>
                <p>A report template for {reportClassName} is not available yet.</p>
              </section>
          : <section className="panel empty workspace-empty">
            <h2>Sign in to your school workspace</h2>
            <p>Score sheets contain private student information and are available only to authorised school staff.</p>
            <a className="primary" href="/login">Staff sign in <ArrowRight size={16}/></a>
          </section>}
      </main>
    </div>

    {help && <div className="modal-backdrop" onClick={() => setHelp(false)}>
      <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={event => event.stopPropagation()}>
        <button className="modal-close icon-button" aria-label="Close help" onClick={() => setHelp(false)}><X size={20}/></button>
        <span className="brand-icon"><BookOpen size={25}/></span>
        <h2 id="help-title">Welcome to Classfolio.</h2>
        <p>Use the preview to review supported templates and school setup.</p>
        <ol>
          <li><strong>Create a school account.</strong> Verify your email and add your school profile.</li>
          <li><strong>Set up classes and staff.</strong> Prepare your roster and invite your team.</li>
          <li><strong>Connect results and reports.</strong> Score entry and reporting will use saved school records.</li>
        </ol>
        <p className="help-note">This workspace preview contains no student names or scores. Score entry and reports are not yet connected to saved records here.</p>
        <a className="primary" href="/signup">Set up your school <ArrowRight size={16}/></a>
      </section>
    </div>}
  </div>
}
