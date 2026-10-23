import { useState } from 'react'

const allowedLogoTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])
const maxLogoBytes = 512 * 1024

type SchoolLogoUploadProps = {
  logoUrl: string | null
  schoolName: string
  onChange: (logoUrl: string | null) => void
}

export function SchoolLogoUpload({ logoUrl, schoolName, onChange }: SchoolLogoUploadProps) {
  const [error, setError] = useState('')

  function selectLogo(file: File | undefined) {
    setError('')
    if (!file) return
    if (!allowedLogoTypes.has(file.type)) {
      setError('Choose a PNG, JPG, or WebP image.')
      return
    }
    if (file.size > maxLogoBytes) {
      setError('The school logo must be 512 KB or smaller.')
      return
    }

    const reader = new FileReader()
    reader.onerror = () => setError('The logo file could not be read. Please try another image.')
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setError('The logo file could not be read. Please try another image.')
        return
      }
      onChange(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return <div className="school-logo-upload">
    <label>School logo <span className="optional-label">(optional · PNG, JPG, or WebP · up to 512 KB)</span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-describedby={error ? 'school-logo-error' : undefined}
        onChange={event => {
          selectLogo(event.currentTarget.files?.[0])
          event.currentTarget.value = ''
        }}
      />
    </label>
    {logoUrl && <div className="school-logo-preview">
      <img src={logoUrl} alt={`${schoolName || 'School'} logo preview`}/>
      <button className="secondary" type="button" onClick={() => { setError(''); onChange(null) }}>Remove logo</button>
    </div>}
    {error && <p className="form-error" id="school-logo-error" role="alert">{error}</p>}
  </div>
}
