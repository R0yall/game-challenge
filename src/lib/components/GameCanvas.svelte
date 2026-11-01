<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Scene from './Scene.svelte';
</script>

<div class="canvas-container">
	<Canvas>
		<Scene />
	</Canvas>
</div>

<style>
	.canvas-container {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: radial-gradient(circle at 50% 30%, #150030 0%, #080014 60%, #030008 100%);
	}
</style>
