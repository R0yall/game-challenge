import * as THREE from 'three';

export type SectionKind = 'cruise' | 'sparse' | 'dense' | 'turn' | 'loop' | 'jump' | 'corkscrew';
interface Section { start: number; length: number; kind: SectionKind; origin: THREE.Vector3; heading: number; bend: number }
export interface CourseFrame { position: THREE.Vector3; rotation: THREE.Quaternion; kind: SectionKind; gap: boolean; protected: boolean; density: number }

// Distance along the course is independent of world Z (which reverses in loops).
export class Course {
 private sections: Section[] = [];
 reset(): void { this.sections = []; this.ensure(600); }
 constructor() { this.reset(); }
 private ensure(distance: number): void {
  while (!this.sections.length || this.sections[this.sections.length - 1].start + this.sections[this.sections.length - 1].length <= distance) {
   const last = this.sections[this.sections.length - 1];
   const end = last ? this.evaluate(last, last.length) : null;
   const kinds: SectionKind[] = ['cruise', 'sparse', 'dense', 'turn', 'loop', 'jump', 'corkscrew'];
   const choices = kinds.filter(k => k !== last?.kind);
   const kind = last ? choices[Math.floor(Math.random() * choices.length)] : 'sparse';
   const length = kind === 'loop' ? 260 + Math.random() * 50 : kind === 'jump' ? 155 + Math.random() * 30 : 100 + Math.random() * 90;
   this.sections.push({ start: last ? last.start + last.length : 0, length, kind, origin: end?.position ?? new THREE.Vector3(), heading: last ? last.heading + (last.kind === 'turn' ? last.bend : 0) : 0, bend: (Math.random() > .5 ? 1 : -1) * (.65 + Math.random() * .65) });
  }
 }
 private evaluate(s: Section, d: number): CourseFrame {
  const t = THREE.MathUtils.clamp(d / s.length, 0, 1);
  let x = 0, y = 0, z = d, pitch = 0, yaw = s.heading, bank = 0;
  if (s.kind === 'turn') {
   const a = t * s.bend, r = s.length / s.bend;
   x = r * (1 - Math.cos(a)); z = r * Math.sin(a); yaw += a;
   bank = -Math.sign(s.bend) * .55 * Math.sin(Math.PI * t);
  } else if (s.kind === 'loop') {
   // Flat approach and exit, then a full vertical circle with a small forward drift.
   const approach = 25, loopLength = s.length - 50, r = (loopLength - 20) / (2 * Math.PI);
   const u = THREE.MathUtils.clamp((d - approach) / loopLength, 0, 1), a = u * Math.PI * 2;
   z = d < approach ? d : approach + r * Math.sin(a) + 20 * u + Math.max(0, d - approach - loopLength);
   y = r * (1 - Math.cos(a));
   x = Math.sign(s.bend) * 28 * u * u * (3 - 2 * u);
   if (d >= approach && d <= approach + loopLength) pitch = -Math.atan2(r * Math.sin(a), r * Math.cos(a) + 20 / (2 * Math.PI));
  } else if (s.kind === 'corkscrew') {
   const u = t * t * (3 - 2 * t), a = u * Math.PI * 2;
   const rate = 2 * Math.PI * 6 * t * (1 - t) / s.length;
   const side = Math.sign(s.bend);
   x = side * 10 * (1 - Math.cos(a)); y = 10 * Math.sin(a);
   yaw += Math.atan2(side * 10 * Math.sin(a) * rate, 1);
   pitch = -Math.atan2(10 * Math.cos(a) * rate, Math.hypot(1, 10 * Math.sin(a) * rate));
   bank = side * a;
  } else if (s.kind === 'jump') {
   // Smooth launch ramp, ballistic flight and a matching downhill landing ramp.
   const a = .25 * s.length, b = .75 * s.length, h = 6;
   if (d < a) { y = h * (d / a) ** 2; pitch = -Math.atan(2 * h * d / (a * a)); }
   else if (d <= b) { const u = (d - a) / (b - a); y = h + 4 * h * u * (1 - u); pitch = -Math.atan(4 * h * (1 - 2 * u) / (b - a)); }
   else { y = h * ((s.length - d) / a) ** 2; pitch = Math.atan(2 * h * (s.length - d) / (a * a)); }
  }
  const position = new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.heading).add(s.origin);
  const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, bank, 'YXZ'));
  if (s.kind === 'loop' && d >= 25 && d <= s.length - 25) {
   const l = s.length - 50, u = (d - 25) / l, a = u * 2 * Math.PI, r = (l - 20) / (2 * Math.PI);
   const forward = new THREE.Vector3(Math.sign(s.bend) * 28 * 6 * u * (1 - u), r * 2 * Math.PI * Math.sin(a), r * 2 * Math.PI * Math.cos(a) + 20).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), s.heading);
   const upHint = new THREE.Vector3(0, 1, 0).applyQuaternion(rotation);
   const right = new THREE.Vector3().crossVectors(upHint, forward).normalize();
   const up = new THREE.Vector3().crossVectors(forward, right).normalize();
   rotation.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, forward));
  }
  const protectedSection = s.kind === 'corkscrew' || s.kind === 'loop' || s.kind === 'jump' || d < 15 || d > s.length - 15;
  return { position, rotation, kind: s.kind, gap: s.kind === 'jump' && t > .25 && t < .75, protected: protectedSection, density: protectedSection || s.kind === 'cruise' ? 0 : s.kind === 'dense' ? 1 : s.kind === 'sparse' ? .3 : .5 };
 }
 sample(distance: number): CourseFrame {
  this.ensure(distance + 600);
  const s = this.sections.find(s => distance < s.start + s.length) ?? this.sections[this.sections.length - 1];
  return this.evaluate(s, distance - s.start);
 }
 place(object: THREE.Object3D, distance: number, x = 0, height = 0): void {
  const f = this.sample(distance);
  object.position.copy(f.position).add(new THREE.Vector3(x, height, 0).applyQuaternion(f.rotation));
  object.quaternion.copy(f.rotation);
 }
}
