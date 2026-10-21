// Demonstration records, deliberately separate from future persisted school data.
export const subjects = ['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Christian Religious Studies', 'Physics', 'Government', 'Agricultural Science', 'Economics', 'Civic Education', 'ICT', 'Further Mathematics']
export const names = ['Chisom Okafor', 'Joseph Adeyemi', 'Aisha Bello', 'Emmanuel Eze', 'Zainab Ibrahim', 'Daniel Uche', 'Favour Obi', 'Samuel Adebayo', 'Esther Nwosu', 'Ibrahim Musa', 'Grace Edet', 'David Ojo', 'Blessing Akpan', 'Joshua Dada', 'Peace Ibe', 'Michael Usman']
export const classes = ['SS 1', 'SS 2', 'SS 3']
export const terms = ['First Term', 'Second Term', 'Third Term']
export type Scores = Record<string, [number, number]>
export function initialScores(): Scores {
  const result: Scores = {}
  classes.forEach((c, ci) => terms.forEach((t, ti) => names.forEach((_, i) => subjects.forEach((s, si) => {
    result[`${c}/${t}/${i}/${s}`] = [18 + ((i * 7 + si * 3 + ci + ti * 2) % 23), 25 + ((i * 11 + si * 7 + ci * 3 + ti * 4) % 36)]
  }))))
  return result
}
export function grade(total: number) { return total >= 80 ? 'A' : total >= 70 ? 'B+' : total >= 60 ? 'B' : total >= 50 ? 'C' : total >= 45 ? 'D' : total >= 40 ? 'E' : 'F' }
export const remarks: Record<string, string> = { A: 'Distinction', 'B+': 'Very good', B: 'Good', C: 'Average', D: 'Weak', E: 'Very weak', F: 'Fail' }
export function ordinal(n: number) { return `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'}` }
