<script lang="ts">
	import { game } from '../../game/gameStore.svelte';

	function handleResume() {
		game.resume();
	}

	function handleRestart() {
		game.start();
	}

	function handleSound() {
		game.toggleSound();
	}
</script>

<div class="overlay">
	<div class="modal">
		<div class="badge">GAME PAUSED</div>
		<h2>PAUSE MENU</h2>

		<div class="stats-preview">
			<div class="preview-item">
				<span class="p-label">Score</span>
				<span class="p-val">{Math.floor(game.score)}</span>
			</div>
			<div class="preview-item">
				<span class="p-label">Distance</span>
				<span class="p-val">{Math.floor(game.distance)}m</span>
			</div>
			<div class="preview-item">
				<span class="p-label">Gems</span>
				<span class="p-val">💎 {game.gems}</span>
			</div>
		</div>

		<div class="button-group">
			<button class="btn btn-primary" onclick={handleResume}>
				▶ RESUME GAME <span class="key-hint">ESC</span>
			</button>

			<button class="btn btn-secondary" onclick={handleRestart}>
				🔄 RESTART <span class="key-hint">R</span>
			</button>

			<button class="btn btn-subtle" onclick={handleSound}>
				{game.isMuted ? '🔇 Unmute Audio' : '🔊 Mute Audio'}
			</button>
		</div>

		<div class="controls-guide">
			<div class="guide-title">CONTROLS</div>
			<div class="guide-row"><span>Steer:</span> <kbd>A / D</kbd> or <kbd>⬅️ ➡️</kbd></div>
			<div class="guide-row"><span>Jump:</span> <kbd>Space</kbd> or <kbd>⬆️</kbd> or <kbd>W</kbd></div>
			<div class="guide-row"><span>Pause:</span> <kbd>ESC</kbd></div>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		background: rgba(5, 2, 18, 0.75);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		animation: fadeIn 0.15s ease-out;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
	}

	.modal {
		background: linear-gradient(145deg, rgba(25, 20, 50, 0.95), rgba(12, 8, 25, 0.95));
		border: 1px solid rgba(0, 240, 255, 0.3);
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 240, 255, 0.2);
		border-radius: 20px;
		padding: 2rem 2.5rem;
		width: 90%;
		max-width: 380px;
		text-align: center;
		color: #ffffff;
	}

	.badge {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		color: #00f0ff;
		background: rgba(0, 240, 255, 0.12);
		padding: 0.3rem 0.8rem;
		border-radius: 999px;
		margin-bottom: 0.5rem;
	}

	h2 {
		margin: 0 0 1.25rem 0;
		font-size: 1.8rem;
		font-weight: 900;
		letter-spacing: 0.04em;
	}

	.stats-preview {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		background: rgba(0, 0, 0, 0.25);
		border-radius: 12px;
		padding: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.preview-item {
		display: flex;
		flex-direction: column;
	}

	.p-label {
		font-size: 0.65rem;
		color: #8c90b0;
		text-transform: uppercase;
	}

	.p-val {
		font-size: 1.05rem;
		font-weight: 700;
		color: #fff;
	}

	.button-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.btn {
		width: 100%;
		padding: 0.85rem 1.25rem;
		border-radius: 12px;
		border: none;
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: all 0.15s ease;
	}

	.btn-primary {
		background: linear-gradient(135deg, #00f0ff, #0099ff);
		color: #050212;
		box-shadow: 0 4px 16px rgba(0, 240, 255, 0.35);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 240, 255, 0.5);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	.btn-subtle {
		background: transparent;
		color: #a0a5c0;
		border: 1px solid transparent;
		font-size: 0.85rem;
		padding: 0.5rem;
	}

	.btn-subtle:hover {
		color: #fff;
		border-color: rgba(255, 255, 255, 0.15);
	}

	.key-hint {
		background: rgba(0, 0, 0, 0.25);
		font-size: 0.65rem;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		margin-left: auto;
	}

	.controls-guide {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 10px;
		padding: 0.75rem 1rem;
		font-size: 0.78rem;
		color: #b0b5d0;
		text-align: left;
	}

	.guide-title {
		font-size: 0.65rem;
		font-weight: 800;
		color: #7b80a0;
		letter-spacing: 0.08em;
		margin-bottom: 0.4rem;
	}

	.guide-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.25rem;
	}

	kbd {
		background: rgba(255, 255, 255, 0.15);
		color: #ffffff;
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
		font-size: 0.72rem;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
</style>
