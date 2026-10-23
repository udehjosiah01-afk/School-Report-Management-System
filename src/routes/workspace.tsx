import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, ArrowUpRight, BookOpen, ChevronDown, ClipboardList, FileText, GraduationCap, HelpCircle, LayoutDashboard, Menu, Plus, Printer, Sprout, Users, X } from 'lucide-react'
import { classes, subjectsByClass } from '../data/fixtures'
import { JuniorReportTemplate } from '../components/junior-report-template'

export const Route = createFileRoute('/workspace')({ component: WorkspacePreview })

type Page = 'Overview' | 'Score sheet' | 'Report cards'

function WorkspacePreview() {
  const [page, setPage] = useState<Page>('Overview')
  const [help, setHelp] = useState(false)
  const [menu, setMenu] = useState(false)

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
            <div className="eyebrow">A CLEARER PICTURE OF PROGRESS</div>
            <h1>{page === 'Overview' ? 'Set up your school workspace.' : page === 'Score sheet' ? 'Add a roster to begin score entry.' : 'Junior terminal report.'}</h1>
            <p>{page === 'Overview' ? 'Create your school account to add classes, students, and staff.' : page === 'Score sheet' ? 'Score entry will be available after your school records and student roster are connected.' : 'A blank print preview based on your supplied school report template.'}</p>
          </div>
          {page === 'Report cards'
            ? <button className="primary" onClick={() => window.print()}><Printer size={17}/> Print blank template</button>
            : <a className="primary" href="/signup"><Plus size={17}/> Set up your school</a>}
        </div>

        {page === 'Overview' ? <>
          <div className="stats-grid">
            {[
              { label: 'Students enrolled', value: '0', foot: 'No school records loaded', tint: 'sage', icon: Users },
              { label: 'Class levels', value: String(classes.length), foot: 'Available during school setup', tint: 'sand', icon: GraduationCap },
              { label: 'Saved scores', value: '0', foot: 'Score entry is not connected here yet', tint: 'blue', icon: ClipboardList },
              { label: 'Reports ready', value: '0', foot: 'Reports use saved school records', tint: 'lilac', icon: FileText },
            ].map(item => <article className="stat-card" key={item.label}>
              <div className="stat-top"><span>{item.label}</span><span className={`stat-icon ${item.tint}`}><item.icon size={18}/></span></div>
              <strong className="stat-value">{item.value}</strong>
              <small>{item.foot}</small>
            </article>)}
          </div>

          <div className="middle-grid">
            <section className="panel performance">
              <div className="panel-heading"><div><h2>Performance overview</h2><p>Class results will appear when school records are available.</p></div></div>
              <div className="empty">No student scores are loaded.</div>
              <div className="chart-footer"><span>Results will be calculated from saved school records.</span><button className="text-button" onClick={() => navigate('Score sheet')}>Score sheet <ArrowRight size={15}/></button></div>
            </section>
            <section className="report-callout">
              <span className="pill">REPORTING FOR YOUR SCHOOL</span>
              <h2>Clear results.<br/>Thoughtfully reported.</h2>
              <p>Your report cards will be available here after student records and scores are connected.</p>
              <div className="paper-art" aria-hidden="true"><div className="paper-stamp"><GraduationCap size={19}/></div><div className="paper-heading"/><div className="paper-subtitle"/><div className="paper-rule"/><div className="paper-line"><i/><b/></div><div className="paper-line"><i/><b/></div><div className="paper-line"><i/><b/></div><div className="paper-line"><i/><b/></div></div>
              <button onClick={() => navigate('Report cards')}>Go to reports <ArrowUpRight size={17}/></button>
            </section>
          </div>

          <section className="panel class-panel">
            <div className="panel-heading"><div><h2>Classes supported</h2><p>Set up your school to configure classes and enroll students.</p></div><span className="count-tag">{classes.length} class levels</span></div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>CLASS</th><th>STUDENTS</th><th>SUBJECTS</th><th>CLASS AVERAGE</th><th>SETUP</th><th/></tr></thead>
                <tbody>{classes.map((schoolClass, index) => <tr key={schoolClass}>
                  <td><span className={`class-symbol symbol-${index % 3}`}><GraduationCap size={18}/></span><strong>{schoolClass}</strong><small className="inline-secondary">{schoolClass.startsWith('JSS') ? 'Junior secondary' : 'Senior secondary'}</small></td>
                  <td>0 <span className="muted">students</span></td>
                  <td>{subjectsByClass[schoolClass].length} <span className="muted">subjects</span></td>
                  <td><strong>—</strong></td>
                  <td><span className="status">Not set up</span></td>
                  <td><a className="row-action" href="/signup">Set up <ArrowRight size={15}/></a></td>
                </tr>)}</tbody>
              </table>
            </div>
          </section>
          <div className="bottom-note"><span><Sprout size={15}/> Built around your school. Designed for your everyday.</span><span>No student records or scores loaded</span></div>
        </> : page === 'Report cards'
          ? <JuniorReportTemplate/>
          : <section className="panel empty workspace-empty">
            <h2>No student roster yet</h2>
            <p>Score entry will be available after your school records and student roster are connected.</p>
            <a className="primary" href="/signup">Set up your school <ArrowRight size={16}/></a>
          </section>}
      </main>
    </div>

    {help && <div className="modal-backdrop" onClick={() => setHelp(false)}>
      <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={event => event.stopPropagation()}>
        <button className="modal-close icon-button" aria-label="Close help" onClick={() => setHelp(false)}><X size={20}/></button>
        <span className="brand-icon"><BookOpen size={25}/></span>
        <h2 id="help-title">Welcome to Classfolio.</h2>
        <p>Your school’s results, with room to breathe.</p>
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
