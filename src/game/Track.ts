import * as THREE from 'three';
import { TRACK_WIDTH } from './SlopeMath.ts';

export const SEGMENT_LENGTH = 60;
export const TOTAL_SEGMENTS = 7; // 7 * 60 = 420m of continuous visible road

interface TrackSegment {
	z: number;
	group: THREE.Group;
}

export class Track {
	public group: THREE.Group;
	private segments: TrackSegment[] = [];

	constructor() {
		this.group = new THREE.Group();

		// Shared Geometries & Materials
		const roadGeo = new THREE.BoxGeometry(TRACK_WIDTH, 0.4, SEGMENT_LENGTH);
		const railGeo = new THREE.BoxGeometry(0.35, 0.9, SEGMENT_LENGTH);
		// A small nearest-neighbour texture gives each road tile a crisp retro look.
		// Thirty rows fit each segment exactly, so recycled sections join cleanly.
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

		for (let i = 0; i < TOTAL_SEGMENTS; i++) {
			const segGroup = new THREE.Group();

			// Road slab: top surface is flush at y = 0
			const roadMesh = new THREE.Mesh(roadGeo, roadMat);
			roadMesh.position.y = -0.2;
			segGroup.add(roadMesh);

			// Left glowing guard rail
			const leftRail = new THREE.Mesh(railGeo, leftRailMat);
			leftRail.position.set(-TRACK_WIDTH / 2, 0.35, 0);
			segGroup.add(leftRail);

			// Right glowing guard rail
			const rightRail = new THREE.Mesh(railGeo, rightRailMat);
			rightRail.position.set(TRACK_WIDTH / 2, 0.35, 0);
			segGroup.add(rightRail);

			const startZ = i * SEGMENT_LENGTH;
			segGroup.position.set(0, 0, startZ + SEGMENT_LENGTH / 2);

			this.group.add(segGroup);
			this.segments.push({ z: startZ, group: segGroup });
		}
	}

	update(playerZ: number): void {
		// Leapfrog segments behind the player to the front
		for (const seg of this.segments) {
			if (seg.z + SEGMENT_LENGTH < playerZ - 15) {
				const maxZ = Math.max(...this.segments.map((s) => s.z));
				seg.z = maxZ + SEGMENT_LENGTH;
				seg.group.position.z = seg.z + SEGMENT_LENGTH / 2;
			}
		}
	}

	reset(): void {
		for (let i = 0; i < this.segments.length; i++) {
			this.segments[i].z = i * SEGMENT_LENGTH;
			this.segments[i].group.position.set(0, 0, this.segments[i].z + SEGMENT_LENGTH / 2);
		}
	}
}
