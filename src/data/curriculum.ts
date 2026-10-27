export const seniorSubjects = [
  'Mathematics',
  'English Language',
  'Chemistry',
  'Commerce',
  'Literature',
  'Physics',
  'Government',
  'Geography',
  'Biology',
  'Further Mathematics',
  'Economics',
  'Agricultural Science',
  'Technical Drawing',
  'C.R.S.',
  'Digital Technologies',
  'Citizenship and Heritage Studies',
  'Global Perspective',
  'Trade',
]

export const juniorSubjects = [
  'Mathematics',
  'English',
  'Intermediate Science',
  'Business Studies',
  'Global Perspective',
  'Digital Technologies',
  'Social and Citizenship Studies',
  'Cultural and Creative Arts',
  'Christian Religious Studies',
  'Hausa',
  'Physical and Health Education',
  'Nigerian History',
  'Trade',
  'French',
]

export const jss3Subjects = [
  'Mathematics',
  'English',
  'Basic Science',
  'Basic Technology',
  'Information Communication Technology',
  'Social Studies',
  'Security Education',
  'Business Studies',
  'Cultural and Creative Arts',
  'Christian Religious Studies',
  'Hausa',
  'Physical and Health Education',
  'Nigerian History',
  'Agric Science',
  'Home Economics',
  'Civic Education',
  'French',
]

export const workbookSeniorSubjects = [
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

export const schoolClassNames = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3']

export function subjectsForClassName(className: string) {
  if (className === 'JSS 1' || className === 'JSS 2') return juniorSubjects
  if (className === 'JSS 3') return jss3Subjects
  if (className === 'SS 1' || className === 'SS 2' || className === 'SS 3') return seniorSubjects
  return []
}

export function demoSubjectsForClass(className: string) {
  return subjectsForClassName(className)
}
