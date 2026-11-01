<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import {
		game,
		TRACK_WIDTH,
		PLAYER_RADIUS,
		GRAVITY,
		BASE_SPEED,
		MAX_SPEED
	} from '../game/gameStore.svelte';

	const SLOPE = 0.16; // Incline factor: ball rolls downhill into the distance
	const slopeAngle = Math.atan(SLOPE);
	const TRACK_SEGMENT_LENGTH = 50;
	const TOTAL_SEGMENTS = 8;
	const HALF_TRACK = TRACK_WIDTH / 2 - 0.7;

	// Slope helper: gives track ground height for any Z
	function getTrackY(z: number): number {
		return -z * SLOPE;
	}

	// Three.js object references
	let cameraRef = $state<THREE.PerspectiveCamera>();
	let playerGroupRef = $state<THREE.Group>();
	let playerMeshRef = $state<THREE.Mesh>();
	let shadowMeshRef = $state<THREE.Mesh>();
	let starPointsRef = $state<THREE.Points>();

	let segmentMeshes = $state<(THREE.Group | undefined)[]>([]);
	let obstacleMeshes = $state<(THREE.Group | undefined)[]>([]);
	let gemMeshes = $state<(THREE.Mesh | undefined)[]>([]);

	// Track segments (managed in Three.js)
	interface SegmentData {
		z: number;
	}

	const segmentPool: SegmentData[] = Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => ({
		z: i * TRACK_SEGMENT_LENGTH
	}));

	// Obstacle Pool (fixed 12 items to avoid reactive thrashing)
	interface ObstacleEntity {
		type: 'barrier' | 'pillar' | 'moving';
		x: number;
		y: number;
		z: number;
		w: number;
		h: number;
		d: number;
		speedX?: number;
		minX?: number;
		maxX?: number;
	}

	const obstaclePool: ObstacleEntity[] = [
		// 5 Low barriers (jumpable)
		{ type: 'barrier', x: 0, y: 0.45, z: 50, w: 3.4, h: 0.9, d: 0.6 },
		{ type: 'barrier', x: -3.2, y: 0.45, z: 90, w: 3.4, h: 0.9, d: 0.6 },
		{ type: 'barrier', x: 3.2, y: 0.45, z: 130, w: 3.4, h: 0.9, d: 0.6 },
		{ type: 'barrier', x: 0, y: 0.45, z: 170, w: 3.4, h: 0.9, d: 0.6 },
		{ type: 'barrier', x: -3.2, y: 0.45, z: 210, w: 3.4, h: 0.9, d: 0.6 },
		// 5 Tall pillars (steer around)
		{ type: 'pillar', x: 3.2, y: 2.2, z: 70, w: 2.2, h: 4.4, d: 1.2 },
		{ type: 'pillar', x: 0, y: 2.2, z: 110, w: 2.2, h: 4.4, d: 1.2 },
		{ type: 'pillar', x: -3.2, y: 2.2, z: 150, w: 2.2, h: 4.4, d: 1.2 },
		{ type: 'pillar', x: 3.2, y: 2.2, z: 190, w: 2.2, h: 4.4, d: 1.2 },
		{ type: 'pillar', x: 0, y: 2.2, z: 230, w: 2.2, h: 4.4, d: 1.2 },
		// 2 Moving barriers
		{ type: 'moving', x: 0, y: 1.1, z: 100, w: 2.8, h: 2.2, d: 0.8, speedX: 5, minX: -HALF_TRACK + 1.2, maxX: HALF_TRACK - 1.2 },
		{ type: 'moving', x: 0, y: 1.1, z: 180, w: 2.8, h: 2.2, d: 0.8, speedX: -6, minX: -HALF_TRACK + 1.2, maxX: HALF_TRACK - 1.2 }
	];

	// Collectible Gem Pool (fixed 8 items)
	interface GemEntity {
		x: number;
		y: number;
		z: number;
		collected: boolean;
	}

	const gemPool: GemEntity[] = [
		{ x: -3.2, y: 1.2, z: 60, collected: false },
		{ x: 3.2, y: 1.2, z: 80, collected: false },
		{ x: 0, y: 1.2, z: 120, collected: false },
		{ x: -3.2, y: 1.2, z: 140, collected: false },
		{ x: 3.2, y: 1.2, z: 160, collected: false },
		{ x: 0, y: 1.2, z: 200, collected: false },
		{ x: -3.2, y: 1.2, z: 220, collected: false },
		{ x: 3.2, y: 1.2, z: 240, collected: false }
	];

	// Starfield points geometry (created once)
	const starCount = 300;
	const starGeometry = new THREE.BufferGeometry();
	const starPositions = new Float32Array(starCount * 3);
	for (let i = 0; i < starCount; i++) {
		starPositions[i * 3] = (Math.random() - 0.5) * 160;
		starPositions[i * 3 + 1] = Math.random() * 80 - 10;
		starPositions[i * 3 + 2] = Math.random() * 500 - 50;
	}
	starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

	// Reposition an obstacle forward when it falls behind
	function repositionObstacle(obs: ObstacleEntity, idx: number, forwardZ: number) {
		obs.z = forwardZ;
		const laneRoll = Math.random();
		if (laneRoll < 0.33) obs.x = -3.2;
		else if (laneRoll < 0.66) obs.x = 0;
		else obs.x = 3.2;

		if (obs.type === 'moving') {
			obs.x = (Math.random() - 0.5) * 4;
			obs.speedX = (Math.random() > 0.5 ? 1 : -1) * (4.5 + Math.random() * 3);
		}

		const grp = obstacleMeshes[idx];
		if (grp) {
			grp.position.set(obs.x, getTrackY(obs.z) + obs.y, obs.z);
		}
	}

	// Reposition a gem forward
	function repositionGem(gem: GemEntity, idx: number, forwardZ: number) {
		gem.z = forwardZ;
		gem.collected = false;
		const laneRoll = Math.random();
		if (laneRoll < 0.33) gem.x = -3.2;
		else if (laneRoll < 0.66) gem.x = 0;
		else gem.x = 3.2;

		const mesh = gemMeshes[idx];
		if (mesh) {
			mesh.position.set(gem.x, getTrackY(gem.z) + gem.y, gem.z);
			mesh.visible = true;
		}
	}

	// Reset scene entities when game starts / restarts
	function resetSceneWorld() {
		// Reset track
		for (let i = 0; i < segmentPool.length; i++) {
			segmentPool[i].z = i * TRACK_SEGMENT_LENGTH;
			const grp = segmentMeshes[i];
			if (grp) {
				const centerZ = segmentPool[i].z + TRACK_SEGMENT_LENGTH / 2;
				grp.position.set(0, getTrackY(centerZ), centerZ);
			}
		}

		// Reset obstacles
		obstaclePool[0].z = 50;
		obstaclePool[1].z = 75;
		obstaclePool[2].z = 100;
		obstaclePool[3].z = 125;
		obstaclePool[4].z = 150;
		obstaclePool[5].z = 175;
		obstaclePool[6].z = 200;
		obstaclePool[7].z = 225;
		obstaclePool[8].z = 250;
		obstaclePool[9].z = 275;
		obstaclePool[10].z = 300;
		obstaclePool[11].z = 325;

		for (let i = 0; i < obstaclePool.length; i++) {
			const obs = obstaclePool[i];
			const grp = obstacleMeshes[i];
			if (grp) {
				grp.position.set(obs.x, getTrackY(obs.z) + obs.y, obs.z);
			}
		}

		// Reset gems
		gemPool.forEach((gem, idx) => {
			gem.z = 60 + idx * 35;
			gem.collected = false;
			const mesh = gemMeshes[idx];
			if (mesh) {
				mesh.position.set(gem.x, getTrackY(gem.z) + gem.y, gem.z);
				mesh.visible = true;
			}
		});

		// Reset player visual group
		if (playerGroupRef) {
			playerGroupRef.position.set(0, getTrackY(0) + PLAYER_RADIUS, 0);
		}
	}

	// Watch for reset trigger
	let lastResetCount = 0;
	$effect(() => {
		if (game.resetCount !== lastResetCount) {
			lastResetCount = game.resetCount;
			resetSceneWorld();
		}
	});

	// Main physics & animation loop
	useTask((delta) => {
		const dt = Math.min(delta, 0.08);

		if (game.status !== 'playing') {
			return;
		}

		// 1. Forward progression down slope
		if (game.speed < MAX_SPEED) {
			game.speed += dt * 0.4;
		}

		const moveZ = game.speed * dt;
		game.playerZ += moveZ;
		game.distance += moveZ;
		game.score += moveZ * 0.8;

		// Ball rolling rotation
		game.rollAngle += moveZ / PLAYER_RADIUS;

		// 2. Horizontal Steering
		const steerSpeed = 16;
		if (game.moveLeft) {
			game.playerX -= steerSpeed * dt;
		}
		if (game.moveRight) {
			game.playerX += steerSpeed * dt;
		}

		// Boundary check
		if (game.playerX < -HALF_TRACK) game.playerX = -HALF_TRACK;
		else if (game.playerX > HALF_TRACK) game.playerX = HALF_TRACK;

		// 3. Jump & Gravity
		if (!game.isGrounded) {
			game.playerVy += GRAVITY * dt;
			game.playerY += game.playerVy * dt;

			if (game.playerY <= PLAYER_RADIUS) {
				game.playerY = PLAYER_RADIUS;
				game.playerVy = 0;
				game.isGrounded = true;
			}
		}

		// 4. Update Player Meshes (direct Three.js transforms - zero reactive re-render)
		const trackGroundY = getTrackY(game.playerZ);
		if (playerGroupRef) {
			playerGroupRef.position.set(
				game.playerX,
				trackGroundY + game.playerY,
				game.playerZ
			);
		}

		if (playerMeshRef) {
			playerMeshRef.rotation.x = game.rollAngle;
			playerMeshRef.rotation.z = game.moveRight ? -0.2 : game.moveLeft ? 0.2 : 0;
		}

		if (shadowMeshRef) {
			const heightAboveGround = game.playerY - PLAYER_RADIUS;
			shadowMeshRef.position.y = -heightAboveGround;
			const shadowScale = Math.max(0.4, 1 - heightAboveGround * 0.25);
			shadowMeshRef.scale.set(shadowScale, shadowScale, 1);
		}

		// 5. Update Starfield Position (follows player smoothly)
		if (starPointsRef) {
			starPointsRef.position.set(0, trackGroundY, game.playerZ);
		}

		// 6. Track Recycling (Leapfrog segments forward)
		for (let i = 0; i < segmentPool.length; i++) {
			const seg = segmentPool[i];
			if (seg.z + TRACK_SEGMENT_LENGTH < game.playerZ - 10) {
				const maxZ = Math.max(...segmentPool.map((s) => s.z));
				seg.z = maxZ + TRACK_SEGMENT_LENGTH;
				const grp = segmentMeshes[i];
				if (grp) {
					const centerZ = seg.z + TRACK_SEGMENT_LENGTH / 2;
					grp.position.set(0, getTrackY(centerZ), centerZ);
				}
			}
		}

		// 7. Update Moving Obstacles & Recycle Obstacles
		for (let i = 0; i < obstaclePool.length; i++) {
			const obs = obstaclePool[i];
			// Move oscillating obstacles
			if (obs.type === 'moving' && obs.speedX && obs.minX !== undefined && obs.maxX !== undefined) {
				obs.x += obs.speedX * dt;
				if (obs.x < obs.minX) {
					obs.x = obs.minX;
					obs.speedX = Math.abs(obs.speedX);
				} else if (obs.x > obs.maxX) {
					obs.x = obs.maxX;
					obs.speedX = -Math.abs(obs.speedX);
				}
				const grp = obstacleMeshes[i];
				if (grp) {
					grp.position.x = obs.x;
				}
			}

			// Recycle obstacle when passed
			if (obs.z < game.playerZ - 15) {
				const maxObsZ = Math.max(...obstaclePool.map((o) => o.z));
				const spacing = Math.max(18, 30 - (game.speed - BASE_SPEED) * 0.25);
				repositionObstacle(obs, i, maxObsZ + spacing);
			}
		}

		// 8. Update & Recycle Collectible Gems
		for (let i = 0; i < gemPool.length; i++) {
			const gem = gemPool[i];
			const mesh = gemMeshes[i];
			if (mesh && !gem.collected) {
				mesh.rotation.y += dt * 3;
			}

			// Recycle gem when passed
			if (gem.z < game.playerZ - 15) {
				const maxGemZ = Math.max(...gemPool.map((g) => g.z));
				repositionGem(gem, i, maxGemZ + 35);
			}
		}

		// 9. Collision Detection
		const pX = game.playerX;
		const pY = game.playerY;
		const pZ = game.playerZ;
		const pR = PLAYER_RADIUS;

		// Check Obstacles
		for (const obs of obstaclePool) {
			const dz = Math.abs(pZ - obs.z);
			const allowedDz = (obs.d / 2) + pR * 0.75;

			if (dz < allowedDz) {
				const dx = Math.abs(pX - obs.x);
				const allowedDx = (obs.w / 2) + pR * 0.7;

				if (dx < allowedDx) {
					const obsTop = obs.y + obs.h / 2;
					const playerBottom = pY - pR * 0.5;

					if (playerBottom < obsTop) {
						// CRASH!
						game.triggerGameOver();
						return;
					}
				}
			}
		}

		// Check Gems
		for (let i = 0; i < gemPool.length; i++) {
			const gem = gemPool[i];
			if (gem.collected) continue;
			const dist = Math.hypot(pX - gem.x, pY - gem.y, pZ - gem.z);
			if (dist < pR + 0.8) {
				gem.collected = true;
				const mesh = gemMeshes[i];
				if (mesh) mesh.visible = false;
				game.collectGem(50);
			}
		}

		// 10. Camera Follow
		if (cameraRef) {
			const targetCamX = pX * 0.35;
			const targetCamY = trackGroundY + 4.2;
			const targetCamZ = pZ - 8.5;

			cameraRef.position.x += (targetCamX - cameraRef.position.x) * 0.15;
			cameraRef.position.y += (targetCamY - cameraRef.position.y) * 0.2;
			cameraRef.position.z += (targetCamZ - cameraRef.position.z) * 0.25;

			const lookAtX = pX * 0.15;
			const lookAtY = getTrackY(pZ + 15) + 0.8;
			const lookAtZ = pZ + 15;
			cameraRef.lookAt(lookAtX, lookAtY, lookAtZ);

			const targetFov = 65 + (game.speed - BASE_SPEED) * 0.45;
			cameraRef.fov += (targetFov - cameraRef.fov) * 0.05;
			cameraRef.updateProjectionMatrix();
		}
	});
</script>

<!-- Camera -->
<T.PerspectiveCamera
	bind:ref={cameraRef}
	makeDefault
	position={[0, 4.5, -8.5]}
	fov={65}
	near={0.1}
	far={600}
/>

<!-- Lights -->
<T.DirectionalLight position={[15, 30, -10]} intensity={2.2} color="#ffffff" />
<T.AmbientLight intensity={0.8} color="#2b1055" />
<T.HemisphereLight args={['#00f0ff', '#100028', 1.2]} />

<!-- Optimized Starfield (Single Points Object) -->
<T.Points bind:ref={starPointsRef} geometry={starGeometry}>
	<T.PointsMaterial color="#00f0ff" size={0.6} sizeAttenuation={true} />
</T.Points>

<!-- Track Segments (Static pool of 8 meshes) -->
{#each segmentPool as seg, idx (idx)}
	<T.Group
		bind:ref={segmentMeshes[idx]}
		position={[0, getTrackY(seg.z + TRACK_SEGMENT_LENGTH / 2), seg.z + TRACK_SEGMENT_LENGTH / 2]}
		rotation={[-slopeAngle, 0, 0]}
	>
		<!-- Road Surface -->
		<T.Mesh>
			<T.BoxGeometry args={[TRACK_WIDTH, 0.4, TRACK_SEGMENT_LENGTH / Math.cos(slopeAngle)]} />
			<T.MeshStandardMaterial
				color={idx % 2 === 0 ? '#111322' : '#171a2e'}
				roughness={0.4}
				metalness={0.2}
			/>
		</T.Mesh>

		<!-- Glowing Left Rail -->
		<T.Mesh position={[-TRACK_WIDTH / 2, 0.4, 0]}>
			<T.BoxGeometry args={[0.3, 0.8, TRACK_SEGMENT_LENGTH / Math.cos(slopeAngle)]} />
			<T.MeshStandardMaterial
				color="#00f0ff"
				emissive="#00f0ff"
				emissiveIntensity={1.8}
				roughness={0.2}
			/>
		</T.Mesh>

		<!-- Glowing Right Rail -->
		<T.Mesh position={[TRACK_WIDTH / 2, 0.4, 0]}>
			<T.BoxGeometry args={[0.3, 0.8, TRACK_SEGMENT_LENGTH / Math.cos(slopeAngle)]} />
			<T.MeshStandardMaterial
				color="#ff0077"
				emissive="#ff0077"
				emissiveIntensity={1.8}
				roughness={0.2}
			/>
		</T.Mesh>

		<!-- Yellow Center Dash Line -->
		<T.Mesh position={[0, 0.22, 0]}>
			<T.BoxGeometry args={[0.15, 0.05, TRACK_SEGMENT_LENGTH / Math.cos(slopeAngle)]} />
			<T.MeshStandardMaterial
				color="#ffff00"
				emissive="#ffff00"
				emissiveIntensity={1.2}
			/>
		</T.Mesh>
	</T.Group>
{/each}

<!-- Obstacle Pool (Static pool of 12 meshes) -->
{#each obstaclePool as obs, idx (idx)}
	<T.Group
		bind:ref={obstacleMeshes[idx]}
		position={[obs.x, getTrackY(obs.z) + obs.y, obs.z]}
		rotation={[-slopeAngle, 0, 0]}
	>
		<T.Mesh>
			<T.BoxGeometry args={[obs.w, obs.h, obs.d]} />
			<T.MeshStandardMaterial
				color={obs.type === 'barrier' ? '#ff0055' : obs.type === 'pillar' ? '#9900ff' : '#ffaa00'}
				emissive={obs.type === 'barrier' ? '#ff0055' : obs.type === 'pillar' ? '#9900ff' : '#ffaa00'}
				emissiveIntensity={0.8}
				roughness={0.3}
				metalness={0.6}
			/>
		</T.Mesh>
	</T.Group>
{/each}

<!-- Collectible Gems Pool (Static pool of 8 meshes) -->
{#each gemPool as gem, idx (idx)}
	<T.Mesh
		bind:ref={gemMeshes[idx]}
		position={[gem.x, getTrackY(gem.z) + gem.y, gem.z]}
		rotation={[0, 0, Math.PI / 4]}
	>
		<T.OctahedronGeometry args={[0.5, 0]} />
		<T.MeshStandardMaterial
			color="#00ffff"
			emissive="#00ffff"
			emissiveIntensity={2.5}
			roughness={0.1}
			metalness={0.9}
		/>
	</T.Mesh>
{/each}

<!-- Player Group (Direct Three.js transforms - zero reactive re-render) -->
<T.Group bind:ref={playerGroupRef} position={[0, getTrackY(0) + PLAYER_RADIUS, 0]}>
	<!-- Rolling Sphere Mesh -->
	<T.Mesh bind:ref={playerMeshRef}>
		<T.SphereGeometry args={[PLAYER_RADIUS, 32, 32]} />
		<T.MeshStandardMaterial
			color="#00ffff"
			emissive="#0066aa"
			emissiveIntensity={0.9}
			metalness={0.85}
			roughness={0.15}
		/>
	</T.Mesh>

	<!-- Aura Ring -->
	<T.Mesh rotation={[Math.PI / 2, 0, 0]}>
		<T.TorusGeometry args={[PLAYER_RADIUS * 1.15, 0.04, 16, 32]} />
		<T.MeshBasicMaterial color="#ffffff" />
	</T.Mesh>

	<!-- Shadow Mesh (Scaled via Three.js scale) -->
	<T.Mesh
		bind:ref={shadowMeshRef}
		position={[0, -(PLAYER_RADIUS - 0.05), 0]}
		rotation={[-Math.PI / 2 - slopeAngle, 0, 0]}
	>
		<T.CircleGeometry args={[PLAYER_RADIUS * 1.2, 24]} />
		<T.MeshBasicMaterial color="#000000" transparent opacity={0.5} />
	</T.Mesh>
</T.Group>
