import assert from 'node:assert/strict';
import {LESSONS,CONTEXT,ACADEMY_VERSION} from '../js/academy.js';
assert.equal(ACADEMY_VERSION,'1.0.0');
assert.ok(LESSONS.length>=6);
assert.ok(new Set(LESSONS.map(x=>x.id)).size===LESSONS.length);
for(const l of LESSONS){assert.ok(l.title&&l.module&&l.objective&&l.body);assert.ok(Number.isInteger(l.minutes)&&l.minutes>0);assert.ok(Array.isArray(l.check)&&l.check.length>=2);}
for(const k of ['dashboard','board','planning','deep-work','review','performance','execution-health','assistant']){assert.ok(CONTEXT[k],`missing context ${k}`);assert.ok(CONTEXT[k].what&&CONTEXT[k].do&&CONTEXT[k].correct);}
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
assert.match(app,/academy/);assert.match(app,/toggleGuide/);
console.log('PHASE AI-8 TESTS: PASS');
