import * as THREE from 'three';
import { HALF_TRACK } from './SlopeMath.ts';
import { Course } from './Course.ts';
import { sounds } from './Audio.ts';

interface Bomb {
	mesh: THREE.Group;
	targetDecal?: THREE.Mesh;
	x: number;
	z: number;
	y: number; // height above road
	vy: number;
	falling: boolean;
	active: boolean;
	shockwave?: THREE.Mesh;
	shockwaveTime: number;
}

export class UfoEncounter {
	public group: THREE.Group;
	public ufoBody: THREE.Group;
	private elonHeadMesh: THREE.Mesh;
	private rimLights: THREE.Mesh[] = [];
	private thrusterBeam!: THREE.Mesh;

	// State
	public state: 'dormant' | 'approaching' | 'hovering' | 'departing' = 'dormant';
	private nextTriggerDistance = 160;
	private encounterTimer = 0;
	private bombsDropped = 0;
	private maxBombs = 4;
	private bombTimer = 0;
	private alertCallback?: (active: boolean) => void;

	// Dynamic distance & altitude variation
	private followDist = 20.0;
	private targetFollowDist = 20.0;
	private followHeight = 4.5;
	private targetFollowHeight = 4.5;
	private postureTimer = 2.5;

	// Movement
	private ufoX = 0;
	private ufoY = 18;
	private ufoZ = 0;
	private swayTime = 0;

	// Bombs
	private bombs: Bomb[] = [];
	private bombGroup: THREE.Group;
 private course?: Course;
 private visualTransforms: { object: THREE.Object3D; position: THREE.Vector3; rotation: THREE.Quaternion }[] = [];
 private restoreCourseTransforms(): void {
  for (const entry of this.visualTransforms) { entry.object.position.copy(entry.position); entry.object.quaternion.copy(entry.rotation); }
  this.visualTransforms = [];
 }
 private applyCourseTransforms(): void {
  if (!this.course) return;
  for (const object of [this.ufoBody, ...this.bombGroup.children]) {
   const position = object.position.clone(), rotation = object.quaternion.clone();
   this.visualTransforms.push({ object, position, rotation });
   this.course.place(object, position.z, position.x, position.y);
   object.quaternion.multiply(rotation);
  }
 }

	constructor(onAlert?: (active: boolean) => void) {
		this.alertCallback = onAlert;
		this.group = new THREE.Group();
		this.bombGroup = new THREE.Group();
		this.group.add(this.bombGroup);

		this.ufoBody = new THREE.Group();
		this.group.add(this.ufoBody);

		// Build the Low Poly Saucer matching Image 1
		this.buildLowPolySaucer();

		// Add Elon Musk Head (Quad with transparent PNG)
		this.elonHeadMesh = this.buildElonHead();
		this.ufoBody.add(this.elonHeadMesh);

		// Hide until triggered
		this.ufoBody.visible = false;
	}

	private buildLowPolySaucer(): void {
		const segments = 12; // 12-sided faceted polygon just like Image 1

		// 1. Upper Sloping Saucer Hull
		// Cylinder with top radius 1.0, bottom radius 2.6, height 0.65
		const upperGeo = new THREE.CylinderGeometry(1.0, 2.6, 0.65, segments);
		const upperMat = new THREE.MeshStandardMaterial({
			color: 0x9ca3af,
			roughness: 0.35,
			metalness: 0.6,
			flatShading: true
		});
		const upperHull = new THREE.Mesh(upperGeo, upperMat);
		upperHull.position.y = 0.25;
		this.ufoBody.add(upperHull);

		// 2. Turquoise Accent Panels around the upper slope (Image 1 feature!)
		const accentMat = new THREE.MeshStandardMaterial({
			color: 0x0ea5e9,
			emissive: 0x0284c7,
			emissiveIntensity: 0.35,
			roughness: 0.3,
			metalness: 0.5,
			flatShading: true
		});
		// Add alternating colored wedge panels
		for (let i = 0; i < segments; i += 2) {
			const angle = (i / segments) * Math.PI * 2;
			const panelGeo = new THREE.CylinderGeometry(
				1.01, 2.61, 0.655, 1, 1, false,
				angle, Math.PI * 2 / segments * 0.75
			);
			const panel = new THREE.Mesh(panelGeo, accentMat);
			panel.position.y = 0.25;
			this.ufoBody.add(panel);
		}

		// 3. Lower Saucer Hull
		const lowerGeo = new THREE.CylinderGeometry(2.6, 1.1, 0.6, segments);
		const lowerMat = new THREE.MeshStandardMaterial({
			color: 0x64748b,
			roughness: 0.4,
			metalness: 0.65,
			flatShading: true
		});
		const lowerHull = new THREE.Mesh(lowerGeo, lowerMat);
		lowerHull.position.y = -0.35;
		this.ufoBody.add(lowerHull);

		// 4. Cockpit Collar / Rim
		const collarGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.25, segments, 1, true);
		const collarMat = new THREE.MeshStandardMaterial({
			color: 0x475569,
			roughness: 0.5,
			metalness: 0.7,
			flatShading: true
		});
		const collar = new THREE.Mesh(collarGeo, collarMat);
		collar.position.y = 0.65;
		this.ufoBody.add(collar);

		// Cockpit Dark Interior Hole
		const floorGeo = new THREE.CircleGeometry(0.95, segments);
		const floorMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
		const floor = new THREE.Mesh(floorGeo, floorMat);
		floor.rotation.x = -Math.PI / 2;
		floor.position.y = 0.45;
		this.ufoBody.add(floor);

		// 5. Glowing Turquoise / Cyan LED Rim Lights
		const lightMat = new THREE.MeshStandardMaterial({
			color: 0x00ffff,
			emissive: 0x00ffff,
			emissiveIntensity: 2.8,
			roughness: 0.1
		});
		const lightGeo = new THREE.BoxGeometry(0.45, 0.14, 0.08);

		for (let i = 0; i < segments; i++) {
			const angle = (i / segments) * Math.PI * 2 + (Math.PI / segments);
			const light = new THREE.Mesh(lightGeo, lightMat);
			const r = 2.62;
			light.position.set(Math.sin(angle) * r, -0.05, Math.cos(angle) * r);
			light.rotation.y = angle;
			this.ufoBody.add(light);
			this.rimLights.push(light);
		}

		// 6. Undercarriage Thruster Beam
		const beamGeo = new THREE.ConeGeometry(2.0, 5.0, 16, 1, true);
		const beamMat = new THREE.MeshBasicMaterial({
			color: 0x00f0ff,
			transparent: true,
			opacity: 0.18,
			side: THREE.DoubleSide,
			fog: false
		});
		this.thrusterBeam = new THREE.Mesh(beamGeo, beamMat);
		this.thrusterBeam.position.y = -3.0;
		this.thrusterBeam.rotation.x = Math.PI;
		this.ufoBody.add(this.thrusterBeam);
	}

	private buildElonHead(): THREE.Mesh {
		// Texture loader for Image 2 (/elon.png)
		const loader = new THREE.TextureLoader();
		const texture = loader.load('/elon.png');
		texture.colorSpace = THREE.SRGBColorSpace;

		// Head Quad: width 1.65, height 2.05
		const headGeo = new THREE.PlaneGeometry(2.35, 2.9);
		const headMat = new THREE.MeshBasicMaterial({
			map: texture,
			transparent: true,
			alphaTest: 0.05,
			side: THREE.DoubleSide
		});

		const head = new THREE.Mesh(headGeo, headMat);
		// Position so chest/neck sits inside cockpit collar, head stands proud
		head.position.set(0, 1.32, 0.05);
		head.rotation.y = Math.PI; // Face towards camera (looking down -Z in local coords)
		return head;
	}

	update(dt: number, playerZ: number, playerX: number, playerSpeed: number, course?: Course): void {
  this.restoreCourseTransforms();
  this.course = course;
		this.swayTime += dt;

		// Pulse rim lights
		const pulse = 1.8 + Math.sin(this.swayTime * 8) * 1.2;
		this.rimLights.forEach((light) => {
			const mat = light.material as THREE.MeshStandardMaterial;
			mat.emissiveIntensity = pulse;
		});

		// Subtle head bobbing / nodding animation
		this.elonHeadMesh.position.y = 1.45 + Math.sin(this.swayTime * 4.5) * 0.04;

		// Update active bombs
		this.updateBombs(dt, playerZ);

		// State Machine
		switch (this.state) {
			case 'dormant':
				if (playerZ >= this.nextTriggerDistance) {
					this.startEncounter(playerZ);
				}
				break;

			case 'approaching':
				this.updateApproaching(dt, playerZ);
				break;

			case 'hovering':
				this.updateHovering(dt, playerZ, playerX, playerSpeed);
				break;

			case 'departing':
				this.updateDeparting(dt, playerZ);
				break;
		}
  this.applyCourseTransforms();
	}

	private startEncounter(playerZ: number): void {
		this.state = 'approaching';
		this.ufoBody.visible = true;
		this.bombsDropped = 0;
		this.bombTimer = 1.2;
		this.encounterTimer = 0;
		this.followDist = 24.0;
		this.targetFollowDist = 20.0;
		this.followHeight = 5.5;
		this.targetFollowHeight = 4.4;
		this.postureTimer = 3.0;

		// Spawn high up in the sky ahead of the player
		this.ufoX = 0;
		this.ufoY = 22;
		this.ufoZ = playerZ + 45;
		this.ufoBody.position.set(this.ufoX, this.ufoY, this.ufoZ);
		this.ufoBody.rotation.set(0.3, 0, 0);

		sounds.playUfoAlarm();
		if (this.alertCallback) this.alertCallback(true);
	}

	private updateApproaching(dt: number, playerZ: number): void {
		const targetY = 3.2;
		const targetZ = playerZ + 9.5;

		// Swoop down to hover height
		this.ufoY += (targetY - this.ufoY) * Math.min(1, dt * 3.5);
		this.ufoZ = targetZ;
		this.ufoBody.position.set(this.ufoX, this.ufoY, this.ufoZ);

		// Level out pitch
		this.ufoBody.rotation.x += (0 - this.ufoBody.rotation.x) * Math.min(1, dt * 4);

		if (Math.abs(this.ufoY - targetY) < 0.25) {
			this.state = 'hovering';
		}
	}

	private updateHovering(dt: number, playerZ: number, playerX: number, playerSpeed: number): void {
		this.encounterTimer += dt;
		this.bombTimer -= dt;
		this.postureTimer -= dt;

		// Dynamically switch distance between close-up taunts, mid-range chase, and distant high scouting
		if (this.postureTimer <= 0) {
			const roll = Math.random();
			if (roll < 0.45) {
				// Close encounter: clear view, comfortable reaction time (~18m - 22m ahead)
				this.targetFollowDist = 18.0 + Math.random() * 4.0;
				this.targetFollowHeight = 4.2 + Math.random() * 0.8;
				this.postureTimer = 3.0 + Math.random() * 2.0;
			} else if (roll < 0.78) {
				// Mid-range cruise: scouting and swaying (~27m - 34m ahead)
				this.targetFollowDist = 27.0 + Math.random() * 7.0;
				this.targetFollowHeight = 5.8 + Math.random() * 1.5;
				this.postureTimer = 2.6 + Math.random() * 2.0;
			} else {
				// Distant high orbit: pulls far ahead into space (~40m - 50m ahead)
				this.targetFollowDist = 40.0 + Math.random() * 10.0;
				this.targetFollowHeight = 8.5 + Math.random() * 3.5;
				this.postureTimer = 2.2 + Math.random() * 1.8;
			}
		}

		// Before dropping a bomb, if far away, swoop back in close!
		if (this.bombTimer < 1.2 && this.targetFollowDist > 25) {
			this.targetFollowDist = 19.0 + Math.random() * 3.0;
			this.targetFollowHeight = 4.3 + Math.random() * 0.7;
		}

		// Smoothly lerp towards target follow distance & altitude
		this.followDist += (this.targetFollowDist - this.followDist) * Math.min(1, dt * 2.2);
		this.followHeight += (this.targetFollowHeight - this.followHeight) * Math.min(1, dt * 2.0);

		// Follow player along Z & Y
		this.ufoZ = playerZ + this.followDist;
		this.ufoY = this.followHeight + Math.sin(this.swayTime * 3) * 0.35;

		// Smooth sway left and right across lanes with slight tracking of player
		const swayX = Math.sin(this.swayTime * (1.6 + playerSpeed * 0.01)) * (HALF_TRACK - 1.2);
		const targetX = swayX * 0.7 + playerX * 0.3;
		this.ufoX += (targetX - this.ufoX) * Math.min(1, dt * 4.5);

		this.ufoBody.position.set(this.ufoX, this.ufoY, this.ufoZ);

		// Dynamic pitch: tilts forward when pulling ahead, levels to face camera when close
		const distDelta = this.targetFollowDist - this.followDist;
		const targetPitch = -0.15 - Math.max(-0.25, Math.min(0.2, distDelta * 0.035));
		this.ufoBody.rotation.x += (targetPitch - this.ufoBody.rotation.x) * Math.min(1, dt * 4);

		// Bank / tilt saucer into the sway
		const tiltZ = -Math.cos(this.swayTime * 1.8) * 0.28;
		this.ufoBody.rotation.z = tiltZ;
		// Head leans slightly into the turn
		this.elonHeadMesh.rotation.z = -tiltZ * 0.5;

		// Drop bombs
		if (this.bombTimer <= 0 && this.bombsDropped < this.maxBombs) {
			this.dropBomb();
			this.bombsDropped++;
			this.bombTimer = 3.2 + Math.random() * 1.2;

			// 55% chance to pull away further right after dropping a bomb
			if (Math.random() < 0.55) {
				this.targetFollowDist = 28.0 + Math.random() * 8.0;
				this.targetFollowHeight = 6.5 + Math.random() * 2.5;
				this.postureTimer = 2.6 + Math.random() * 1.5;
			}
		}

		// Exit after dropping all bombs or after 16 seconds
		if (this.bombsDropped >= this.maxBombs && this.encounterTimer > 12) {
			this.state = 'departing';
			sounds.playUfoWarp();
			if (this.alertCallback) this.alertCallback(false);
		}
	}

	private updateDeparting(dt: number, playerZ: number): void {
		// Tilt up and rocket into space!
		this.ufoY += 32 * dt;
		this.ufoZ += 45 * dt;
		this.ufoBody.position.set(this.ufoX, this.ufoY, this.ufoZ);
		this.ufoBody.rotation.x -= dt * 1.2;

		if (this.ufoY > 40) {
			this.ufoBody.visible = false;
			this.state = 'dormant';
			// Schedule next encounter ~300m - 400m further down the track
			this.nextTriggerDistance = playerZ + 320 + Math.random() * 120;
		}
	}

	private dropBomb(): void {
  if (this.course && (this.course.sample(this.ufoZ).density === 0 || this.course.sample(this.ufoZ - this.followDist).protected)) return;
		sounds.playUfoDrop();

		// Create Low-Poly Spiked Cyber Bomb
		const bombGroup = new THREE.Group();

		// Core sphere
		const coreGeo = new THREE.DodecahedronGeometry(0.55, 0);
		const coreMat = new THREE.MeshStandardMaterial({
			color: 0x1e293b,
			roughness: 0.3,
			metalness: 0.85,
			flatShading: true
		});
		const core = new THREE.Mesh(coreGeo, coreMat);
		bombGroup.add(core);

		// Glowing Red / Orange Spikes
		const spikeGeo = new THREE.ConeGeometry(0.16, 0.45, 5);
		const spikeMat = new THREE.MeshStandardMaterial({
			color: 0xff0044,
			emissive: 0xff0044,
			emissiveIntensity: 2.2,
			roughness: 0.2
		});

		// 6 Directional hazard spikes
		const spikeDirs = [
			[0, 0.5, 0], [0, -0.5, 0],
			[0.5, 0, 0], [-0.5, 0, 0],
			[0, 0, 0.5], [0, 0, -0.5]
		];
		spikeDirs.forEach(([x, y, z]) => {
			const spike = new THREE.Mesh(spikeGeo, spikeMat);
			spike.position.set(x, y, z);
			spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, y, z).normalize());
			bombGroup.add(spike);
		});

		// Red Warning Beacon Ring
		const beaconGeo = new THREE.TorusGeometry(0.65, 0.04, 8, 16);
		const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
		const beacon = new THREE.Mesh(beaconGeo, beaconMat);
		beacon.rotation.x = Math.PI / 2;
		bombGroup.add(beacon);

		// Position at current UFO position
		const dropX = this.ufoX;
		const dropZ = this.ufoZ;
		const dropY = this.ufoY - 0.8;
		bombGroup.position.set(dropX, dropY, dropZ);
		this.bombGroup.add(bombGroup);

		// Ground hazard targeting warning reticle on road surface
		const reticleGeo = new THREE.RingGeometry(0.45, 0.75, 24);
		const reticleMat = new THREE.MeshBasicMaterial({
			color: 0xff1744,
			transparent: true,
			opacity: 0.8,
			side: THREE.DoubleSide
		});
		const reticle = new THREE.Mesh(reticleGeo, reticleMat);
		reticle.rotation.x = -Math.PI / 2;
		reticle.position.set(dropX, 0.02, dropZ);
		this.bombGroup.add(reticle);

		this.bombs.push({
			mesh: bombGroup,
			targetDecal: reticle,
			x: dropX,
			z: dropZ,
			y: dropY,
			vy: -2,
			falling: true,
			active: true,
			shockwaveTime: 0
		});
	}

	private updateBombs(dt: number, playerZ: number): void {
		for (let i = this.bombs.length - 1; i >= 0; i--) {
			const b = this.bombs[i];

			if (b.falling) {
				b.vy -= 42 * dt; // gravity
				b.y += b.vy * dt;

				// Spin while falling
				b.mesh.rotation.x += dt * 5;
				b.mesh.rotation.y += dt * 6;

				// Impact with road surface (y = 0.55)
				// Pulse targeting decal while bomb is falling
				if (b.targetDecal) {
					const pulse = 0.65 + Math.sin(this.swayTime * 16) * 0.3;
					(b.targetDecal.material as THREE.MeshBasicMaterial).opacity = pulse;
				}

				if (b.y <= 0.55) {
					b.y = 0.55;
					b.falling = false;
					sounds.playBombExplode();

					// Remove warning reticle
					if (b.targetDecal) {
						this.bombGroup.remove(b.targetDecal);
						b.targetDecal = undefined;
					}

					// Create road impact shockwave ring
					const ringGeo = new THREE.RingGeometry(0.4, 0.7, 24);
					const ringMat = new THREE.MeshBasicMaterial({
						color: 0xff0044,
						transparent: true,
						opacity: 0.85,
						side: THREE.DoubleSide
					});
					const ring = new THREE.Mesh(ringGeo, ringMat);
					ring.rotation.x = -Math.PI / 2;
					ring.position.set(b.x, 0.04, b.z);
					this.bombGroup.add(ring);
					b.shockwave = ring;
				}
				b.mesh.position.set(b.x, b.y, b.z);
			} else {
				// Armed on road: pulse hazard glow
				b.mesh.rotation.y += dt * 2;
			}

			// Expand & fade shockwave ring
			if (b.shockwave) {
				b.shockwaveTime += dt;
				const scale = 1 + b.shockwaveTime * 8;
				b.shockwave.scale.set(scale, scale, 1);
				const mat = b.shockwave.material as THREE.MeshBasicMaterial;
				mat.opacity = Math.max(0, 0.85 - b.shockwaveTime * 1.8);
				if (b.shockwaveTime > 0.5) {
					this.bombGroup.remove(b.shockwave);
					b.shockwave = undefined;
				}
			}

			// Clean up bombs passed behind player
			if (b.z < playerZ - 20) {
				this.bombGroup.remove(b.mesh);
				if (b.targetDecal) this.bombGroup.remove(b.targetDecal);
				if (b.shockwave) this.bombGroup.remove(b.shockwave);
				this.bombs.splice(i, 1);
			}
		}
	}

	checkCollision(playerX: number, playerZ: number, playerJumpY: number, onBombHit: (b: Bomb) => void): boolean {
		for (const b of this.bombs) {
			if (!b.active) continue;

			// A bomb high in the air above player does not hit the player
			if (b.falling && b.y > 0.85) continue;

			const dz = Math.abs(playerZ - b.z);
			const dx = Math.abs(playerX - b.x);

			// Fair, responsive bounding box (0.75m radius)
			if (dz < 0.75 && dx < 0.75) {
				// Normal jump cleanly clears the bomb
				if (playerJumpY < 0.55) {
					onBombHit(b);
					return true;
				}
			}
		}
		return false;
	}

	destroyBomb(b: Bomb): void {
		b.active = false;
		this.bombGroup.remove(b.mesh);
		if (b.targetDecal) this.bombGroup.remove(b.targetDecal);
		if (b.shockwave) this.bombGroup.remove(b.shockwave);
	}

	reset(): void {
  this.restoreCourseTransforms();
		this.state = 'dormant';
		this.nextTriggerDistance = 160;
		this.encounterTimer = 0;
		this.bombsDropped = 0;
		this.followDist = 20.0;
		this.targetFollowDist = 20.0;
		this.followHeight = 4.5;
		this.targetFollowHeight = 4.5;
		this.postureTimer = 0;
		this.ufoBody.visible = false;
		if (this.alertCallback) this.alertCallback(false);

		// Clear all bombs
		for (const b of this.bombs) {
			this.bombGroup.remove(b.mesh);
			if (b.targetDecal) this.bombGroup.remove(b.targetDecal);
			if (b.shockwave) this.bombGroup.remove(b.shockwave);
		}
		this.bombs = [];
	}
}
