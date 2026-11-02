import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/game/Course.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace("'three'", JSON.stringify(import.meta.resolve('three')));
const { Course } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const seen = new Set();
for (let run = 0; run < 12; run++) {
 const course = new Course();
 course.sample(10000);
 for (const s of course.sections.slice()) {
  seen.add(s.kind);
  for (let d = 0; d <= s.length; d += 2) {
   const f = course.sample(s.start + d);
   assert.ok(f.position.toArray().every(Number.isFinite));
   assert.ok(Math.abs(f.rotation.length() - 1) < 1e-8);
   if (s.kind === 'loop' || s.kind === 'jump' || s.kind === 'corkscrew') assert.equal(f.density, 0);
   if (f.gap) assert.equal(f.protected, true);
  }
  const before = course.sample(s.start + s.length - .001);
  const after = course.sample(s.start + s.length + .001);
  assert.ok(before.position.distanceTo(after.position) < .01, 'section position continuity');
  assert.ok(before.rotation.angleTo(after.rotation) < .01, 'section orientation continuity');
  if (s.kind === 'loop') {
   const top = course.sample(s.start + s.length / 2);
   assert.ok(top.position.y > s.origin.y + 50, 'loop has a vertical top');
   const end = course.sample(s.start + s.length);
   const delta = end.position.clone().sub(s.origin).applyAxisAngle({x:0,y:1,z:0}, -s.heading);
   assert.ok(Math.abs(Math.abs(delta.x) - 28) < .01, 'loop exits offset left or right');
  }
 }
 const old = course.sections.map(s => s.length).join(',');
 course.reset();
 assert.notEqual(course.sections.map(s => s.length).join(','), old);
}
assert.equal(seen.size, 7);
console.log('Course checks passed: randomized sections, continuous joins, loops, gaps and safe stunt sections.');
