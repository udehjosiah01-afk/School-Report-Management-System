import { useState } from 'react'

export function StudentPassportPhotoField({
  value,
  onChange,
  label = 'Learner passport photo',
}: {
  value?: string | null
  onChange: (dataUrl: string | null) => void
  label?: string
}) {
  const [error, setError] = useState('')

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      onChange(null)
      return
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Please upload a PNG, JPG, or WEBP image.')
      onChange(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      if (!result) {
        setError('The image could not be read.')
        onChange(null)
        return
      }
      setError('')
      onChange(result)
    }
    reader.readAsDataURL(file)
  }

  return <label className="school-logo-upload school-passport-upload">
    <span>{label}</span>
    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleChange} />
    {value
      ? <img src={value} alt="Passport preview" className="school-passport-preview" />
      : <span className="school-passport-placeholder">No learner photo uploaded yet.</span>}
    {error && <small className="form-error">{error}</small>}
  </label>
}
