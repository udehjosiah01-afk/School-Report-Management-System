import { useState } from 'react'

type StudentPassportUploadProps = {
  photoDataUrl: string | null
  studentName: string
  onChange: (photoDataUrl: string | null) => void
}

export function StudentPassportUpload({ photoDataUrl, studentName, onChange }: StudentPassportUploadProps) {
  const [error, setError] = useState('')

  function selectPhoto(file: File | undefined) {
    setError('')
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Choose a PNG, JPG, or WebP passport photo.')
      return
    }
    if (file.size > 512 * 1024) {
      setError('The learner passport photo must be 512 KB or smaller.')
      return
    }

    const reader = new FileReader()
    reader.onerror = () => setError('The passport photo could not be read. Please try another image.')
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setError('The passport photo could not be read. Please try another image.')
        return
      }
      onChange(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return <div className="student-passport-upload">
    <label>Learner passport photograph <span className="optional-label">(optional · PNG, JPG, or WebP · up to 512 KB)</span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-describedby={error ? 'student-photo-error' : undefined}
        onChange={event => {
          selectPhoto(event.currentTarget.files?.[0])
          event.currentTarget.value = ''
        }}
      />
    </label>
    {photoDataUrl && <div className="student-photo-preview">
      <img src={photoDataUrl} alt={`${studentName || 'Learner'} passport photo preview`}/>
      <button className="secondary" type="button" onClick={() => { setError(''); onChange(null) }}>Remove photo</button>
    </div>}
    {error && <p className="form-error" id="student-photo-error" role="alert">{error}</p>}
  </div>
}
