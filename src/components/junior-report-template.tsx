import { juniorSubjects } from '../data/curriculum'
import '../report-template.css'

const gradeScale = [
  ['DISTINCTION', 'A'],
  ['VERY GOOD', 'B+'],
  ['GOOD', 'B'],
  ['AVERAGE', 'C'],
  ['POOR', 'D'],
  ['FAIL', 'E'],
]

const affectiveDomain = [
  'Punctuality',
  'Leadership',
  'Attitude to School Work',
  'Attentiveness',
  'Relationship with others',
  'Honesty',
  'Emotional Stability',
]

const psychomotorSkills = [
  'Verbal Fluency',
  'Sports and Games',
  'Attitude to School Work',
  'Handwriting',
  'Musical Skills',
]

function BlankField({ label, className = '' }: { label: string; className?: string }) {
  return <div className={`jss-field ${className}`}><span>{label}</span><i aria-hidden="true"/></div>
}

export function JuniorReportTemplate() {
  return <section className="jss-report-preview">
    <div className="jss-report-preview-note">
      <strong>Blank template preview</strong>
      <span>This follows the supplied JSS report design. No student details, marks, or junior grading calculations are filled in.</span>
    </div>
    <article className="jss-report-card" aria-label="Blank Kilimanjaro International School junior terminal report template">
      <header className="jss-report-header">
        <img src="/kilimanjaro-international-school-logo.jpeg" alt="Kilimanjaro International School crest"/>
        <div>
          <h2>KILIMANJARO INTERNATIONAL SCHOOL</h2>
          <p>PLOT 998 JIKWOYI LAYOUT, AGWANGEDE, JIKWOYI – KARSHI ROAD, ABUJA</p>
          <h3>TERMINAL REPORT SHEET</h3>
        </div>
      </header>

      <section className="jss-student-fields" aria-label="Student and term information">
        <BlankField label="NAME" className="field-full"/>
        <BlankField label="ADMISSION NUMBER"/>
        <BlankField label="CLASS"/>
        <BlankField label="TERM"/>
        <BlankField label="SESSION"/>
        <BlankField label="HOUSE"/>
        <BlankField label="TOTAL NO. IN CLASS"/>
        <BlankField label="ATTENDANCE"/>
        <BlankField label="OUT OF"/>
        <BlankField label="AGE"/>
      </section>

      <section className="jss-report-totals" aria-label="Report totals">
        <BlankField label="TOTAL MARKS OBTAINED"/>
        <BlankField label="TOTAL MARKS OBTAINABLE"/>
        <BlankField label="AVERAGE"/>
        <BlankField label="GRADE"/>
      </section>

      <div className="jss-subject-table-scroll">
        <table className="jss-subject-table">
          <thead>
            <tr>
              <th scope="col">S/N</th>
              <th scope="col">SUBJECTS</th>
              <th scope="col">TEST<br/>(40)</th>
              <th scope="col">EXAM<br/>(60)</th>
              <th scope="col">TOTAL<br/>(100)</th>
              <th scope="col">1ST<br/>TERM</th>
              <th scope="col">2ND<br/>TERM</th>
              <th scope="col">AVERAGE</th>
              <th scope="col">GRADE</th>
              <th scope="col">REMARK</th>
              <th scope="col">POSITION<br/>IN CLASS</th>
              <th scope="col">OUT OF</th>
              <th scope="col">TEACHER’S<br/>NAME</th>
            </tr>
          </thead>
          <tbody>
            {juniorSubjects.map((subject, index) => <tr key={subject}>
              <td>{index + 1}</td>
              <th scope="row">{subject.toUpperCase()}</th>
              {Array.from({ length: 11 }, (_, cell) => <td key={cell}/>)}
            </tr>)}
          </tbody>
        </table>
      </div>

      <div className="jss-report-bottom-grid">
        <section className="jss-reference-scale">
          <h4>REFERENCE SCALE</h4>
          <table>
            <thead><tr><th scope="col">SCALE</th><th scope="col">GRADE</th></tr></thead>
            <tbody>{gradeScale.map(([scale, grade]) => <tr key={grade}><td>{scale}</td><td>{grade}</td></tr>)}</tbody>
          </table>
          <p>Reference from supplied template; grading calculations are not configured.</p>
        </section>

        <section className="jss-domain-section">
          <h4>AFFECTIVE DOMAIN</h4>
          <table>
            <thead><tr><th scope="col">ATTRIBUTE</th><th scope="col">GRADE</th></tr></thead>
            <tbody>{affectiveDomain.map(item => <tr key={item}><th scope="row">{item}</th><td/></tr>)}</tbody>
          </table>
        </section>

        <section className="jss-domain-section">
          <h4>PSYCHOMOTOR SKILLS</h4>
          <table>
            <thead><tr><th scope="col">SKILL</th><th scope="col">GRADE</th></tr></thead>
            <tbody>{psychomotorSkills.map(item => <tr key={item}><th scope="row">{item}</th><td/></tr>)}</tbody>
          </table>
        </section>
      </div>

      <section className="jss-comments">
        <div><h4>CLASS TEACHER’S COMMENT</h4><i/></div>
        <div><h4>PRINCIPAL’S COMMENT</h4><i/></div>
      </section>
      <footer className="jss-report-footer">
        <BlankField label="NEXT TERM BEGINS" />
        <div className="jss-stamp-box"><span>SCHOOL STAMP</span></div>
      </footer>
    </article>
  </section>
}
