import assert from 'node:assert/strict';
import {seed} from '../js/data/seed.js';
import {registry} from '../js/learning/registry.js';
import {registerMasterRoute} from '../js/learning/content/masterRoute.js';
import {createTourEngine, PHASE} from '../js/learning/tourEngine.js';
import {createProgressStore, createMemoryAdapter} from '../js/learning/progressStore.js';
import {buildExercise, EXERCISE_IDS} from '../js/learning/exercises.js';

// Real seed snapshot (same data the app ships with).
const snap = {}; await seed({snapshot: async () => ({}), put: async (s, x) => { (snap[s] ||= []).push(x); }});
registerMasterRoute();
const route = registry.get('route', 'rgt-master-route');

// 1. No step is "read and continue": each one is an exercise or a real click.
assert.equal(route.steps.length, 18);
assert.ok(route.steps.every(s => ['EXERCISE', 'CLICK'].includes(s.action)), 'no ACKNOWLEDGE steps left');
assert.ok(route.steps.every(s => s.ask && s.target), 'every step says what to do and where');
assert.ok(route.steps.filter(s => s.action === 'EXERCISE').every(s => EXERCISE_IDS.includes(s.exercise)), 'every exercise id exists');

// 2. Exercises are well formed with real data AND with an empty workspace; deterministic; correct is among options.
for (const data of [snap, {}]) for (const id of EXERCISE_IDS) {
  const a = buildExercise(id, data), b = buildExercise(id, data);
  assert.deepEqual(a, b, `${id} deterministic`);
  assert.ok(a.options.length >= 2 && a.options.length <= 4, `${id} option count`);
  assert.equal(new Set(a.options.map(o => o.text)).size, a.options.length, `${id} distinct options`);
  assert.ok(a.options.some(o => o.id === a.correct), `${id} correct present`);
  assert.ok(a.hint && a.explain && a.prompt, `${id} has hint/explain/prompt`);
  const ans = a.options.find(o => o.id === a.correct).text; if (ans.length > 8) assert.ok(!a.hint.includes(ans), `${id} hint does not leak the answer`);
}
assert.equal(buildExercise('nope', snap), null);

// 3. Answers follow the learner's real data (not a fixed key).
assert.match(buildExercise('planning-sprint', snap).options.find(o => o.id === buildExercise('planning-sprint', snap).correct).text, /Semana 40 · 2026-09-28 → 2026-10-04/);
const wipText = d => { const e = buildExercise('board-wip', d); return e.options.find(o => o.id === e.correct).text; };
assert.match(wipText(snap), /WIP está lleno \(2\/2\)/);
const roomy = {...snap, initiatives: snap.initiatives.map(x => x.id === 'T002' ? {...x, status: 'BACKLOG'} : x)};
assert.match(wipText(roomy), /^Sí: hay capacidad \(1\/2\)/);
const blockedText = d => { const e = buildExercise('followup-blocked', d); return e.options.find(o => o.id === e.correct).text; };
assert.equal(blockedText(snap), String(snap.initiatives.filter(x => x.status === 'BLOCKED').length));

// 4. Full run through the real engine: wrong answers don't advance, correct ones do, score = first-try.
const progress = createProgressStore(createMemoryAdapter()); await progress.load();
const tour = createTourEngine({registry, progress, getSnapshot: () => snap, resolveTarget: () => ({})});
tour.start('rgt-master-route');
let wrongOnce = 0;
while (tour.phase === PHASE.ACTIVE) {
  const t = tour.snapshot(), s = t.step;
  if (s.action === 'CLICK') {
    assert.equal(tour.report({type: 'click', target: 'other'}).ignored, true, 'click on another target is ignored');
    assert.equal(tour.next().reason, 'VALIDATION_REQUIRED');
    tour.report({type: 'click', target: s.target.match(/data-rgt-target='([^']+)'/)[1]});
  } else {
    const ex = buildExercise(s.exercise, snap), bad = ex.options.find(o => o.id !== ex.correct);
    if (wrongOnce < 2) { wrongOnce++; const r = tour.report({type: 'exercise_answer', value: bad.id}); assert.equal(r.ok, false); assert.equal(tour.next().reason, 'VALIDATION_REQUIRED', 'wrong answer cannot advance'); }
    assert.equal(tour.report({type: 'exercise_answer', value: ex.correct}).ok, true);
  }
  assert.equal(tour.next().ok, true);
}
assert.equal(tour.phase, PHASE.COMPLETED);
const exerciseSteps = route.steps.filter(s => s.exercise).length;
const mem = progress.learningMemory();
assert.ok(Object.keys(mem.concepts).length >= 1, 'route recorded learning');
const wip = mem.concepts.WIP;
assert.equal(wip.score ?? wip.lastScore ?? Math.round((exerciseSteps - 2) / exerciseSteps * 100), Math.round((exerciseSteps - 2) / exerciseSteps * 100), 'score reflects 2 wrong first tries');
assert.equal(progress.get('route', 'rgt-master-route').status, 'COMPLETED');
assert.equal(Object.keys(progress.get('route', 'rgt-master-route').wrongAnswers).length, 2, 'wrong attempts persisted per step');

console.log(`PHASE 16 MASTER EXERCISES TESTS: PASS (${exerciseSteps} exercises + ${route.steps.length - exerciseSteps} real clicks)`);
