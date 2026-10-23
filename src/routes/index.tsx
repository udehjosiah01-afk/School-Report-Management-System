import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Check, ClipboardCheck, FileText, GraduationCap, ShieldCheck, Sprout, Users } from 'lucide-react'
import '../landing.css'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  return <div className="landing-page">
    <header className="landing-header">
      <a className="landing-brand" href="/" aria-label="Classfolio home">
        <span className="brand-icon"><BookOpen size={22}/></span>
        classfolio<span className="brand-dot">.</span>
      </a>
      <nav className="landing-nav" aria-label="Main navigation">
        <a href="#why-classfolio">Why Classfolio</a>
        <a href="#how-it-works">How it works</a>
      </nav>
      <div className="landing-actions">
        <a className="landing-signin" href="/login">Staff sign in</a>
        <a className="landing-cta landing-cta-small" href="/signup">Create school account <ArrowRight size={16}/></a>
      </div>
    </header>

    <main>
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-kicker"><Sprout size={15}/> SCHOOL RESULTS, WITH ROOM TO BREATHE</span>
          <h1>Less time chasing marks.<br/><em>More time for progress.</em></h1>
          <p>Bring your school’s classes, staff and term results into one thoughtful workspace, built for the way schools work.</p>
          <div className="landing-hero-actions">
            <a className="landing-cta" href="/signup">Set up your school <ArrowRight size={17}/></a>
            <a className="landing-text-link" href="/login">Already have an account? Sign in</a>
          </div>
          <div className="landing-trust"><ShieldCheck size={17}/><span>Each school gets its own private workspace.</span></div>
        </div>

        <div className="landing-visual" aria-label="Illustration of a school report card">
          <div className="landing-orbit orbit-one"/>
          <div className="landing-orbit orbit-two"/>
          <div className="landing-leaf"><Sprout size={28}/></div>
          <article className="landing-report">
            <div className="landing-report-top">
              <span className="landing-report-seal"><GraduationCap size={21}/></span>
              <span><strong>TERM REPORT</strong><small>YOUR SCHOOL NAME</small></span>
              <span className="landing-report-mark"><Check size={16}/></span>
            </div>
            <div className="landing-report-title">
              <span>STUDENT</span><i/>
              <span>CLASS &amp; TERM</span><i/>
            </div>
            <div className="landing-report-table">
              <div className="landing-report-row table-head"><span>SUBJECT</span><span>SCORE</span><span>GRADE</span></div>
              {['English language', 'Mathematics', 'Basic science', 'Social studies'].map(subject => <div className="landing-report-row" key={subject}><span>{subject}</span><span>—</span><span>—</span></div>)}
            </div>
            <div className="landing-report-footer"><span>TEACHER’S COMMENT</span><i/><b>Progress, thoughtfully presented.</b></div>
          </article>
          <div className="landing-note"><FileText size={17}/><span><strong>Clear reports</strong><small>Designed around your school</small></span></div>
        </div>
      </section>

      <section className="landing-benefits" id="why-classfolio">
        <div className="landing-section-heading">
          <span className="landing-kicker">A BETTER WAY TO KEEP THE WHOLE PICTURE</span>
          <h2>Made for the work behind every report.</h2>
          <p>School administration should feel organised and clear, not like another pile of paperwork.</p>
        </div>
        <div className="landing-feature-grid">
          <article className="landing-feature">
            <span className="landing-feature-icon feature-sage"><GraduationCap size={21}/></span>
            <h3>A workspace for your school</h3>
            <p>Set up your school profile and keep its administration in a school-specific workspace.</p>
          </article>
          <article className="landing-feature">
            <span className="landing-feature-icon feature-sand"><Users size={20}/></span>
            <h3>Classes and people, together</h3>
            <p>Organise junior and senior classes, student records, staff, and subject assignments.</p>
          </article>
          <article className="landing-feature">
            <span className="landing-feature-icon feature-lilac"><ClipboardCheck size={20}/></span>
            <h3>Results that make sense</h3>
            <p>Bring term results into a clear report format that’s easier to review and share.</p>
          </article>
        </div>
      </section>

      <section className="landing-how" id="how-it-works">
        <div>
          <span className="landing-kicker">A SIMPLE PLACE TO START</span>
          <h2>Start with your school.<br/><em>Build from there.</em></h2>
          <p>Create an administrator account, verify your email, and add your school profile. You can then set up classes and staff in your private workspace.</p>
          <a className="landing-cta" href="/signup">Create your school workspace <ArrowRight size={17}/></a>
        </div>
        <ol className="landing-steps">
          <li><span>01</span><div><strong>Create an account</strong><p>Register with your school administrator email.</p></div></li>
          <li><span>02</span><div><strong>Set up your school</strong><p>Add your school profile and prepare your classes.</p></div></li>
          <li><span>03</span><div><strong>Bring your team in</strong><p>Invite staff and organise school records.</p></div></li>
        </ol>
      </section>
      <aside className="landing-status" role="note">
        <span><i/> Workspace status</span>
        <p>School registration and records setup are available. Score entry and reports still need to be connected to saved school records; the workspace preview contains no student names or scores.</p>
        <a href="/workspace">View the workspace preview <ArrowRight size={15}/></a>
      </aside>
    </main>

    <footer className="landing-footer">
      <a className="landing-brand" href="/" aria-label="Classfolio home"><span className="brand-icon"><BookOpen size={20}/></span>classfolio<span className="brand-dot">.</span></a>
      <span>Clearer school results. More room for what matters.</span>
      <a href="/workspace">View workspace preview</a>
    </footer>
  </div>
}
