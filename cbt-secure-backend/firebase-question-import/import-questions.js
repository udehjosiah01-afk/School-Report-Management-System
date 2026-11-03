
const { app, db } = require("../firebase");
const { examKey } = require("../exam-utils");
const collection = db.collection("questions_v2");

const questions = [
  {
    id: 1,
    q: "Evaluate 3 squared plus 4 squared.",
    options: ["7", "12", "25", "49"],
    answer: "25"
  },
  {
    id: 2,
    q: "Simplify 5x + 3x - 2x.",
    options: ["6x", "8x", "10x", "6x squared"],
    answer: "6x"
  },
  {
    id: 3,
    q: "Express 0.375 as a fraction in its lowest terms.",
    options: ["3/5", "3/8", "5/8", "375/1000"],
    answer: "3/8"
  },
  {
    id: 4,
    q: "Evaluate 2 to the power of 5.",
    options: ["10", "16", "25", "32"],
    answer: "32"
  },
  {
    id: 5,
    q: "Find the square root of 25.",
    options: ["3", "4", "5", "6"],
    answer: "5"
  },
  {
    id: 6,
    q: "Find the lowest common multiple of 6 and 8.",
    options: ["12", "18", "24", "48"],
    answer: "24"
  },
  {
    id: 7,
    q: "Find the highest common factor of 24 and 36.",
    options: ["6", "8", "12", "18"],
    answer: "12"
  },
  {
    id: 8,
    q: "Calculate 1/2 + 1/3.",
    options: ["2/5", "5/6", "1/6", "3/5"],
    answer: "5/6"
  },
  {
    id: 9,
    q: "Solve 3x = 36.",
    options: ["9", "10", "12", "15"],
    answer: "12"
  },
  {
    id: 10,
    q: "Express 35% as a decimal.",
    options: ["3.5", "0.035", "0.35", "35.0"],
    answer: "0.35"
  },
  {
    id: 11,
    q: "Solve 2x + 3 = 25.",
    options: ["8", "10", "11", "14"],
    answer: "11"
  },
  {
    id: 12,
    q: "Expand 3(x + 4).",
    options: ["3x + 4", "3x + 12", "7x", "12x"],
    answer: "3x + 12"
  },
  {
    id: 13,
    q: "Factorise x squared + 5x.",
    options: ["x(x + 5)", "5(x + 1)", "x(x - 5)", "x + 5"],
    answer: "x(x + 5)"
  },
  {
    id: 14,
    q: "Evaluate 7 to the power of 0.",
    options: ["0", "1", "7", "70"],
    answer: "1"
  },
  {
    id: 15,
    q: "What is the probability of getting a head when a fair coin is tossed once?",
    options: ["0", "1/4", "1/2", "1"],
    answer: "1/2"
  },
  {
    id: 16,
    q: "What is the sum of angles on a straight line?",
    options: ["90°", "120°", "180°", "360°"],
    answer: "180°"
  },
  {
    id: 17,
    q: "Two angles of a triangle are 58° and 70°. Find the third angle.",
    options: ["42°", "52°", "62°", "72°"],
    answer: "52°"
  },
  {
    id: 18,
    q: "An isosceles triangle has a vertex angle of 50°. Find each base angle.",
    options: ["50°", "60°", "65°", "75°"],
    answer: "65°"
  },
  {
    id: 19,
    q: "Find the perimeter of a rectangle measuring 8 cm by 5 cm.",
    options: ["13 cm", "26 cm", "40 cm", "20 cm"],
    answer: "26 cm"
  },
  {
    id: 20,
    q: "Find the area of a rectangle measuring 6 cm by 5 cm.",
    options: ["11 cm²", "22 cm²", "30 cm²", "60 cm²"],
    answer: "30 cm²"
  },
  {
    id: 21,
    q: "Find the mean of 6, 8 and 10.",
    options: ["6", "7", "8", "9"],
    answer: "8"
  },
  {
    id: 22,
    q: "Find the median of 3, 5, 7, 9 and 11.",
    options: ["3", "5", "7", "9"],
    answer: "7"
  },
  {
    id: 23,
    q: "Simplify the ratio 12:16.",
    options: ["2:3", "3:4", "4:5", "6:8"],
    answer: "3:4"
  },
  {
    id: 24,
    q: "Find the simple interest on ₦60,000 at 12% per annum for 1 year.",
    options: ["₦6,000", "₦7,200", "₦8,200", "₦12,000"],
    answer: "₦7,200"
  },
  {
    id: 25,
    q: "Find the simple interest on ₦8,000 at 5% per annum for 1 year.",
    options: ["₦200", "₦400", "₦800", "₦1,000"],
    answer: "₦400"
  },
  {
    id: 26,
    q: "Simplify 3a + 4a + b + 2b.",
    options: ["7a + 3b", "7ab", "5a + 5b", "7a + 2b"],
    answer: "7a + 3b"
  },
  {
    id: 27,
    q: "Evaluate the cube root of 512.",
    options: ["6", "7", "8", "9"],
    answer: "8"
  },
  {
    id: 28,
    q: "Which of these numbers is prime?",
    options: ["21", "27", "29", "33"],
    answer: "29"
  },
  {
    id: 29,
    q: "Find the gradient of the line joining (1, 2) and (3, 6).",
    options: ["1", "2", "3", "4"],
    answer: "2"
  },
  {
    id: 30,
    q: "A fair die is rolled once. What is the probability of getting an even number?",
    options: ["1/6", "1/3", "1/2", "2/3"],
    answer: "1/2"
  }
];

async function importQuestions() {
  let added = 0;
  let skipped = 0;
  const exam = {
    classLevel: "SS1",
    subject: "Mathematics",
    term: "First Term",
    durationSeconds: Number(process.env.CBT_EXAM_DURATION_SECONDS || 1800),
    active: true
  };
  const examRef = db.collection("exams").doc(examKey(exam));
  const existingExam = await examRef.get();
  if (!existingExam.exists) await examRef.create(exam);

  for (const question of questions) {
    const documentId = `maths_${String(question.id).padStart(3, "0")}`;
    const ref = collection.doc(documentId);

    const data = {
      ...question,
      subject: "Mathematics",
      classLevel: "SS1",
      term: "First Term"
    };

    try {
      await ref.create(data);
      console.log(`ADDED: ${documentId}`);
      added++;
    } catch (error) {
      if (error.code === 6 || error.code === "already-exists") {
        console.log(`SKIPPED (already exists): ${documentId}`);
        skipped++;
      } else {
        throw error;
      }
    }
  }

  console.log("\nImport finished.");
  console.log(`Added: ${added}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total processed: ${added + skipped}`);
}

importQuestions()
  .catch((error) => {
    console.error("Import failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await app.delete();
  });
