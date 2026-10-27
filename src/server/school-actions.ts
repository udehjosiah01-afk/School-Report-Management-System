import { createServerFn } from '@tanstack/react-start'
import { schoolClassNames, subjectsForClassName } from '../data/curriculum'
import { getCurriculumPack } from '../data/curriculum-packs'
import { isUuid } from '../data/score-validation'
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_MAIN_COLOR,
  validateSchoolColor,
  validateSchoolLogoDataUrl,
  validateStudentPhotoDataUrl,
} from '../data/school-branding'

async function loadServerDependencies() {
  const [identity, drizzle, schema, auth, database] = await Promise.all([
    import('@netlify/identity'),
    import('drizzle-orm').then(module => module),
    import('../data/schema'),
    import('./auth.server'),
    import('./database'),
  ])
  return { ...identity, ...drizzle, ...schema, ...auth, ...database }
}

function objectInput(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('A valid form submission is required.')
  }
  return value as Record<string, unknown>
}

function requiredText(value: unknown, label: string, maxLength = 120) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > maxLength) {
    throw new Error(`${label} is required and must be ${maxLength} characters or fewer.`)
  }
  return value.trim()
}

function requiredId(value: unknown, label: string) {
  if (!isUuid(value)) throw new Error(`${label} is invalid.`)
  return value
}

function validateSchool(value: unknown) {
  const input = objectInput(value)
  const contactEmail = requiredText(input.contactEmail, 'School contact email', 254).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error('Enter a valid school contact email address.')
  }
  return {
    name: requiredText(input.name, 'School name', 160),
    address: requiredText(input.address, 'School address', 300),
    phone: requiredText(input.phone, 'School phone number', 40),
    contactEmail,
    motto: typeof input.motto === 'string' ? input.motto.trim().slice(0, 160) : '',
    logoUrl: validateSchoolLogoDataUrl(input.logoUrl),
    mainColor: validateSchoolColor(input.mainColor, 'Main colour', DEFAULT_MAIN_COLOR),
    accentColor: validateSchoolColor(input.accentColor, 'Accent colour', DEFAULT_ACCENT_COLOR),
  }
}

function validateName(value: unknown) {
  return { name: requiredText(objectInput(value).name, 'Name') }
}

function validateCurriculumPack(value: unknown) {
  const packId = requiredText(objectInput(value).packId, 'Curriculum pack', 40)
  if (!getCurriculumPack(packId)) throw new Error('Select a supported curriculum subject pack.')
  return { packId }
}

function validateTerm(value: unknown) {
  const input = objectInput(value)
  const name = requiredText(input.name, 'Term')
  if (!['First Term', 'Second Term', 'Third Term'].includes(name)) {
    throw new Error('Select First Term, Second Term, or Third Term.')
  }
  return {
    name,
    academicYear: requiredText(input.academicYear, 'Academic year', 20),
  }
}

function validateStudent(value: unknown) {
  const input = objectInput(value)
  const rawSubjectIds = input.subjectIds
  if (!Array.isArray(rawSubjectIds) || rawSubjectIds.length === 0 || rawSubjectIds.length > 50) {
    throw new Error('Select one or more subjects registered for this class.')
  }
  const subjectIds = rawSubjectIds.map(subjectId => requiredId(subjectId, 'Subject'))
  if (new Set(subjectIds).size !== subjectIds.length) {
    throw new Error('A subject can only be selected once.')
  }
  return {
    admissionNumber: requiredText(input.admissionNumber, 'Admission number', 40),
    firstName: requiredText(input.firstName, 'First name', 80),
    lastName: requiredText(input.lastName, 'Last name', 80),
    passportPhotoDataUrl: validateStudentPhotoDataUrl(input.passportPhotoDataUrl),
    classId: requiredId(input.classId, 'Class'),
    academicYear: requiredText(input.academicYear, 'Academic year', 20),
    subjectIds,
  }
}

function validateScoreSheet(value: unknown) {
  const input = objectInput(value)
  const accessCode = input.accessCode
  if (accessCode !== undefined && (typeof accessCode !== 'string' || !/^\d{4}$/.test(accessCode))) {
    throw new Error('Enter a valid four-digit teacher access code.')
  }
  return {
    classId: requiredId(input.classId, 'Class'),
    subjectId: requiredId(input.subjectId, 'Subject'),
    termId: requiredId(input.termId, 'Term'),
    accessCode,
  }
}

function validateParentAccessInput(value: unknown) {
  const input = objectInput(value)
  const code = input.code
  if (typeof code !== 'string' || !/^\d{4}$/.test(code)) throw new Error('Enter a valid four-digit parent code.')
  const schoolEmail = requiredText(input.schoolEmail, 'School contact email', 254).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolEmail)) throw new Error('Enter a valid school contact email.')
  return {
    schoolEmail,
    admissionNumber: requiredText(input.admissionNumber, 'Admission number', 40),
    code,
  }
}

function validateClassSubjects(value: unknown) {
  const input = objectInput(value)
  const rawSubjectIds = input.subjectIds
  if (!Array.isArray(rawSubjectIds) || rawSubjectIds.length > 50) {
    throw new Error('Choose a valid subject list.')
  }
  const subjectIds = rawSubjectIds.map(subjectId => requiredId(subjectId, 'Subject'))
  if (new Set(subjectIds).size !== subjectIds.length) throw new Error('A subject can only be selected once.')
  return { classId: requiredId(input.classId, 'Class'), subjectIds }
}

function validateTeacherEmail(value: unknown) {
  const input = objectInput(value)
  const email = requiredText(input.email, 'Staff email', 254).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid staff email address.')
  return { email }
}

function validateRole(value: unknown) {
  const input = objectInput(value)
  const role = requiredText(input.role, 'Staff role', 20)
  if (role !== 'admin' && role !== 'teacher') throw new Error('Select administrator or teacher.')
  return { membershipId: requiredId(input.membershipId, 'Staff member'), role }
}

function validateAssignment(value: unknown) {
  const input = objectInput(value)
  return {
    identityUserId: requiredText(input.identityUserId, 'Staff account ID', 120),
    classId: requiredId(input.classId, 'Class'),
    subjectId: requiredId(input.subjectId, 'Subject'),
  }

  function validateStudentId(value: unknown) {
    return { studentId: requiredId(objectInput(value).studentId, 'Student') }
  }

  function validateStudentPhoto(value: unknown) {
    const input = objectInput(value)
    return {
      studentId: requiredId(input.studentId, 'Student'),
      passportPhotoDataUrl: validateStudentPhotoDataUrl(input.passportPhotoDataUrl),
    }
  }

  function validateTeacherCodeTarget(value: unknown) {
    const input = objectInput(value)
    return {
      identityUserId: requiredText(input.identityUserId, 'Teacher account ID', 120),
      classId: requiredId(input.classId, 'Class'),
      subjectId: requiredId(input.subjectId, 'Subject'),
    }
  }
}

export const registerSchool = createServerFn({ method: 'POST' })
  .validator(validateSchool)
  .handler(async ({ data }) => {
    const { getUser, getDb, schoolMemberships, eq, schools, schoolClasses, subjects, classSubjects } = await loadServerDependencies()
    const identity = await getUser()
    if (!identity?.email) throw new Error('Create and verify your email account before registering a school.')
    const db = getDb()
    return db.transaction(async tx => {
      const [existingMembership] = await tx
        .select({ id: schoolMemberships.id })
        .from(schoolMemberships)
        .where(eq(schoolMemberships.identityUserId, identity.id))
        .limit(1)
      if (existingMembership) throw new Error('This account already belongs to a school.')

      const [school] = await tx.insert(schools).values(data).returning()
      if (!school) throw new Error('Your school profile could not be created.')

      const [membership] = await tx.insert(schoolMemberships).values({
        schoolId: school.id,
        identityUserId: identity.id,
        role: 'admin',
      }).returning()
      if (!membership) throw new Error('Your school administrator account could not be created.')

      const classRows = await tx.insert(schoolClasses).values(
        schoolClassNames.map(name => ({ schoolId: school.id, name })),
      ).returning()
      const curriculumNames = [...new Set(schoolClassNames.flatMap(subjectsForClassName))]
      const subjectRows = await tx.insert(subjects).values(
        curriculumNames.map(name => ({ schoolId: school.id, name })),
      ).returning()
      const subjectByName = new Map(subjectRows.map(subject => [subject.name, subject.id]))
      const subjectRowsForClass = classRows.flatMap(schoolClass => {
        const names = subjectsForClassName(schoolClass.name)
        return names.map(name => ({
          schoolId: school.id,
          classId: schoolClass.id,
          subjectId: subjectByName.get(name)!,
        }))
      })
      if (subjectRowsForClass.length) await tx.insert(classSubjects).values(subjectRowsForClass)

      return {
        school: {
          id: school.id,
          name: school.name,
          address: school.address,
          phone: school.phone,
          contactEmail: school.contactEmail,
          motto: school.motto,
          logoUrl: school.logoUrl,
          mainColor: school.mainColor,
          accentColor: school.accentColor,
        },
        membershipId: membership.id,
      }
    })
  })

export const getSchoolSetup = createServerFn({ method: 'GET' }).handler(async () => {
  const {
    requireStaff, getDb, schools, eq, schoolClasses, asc, staffAssignments, and,
    subjects, classSubjects, academicTerms, studentEnrollments, students,
    studentSubjects, scoreEntries, count, isNotNull,
  } = await loadServerDependencies()
  const staff = await requireStaff()
  const db = getDb()
  const isAdmin = staff.role === 'admin'
  const schoolQuery = db.select({
    id: schools.id,
    name: schools.name,
    address: schools.address,
    phone: schools.phone,
    contactEmail: schools.contactEmail,
    motto: schools.motto,
    logoUrl: schools.logoUrl,
    mainColor: schools.mainColor,
    accentColor: schools.accentColor,
  }).from(schools).where(eq(schools.id, staff.schoolId)).limit(1)
  const classRows = isAdmin
    ? await db.select().from(schoolClasses).where(eq(schoolClasses.schoolId, staff.schoolId)).orderBy(asc(schoolClasses.name))
    : await db.selectDistinct({
        id: schoolClasses.id,
        schoolId: schoolClasses.schoolId,
        name: schoolClasses.name,
        createdAt: schoolClasses.createdAt,
      })
        .from(schoolClasses)
        .innerJoin(staffAssignments, and(
          eq(staffAssignments.classId, schoolClasses.id),
          eq(staffAssignments.schoolId, staff.schoolId),
        ))
        .where(eq(staffAssignments.identityUserId, staff.id))
        .orderBy(asc(schoolClasses.name))
  const subjectRows = isAdmin
    ? await db.select().from(subjects).where(eq(subjects.schoolId, staff.schoolId)).orderBy(asc(subjects.name))
    : await db.selectDistinct({
        id: subjects.id,
        schoolId: subjects.schoolId,
        name: subjects.name,
        createdAt: subjects.createdAt,
      })
        .from(subjects)
        .innerJoin(staffAssignments, and(
          eq(staffAssignments.subjectId, subjects.id),
          eq(staffAssignments.schoolId, staff.schoolId),
        ))
        .where(eq(staffAssignments.identityUserId, staff.id))
        .orderBy(asc(subjects.name))
  const classSubjectRows = await db
    .select({
      classId: classSubjects.classId,
      subjectId: classSubjects.subjectId,
    })
    .from(classSubjects)
    .where(eq(classSubjects.schoolId, staff.schoolId))
  const termRows = await db
    .select()
    .from(academicTerms)
    .where(eq(academicTerms.schoolId, staff.schoolId))
    .orderBy(asc(academicTerms.academicYear), asc(academicTerms.name))
  const enrollmentQuery = db.selectDistinct({
    id: studentEnrollments.id,
    studentId: students.id,
    admissionNumber: students.admissionNumber,
    firstName: students.firstName,
    lastName: students.lastName,
    classId: schoolClasses.id,
    className: schoolClasses.name,
    academicYear: studentEnrollments.academicYear,
  })
    .from(studentEnrollments)
    .innerJoin(students, and(
      eq(students.id, studentEnrollments.studentId),
      eq(students.schoolId, staff.schoolId),
    ))
    .innerJoin(schoolClasses, and(
      eq(schoolClasses.id, studentEnrollments.classId),
      eq(schoolClasses.schoolId, staff.schoolId),
    ))
  const enrollmentRows = isAdmin
    ? await enrollmentQuery
        .where(eq(studentEnrollments.schoolId, staff.schoolId))
        .orderBy(asc(studentEnrollments.academicYear), asc(schoolClasses.name), asc(students.lastName))
    : await enrollmentQuery
        .innerJoin(staffAssignments, and(
          eq(staffAssignments.classId, studentEnrollments.classId),
          eq(staffAssignments.schoolId, staff.schoolId),
        ))
        .where(and(
          eq(studentEnrollments.schoolId, staff.schoolId),
          eq(staffAssignments.identityUserId, staff.id),
        ))
        .orderBy(asc(studentEnrollments.academicYear), asc(schoolClasses.name), asc(students.lastName))
  const [expectedScoreRows, completeScoreRows] = isAdmin
    ? await Promise.all([
        db.select({
          classId: studentEnrollments.classId,
          academicYear: studentEnrollments.academicYear,
          expectedCount: count(),
        })
          .from(studentSubjects)
          .innerJoin(studentEnrollments, and(
            eq(studentEnrollments.id, studentSubjects.enrollmentId),
            eq(studentEnrollments.schoolId, staff.schoolId),
          ))
          .where(eq(studentSubjects.schoolId, staff.schoolId))
          .groupBy(studentEnrollments.classId, studentEnrollments.academicYear),
        db.select({
          classId: studentEnrollments.classId,
          termId: scoreEntries.termId,
          academicYear: studentEnrollments.academicYear,
          completeCount: count(),
        })
          .from(scoreEntries)
          .innerJoin(studentEnrollments, and(
            eq(studentEnrollments.id, scoreEntries.enrollmentId),
            eq(studentEnrollments.schoolId, staff.schoolId),
          ))
          .innerJoin(academicTerms, and(
            eq(academicTerms.id, scoreEntries.termId),
            eq(academicTerms.schoolId, staff.schoolId),
            eq(academicTerms.academicYear, studentEnrollments.academicYear),
          ))
          .where(and(
            eq(scoreEntries.schoolId, staff.schoolId),
            isNotNull(scoreEntries.testScore),
            isNotNull(scoreEntries.examScore),
          ))
          .groupBy(studentEnrollments.classId, scoreEntries.termId, studentEnrollments.academicYear),
      ])
    : [[], []]
  const scoreCoverage = termRows.flatMap(term => expectedScoreRows
    .filter(row => row.expectedCount > 0 && row.academicYear === term.academicYear && classRows.some(schoolClass => schoolClass.id === row.classId))
    .map(row => ({
      classId: row.classId,
      termId: term.id,
      expectedCount: row.expectedCount,
      completeCount: completeScoreRows.find(score => score.classId === row.classId && score.termId === term.id && score.academicYear === term.academicYear)?.completeCount ?? 0,
    })))
  return {
    school: (await schoolQuery)[0] ?? null,
    classes: classRows,
    subjects: subjectRows,
    classSubjects: classSubjectRows,
    terms: termRows,
    enrollments: enrollmentRows,
    scoreCoverage,
  }
})

export const updateSchoolBranding = createServerFn({ method: 'POST' })
  .validator(validateSchool)
  .handler(async ({ data }) => {
    const { requireStaff, getDb, schools, eq } = await loadServerDependencies()
    const staff = await requireStaff('admin')
    const [school] = await getDb()
      .update(schools)
      .set(data)
      .where(eq(schools.id, staff.schoolId))
      .returning({
        id: schools.id,
        name: schools.name,
        address: schools.address,
        phone: schools.phone,
        contactEmail: schools.contactEmail,
        motto: schools.motto,
        logoUrl: schools.logoUrl,
        mainColor: schools.mainColor,
        accentColor: schools.accentColor,
      })
    if (!school) throw new Error('The school profile could not be updated.')
    return school
  })

export const createSchoolClass = createServerFn({ method: 'POST' })
  .validator(validateName)
  .handler(async ({ data }) => {
    const { requireStaff, getDb, schoolClasses } = await loadServerDependencies()
    const staff = await requireStaff('admin')
    const [result] = await getDb().insert(schoolClasses).values({
      schoolId: staff.schoolId,
      ...data,
    }).returning()
    if (!result) throw new Error('The class could not be created.')
    return result
  })

export const createSubject = createServerFn({ method: 'POST' })
  .validator(validateName)
  .handler(async ({ data }) => {
    const { requireStaff, getDb, subjects } = await loadServerDependencies()
    const staff = await requireStaff('admin')
    const [result] = await getDb().insert(subjects).values({
      schoolId: staff.schoolId,
      ...data,
    }).returning()
    if (!result) throw new Error('The subject could not be created.')
    return result
  })

export const addCurriculumPack = createServerFn({ method: 'POST' })
  .validator(validateCurriculumPack)
  .handler(async ({ data }) => {
    const { requireStaff, getDb, subjects, eq } = await loadServerDependencies()
    const staff = await requireStaff('admin')
    const pack = getCurriculumPack(data.packId)
    if (!pack) throw new Error('The selected curriculum subject pack is unavailable.')

    const db = getDb()
    const existing = await db.select({ name: subjects.name })
      .from(subjects)
      .where(eq(subjects.schoolId, staff.schoolId))
    const existingNames = new Set(existing.map(subject => subject.name))
    const missingNames = pack.subjects.filter(name => !existingNames.has(name))
    if (!missingNames.length) return { addedCount: 0, packName: pack.name }

    const inserted = await db.insert(subjects).values(missingNames.map(name => ({
      schoolId: staff.schoolId,
      name,
    })))
      .onConflictDoNothing({ target: [subjects.schoolId, subjects.name] })
      .returning({ id: subjects.id })
    return { addedCount: inserted.length, packName: pack.name }
  })

export const saveClassSubjects = createServerFn({ method: 'POST' })
  .validator(validateClassSubjects)
  .handler(async ({ data }) => {
    const {
      requireStaff, getDb, schoolClasses, and, eq, subjects, inArray,
      studentEnrollments, classSubjects,
    } = await loadServerDependencies()
    const staff = await requireStaff('admin')
    const db = getDb()
    const [schoolClass] = await db.select({ id: schoolClasses.id })
      .from(schoolClasses)
      .where(and(eq(schoolClasses.id, data.classId), eq(schoolClasses.schoolId, staff.schoolId)))
      .limit(1)
    if (!schoolClass) throw new Error('The selected class is not part of your school.')

    const validSubjects = data.subjectIds.length
      ? await db.select({ id: subjects.id }).from(subjects).where(and(
          eq(subjects.schoolId, staff.schoolId),
          inArray(subjects.id, data.subjectIds),
        ))
      : []
    if (validSubjects.length !== data.subjectIds.length) {
      throw new Error('Every selected subject must belong to your school.')
    }

    const existingEnrollments = await db.select({ id: studentEnrollments.id })
      .from(studentEnrollments)
      .where(and(
        eq(studentEnrollments.schoolId, staff.schoolId),
        eq(studentEnrollments.classId, schoolClass.id),
      ))
      .limit(1)
    if (existingEnrollments.length) {
      throw new Error('Class subjects cannot be changed after students have been enrolled.')
    }

    await db.transaction(async tx => {
      await tx.delete(classSubjects).where(and(
        eq(classSubjects.schoolId, staff.schoolId),
        eq(classSubjects.classId, data.classId),
      ))
      if (data.subjectIds.length) {
        await tx.insert(classSubjects).values(data.subjectIds.map(subjectId => ({
          schoolId: staff.schoolId,
          classId: data.classId,
          subjectId,
        })))
      }
    })
    return { saved: true }
  })

export const createAcademicTerm = createServerFn({ method: 'POST' })
  .validator(validateTerm)
  .handler(async ({ data }) => {
    const { requireStaff, getDb, academicTerms } = await loadServerDependencies()
    const staff = await requireStaff('admin')
    const [result] = await getDb().insert(academicTerms).values({
      schoolId: staff.schoolId,
      ...data,
    }).returning()
    if (!result) throw new Error('The term could not be created.')
    return result
  })

export const createStudent = createServerFn({ method: 'POST' })
  .validator(validateStudent)
  .handler(async ({ data }) => {
    const {
      requireStaff, getDb, schoolClasses, and, eq, classSubjects, inArray,
      students, studentEnrollments, studentSubjects,
    } = await loadServerDependencies()
    const staff = await requireStaff('admin')
    const db = getDb()
    return db.transaction(async tx => {
      const [schoolClass] = await tx.select({ id: schoolClasses.id })
        .from(schoolClasses)
        .where(and(eq(schoolClasses.id, data.classId), eq(schoolClasses.schoolId, staff.schoolId)))
        .limit(1)
      if (!schoolClass) throw new Error('The selected class is not part of your school.')

      const classSubjectRows = data.subjectIds.length
        ? await tx.select({ subjectId: classSubjects.subjectId })
            .from(classSubjects)
            .where(and(
              eq(classSubjects.schoolId, staff.schoolId),
              eq(classSubjects.classId, data.classId),
              inArray(classSubjects.subjectId, data.subjectIds),
            ))
        : []
      if (classSubjectRows.length !== data.subjectIds.length) {
        throw new Error('Students can only be enrolled in subjects configured for their class.')
      }

      const [existingStudent] = await tx.select()
        .from(students)
        .where(and(
          eq(students.schoolId, staff.schoolId),
          eq(students.admissionNumber, data.admissionNumber),
        ))
        .limit(1)
      let student = existingStudent
      if (student && (student.firstName !== data.firstName || student.lastName !== data.lastName)) {
        throw new Error('That admission number is already registered to a different student.')
      }
      if (!student) {
        const [created] = await tx.insert(students).values({
          schoolId: staff.schoolId,
          admissionNumber: data.admissionNumber,
          firstName: data.firstName,
          lastName: data.lastName,
        }).returning()
        if (!created) throw new Error('The student record could not be created.')
        student = created
      }

      const [enrollment] = await tx.insert(studentEnrollments).values({
        schoolId: staff.schoolId,
        studentId: student.id,
        classId: data.classId,
        academicYear: data.academicYear,
      }).returning()
      if (!enrollment) throw new Error('The student enrollment could not be created.')
      await tx.insert(studentSubjects).values(data.subjectIds.map(subjectId => ({
        schoolId: staff.schoolId,
        enrollmentId: enrollment.id,
        subjectId,
      })))
      return enrollment
    })
  })

export const getSchoolStaff = createServerFn({ method: 'GET' }).handler(async () => {
  const { requireStaff, getDb, schoolMemberships, eq, asc, admin } = await loadServerDependencies()
  const staff = await requireStaff('admin')
  const members = await getDb().select().from(schoolMemberships)
    .where(eq(schoolMemberships.schoolId, staff.schoolId))
    .orderBy(asc(schoolMemberships.createdAt))
  return Promise.all(members.map(async member => {
    const identity = await admin.getUser(member.identityUserId)
    return {
      id: member.id,
      identityUserId: member.identityUserId,
      email: identity.email ?? '',
      role: member.role,
    }
  }))
})

export const addSchoolStaff = createServerFn({ method: 'POST' })
  .validator(validateTeacherEmail)
  .handler(async ({ data }) => {
    const { requireStaff, admin, getDb, schoolMemberships } = await loadServerDependencies()
    const staff = await requireStaff('admin')
    let matchingUser: { id: string } | undefined
    for (let page = 1; !matchingUser; page += 1) {
      const users = await admin.listUsers({ page, perPage: 100 })
      matchingUser = users.find(user => user.email?.toLowerCase() === data.email)
      if (matchingUser || users.length < 100) break
    }
    if (!matchingUser) {
      throw new Error('No Identity account matches that email. Invite the staff member in Netlify Identity first.')
    }
    if (matchingUser.id === staff.id) throw new Error('Your account is already a school administrator.')

    const [member] = await getDb().insert(schoolMemberships).values({
      schoolId: staff.schoolId,
      identityUserId: matchingUser.id,
      role: 'teacher',
    }).returning({ id: schoolMemberships.id })
    if (!member) throw new Error('This account already belongs to a school.')
    return member
  })

export const setStaffRole = createServerFn({ method: 'POST' })
  .validator(validateRole)
  .handler(async ({ data }) => {
    const { requireStaff, getDb, schoolMemberships, and, eq } = await loadServerDependencies()
    const staff = await requireStaff('admin')
    const db = getDb()
    const [target] = await db.select()
      .from(schoolMemberships)
      .where(and(
        eq(schoolMemberships.id, data.membershipId),
        eq(schoolMemberships.schoolId, staff.schoolId),
      ))
      .limit(1)
    if (!target) throw new Error('The selected staff member is not part of your school.')
    if (target.role === 'admin' && data.role !== 'admin') {
      const admins = await db.select({ id: schoolMemberships.id })
        .from(schoolMemberships)
        .where(and(
          eq(schoolMemberships.schoolId, staff.schoolId),
          eq(schoolMemberships.role, 'admin'),
        ))
      if (admins.length <= 1) throw new Error('A school must retain at least one administrator.')
    }
    await db.update(schoolMemberships)
      .set({ role: data.role })
      .where(and(
        eq(schoolMemberships.id, data.membershipId),
        eq(schoolMemberships.schoolId, staff.schoolId),
      ))
    return { saved: true }
  })

export const assignTeacher = createServerFn({ method: 'POST' })
  .validator(validateAssignment)
  .handler(async ({ data }) => {
    const {
      requireStaff, getDb, schoolMemberships, and, eq, classSubjects,
      staffAssignments,
    } = await loadServerDependencies()
    const staff = await requireStaff('admin')
    const db = getDb()
    const [member] = await db.select({ id: schoolMemberships.id })
      .from(schoolMemberships)
      .where(and(
        eq(schoolMemberships.identityUserId, data.identityUserId),
        eq(schoolMemberships.schoolId, staff.schoolId),
        eq(schoolMemberships.role, 'teacher'),
      ))
      .limit(1)
    if (!member) throw new Error('Only a teacher belonging to your school can receive a teaching assignment.')

    const [classSubject] = await db.select({ id: classSubjects.id })
      .from(classSubjects)
      .where(and(
        eq(classSubjects.schoolId, staff.schoolId),
        eq(classSubjects.classId, data.classId),
        eq(classSubjects.subjectId, data.subjectId),
      ))
      .limit(1)
    if (!classSubject) throw new Error('The subject is not registered for this class in your school.')

    const [assignment] = await db.insert(staffAssignments).values({
      schoolId: staff.schoolId,
      ...data,
    }).onConflictDoNothing({
      target: [
        staffAssignments.schoolId,
        staffAssignments.identityUserId,
        staffAssignments.classId,
        staffAssignments.subjectId,
      ],
    }).returning()
    return assignment ?? null
  })

export const getScoreSheet = createServerFn({ method: 'GET' })
  .validator(validateScoreSheet)
  .handler(async ({ data }) => {
    const {
      requireStaff, getDb, academicTerms, and, eq, staffAssignments, classSubjects,
      studentEnrollments, students, scoreEntries, studentSubjects, asc,
    } = await loadServerDependencies()
    const staff = await requireStaff()
    const db = getDb()
    const [term] = await db.select({
      academicYear: academicTerms.academicYear,
      isPublished: academicTerms.isPublished,
    }).from(academicTerms).where(and(
      eq(academicTerms.id, data.termId),
      eq(academicTerms.schoolId, staff.schoolId),
    )).limit(1)
    if (!term) throw new Error('The selected term does not belong to your school.')
    if (term.isPublished) throw new Error('Scores in this term have been published and are locked.')

    if (staff.role !== 'admin') {
      const [assignment] = await db.select({ id: staffAssignments.id })
        .from(staffAssignments)
        .where(and(
          eq(staffAssignments.identityUserId, staff.id),
          eq(staffAssignments.schoolId, staff.schoolId),
          eq(staffAssignments.classId, data.classId),
          eq(staffAssignments.subjectId, data.subjectId),
        ))
        .limit(1)
      if (!assignment) throw new Error('You are not assigned to this class and subject.')
    }

    const [classSubject] = await db.select({ id: classSubjects.id })
      .from(classSubjects)
      .where(and(
        eq(classSubjects.schoolId, staff.schoolId),
        eq(classSubjects.classId, data.classId),
        eq(classSubjects.subjectId, data.subjectId),
      ))
      .limit(1)
    if (!classSubject) throw new Error('The selected subject is not configured for this class.')

    return db.select({
      enrollmentId: studentEnrollments.id,
      studentId: students.id,
      admissionNumber: students.admissionNumber,
      firstName: students.firstName,
      lastName: students.lastName,
      testScore: scoreEntries.testScore,
      examScore: scoreEntries.examScore,
    })
      .from(studentSubjects)
      .innerJoin(studentEnrollments, and(
        eq(studentEnrollments.id, studentSubjects.enrollmentId),
        eq(studentEnrollments.schoolId, staff.schoolId),
      ))
      .innerJoin(students, and(
        eq(students.id, studentEnrollments.studentId),
        eq(students.schoolId, staff.schoolId),
      ))
      .leftJoin(scoreEntries, and(
        eq(scoreEntries.enrollmentId, studentEnrollments.id),
        eq(scoreEntries.schoolId, staff.schoolId),
        eq(scoreEntries.subjectId, studentSubjects.subjectId),
        eq(scoreEntries.termId, data.termId),
      ))
      .where(and(
        eq(studentSubjects.schoolId, staff.schoolId),
        eq(studentSubjects.subjectId, data.subjectId),
        eq(studentEnrollments.classId, data.classId),
        eq(studentEnrollments.academicYear, term.academicYear),
      ))
      .orderBy(asc(students.lastName), asc(students.firstName))
  })
