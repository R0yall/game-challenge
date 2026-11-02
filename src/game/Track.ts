import * as THREE from 'three';
import { TRACK_WIDTH } from './SlopeMath.ts';
import { Course } from './Course.ts';
export const SEGMENT_LENGTH = 2;
export const TOTAL_SEGMENTS = 300;
export class Track {
 public group = new THREE.Group();
 private segments: { z: number; group: THREE.Group }[] = [];
 constructor(public course: Course) {
		const canvas = document.createElement('canvas');
		const tilePixels = 8;
		const columns = 12;
		const rows = 30;
		canvas.width = columns * tilePixels;
		canvas.height = rows * tilePixels;
		const context = canvas.getContext('2d');
		if (!context) throw new Error('Could not create road texture');
		const colors = ['#ff426b', '#ff963f', '#ffe458', '#56e895', '#35cfff', '#9a78ff'];
		for (let z = 0; z < rows; z++) {
			for (let x = 0; x < columns; x++) {
				// The color pattern repeats at the segment boundaries.
				context.fillStyle = colors[(x + Math.floor(z / 5)) % colors.length];
				context.fillRect(x * tilePixels, z * tilePixels, tilePixels, tilePixels);
				context.fillStyle = (x + z) % 2 === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(28,0,54,0.14)';
				context.fillRect(x * tilePixels, z * tilePixels, tilePixels, tilePixels);
				context.fillStyle = 'rgba(255,255,255,0.16)';
				context.fillRect(x * tilePixels, z * tilePixels, tilePixels, 1);
				context.fillRect(x * tilePixels, z * tilePixels, 1, tilePixels);
			}
		}
		const roadTexture = new THREE.CanvasTexture(canvas);
		roadTexture.colorSpace = THREE.SRGBColorSpace;
		roadTexture.wrapT = THREE.RepeatWrapping;
  roadTexture.magFilter = THREE.NearestFilter;
		roadTexture.minFilter = THREE.NearestFilter;
		const roadMat = new THREE.MeshStandardMaterial({
			map: roadTexture,
			emissive: 0xffffff,
			emissiveMap: roadTexture,
			emissiveIntensity: 0.3,
			roughness: 0.6,
			metalness: 0.1
		});

		const leftRailMat = new THREE.MeshStandardMaterial({
			color: 0x00f0ff,
			emissive: 0x00f0ff,
			emissiveIntensity: 2.0,
			roughness: 0.1
		});

		const rightRailMat = new THREE.MeshStandardMaterial({
			color: 0xff0077,
			emissive: 0xff0077,
			emissiveIntensity: 2.0,
			roughness: 0.1
		});

  const roadGeo = new THREE.BoxGeometry(TRACK_WIDTH, .4, 2.1);
  const railGeo = new THREE.BoxGeometry(.35, .9, 2.1);
  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
   const group = new THREE.Group();
   const road = new THREE.Mesh(roadGeo.clone(), roadMat); road.position.y = -.2; group.add(road);
   for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(railGeo.clone(), side < 0 ? leftRailMat : rightRailMat);
    rail.position.set(side * TRACK_WIDTH / 2, .35, 0); group.add(rail);
   }
   this.group.add(group); this.segments.push({ z: i * SEGMENT_LENGTH, group });
  }
  this.reset();
 }
 private place(seg: {z: number; group: THREE.Group}): void {
  // Sweep the slab and rails between actual course samples so bends and twists join.
  for (const child of seg.group.children) {
   const mesh = child as THREE.Mesh<THREE.BoxGeometry>;
   const attribute = mesh.geometry.getAttribute('position');
   const original = mesh.geometry.userData.original ?? Array.from(attribute.array);
   mesh.geometry.userData.original = original;
   const offset = mesh.geometry.userData.offset ?? mesh.position.clone();
   mesh.geometry.userData.offset = offset;
   mesh.position.set(0, 0, 0);
   for (let i = 0; i < attribute.count; i++) {
    const distance = seg.z + 1 + original[i * 3 + 2];
    const frame = this.course.sample(distance);
    const point = new THREE.Vector3(original[i * 3] + offset.x, original[i * 3 + 1] + offset.y, 0).applyQuaternion(frame.rotation).add(frame.position);
    attribute.setXYZ(i, point.x, point.y, point.z);
    if (mesh.material instanceof THREE.MeshStandardMaterial && mesh.material.map) {
     mesh.geometry.getAttribute('uv').setY(i, distance / 60);
    }
   }
   attribute.needsUpdate = true;
   mesh.geometry.getAttribute('uv').needsUpdate = true;
   mesh.geometry.computeVertexNormals();
   mesh.geometry.computeBoundingSphere();
  }
  seg.group.visible = !this.course.sample(seg.z + 1).gap;
 }
 update(playerZ: number): void {
  for (const seg of this.segments) if (seg.z + 2 < playerZ - 35) {
   seg.z += TOTAL_SEGMENTS * SEGMENT_LENGTH; this.place(seg);
  }
 }
 reset(): void { this.segments.forEach((seg, i) => { seg.z = i * SEGMENT_LENGTH; this.place(seg); }); }
}
