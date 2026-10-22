export const seniorSubjects = [
  'Mathematics',
  'English Language',
  'Biology',
  'Chemistry',
  'Christian Religious Studies',
  'Physics',
  'Government',
  'Agricultural Science',
  'Economics',
  'Civic Education',
  'ICT',
  'Geography',
  'Literature',
]

export const juniorSubjects = [
  'Mathematics',
  'English Studies',
  'Intermediate Science',
  'Global Perspectives',
  'Digital Technologies',
  'Physical Health Education',
  'Home Economics',
  'Agricultural Science',
  'Civic Education',
  'Christian Religious Studies',
  'Security Education',
  'Social Studies',
  'Cultural and Creative Arts',
  'History',
  'French',
  'Business Studies',
  'Hausa',
]

export const schoolClassNames = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

export function subjectsForClassName(className: string) {
  if (className === 'JSS 1' || className === 'JSS 2') return juniorSubjects
  if (className.startsWith('SS ')) return seniorSubjects
  return []
}

export function demoSubjectsForClass(className: string) {
  if (className === 'JSS 1' || className === 'JSS 2') return juniorSubjects
  if (className.startsWith('SS ')) return seniorSubjects
  return []
}
