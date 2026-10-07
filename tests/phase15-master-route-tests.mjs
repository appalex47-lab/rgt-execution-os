import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRegistry} from '../js/learning/registry.js';
import {registerMasterRoute} from '../js/learning/content/masterRoute.js';
import {GROUPS, UTILITIES, allViews} from '../js/core/nav.js';

const r = createRegistry();
registerMasterRoute.bind(null)();
// The production registration above uses the module singleton; locate the route from a fresh import instead.
const {registry} = await import('../js/learning/registry.js');
const master = registry.get('route', 'rgt-master-route');
assert.ok(master, 'master route must be registered');
assert.equal(master.master, true);
assert.equal(master.real, true);
assert.equal(master.steps.length, 18);

const views = master.steps.map(s => s.view);
assert.deepEqual(views, [
  'dashboard',
  'group:planificar', 'planning', 'board', 'initiatives', 'must-win',
  'group:ejecutar', 'tasks', 'deep-work', 'follow-up',
  'group:revisar', 'review', 'execution-health', 'performance', 'history',
  'group:aprender', 'academy',
  'assistant'
]);
assert.equal(new Set(master.steps.map(s => s.id)).size, master.steps.length);
assert.ok(master.steps.every(s => ['EXERCISE', 'CLICK'].includes(s.action)), 'Fase 16: cada paso es un ejercicio o una acción real');
assert.ok(master.steps.filter(s => s.action === 'EXERCISE').every(s => s.validation?.id === 'exercise_answer'));
assert.ok(master.steps.every(s => !s.view || allViews().includes(s.view)), 'every route view must be real');
assert.ok(!views.includes('cases'), 'placeholder cases must not enter natural route');
assert.ok(!views.includes('guided-routes'), 'route launcher must not route to itself');
assert.equal(master.steps.at(-1).view, 'assistant');

const learn = GROUPS.find(g => g.id === 'aprender');
assert.ok(learn?.modules.some(m => m.view === 'academy'));
assert.ok(UTILITIES.some(u => u.view === 'assistant'));

const launcher = fs.readFileSync(new URL('../js/ui/guidedRoutes.js', import.meta.url), 'utf8');
assert.match(launcher, /rgt-master-route/);
assert.ok(!launcher.includes('PLANNED_ROUTES'));

const guide = fs.readFileSync(new URL('../js/ui/guide.js', import.meta.url), 'utf8');
assert.match(guide, /t\.step\.view && t\.step\.view !== currentView\(\)/);
assert.match(guide, /router\.go\(t\.step\.view\)/);

console.log(`PHASE 15 MASTER ROUTE TESTS: PASS (18 steps)`);
