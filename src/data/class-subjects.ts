export type ClassSubjectCatalogItem = {
  id: string
  name: string
}

export type ClassSubjectLink = {
  classId: string
  subjectId: string
}

export function getConfiguredSubjectsForClass(
  catalogue: readonly ClassSubjectCatalogItem[],
  classSubjects: readonly ClassSubjectLink[],
  classId: string,
) {
  const selectedIds = new Set(
    classSubjects
      .filter(link => link.classId === classId)
      .map(link => link.subjectId),
  )
  return catalogue.filter(subject => selectedIds.has(subject.id))
}
