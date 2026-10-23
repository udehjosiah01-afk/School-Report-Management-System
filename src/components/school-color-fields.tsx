import { DEFAULT_ACCENT_COLOR, DEFAULT_MAIN_COLOR, schoolColorsNeedContrastWarning } from '../data/school-branding'

export function SchoolColorFields({
  mainColor,
  accentColor,
  onChange,
}: {
  mainColor: string
  accentColor: string
  onChange: (colors: { mainColor: string; accentColor: string }) => void
}) {
  const showWarning = schoolColorsNeedContrastWarning(mainColor, accentColor)
  return <div className="school-color-fields">
    <label>Main colour<input type="color" value={mainColor || DEFAULT_MAIN_COLOR} onChange={event => onChange({ mainColor: event.target.value, accentColor })}/><small>Used for headings, navigation, and primary actions.</small></label>
    <label>Accent colour<input type="color" value={accentColor || DEFAULT_ACCENT_COLOR} onChange={event => onChange({ mainColor, accentColor: event.target.value })}/><small>Used for highlights and report details.</small></label>
    {showWarning && <p className="school-color-warning" role="status">These colours may be difficult to read together. Text contrast will be adjusted automatically; consider choosing darker colours for better readability.</p>}
  </div>
}
