<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import * as THREE from 'three';
	import {
		game,
		TRACK_WIDTH,
		PLAYER_RADIUS,
		GRAVITY,
		BASE_SPEED,
		MAX_SPEED
	} from '../game/gameStore.svelte';
	import type { Obstacle, Collectible, TrackSegment } from '../types/game';

	const SLOPE = 0.16; // Incline factor: ball rolls downward into the distance
	const TRACK_SEGMENT_LENGTH = 50;
	const TOTAL_SEGMENTS = 8;
	const HORIZON_DISTANCE = TRACK_SEGMENT_LENGTH * (TOTAL_SEGMENTS - 1);
	const HALF_TRACK = TRACK_WIDTH / 2 - 0.7;

	// Slope helper: gives track ground height for any Z
	function getTrackY(z: number): number {
		return -z * SLOPE;
	}

	const slopeAngle = Math.atan(SLOPE);

	// Three.js object references
	let cameraRef = $state<THREE.PerspectiveCamera>();
	let playerMeshRef = $state<THREE.Mesh>();

	// Track segments state
	let segments = $state<TrackSegment[]>([]);
	let obstacles = $state<Obstacle[]>([]);
	let collectibles = $state<Collectible[]>([]);
	let obstacleIdCounter = 0;
	let nextSpawnZ = 45;

	// Initialize track segments
	function initTrack() {
		segments = [];
		for (let i = 0; i < TOTAL_SEGMENTS; i++) {
			segments.push({
				id: i,
				z: i * TRACK_SEGMENT_LENGTH,
				length: TRACK_SEGMENT_LENGTH,
				color: i % 2 === 0 ? '#111322' : '#171a2e'
			});
		}
	}

	// Procedural generation helper
	function spawnObstaclesUpTo(targetZ: number) {
		while (nextSpawnZ < targetZ) {
			const z = nextSpawnZ;
			const r = Math.random();

			// 75% chance of obstacle, 25% empty breather
			if (r < 0.75) {
				const typeRoll = Math.random();
				const laneRoll = Math.random();
				let laneX = 0;
				if (laneRoll < 0.33) laneX = -3.2;
				else if (laneRoll < 0.66) laneX = 0;
				else laneX = 3.2;

				if (typeRoll < 0.45) {
					// Low barrier - jumpable!
					obstacles.push({
						id: ++obstacleIdCounter,
						type: 'barrier',
						x: laneX,
						y: 0.45,
						z: z,
						width: 3.2,
						height: 0.9,
						depth: 0.6,
						color: '#ff0055'
					});
				} else if (typeRoll < 0.75) {
					// Tall pillar - must steer around!
					obstacles.push({
						id: ++obstacleIdCounter,
						type: 'pillar',
						x: laneX,
						y: 2.2,
						z: z,
						width: 2.2,
						height: 4.4,
						depth: 1.2,
						color: '#9900ff'
					});
				} else {
					// Moving barrier sliding horizontally
					obstacles.push({
						id: ++obstacleIdCounter,
						type: 'moving_barrier',
						x: (Math.random() - 0.5) * 4,
						y: 1.1,
						z: z,
						width: 2.6,
						height: 2.2,
						depth: 0.8,
						color: '#ffaa00',
						speedX: (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 3),
						minX: -HALF_TRACK + 1.2,
						maxX: HALF_TRACK - 1.2
					});
				}
			}

			// Also spawn collectible gems along the track
			if (Math.random() < 0.5) {
				const gemLaneRoll = Math.random();
				let gemX = 0;
				if (gemLaneRoll < 0.33) gemX = -3.2;
				else if (gemLaneRoll < 0.66) gemX = 0;
				else gemX = 3.2;

				collectibles.push({
					id: ++obstacleIdCounter,
					type: 'gem',
					x: gemX,
					y: 1.2,
					z: z + 6,
					size: 0.5,
					color: '#00ffff',
					rotationSpeed: 2.5
				});
			}

			// Spacing shrinks slightly as game speeds up, min 18 units
			const spacing = Math.max(16, 28 - (game.speed - BASE_SPEED) * 0.3);
			nextSpawnZ += spacing;
		}
	}

	// Reset scene state
	function resetScene() {
		initTrack();
		obstacles = [];
		collectibles = [];
		nextSpawnZ = 45;
		spawnObstaclesUpTo(game.playerZ + HORIZON_DISTANCE);
	}

	// Initialize once
	resetScene();

	// Watch for game restart
	$effect(() => {
		if (game.status === 'playing' && game.distance === 0 && game.playerZ === 0) {
			resetScene();
		}
	});

	// Main physics & animation task
	useTask((delta) => {
		// Cap delta to prevent huge jumps on tab switch / lag
		const dt = Math.min(delta, 0.08);

		if (game.status !== 'playing') {
			return;
		}

		// 1. Forward progression down the slope
		// Gradual speed increase
		if (game.speed < MAX_SPEED) {
			game.speed += dt * 0.45;
		}

		const moveZ = game.speed * dt;
		game.playerZ += moveZ;
		game.distance += moveZ;
		game.score += moveZ * 0.8;

		// Ball rolling animation (circumference = 2 * PI * r)
		const rollDelta = moveZ / PLAYER_RADIUS;
		game.rollAngle += rollDelta;

		// 2. Horizontal Steering (A/D, arrows, mobile buttons)
		const steerSpeed = 16;
		if (game.moveLeft) {
			game.playerX -= steerSpeed * dt;
		}
		if (game.moveRight) {
			game.playerX += steerSpeed * dt;
		}

		// Constrain within track boundaries
		if (game.playerX < -HALF_TRACK) {
			game.playerX = -HALF_TRACK;
		} else if (game.playerX > HALF_TRACK) {
			game.playerX = HALF_TRACK;
		}

		// 3. Jump and Gravity Physics
		if (!game.isGrounded) {
			game.playerVy += GRAVITY * dt;
			game.playerY += game.playerVy * dt;

			// Land on track surface
			if (game.playerY <= PLAYER_RADIUS) {
				game.playerY = PLAYER_RADIUS;
				game.playerVy = 0;
				game.isGrounded = true;
			}
		}

		// 4. Update Moving Obstacles
		for (const obs of obstacles) {
			if (obs.type === 'moving_barrier' && obs.speedX && obs.minX !== undefined && obs.maxX !== undefined) {
				obs.x += obs.speedX * dt;
				if (obs.x < obs.minX) {
					obs.x = obs.minX;
					obs.speedX = Math.abs(obs.speedX);
				} else if (obs.x > obs.maxX) {
					obs.x = obs.maxX;
					obs.speedX = -Math.abs(obs.speedX);
				}
			}
		}

		// 5. Track recycling
		// Find segments behind the player
		for (let i = 0; i < segments.length; i++) {
			const seg = segments[i];
			if (seg.z + seg.length < game.playerZ - 20) {
				// Move this segment to the furthest position ahead
				const maxZ = Math.max(...segments.map((s) => s.z));
				seg.z = maxZ + TRACK_SEGMENT_LENGTH;
			}
		}

		// Spawn more obstacles ahead
		spawnObstaclesUpTo(game.playerZ + HORIZON_DISTANCE);

		// Clean up old obstacles and collectibles behind player
		obstacles = obstacles.filter((o) => o.z > game.playerZ - 15);
		collectibles = collectibles.filter((c) => c.z > game.playerZ - 15 && !c.collected);

		// 6. Collision Detection
		const pX = game.playerX;
		const pY = game.playerY; // height above track
		const pZ = game.playerZ;
		const pR = PLAYER_RADIUS;

		// Check Obstacles
		for (const obs of obstacles) {
			const dz = Math.abs(pZ - obs.z);
			const allowedDz = (obs.depth / 2) + pR * 0.75;

			if (dz < allowedDz) {
				const dx = Math.abs(pX - obs.x);
				const allowedDx = (obs.width / 2) + pR * 0.7;

				if (dx < allowedDx) {
					// Check vertical clearance (did we jump over it?)
					const obsTop = obs.y + obs.height / 2;
					const playerBottom = pY - pR * 0.5;

					if (playerBottom < obsTop) {
						// CRASH!
						game.triggerGameOver();
						return;
					}
				}
			}
		}

		// Check Collectibles (Gems)
		for (const gem of collectibles) {
			if (gem.collected) continue;
			const dist = Math.hypot(pX - gem.x, pY - gem.y, pZ - gem.z);
			if (dist < pR + gem.size + 0.3) {
				gem.collected = true;
				game.collectGem(50);
			}
		}

		// 7. Dynamic Camera Follow
		if (cameraRef) {
			const targetCamX = pX * 0.35;
			const targetCamY = getTrackY(pZ) + 4.2;
			const targetCamZ = pZ - 8.5;

			// Smooth lerp
			cameraRef.position.x += (targetCamX - cameraRef.position.x) * 0.12;
			cameraRef.position.y += (targetCamY - cameraRef.position.y) * 0.15;
			cameraRef.position.z += (targetCamZ - cameraRef.position.z) * 0.2;

			// Look slightly ahead down the slope
			const lookAtX = pX * 0.15;
			const lookAtY = getTrackY(pZ + 15) + 0.8;
			const lookAtZ = pZ + 15;
			cameraRef.lookAt(lookAtX, lookAtY, lookAtZ);

			// Dynamic FOV sensation for speed
			const targetFov = 65 + (game.speed - BASE_SPEED) * 0.45;
			cameraRef.fov += (targetFov - cameraRef.fov) * 0.05;
			cameraRef.updateProjectionMatrix();
		}
	});

	// Star/particle positions for aesthetic cyber backdrop
	const starsCount = 200;
	const stars = Array.from({ length: starsCount }).map(() => ({
		x: (Math.random() - 0.5) * 120,
		y: Math.random() * 80 - 10,
		z: Math.random() * 400 - 50,
		size: 0.2 + Math.random() * 0.4,
		color: Math.random() > 0.5 ? '#00f0ff' : '#ff00aa'
	}));
</script>

<!-- Camera setup with slope default -->
<T.PerspectiveCamera
	bind:ref={cameraRef}
	makeDefault
	position={[0, 4.5, -8.5]}
	fov={65}
	near={0.1}
	far={600}
/>

<!-- Directional Sun Light -->
<T.DirectionalLight
	position={[15, 30, -10]}
	intensity={2.2}
	color="#ffffff"
	castShadow
/>

<!-- Ambient & Hemisphere Light for crisp neon vibes -->
<T.AmbientLight intensity={0.8} color="#2b1055" />
<T.HemisphereLight
	args={['#00f0ff', '#100028', 1.2]}
/>

<!-- Starfield / Floating cyber dust -->
{#each stars as star}
	<T.Mesh position={[star.x, star.y + getTrackY(game.playerZ), star.z + game.playerZ]}>
		<T.SphereGeometry args={[star.size, 6, 6]} />
		<T.MeshBasicMaterial color={star.color} />
	</T.Mesh>
{/each}

<!-- Track Segments -->
{#each segments as seg (seg.id)}
	<!-- Center road surface -->
	<T.Mesh
		position={[0, getTrackY(seg.z + seg.length / 2), seg.z + seg.length / 2]}
		rotation={[-slopeAngle, 0, 0]}
	>
		<T.BoxGeometry args={[TRACK_WIDTH, 0.4, seg.length / Math.cos(slopeAngle)]} />
		<T.MeshStandardMaterial
			color={seg.color}
			roughness={0.4}
			metalness={0.2}
		/>
	</T.Mesh>

	<!-- Glowing Neon Left Guard Rail -->
	<T.Mesh
		position={[-TRACK_WIDTH / 2, getTrackY(seg.z + seg.length / 2) + 0.4, seg.z + seg.length / 2]}
		rotation={[-slopeAngle, 0, 0]}
	>
		<T.BoxGeometry args={[0.3, 0.8, seg.length / Math.cos(slopeAngle)]} />
		<T.MeshStandardMaterial
			color="#00f0ff"
			emissive="#00f0ff"
			emissiveIntensity={1.8}
			roughness={0.2}
		/>
	</T.Mesh>

	<!-- Glowing Neon Right Guard Rail -->
	<T.Mesh
		position={[TRACK_WIDTH / 2, getTrackY(seg.z + seg.length / 2) + 0.4, seg.z + seg.length / 2]}
		rotation={[-slopeAngle, 0, 0]}
	>
		<T.BoxGeometry args={[0.3, 0.8, seg.length / Math.cos(slopeAngle)]} />
		<T.MeshStandardMaterial
			color="#ff0077"
			emissive="#ff0077"
			emissiveIntensity={1.8}
			roughness={0.2}
		/>
	</T.Mesh>

	<!-- Center Lane Glowing Dash Line -->
	<T.Mesh
		position={[0, getTrackY(seg.z + seg.length / 2) + 0.22, seg.z + seg.length / 2]}
		rotation={[-slopeAngle, 0, 0]}
	>
		<T.BoxGeometry args={[0.15, 0.05, seg.length / Math.cos(slopeAngle)]} />
		<T.MeshStandardMaterial
			color="#ffff00"
			emissive="#ffff00"
			emissiveIntensity={1.2}
		/>
	</T.Mesh>
{/each}

<!-- Obstacles -->
{#each obstacles as obs (obs.id)}
	<T.Mesh
		position={[
			obs.x,
			getTrackY(obs.z) + obs.y,
			obs.z
		]}
		rotation={[-slopeAngle, 0, 0]}
	>
		<T.BoxGeometry args={[obs.width, obs.height, obs.depth]} />
		<T.MeshStandardMaterial
			color={obs.color}
			emissive={obs.color}
			emissiveIntensity={0.8}
			roughness={0.3}
			metalness={0.6}
		/>
	</T.Mesh>
{/each}

<!-- Collectibles (Spinning Gems) -->
{#each collectibles as gem (gem.id)}
	{#if !gem.collected}
		<T.Mesh
			position={[
				gem.x,
				getTrackY(gem.z) + gem.y,
				gem.z
			]}
			rotation={[0, (game.rollAngle * 0.8) + gem.id, Math.PI / 4]}
		>
			<T.OctahedronGeometry args={[gem.size, 0]} />
			<T.MeshStandardMaterial
				color={gem.color}
				emissive={gem.color}
				emissiveIntensity={2.5}
				roughness={0.1}
				metalness={0.9}
			/>
		</T.Mesh>
	{/if}
{/each}

<!-- Player Ball -->
<T.Group
	position={[
		game.playerX,
		getTrackY(game.playerZ) + game.playerY,
		game.playerZ
	]}
>
	<!-- Rolling Sphere -->
	<T.Mesh
		bind:ref={playerMeshRef}
		rotation={[game.rollAngle, 0, (game.moveRight ? -0.2 : game.moveLeft ? 0.2 : 0)]}
	>
		<T.SphereGeometry args={[PLAYER_RADIUS, 32, 32]} />
		<T.MeshStandardMaterial
			color="#00ffff"
			emissive="#0066aa"
			emissiveIntensity={0.9}
			metalness={0.85}
			roughness={0.15}
			wireframe={false}
		/>
	</T.Mesh>

	<!-- Subtle Glowing Core / Aura Ring -->
	<T.Mesh rotation={[Math.PI / 2, 0, 0]}>
		<T.TorusGeometry args={[PLAYER_RADIUS * 1.15, 0.04, 16, 32]} />
		<T.MeshBasicMaterial color="#ffffff" />
	</T.Mesh>

	<!-- Shadow blob on track surface below player -->
	<T.Mesh
		position={[0, -(game.playerY - 0.05), 0]}
		rotation={[-Math.PI / 2 - slopeAngle, 0, 0]}
	>
		<T.CircleGeometry args={[PLAYER_RADIUS * Math.max(0.4, 1.2 - (game.playerY - PLAYER_RADIUS) * 0.3), 24]} />
		<T.MeshBasicMaterial
			color="#000000"
			transparent
			opacity={Math.max(0.15, 0.6 - (game.playerY - PLAYER_RADIUS) * 0.18)}
		/>
	</T.Mesh>
</T.Group>
