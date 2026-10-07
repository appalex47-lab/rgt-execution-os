import assert from "node:assert/strict";
import {LESSONS} from "../js/academy.js";
import {createProgressStore, createMemoryAdapter} from "../js/learning/progressStore.js";

assert.equal(LESSONS.length, 8);
for (const lesson of LESSONS) {
  assert.ok(Array.isArray(lesson.questions) && lesson.questions.length >= 2, `${lesson.id}: questions`);
  assert.equal(lesson.passScore, 80);
  for (const q of lesson.questions) {
    assert.ok(q.question && q.options.length >= 2);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length);
    assert.ok(q.explanation);
  }
}

const ad = createMemoryAdapter();
const p = createProgressStore(ad);
await p.load();
p.start("lesson", "foundations-rgt");
let r = p.set("lesson", "foundations-rgt", "IN_PROGRESS", {attempts: 1, score: 50, completedSteps: []});
assert.equal(r.status, "IN_PROGRESS");
assert.equal(r.score, 50);
r = p.set("lesson", "foundations-rgt", "COMPLETED", {attempts: 2, score: 100, completedSteps: ["q:0", "q:1"]});
assert.equal(r.status, "COMPLETED");
assert.equal(r.score, 100);
await p.flush();
const p2 = createProgressStore(ad); await p2.load();
assert.equal(p2.statusOf("lesson", "foundations-rgt"), "COMPLETED");
assert.equal(p2.get("lesson", "foundations-rgt").score, 100);
console.log("ACADEMY LEARNING TESTS: PASS (8 lesson contracts + persistence)");
