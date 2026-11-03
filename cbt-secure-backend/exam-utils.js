const crypto = require("node:crypto");

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function examKey({ classLevel, subject, term }) {
  return hash(`${classLevel.trim().toLowerCase()}|${subject.trim().toLowerCase()}|${term.trim().toLowerCase()}`);
}

function isValidAnswers(answers, questionIds) {
  if (!Array.isArray(answers) || answers.length !== questionIds.length) return false;
  const expected = new Set(questionIds.map(String));
  const received = new Set();
  for (const answer of answers) {
    if (!answer || typeof answer.id !== "string" || typeof answer.answer !== "string") return false;
    if (!expected.has(answer.id) || received.has(answer.id)) return false;
    received.add(answer.id);
  }
  return received.size === expected.size;
}

function isStrongAdminKey(candidate, configured) {
  if (typeof candidate !== "string" || typeof configured !== "string" || configured.length < 32) return false;
  const candidateBuffer = Buffer.from(candidate);
  const configuredBuffer = Buffer.from(configured);
  return candidateBuffer.length === configuredBuffer.length
    && crypto.timingSafeEqual(candidateBuffer, configuredBuffer);
}

module.exports = { examKey, hash, isStrongAdminKey, isValidAnswers };
