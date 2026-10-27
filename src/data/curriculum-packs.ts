import { juniorSubjects, jss3Subjects, seniorSubjects } from './curriculum.ts'

export const curriculumPacks = {
  nigeria: {
    name: 'Current Nigerian school defaults',
    subjects: [...new Set([...juniorSubjects, ...jss3Subjects, ...seniorSubjects])],
  },
  british: {
    name: 'British / Cambridge suggestions',
    subjects: [
      'English Language',
      'English Literature',
      'Mathematics',
      'Additional Mathematics',
      'Biology',
      'Chemistry',
      'Physics',
      'Combined Science',
      'Computer Science',
      'Information and Communication Technology',
      'Business Studies',
      'Economics',
      'Accounting',
      'Geography',
      'History',
      'Global Perspectives',
      'Citizenship',
      'Art and Design',
      'Design and Technology',
      'Music',
      'Physical Education',
      'Foreign Language',
    ],
  },
  turkish: {
    name: 'Turkish / MEB suggestions',
    subjects: [
      'Türkçe',
      'Türk Dili ve Edebiyatı',
      'Matematik',
      'Fen Bilimleri',
      'Fizik',
      'Kimya',
      'Biyoloji',
      'Sosyal Bilgiler',
      'Tarih',
      'T.C. İnkılap Tarihi ve Atatürkçülük',
      'Coğrafya',
      'Felsefe',
      'Din Kültürü ve Ahlak Bilgisi',
      'Yabancı Dil',
      'Bilişim Teknolojileri ve Yazılım',
      'Teknoloji ve Tasarım',
      'Görsel Sanatlar',
      'Müzik',
      'Beden Eğitimi ve Spor',
      'Rehberlik ve Kariyer Planlama',
    ],
  },
} as const

export type CurriculumPackId = keyof typeof curriculumPacks

export function getCurriculumPack(packId: string) {
  return Object.hasOwn(curriculumPacks, packId)
    ? curriculumPacks[packId as CurriculumPackId]
    : null
}
