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
		const centerLineGeo = new THREE.BoxGeometry(0.2, 0.04, SEGMENT_LENGTH);

		const darkRoadMat = new THREE.MeshStandardMaterial({
			color: 0x111322,
			roughness: 0.35,
			metalness: 0.25
		});
		const lightRoadMat = new THREE.MeshStandardMaterial({
			color: 0x171a2e,
			roughness: 0.35,
			metalness: 0.25
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

		const centerLineMat = new THREE.MeshStandardMaterial({
			color: 0xffff00,
			emissive: 0xffcc00,
			emissiveIntensity: 1.2
		});

		for (let i = 0; i < TOTAL_SEGMENTS; i++) {
			const segGroup = new THREE.Group();

			// Road slab: top surface is flush at y = 0
			const roadMesh = new THREE.Mesh(roadGeo, i % 2 === 0 ? darkRoadMat : lightRoadMat);
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

			// Glowing center lane stripe
			const centerLine = new THREE.Mesh(centerLineGeo, centerLineMat);
			centerLine.position.set(0, 0.01, 0);
			segGroup.add(centerLine);

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
