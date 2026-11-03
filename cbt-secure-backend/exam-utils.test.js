const test = require("node:test");
const assert = require("node:assert/strict");
const { examKey, hash, isStrongAdminKey, isValidAnswers } = require("./exam-utils");

test("exam keys are stable regardless of capitalization and whitespace", () => {
  assert.equal(
    examKey({ classLevel: "SS1", subject: "Mathematics", term: "First Term" }),
    examKey({ classLevel: " ss1 ", subject: "MATHEMATICS", term: "first term " }),
  );
});

test("answer validation requires every question exactly once", () => {
  const ids = ["q1", "q2"];
  assert.equal(isValidAnswers([{ id: "q1", answer: "A" }, { id: "q2", answer: "" }], ids), true);
  assert.equal(isValidAnswers([{ id: "q1", answer: "A" }], ids), false);
  assert.equal(isValidAnswers([{ id: "q1", answer: "A" }, { id: "q1", answer: "B" }], ids), false);
  assert.equal(isValidAnswers([{ id: "q1", answer: "A" }, { id: "other", answer: "B" }], ids), false);
  assert.equal(isValidAnswers([{ id: "q1", answer: 4 }, { id: "q2", answer: "" }], ids), false);
});

test("admin authorization requires a configured long key and uses exact matching", () => {
  const key = "a".repeat(32);
  assert.equal(isStrongAdminKey(key, key), true);
  assert.equal(isStrongAdminKey("wrong", key), false);
  assert.equal(isStrongAdminKey(key, "short"), false);
  assert.equal(isStrongAdminKey(key, undefined), false);
});

test("hash produces stable, non-reversible fixed-length identifiers", () => {
  assert.equal(hash("same"), hash("same"));
  assert.notEqual(hash("same"), hash("different"));
  assert.equal(hash("same").length, 64);
});
