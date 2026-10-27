import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, BookOpen, ClipboardCheck, FileText, GraduationCap, Menu, ShieldCheck, Users } from 'lucide-react'
import type { MouseEvent } from 'react'
import '../landing.css'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  return <div className="landing-page official-landing">
    <header className="landing-header">
      <a className="landing-brand" href="/" aria-label="Classfolio home">
        <span className="brand-icon"><BookOpen size={22}/></span>
        <span className="landing-product-name">Classfolio</span>
      </a>
      <details className="landing-menu">
        <summary aria-label="Open site menu"><Menu size={18}/> Menu</summary>
        <nav aria-label="Site menu">
          <a href="/signup" onClick={closeLandingMenu}>School signup</a>
          <a href="/login" onClick={closeLandingMenu}>Staff login</a>
          <a href="#reports" onClick={closeLandingMenu}>Report cards</a>
          <a href="#worksheets" onClick={closeLandingMenu}>Worksheets</a>
          <a href="#curriculum" onClick={closeLandingMenu}>Curriculum</a>
        </nav>
      </details>
    </header>

    <main className="official-landing-main">
      <section className="official-welcome">
        <div className="official-welcome-copy">
          <span className="landing-kicker"><ShieldCheck size={16}/> FOR SCHOOL ADMINISTRATORS</span>
          <h1>One workspace for your school’s records.</h1>
          <p>Classfolio helps school administrators organize classes, choose a curriculum, manage staff and student records, and prepare term score sheets.</p>
          <div className="landing-hero-actions">
            <a className="landing-cta" href="/signup">Create a school account <ArrowRight size={17}/></a>
            <a className="landing-text-link" href="/login">Staff login</a>
          </div>
          <p className="official-privacy"><ShieldCheck size={16}/> Each school manages its own name, logo, colours, classes, and subject choices in its private workspace.</p>
        </div>
        <aside className="official-status-card" aria-label="Who can use Classfolio">
          <div className="official-status-heading"><Users size={21}/><div><strong>School-managed access</strong><span>For administrators and authorized staff</span></div></div>
          <ul>
            <li><GraduationCap size={18}/><span>Administrators set up the school and choose its curriculum.</span><b>Admin</b></li>
            <li><ClipboardCheck size={18}/><span>Authorized staff use their school’s configured classes and subjects.</span><b>Staff</b></li>
            <li><FileText size={18}/><span>School branding and records stay in that school’s workspace.</span><b>Private</b></li>
          </ul>
        </aside>
      </section>

      <section className="official-workflow curriculum-section" id="curriculum">
        <div className="official-section-title">
          <span>CURRICULUM CHOICE</span>
          <h2>Choose subjects that fit your school.</h2>
          <p>Administrators can add a subject pack to their school catalogue, then choose and edit subjects class by class. Packs are suggestions, not official grade-by-grade mappings.</p>
        </div>
        <div className="official-area-grid curriculum-pack-grid">
          <article><BookOpen size={23}/><strong>Nigerian subject options</strong><span>Start with the school’s Nigerian class subject lists and add or adjust subjects to match its curriculum.</span></article>
          <article><BookOpen size={23}/><strong>British / Cambridge suggestions</strong><span>Add an optional catalogue of subjects for schools using British or Cambridge programmes.</span></article>
          <article><BookOpen size={23}/><strong>Turkish / MEB suggestions</strong><span>Add an optional catalogue of Turkish-language subject suggestions, then configure each class.</span></article>
        </div>
        <p className="curriculum-note">Schools can also add their own subjects. Subject packs do not change class lists until an administrator selects and saves those subjects.</p>
      </section>

      <section className="official-workflow landing-capabilities">
        <div className="official-section-title">
          <span>ADMINISTRATIVE WORKSPACE</span>
          <h2>Tools for everyday school administration.</h2>
        </div>
        <div className="official-area-grid">
          <article id="worksheets"><ClipboardCheck size={23}/><strong>Score sheets</strong><span>Authorized staff enter and save draft test and examination scores for students enrolled in each configured class subject.</span></article>
          <article id="reports"><FileText size={23}/><strong>Report cards</strong><span>School-branded report layouts use the subjects configured by each school. Saved-result report generation is not connected yet.</span></article>
          <article><Users size={23}/><strong>School records</strong><span>Administrators manage school details, staff access, classes, subject catalogues, and student enrolments.</span></article>
        </div>
      </section>

      <section className="landing-how official-how" id="how-it-works">
        <div>
          <span className="landing-kicker">HOW IT WORKS</span>
          <h2>Set up your school, then manage it in its own workspace.</h2>
          <p>Create an administrator account to start configuring a private workspace for your school. Existing staff can sign in to access the permissions and classes assigned to them.</p>
          <a className="landing-cta" href="/signup">Register your school <ArrowRight size={16}/></a>
        </div>
        <ol className="landing-steps">
          <li><span>01</span><div><strong>Create the school account</strong><p>Verify the administrator email and enter the school profile.</p></div></li>
          <li><span>02</span><div><strong>Choose classes and subjects</strong><p>Add curriculum suggestions if needed, then select subjects for each class.</p></div></li>
          <li><span>03</span><div><strong>Set up staff and records</strong><p>Enroll students, assign staff, and use the school’s configured score-entry workspace.</p></div></li>
        </ol>
      </section>
    </main>

    <footer className="landing-footer official-landing-footer">
      <span className="landing-footer-product">Classfolio <small>School administration</small></span>
      <span>Each school manages its own workspace and branding.</span>
      <a href="/login">Staff login</a>
    </footer>
  </div>
}

function closeLandingMenu(event: MouseEvent<HTMLAnchorElement>) {
  event.currentTarget.closest('details')?.removeAttribute('open')
}
