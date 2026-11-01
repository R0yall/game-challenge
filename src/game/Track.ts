import * as THREE from 'three';
import {
	SLOPE_ANGLE,
	TRACK_WIDTH,
	getSlopePosition
} from './SlopeMath.ts';

export const SEGMENT_LENGTH = 60;
export const TOTAL_SEGMENTS = 7; // 7 * 60 = 420m of continuous visible track

interface TrackSegment {
	s: number; // start distance along slope
	group: THREE.Group;
}

export class Track {
	public group: THREE.Group;
	private segments: TrackSegment[] = [];
	private tempPos = new THREE.Vector3();

	constructor() {
		this.group = new THREE.Group();

		// Shared Geometries & Materials for efficiency
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
			// Tilt entire segment group by slope angle so surface is flush with the slope
			segGroup.rotation.x = -SLOPE_ANGLE;

			// Road slab: top surface is at y = 0
			const roadMesh = new THREE.Mesh(roadGeo, i % 2 === 0 ? darkRoadMat : lightRoadMat);
			roadMesh.position.y = -0.2;
			segGroup.add(roadMesh);

			// Left glowing guard rail
			const leftRail = new THREE.Mesh(railGeo, leftRailMat);
			leftRail.position.set(-TRACK_WIDTH / 2, 0.3, 0);
			segGroup.add(leftRail);

			// Right glowing guard rail
			const rightRail = new THREE.Mesh(railGeo, rightRailMat);
			rightRail.position.set(TRACK_WIDTH / 2, 0.3, 0);
			segGroup.add(rightRail);

			// Glowing center lane stripe
			const centerLine = new THREE.Mesh(centerLineGeo, centerLineMat);
			centerLine.position.set(0, 0.02, 0);
			segGroup.add(centerLine);

			const startS = i * SEGMENT_LENGTH;
			this.positionSegment(segGroup, startS);

			this.group.add(segGroup);
			this.segments.push({ s: startS, group: segGroup });
		}
	}

	private positionSegment(segGroup: THREE.Group, startS: number): void {
		const centerS = startS + SEGMENT_LENGTH / 2;
		// Position at slope surface (h = 0)
		getSlopePosition(0, centerS, 0, this.tempPos);
		segGroup.position.copy(this.tempPos);
	}

	update(playerS: number): void {
		// Recycle segments behind the player
		for (const seg of this.segments) {
			if (seg.s + SEGMENT_LENGTH < playerS - 15) {
				const maxS = Math.max(...this.segments.map((s) => s.s));
				seg.s = maxS + SEGMENT_LENGTH;
				this.positionSegment(seg.group, seg.s);
			}
		}
	}

	reset(): void {
		for (let i = 0; i < this.segments.length; i++) {
			this.segments[i].s = i * SEGMENT_LENGTH;
			this.positionSegment(this.segments[i].group, this.segments[i].s);
		}
	}
}
