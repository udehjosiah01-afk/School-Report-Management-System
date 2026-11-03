
const express = require("express");
const cors = require("cors");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const app = express();
const PORT = 3000;

// Allow requests from your local CBT during development.
app.use(cors());
app.use(express.json());

// Connect securely to your existing Firebase project.
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
  projectId: "cbt-system-d3097"
});

const db = getFirestore();

// Test whether the backend is running.
app.get("/", (req, res) => {
  res.json({
    message: "CBT Secure Backend is running."
  });
});

// Fetch exam questions without exposing correct answers.
app.get("/api/questions", async (req, res) => {
  try {
    const { subject, classLevel, term } = req.query;

    if (!subject || !classLevel || !term) {
      return res.status(400).json({
        error: "Subject, class level, and term are required."
      });
    }

    const snapshot = await db
      .collection("questions_v2")
      .where("subject", "==", subject)
      .where("classLevel", "==", classLevel)
      .where("term", "==", term)
      .get();

    const questions = snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        id: data.id,
        q: data.q,
        options: data.options
      };
    });

    res.json({ questions });
  } catch (error) {
    console.error("Question-loading error:", error);

    res.status(500).json({
      error: "Unable to load exam questions."
    });
  }
});

app.post("/api/grade", async (req, res) => {
  try {
    const { answers, subject, classLevel, term } = req.body;

    if (
      !Array.isArray(answers) ||
      !subject ||
      !classLevel ||
      !term
    ) {
      return res.status(400).json({
        error: "Answers, subject, class level, and term are required."
      });
    }

    const snapshot = await db
      .collection("questions_v2")
      .where("subject", "==", subject)
      .where("classLevel", "==", classLevel)
      .where("term", "==", term)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: "No matching questions were found."
      });
    }

    const answerKey = new Map();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      answerKey.set(String(data.id), data);
    });

    let score = 0;

    const review = answers.map(item => {
      const question = answerKey.get(String(item.id));

      if (!question) {
        return {
          id: item.id,
          correct: false,
          error: "Question not found."
        };
      }

      const isCorrect = item.answer === question.answer;

      if (isCorrect) score++;

      return {
        id: question.id,
        question: question.q,
        selectedAnswer: item.answer || "Not Answered",
        correct: isCorrect,
        correctAnswer: question.answer
      };
    });

    res.json({
      score,
      total: answers.length,
      review
    });

  } catch (error) {
    console.error("Grading error:", error);

    res.status(500).json({
      error: "Unable to grade this examination."
    });
  }
});

app.listen(PORT, () => {
  console.log(`CBT backend running at http://localhost:${PORT}`);
});
