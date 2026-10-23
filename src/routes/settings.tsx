import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentStaff } from '../server/auth'
import { getSchoolSetup } from '../server/school-actions'
import { SchoolBrandingSettings } from '../components/school-branding-settings'
import { schoolThemeStyle } from '../data/school-branding'

export const Route = createFileRoute('/settings')({
  beforeLoad: async () => {
    const staff = await getCurrentStaff()
    if (!staff) throw redirect({ to: '/login' })
    return { staff }
  },
  loader: () => getSchoolSetup(),
  component: SchoolSettings,
})

function SchoolSettings() {
  const { staff } = Route.useRouteContext()
  const setup = Route.useLoaderData()

  return <main className="records-page" style={schoolThemeStyle(setup.school?.mainColor, setup.school?.accentColor)}>
    <header className="records-header">
      <a className="records-school-brand" href="/school-data">
        {setup.school?.logoUrl
          ? <img src={setup.school.logoUrl} alt=""/>
          : <span className="records-school-seal"><span>{setup.school?.name?.slice(0, 1) || 'S'}</span></span>}
        <span><strong>{setup.school?.name ?? 'School workspace'}</strong><small>School settings <i>·</i> Classfolio</small></span>
      </a>
      <a className="secondary" href="/school-data">School workspace</a>
    </header>
    <div className="records-content">
      <div className="eyebrow">SCHOOL ADMINISTRATION</div>
      <h1>Settings</h1>
      <p>Manage the official school identity used across your workspace and report cards.</p>
      {staff.roles.includes('admin')
        ? setup.school
          ? <section className="records-section">
              <h2>School identity and appearance</h2>
              <p>Choose a logo and colours for your school. Text contrast is adjusted automatically, and low-contrast choices are flagged before saving.</p>
              <SchoolBrandingSettings school={setup.school}/>
            </section>
          : <p className="records-empty">School profile information is not available.</p>
        : <p className="records-empty" role="status">Only a school administrator can change these settings.</p>}
    </div>
  </main>
}
