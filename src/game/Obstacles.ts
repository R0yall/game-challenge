import * as THREE from 'three';
import {
	HALF_TRACK,
	PLAYER_RADIUS
} from './SlopeMath.ts';

export type ObstacleType = 'barrier' | 'pillar' | 'moving';

interface ObstacleEntity {
	type: ObstacleType;
	x: number;
	z: number;
	w: number;
	h: number;
	d: number;
	speedX?: number;
	group: THREE.Group;
}

interface GemEntity {
	x: number;
	z: number;
	collected: boolean;
	mesh: THREE.Mesh;
}

export class ObstacleManager {
	public group: THREE.Group;
	private obstacles: ObstacleEntity[] = [];
	private gems: GemEntity[] = [];

	constructor() {
		this.group = new THREE.Group();
		this.initObstacles();
		this.initGems();
	}

	private initObstacles(): void {
		const barrierGeo = new THREE.BoxGeometry(3.4, 0.85, 0.6);
		const pillarGeo = new THREE.BoxGeometry(2.2, 4.4, 1.2);
		const movingGeo = new THREE.BoxGeometry(2.8, 2.2, 0.8);

		const barrierMat = new THREE.MeshStandardMaterial({
			color: 0xff0055,
			emissive: 0xff0055,
			emissiveIntensity: 0.9,
			roughness: 0.25,
			metalness: 0.7
		});

		const pillarMat = new THREE.MeshStandardMaterial({
			color: 0x9900ff,
			emissive: 0x9900ff,
			emissiveIntensity: 0.9,
			roughness: 0.25,
			metalness: 0.7
		});

		const movingMat = new THREE.MeshStandardMaterial({
			color: 0xffaa00,
			emissive: 0xffaa00,
			emissiveIntensity: 1.0,
			roughness: 0.2,
			metalness: 0.8
		});

		// 12 Obstacles in pool
		const types: ObstacleType[] = [
			'barrier', 'pillar', 'moving',
			'barrier', 'pillar', 'barrier',
			'moving', 'pillar', 'barrier',
			'pillar', 'barrier', 'moving'
		];

		const laneOffsets = [-3.2, 0, 3.2];

		types.forEach((type, idx) => {
			const grp = new THREE.Group();

			let w = 3.4;
			let h = 0.85;
			let d = 0.6;
			let speedX: number | undefined;

			if (type === 'barrier') {
				const mesh = new THREE.Mesh(barrierGeo, barrierMat);
				mesh.position.y = h / 2;
				grp.add(mesh);
			} else if (type === 'pillar') {
				w = 2.2;
				h = 4.4;
				d = 1.2;
				const mesh = new THREE.Mesh(pillarGeo, pillarMat);
				mesh.position.y = h / 2;
				grp.add(mesh);
			} else {
				w = 2.8;
				h = 2.2;
				d = 0.8;
				speedX = (idx % 2 === 0 ? 1 : -1) * 5.5;
				const mesh = new THREE.Mesh(movingGeo, movingMat);
				mesh.position.y = h / 2;
				grp.add(mesh);
			}

			const laneX = laneOffsets[idx % laneOffsets.length];
			const startZ = 55 + idx * 28;

			grp.position.set(laneX, 0, startZ);

			this.group.add(grp);
			this.obstacles.push({
				type,
				x: laneX,
				z: startZ,
				w,
				h,
				d,
				speedX,
				group: grp
			});
		});
	}

	private initGems(): void {
		const gemGeo = new THREE.OctahedronGeometry(0.5, 0);
		const gemMat = new THREE.MeshStandardMaterial({
			color: 0x00ffff,
			emissive: 0x00ffff,
			emissiveIntensity: 2.5,
			roughness: 0.1,
			metalness: 0.95
		});

		const laneOffsets = [-3.2, 3.2, 0];

		for (let i = 0; i < 8; i++) {
			const mesh = new THREE.Mesh(gemGeo, gemMat);
			const gemX = laneOffsets[i % laneOffsets.length];
			const gemZ = 65 + i * 36;

			mesh.position.set(gemX, 1.2, gemZ);

			this.group.add(mesh);
			this.gems.push({
				x: gemX,
				z: gemZ,
				collected: false,
				mesh
			});
		}
	}

	update(dt: number, playerZ: number, currentSpeed: number): void {
		// 1. Move sliding obstacles
		for (const obs of this.obstacles) {
			if (obs.type === 'moving' && obs.speedX !== undefined) {
				obs.x += obs.speedX * dt;
				const minX = -HALF_TRACK + 1.2;
				const maxX = HALF_TRACK - 1.2;

				if (obs.x < minX) {
					obs.x = minX;
					obs.speedX = Math.abs(obs.speedX);
				} else if (obs.x > maxX) {
					obs.x = maxX;
					obs.speedX = -Math.abs(obs.speedX);
				}

				obs.group.position.x = obs.x;
			}

			// Recycle obstacle when behind player
			if (obs.z < playerZ - 15) {
				const maxZ = Math.max(...this.obstacles.map((o) => o.z));
				const spacing = Math.max(18, 30 - (currentSpeed - 26) * 0.25);
				obs.z = maxZ + spacing;

				const laneRoll = Math.random();
				if (laneRoll < 0.33) obs.x = -3.2;
				else if (laneRoll < 0.66) obs.x = 0;
				else obs.x = 3.2;

				if (obs.type === 'moving') {
					obs.x = (Math.random() - 0.5) * 4;
					obs.speedX = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 3);
				}

				obs.group.position.set(obs.x, 0, obs.z);
			}
		}

		// 2. Rotate & recycle gems
		for (const gem of this.gems) {
			if (!gem.collected) {
				gem.mesh.rotation.y += dt * 3.2;
			}

			// Recycle gem when behind player
			if (gem.z < playerZ - 15) {
				const maxGemZ = Math.max(...this.gems.map((g) => g.z));
				gem.z = maxGemZ + 35;
				gem.collected = false;
				gem.mesh.visible = true;

				const laneRoll = Math.random();
				if (laneRoll < 0.33) gem.x = -3.2;
				else if (laneRoll < 0.66) gem.x = 0;
				else gem.x = 3.2;

				gem.mesh.position.set(gem.x, 1.2, gem.z);
			}
		}
	}

	checkCollision(playerX: number, playerZ: number, playerJumpY: number): boolean {
		for (const obs of this.obstacles) {
			const dz = Math.abs(playerZ - obs.z);
			const allowedDz = obs.d / 2 + PLAYER_RADIUS * 0.75;

			if (dz < allowedDz) {
				const dx = Math.abs(playerX - obs.x);
				const allowedDx = obs.w / 2 + PLAYER_RADIUS * 0.7;

				if (dx < allowedDx) {
					// Check jump clearance
					const clearance = obs.h - PLAYER_RADIUS * 0.4;
					if (playerJumpY < clearance) {
						return true; // CRASH!
					}
				}
			}
		}
		return false;
	}

	checkGems(playerX: number, playerZ: number, onCollect: () => void): void {
		for (const gem of this.gems) {
			if (gem.collected) continue;
			const dz = Math.abs(playerZ - gem.z);
			const dx = Math.abs(playerX - gem.x);
			if (dz < PLAYER_RADIUS + 0.8 && dx < PLAYER_RADIUS + 0.8) {
				gem.collected = true;
				gem.mesh.visible = false;
				onCollect();
			}
		}
	}

	reset(): void {
		const laneOffsets = [-3.2, 0, 3.2];
		this.obstacles.forEach((obs, idx) => {
			obs.z = 55 + idx * 28;
			obs.x = laneOffsets[idx % laneOffsets.length];
			if (obs.type === 'moving') {
				obs.speedX = (idx % 2 === 0 ? 1 : -1) * 5.5;
			}
			obs.group.position.set(obs.x, 0, obs.z);
		});

		this.gems.forEach((gem, idx) => {
			gem.z = 65 + idx * 36;
			gem.x = laneOffsets[idx % laneOffsets.length];
			gem.collected = false;
			gem.mesh.visible = true;
			gem.mesh.position.set(gem.x, 1.2, gem.z);
		});
	}
}
