import * as THREE from 'three';

export class Starfield {
	public points: THREE.Points;

	constructor(count = 700) {
		const geo = new THREE.BufferGeometry();
		const positions = new Float32Array(count * 3);
		const colors = new Float32Array(count * 3);

		const colorCyan = new THREE.Color(0x00f0ff);
		const colorPink = new THREE.Color(0xff00aa);
		const colorWhite = new THREE.Color(0xffffff);
		const colorPurple = new THREE.Color(0xaa00ff);

		for (let i = 0; i < count; i++) {
			// Full 360-degree spherical cosmic shell surrounding the camera
			const radius = 100 + Math.random() * 260;
			const u = Math.random();
			const v = Math.random();
			const theta = u * 2.0 * Math.PI; // azimuth
			const phi = Math.acos(2.0 * v - 1.0); // elevation (-PI/2 to +PI/2)
			const sinPhi = Math.sin(phi);

			positions[i * 3] = radius * sinPhi * Math.cos(theta);
			positions[i * 3 + 1] = radius * sinPhi * Math.sin(theta);
			positions[i * 3 + 2] = radius * Math.cos(phi);

			// Palette of glowing cyber stars
			const pick = Math.random();
			const c = pick > 0.65 ? colorCyan : pick > 0.35 ? colorPink : pick > 0.15 ? colorPurple : colorWhite;
			colors[i * 3] = c.r;
			colors[i * 3 + 1] = c.g;
			colors[i * 3 + 2] = c.b;
		}

		geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

		const mat = new THREE.PointsMaterial({
			size: 0.9,
			vertexColors: true,
			transparent: true,
			opacity: 0.85
		});

		this.points = new THREE.Points(geo, mat);
	}

	update(cameraWorldPos: THREE.Vector3): void {
		// Keep the starfield locked around the camera so it surrounds the player everywhere in 360 degrees
		this.points.position.copy(cameraWorldPos);
	}
}
