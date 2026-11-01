<script lang="ts">
	import { onMount } from 'svelte';
	import GameCanvas from '#lib/components/GameCanvas.svelte';
	import HUD from '#lib/components/UI/HUD.svelte';
	import PauseMenu from '#lib/components/UI/PauseMenu.svelte';
	import GameOverModal from '#lib/components/UI/GameOverModal.svelte';
	import StartScreen from '#lib/components/UI/StartScreen.svelte';
	import MobileControls from '#lib/components/UI/MobileControls.svelte';
	import { game } from '#lib/game/gameStore.svelte.js';

	function handleKeyDown(e: KeyboardEvent) {
		// Prevent default scroll behavior for game keys
		if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
			e.preventDefault();
		}

		if (e.code === 'Escape') {
			game.togglePause();
			return;
		}

		if (game.status === 'idle') {
			if (e.code === 'Space' || e.code === 'Enter') {
				game.start();
			}
			return;
		}

		if (game.status === 'gameover') {
			if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR') {
				game.start();
			}
			return;
		}

		if (game.status === 'paused') {
			if (e.code === 'KeyR') {
				game.start();
			}
			return;
		}

		if (game.status === 'playing') {
			if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
				game.moveLeft = true;
			}
			if (e.code === 'ArrowRight' || e.code === 'KeyD') {
				game.moveRight = true;
			}
			if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
				game.triggerJump();
			}
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		if (game.status === 'playing') {
			if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
				game.moveLeft = false;
			}
			if (e.code === 'ArrowRight' || e.code === 'KeyD') {
				game.moveRight = false;
			}
		}
	}

	onMount(() => {
		// Auto-pause if tab loses focus
		function handleBlur() {
			if (game.status === 'playing') {
				game.pause();
			}
		}

		window.addEventListener('blur', handleBlur);
		return () => {
			window.removeEventListener('blur', handleBlur);
		};
	});
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<main class="game-wrapper">
	<!-- 3D Threlte Scene -->
	<GameCanvas />

	<!-- HUD Overlay -->
	{#if game.status === 'playing' || game.status === 'paused'}
		<HUD />
	{/if}

	<!-- Mobile / Touch Controls -->
	{#if game.status === 'playing'}
		<MobileControls />
	{/if}

	<!-- Start Screen -->
	{#if game.status === 'idle'}
		<StartScreen />
	{/if}

	<!-- Pause Menu (ESC) -->
	{#if game.status === 'paused'}
		<PauseMenu />
	{/if}

	<!-- Game Over Screen -->
	{#if game.status === 'gameover'}
		<GameOverModal />
	{/if}
</main>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: #030008;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		user-select: none;
		-webkit-user-select: none;
	}

	.game-wrapper {
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}
</style>
