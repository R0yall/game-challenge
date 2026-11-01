import * as THREE from 'three';
import { getSlopePosition } from './SlopeMath.ts';

export class Starfield {
	public points: THREE.Points;
	private tempPos = new THREE.Vector3();

	constructor(count = 450) {
		const geo = new THREE.BufferGeometry();
		const positions = new Float32Array(count * 3);
		const colors = new Float32Array(count * 3);

		const color1 = new THREE.Color(0x00f0ff);
		const color2 = new THREE.Color(0xff00aa);
		const color3 = new THREE.Color(0xffffff);

		for (let i = 0; i < count; i++) {
			positions[i * 3] = (Math.random() - 0.5) * 160;
			positions[i * 3 + 1] = Math.random() * 80 - 15;
			positions[i * 3 + 2] = Math.random() * 500 - 50;

			const c = Math.random() > 0.6 ? color1 : Math.random() > 0.3 ? color2 : color3;
			colors[i * 3] = c.r;
			colors[i * 3 + 1] = c.g;
			colors[i * 3 + 2] = c.b;
		}

		geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

		const mat = new THREE.PointsMaterial({
			size: 0.7,
			vertexColors: true,
			transparent: true,
			opacity: 0.85
		});

		this.points = new THREE.Points(geo, mat);
	}

	update(playerS: number): void {
		// Keep stars centered around the player's slope position
		getSlopePosition(0, playerS, 0, this.tempPos);
		this.points.position.set(0, this.tempPos.y, playerS);
	}
}
