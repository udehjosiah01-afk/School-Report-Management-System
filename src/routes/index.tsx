import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, BookOpen, ClipboardCheck, FileText, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import '../landing.css'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  return <div className="landing-page official-landing">
    <header className="landing-header">
      <a className="landing-brand" href="/" aria-label="Classfolio home">
        <span className="brand-icon"><BookOpen size={22}/></span>
        <span className="landing-product-name">Classfolio</span>
      </a>
      <div className="landing-actions">
        <a className="landing-signin" href="/login">Staff sign in</a>
        <a className="landing-cta landing-cta-small" href="/signup">Register your school <ArrowRight size={16}/></a>
      </div>
    </header>

    <main className="official-landing-main">
      <section className="official-welcome">
        <div className="official-welcome-copy">
          <span className="landing-kicker"><ShieldCheck size={16}/> SCHOOL ADMINISTRATION SYSTEM</span>
          <h1>School records and term reporting</h1>
          <p>A school-managed workspace for class setup, student records, staff access, and term results.</p>
          <div className="landing-hero-actions">
            <a className="landing-cta" href="/signup">Register your school <ArrowRight size={17}/></a>
            <a className="landing-text-link" href="/login">Sign in to an existing school</a>
          </div>
          <p className="official-privacy"><ShieldCheck size={16}/> Each school’s records are kept in its own workspace.</p>
        </div>
        <div className="official-status-card">
          <div className="official-status-heading"><BookOpen size={21}/><div><strong>Workspace status</strong><span>Current system capabilities</span></div></div>
          <ul>
            <li><Users size={18}/><span>School profile, classes, staff, and student enrolments</span><b>Available</b></li>
            <li><ClipboardCheck size={18}/><span>Role-checked draft-score operation</span><b>Foundation only</b></li>
            <li><FileText size={18}/><span>Saved-result report generation</span><b>In development</b></li>
          </ul>
        </div>
      </section>

      <section className="official-workflow">
        <div className="official-section-title"><span>WORKSPACE AREAS</span><h2>Manage school records in one place</h2></div>
        <div className="official-area-grid">
          <a href="/signup"><GraduationCap size={23}/><strong>School profile</strong><span>Set your name, logo, colours, classes, and curriculum.</span><ArrowRight size={17}/></a>
          <a href="/login"><Users size={23}/><strong>Staff and students</strong><span>Manage school memberships, class rosters, and access.</span><ArrowRight size={17}/></a>
          <a href="/workspace"><FileText size={23}/><strong>Reports and results</strong><span>Review the report layout and current system status.</span><ArrowRight size={17}/></a>
        </div>
      </section>
    </main>

    <footer className="landing-footer official-landing-footer">
      <span className="landing-footer-product">Classfolio <small>School records</small></span>
      <span>School administration and term reporting</span>
      <a href="/workspace">View workspace preview</a>
    </footer>
  </div>
}
