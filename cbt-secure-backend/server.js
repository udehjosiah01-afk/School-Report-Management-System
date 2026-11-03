const crypto = require("node:crypto");
const cors = require("cors");
const express = require("express");
const { db } = require("./firebase");
const { examKey, hash, isStrongAdminKey, isValidAnswers } = require("./exam-utils");

const app = express();
const PORT = Number(process.env.CBT_PORT || 3001);
const MAX_EXAM_DURATION_SECONDS = 2 * 60 * 60;
const configuredOrigins = (process.env.CBT_ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || configuredOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by the CBT service."));
  },
}));
app.use(express.json({ limit: "32kb" }));

app.get("/", (_req, res) => {
  res.json({ message: "Standalone CBT service is running." });
});

app.post("/api/students", async (req, res) => {
  if (!isStrongAdminKey(req.get("x-cbt-admin-key"), process.env.CBT_ADMIN_API_KEY)) {
    return res.status(401).json({ error: "Valid CBT administrator authorization is required." });
  }

  try {
    const fullName = String(req.body.fullName || "").trim();
    const admissionNumber = String(req.body.admissionNumber || "").trim();
    const classLevel = String(req.body.classLevel || "").trim();
    if (!fullName || !admissionNumber || !classLevel) {
      return res.status(400).json({ error: "Full name, admission number, and class are required." });
    }
    if (fullName.length > 120 || admissionNumber.length > 50 || classLevel.length > 30) {
      return res.status(400).json({ error: "One or more fields exceed the allowed length." });
    }

    const students = db.collection("students");
    const admissionKey = admissionNumber.toUpperCase();
    const studentRef = students.doc(`admission_${hash(admissionKey)}`);
    const codeCollection = db.collection("studentCodeIndex");
    let createdStudent;

    await db.runTransaction(async transaction => {
      const existingAdmission = await transaction.get(studentRef);
      if (existingAdmission.exists) {
        const error = new Error("This admission number is already registered.");
        error.statusCode = 409;
        throw error;
      }

      for (let attempt = 0; attempt < 10; attempt++) {
        const code = generateStudentCode();
        const codeRef = codeCollection.doc(code);
        const existingCode = await transaction.get(codeRef);
        if (existingCode.exists) continue;

        createdStudent = {
          fullName,
          admissionNumber,
          classLevel,
          studentCode: code,
          active: true,
          createdAt: new Date().toISOString(),
        };
        transaction.create(studentRef, createdStudent);
        transaction.create(codeRef, { studentId: studentRef.id, active: true });
        return;
      }

      const error = new Error("Could not generate a unique code. Please try again.");
      error.statusCode = 503;
      throw error;
    });

    return res.status(201).json({
      message: "Student registered. Distribute this code privately; it is only shown once.",
      student: createdStudent,
    });
  } catch (error) {
    if (error.statusCode === 409) return res.status(409).json({ error: error.message });
    console.error("Student registration error:", error);
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : "Unable to register student.",
    });
  }
});

app.post("/api/start-exam", async (req, res) => {
  try {
    const studentCode = String(req.body.studentCode || "").trim().toUpperCase();
    const subject = String(req.body.subject || "").trim();
    const classLevel = String(req.body.classLevel || "").trim();
    const term = String(req.body.term || "").trim();
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(studentCode) || !subject || !classLevel || !term) {
      return res.status(400).json({ error: "A valid student code and complete exam details are required." });
    }

    const codeDoc = await db.collection("studentCodeIndex").doc(studentCode).get();
    if (!codeDoc.exists || codeDoc.data().active !== true) {
      return res.status(401).json({ error: "Invalid or inactive student code." });
    }
    const studentId = codeDoc.data().studentId;
    const studentDoc = await db.collection("students").doc(studentId).get();
    if (!studentDoc.exists || studentDoc.data().active !== true
      || studentDoc.data().studentCode !== studentCode) {
      return res.status(401).json({ error: "Invalid or inactive student code." });
    }
    const student = studentDoc.data();
    if (student.classLevel.toLowerCase() !== classLevel.toLowerCase()) {
      return res.status(403).json({ error: "This examination is not assigned to the student's class." });
    }

    const assessmentId = examKey({ classLevel, subject, term });
    const examRef = db.collection("exams").doc(assessmentId);
    const examDoc = await examRef.get();
    if (!examDoc.exists || examDoc.data().active !== true) {
      return res.status(404).json({ error: "This examination is not available." });
    }
    const exam = examDoc.data();
    const durationSeconds = Number(exam.durationSeconds || process.env.CBT_EXAM_DURATION_SECONDS || 1800);
    if (!Number.isInteger(durationSeconds) || durationSeconds < 60 || durationSeconds > MAX_EXAM_DURATION_SECONDS) {
      console.error(`Invalid duration configured for CBT exam ${assessmentId}.`);
      return res.status(500).json({ error: "The examination is not configured correctly." });
    }

    const questionSnapshot = await db.collection("questions_v2")
      .where("subject", "==", subject)
      .where("classLevel", "==", classLevel)
      .where("term", "==", term)
      .get();
    if (questionSnapshot.empty) {
      return res.status(404).json({ error: "No questions are available for this examination." });
    }
    const questions = questionSnapshot.docs.map(doc => {
      const data = doc.data();
      if (data.id === undefined || typeof data.q !== "string"
        || !Array.isArray(data.options) || data.options.some(option => typeof option !== "string")) {
        throw new Error(`Invalid question data in document ${doc.id}.`);
      }
      return { id: String(data.id), q: data.q, options: data.options };
    });
    const questionIds = questions.map(question => question.id);
    if (new Set(questionIds).size !== questionIds.length) {
      throw new Error(`Duplicate question IDs in CBT exam ${assessmentId}.`);
    }

    const resultRef = db.collection("examResults").doc(resultId(studentId, assessmentId));
    if ((await resultRef.get()).exists) {
      return res.status(409).json({ error: "This examination has already been submitted for this student." });
    }
    const attemptToken = crypto.randomBytes(32).toString("hex");
    const startedAt = Date.now();
    await db.collection("examAttempts").doc(hash(attemptToken)).create({
      studentId,
      student: {
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        classLevel: student.classLevel,
      },
      assessmentId,
      subject,
      classLevel,
      term,
      questionIds,
      durationSeconds,
      startedAt,
      expiresAt: startedAt + durationSeconds * 1000,
      submitted: false,
    });

    return res.json({
      valid: true,
      student: {
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        classLevel: student.classLevel,
      },
      attemptToken,
      durationSeconds,
      questions,
    });
  } catch (error) {
    console.error("Exam start error:", error);
    return res.status(500).json({ error: "Unable to start this examination." });
  }
});

app.post("/api/grade", async (req, res) => {
  try {
    const attemptToken = String(req.body.attemptToken || "");
    const answers = req.body.answers;
    if (!/^[a-f0-9]{64}$/.test(attemptToken)) {
      return res.status(400).json({ error: "A valid examination session is required." });
    }
    const attemptRef = db.collection("examAttempts").doc(hash(attemptToken));
    const attemptDoc = await attemptRef.get();
    if (!attemptDoc.exists) return res.status(401).json({ error: "Examination session not found." });
    const attempt = attemptDoc.data();
    if (attempt.submitted) return res.status(409).json({ error: "This examination session has already been submitted." });
    if (Date.now() > attempt.expiresAt) return res.status(410).json({ error: "The examination session has expired." });
    if (!isValidAnswers(answers, attempt.questionIds)) {
      return res.status(400).json({ error: "The submitted answers do not match this examination." });
    }

    const questionSnapshot = await db.collection("questions_v2")
      .where("subject", "==", attempt.subject)
      .where("classLevel", "==", attempt.classLevel)
      .where("term", "==", attempt.term)
      .get();
    const answerKey = new Map(questionSnapshot.docs.map(doc => {
      const question = doc.data();
      return [String(question.id), question];
    }));
    const submittedAnswers = new Map(answers.map(item => [item.id, item.answer]));
    const review = attempt.questionIds.map(id => {
      const question = answerKey.get(id);
      if (!question) throw new Error(`Question ${id} is no longer available.`);
      const selectedAnswer = submittedAnswers.get(id);
      if (selectedAnswer && !question.options.includes(selectedAnswer)) {
        const error = new Error("An answer is not one of the question's available options.");
        error.statusCode = 400;
        throw error;
      }
      return {
        id,
        question: question.q,
        selectedAnswer: selectedAnswer || "Not Answered",
        correct: selectedAnswer === question.answer,
        correctAnswer: question.answer,
      };
    });
    const score = review.filter(item => item.correct).length;
    const finalResult = {
      studentId: attempt.studentId,
      student: attempt.student,
      assessmentId: attempt.assessmentId,
      subject: attempt.subject,
      classLevel: attempt.classLevel,
      term: attempt.term,
      score,
      total: review.length,
      review,
      submittedAt: new Date().toISOString(),
    };
    const resultRef = db.collection("examResults")
      .doc(resultId(attempt.studentId, attempt.assessmentId));

    await db.runTransaction(async transaction => {
      const [currentAttempt, existingResult] = await Promise.all([
        transaction.get(attemptRef),
        transaction.get(resultRef),
      ]);
      if (!currentAttempt.exists || currentAttempt.data().submitted) {
        const error = new Error("This examination session has already been submitted.");
        error.statusCode = 409;
        throw error;
      }
      if (Date.now() > currentAttempt.data().expiresAt) {
        const error = new Error("The examination session has expired.");
        error.statusCode = 410;
        throw error;
      }
      if (existingResult.exists) {
        const error = new Error("This examination has already been submitted for this student.");
        error.statusCode = 409;
        throw error;
      }
      transaction.create(resultRef, finalResult);
      transaction.update(attemptRef, { submitted: true, submittedAt: finalResult.submittedAt });
    });

    return res.json({ score, total: review.length, review });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    console.error("Grading error:", error);
    return res.status(500).json({ error: "Unable to grade this examination." });
  }
});

function generateStudentCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes, byte => characters[byte % characters.length]).join("");
}

function resultId(studentId, assessmentId) {
  return hash(`${studentId}|${assessmentId}`);
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CBT API listening on port ${PORT} for Firebase project ${process.env.CBT_FIREBASE_PROJECT_ID}.`);
  });
}

module.exports = app;
