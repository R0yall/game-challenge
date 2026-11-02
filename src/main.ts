import { Game, type GameState } from './game/Game.ts';
import { getLeaderboard, recordScore, fetchLeaderboard } from './leaderboard.ts';

// Get DOM Elements
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const hud = document.getElementById('hud') as HTMLElement;
const startScreen = document.getElementById('start-screen') as HTMLElement;
const pauseMenu = document.getElementById('pause-menu') as HTMLElement;
const gameOverModal = document.getElementById('game-over-modal') as HTMLElement;
const mobileControls = document.getElementById('mobile-controls') as HTMLElement;

// HUD Elements
const powerBanner = document.getElementById('power-banner') as HTMLElement;
const ufoAlert = document.getElementById('ufo-alert') as HTMLElement;
const powerCountdown = document.getElementById('power-countdown') as HTMLElement;
const hudScore = document.getElementById('hud-score') as HTMLElement;
const hudBest = document.getElementById('hud-best') as HTMLElement;
const hudDist = document.getElementById('hud-dist') as HTMLElement;
const hudGems = document.getElementById('hud-gems') as HTMLElement;
const hudSpeedLabel = document.getElementById('hud-speed-label') as HTMLElement;
const hudSpeedFill = document.getElementById('hud-speed-fill') as HTMLElement;
const btnSound = document.getElementById('btn-sound') as HTMLButtonElement;
const btnPause = document.getElementById('btn-pause') as HTMLButtonElement;

// Start Elements
const playerNameInput = document.getElementById('player-name') as HTMLInputElement;
const nameError = document.getElementById('name-error') as HTMLElement;
const scoreSaveError = document.getElementById('score-save-error') as HTMLElement;
const btnStart = document.getElementById('btn-start') as HTMLButtonElement;
const startBestContainer = document.getElementById('start-best-container') as HTMLElement;
const startBest = document.getElementById('start-best') as HTMLElement;

// Pause Elements
const pauseScore = document.getElementById('pause-score') as HTMLElement;
const pauseDist = document.getElementById('pause-dist') as HTMLElement;
const pauseGems = document.getElementById('pause-gems') as HTMLElement;
const btnResume = document.getElementById('btn-resume') as HTMLButtonElement;
const btnPauseRestart = document.getElementById('btn-pause-restart') as HTMLButtonElement;
const btnPauseSound = document.getElementById('btn-pause-sound') as HTMLButtonElement;

// Game Over Elements
const gameOverBadge = document.getElementById('game-over-badge') as HTMLElement;
const goScore = document.getElementById('go-score') as HTMLElement;
const goBest = document.getElementById('go-best') as HTMLElement;
const goDist = document.getElementById('go-dist') as HTMLElement;
const goGems = document.getElementById('go-gems') as HTMLElement;
const goSpeed = document.getElementById('go-speed') as HTMLElement;
const btnRestart = document.getElementById('btn-restart') as HTMLButtonElement;

// Touch Elements
const btnTouchLeft = document.getElementById('btn-touch-left') as HTMLButtonElement;
const btnTouchRight = document.getElementById('btn-touch-right') as HTMLButtonElement;
const btnTouchJump = document.getElementById('btn-touch-jump') as HTMLButtonElement;

// Initialize Game
const game = new Game(canvas);
(window as any).__game = game;

try {
	const savedPlayerName = localStorage.getItem('viberunner_player_name') || '';
	if (savedPlayerName) {
		playerNameInput.value = savedPlayerName;
		game.playerName = savedPlayerName;
	}
} catch {}

const leaderboardModal = document.getElementById('leaderboard-modal') as HTMLElement;
const leaderboardList = document.getElementById('leaderboard-list') as HTMLOListElement;
const leaderboardEmpty = document.getElementById('leaderboard-empty') as HTMLElement;
const closeLeaderboardButton = document.getElementById('btn-close-leaderboard') as HTMLButtonElement;
let leaderboardOpener: HTMLButtonElement | null = null;

function renderLeaderboard(): void {
	const scores = getLeaderboard();
	leaderboardList.replaceChildren();
	leaderboardEmpty.classList.toggle('hidden', scores.length > 0);
	for (const entry of scores) {
		const row = document.createElement('li');
		const name = document.createElement('span');
		const score = document.createElement('strong');
		name.textContent = entry.name;
		score.textContent = entry.score.toLocaleString();
		row.append(name, score);
		leaderboardList.append(row);
	}
}
function openLeaderboard(button: HTMLButtonElement): void {
	leaderboardOpener = button;
	renderLeaderboard();
	leaderboardModal.classList.remove('hidden');
	closeLeaderboardButton.focus();
}
function closeLeaderboard(): void {
	leaderboardModal.classList.add('hidden');
	leaderboardOpener?.focus();
}
for (const id of ['btn-start-leaderboard', 'btn-end-leaderboard']) {
	const button = document.getElementById(id) as HTMLButtonElement;
	button.addEventListener('click', () => openLeaderboard(button));
}
closeLeaderboardButton.addEventListener('click', closeLeaderboard);

// Initial cloud sync with Dreamlo
void fetchLeaderboard().then((scores) => {
	renderLeaderboard();
	if (scores.length > 0 && scores[0].score > game.highScore) {
		game.highScore = scores[0].score;
		game.highScoreName = scores[0].name;
		startBest.innerText = `${game.highScore} — ${game.highScoreName}`;
		startBestContainer.classList.remove('hidden');
	}
});
game.onRunFinished = (name, score) => {
	game.scoreSaveFailed = false;
	void recordScore(name, score).then(saved => {
		if (!saved) { game.scoreSaveFailed = true; scoreSaveError.classList.remove('hidden'); }
		if (!leaderboardModal.classList.contains('hidden')) renderLeaderboard();
	});
};

// Hook UI to Game State
game.setUIListener({
	onScoreUpdate: (score, distance, speed, gems) => {
		hudScore.innerText = String(Math.floor(score));
		hudDist.innerText = `${Math.floor(distance)}m`;
		hudGems.innerText = String(gems);
		hudSpeedLabel.innerText = `SPEED ${Math.floor(speed * 2.5)} km/h`;
		const speedPct = Math.min(100, Math.max(0, ((speed - 26) / (60 - 26)) * 100));
		hudSpeedFill.style.width = `${speedPct}%`;
	},
	onStateChange: (state: GameState, score: number, highScore: number, isNewBest: boolean) => {
		hudBest.innerText = String(highScore);

		// Hide all overlays first
		startScreen.classList.add('hidden');
		pauseMenu.classList.add('hidden');
		gameOverModal.classList.add('hidden');
		hud.classList.add('hidden');
		ufoAlert?.classList.add('hidden');
		mobileControls.classList.add('hidden');

		if (state === 'idle') {
			startScreen.classList.remove('hidden');
			if (highScore > 0) {
				startBestContainer.classList.remove('hidden');
				startBest.innerText = `${highScore} — ${game.highScoreName || 'Unknown'}`;
			}
		} else if (state === 'playing') {
			hud.classList.remove('hidden');
			mobileControls.classList.remove('hidden');
		} else if (state === 'paused') {
			hud.classList.remove('hidden');
			pauseMenu.classList.remove('hidden');
			pauseScore.innerText = String(Math.floor(score));
			pauseDist.innerText = `${Math.floor(game.distance)}m`;
			pauseGems.innerText = `💎 ${game.gems}`;
		} else if (state === 'gameover') {
			gameOverModal.classList.remove('hidden');
			goScore.innerText = String(Math.floor(score));
			goBest.innerText = `${highScore} — ${game.highScoreName || 'Unknown'}`;
			scoreSaveError.classList.toggle('hidden', !game.scoreSaveFailed);
			goDist.innerText = `${Math.floor(game.distance)}m`;
			goGems.innerText = `💎 ${game.gems}`;
			goSpeed.innerText = `${Math.floor(game.speed * 2.5)} km/h`;

			if (isNewBest) {
				gameOverBadge.className = 'badge new-best';
				gameOverBadge.innerText = '🏆 NEW HIGH SCORE!';
			} else {
				gameOverBadge.className = 'badge crashed';
				gameOverBadge.innerText = '💥 CRASHED!';
			}
		}
	},
	onUfoAlert: (active: boolean) => {
		ufoAlert?.classList.toggle('hidden', !active);
	},
	onPowerUpdate: (remaining: number) => {
		powerBanner.classList.toggle('hidden', remaining <= 0);
		powerCountdown.textContent = String(Math.ceil(remaining));
	},
	onSoundToggle: (isMuted: boolean) => {
		const label = isMuted ? '🔇' : '🔊';
		btnSound.innerText = label;
		btnPauseSound.innerText = isMuted ? '🔇 Unmute Audio' : '🔊 Mute Audio';
	}
});

// Button Click Bindings
function startFirstRun(): void {
	const name = playerNameInput.value.trim();
	if (!name) {
		nameError.classList.remove('hidden');
		playerNameInput.focus();
		return;
	}
	nameError.classList.add('hidden');
	game.playerName = name;
	try { localStorage.setItem('viberunner_player_name', name); } catch {}
	game.start();
}
playerNameInput.addEventListener('input', () => {
	nameError.classList.add('hidden');
	try {
		const val = playerNameInput.value.trim();
		if (val) {
			localStorage.setItem('viberunner_player_name', val);
			game.playerName = val;
		}
	} catch {}
});
btnStart.addEventListener('click', startFirstRun);
btnPause.addEventListener('click', () => game.togglePause());
btnResume.addEventListener('click', () => game.resume());
btnPauseRestart.addEventListener('click', () => game.start());
btnRestart.addEventListener('click', () => game.start());

btnSound.addEventListener('click', () => game.toggleSound());
btnPauseSound.addEventListener('click', () => game.toggleSound());

// Touch Controls
function bindTouch(btn: HTMLElement, onStart: () => void, onEnd: () => void) {
	btn.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(); }, { passive: false });
	btn.addEventListener('touchend', (e) => { e.preventDefault(); onEnd(); }, { passive: false });
	btn.addEventListener('mousedown', (e) => { e.preventDefault(); onStart(); });
	btn.addEventListener('mouseup', (e) => { e.preventDefault(); onEnd(); });
}

bindTouch(btnTouchLeft, () => { game.player.moveLeft = true; }, () => { game.player.moveLeft = false; });
bindTouch(btnTouchRight, () => { game.player.moveRight = true; }, () => { game.player.moveRight = false; });
btnTouchJump.addEventListener('touchstart', (e) => { e.preventDefault(); game.player.triggerJump(); }, { passive: false });
btnTouchJump.addEventListener('mousedown', (e) => { e.preventDefault(); game.player.triggerJump(); });

// Global Keyboard Events
window.addEventListener('keydown', (e: KeyboardEvent) => {
	if (!leaderboardModal.classList.contains('hidden')) {
		if (e.code === 'Escape') { e.preventDefault(); closeLeaderboard(); }
		return;
	}
	if (e.target instanceof HTMLButtonElement && (e.code === 'Space' || e.code === 'Enter')) return;
	if (e.target === playerNameInput) {
		if (e.code === 'Enter') { e.preventDefault(); startFirstRun(); }
		return;
	}
	if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
		e.preventDefault();
	}

	if (e.code === 'Escape') {
		game.togglePause();
		return;
	}

	if (game.state === 'idle') {
		if (e.code === 'Space' || e.code === 'Enter') {
			startFirstRun();
		}
		return;
	}

	if (game.state === 'gameover') {
		if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR') {
			game.start();
		}
		return;
	}

	if (game.state === 'paused') {
		if (e.code === 'KeyR') {
			game.start();
		}
		return;
	}

	if (game.state === 'playing') {
		if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
			game.player.moveLeft = true;
		}
		if (e.code === 'ArrowRight' || e.code === 'KeyD') {
			game.player.moveRight = true;
		}
		if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
			game.player.triggerJump();
		}
	}
});

window.addEventListener('keyup', (e: KeyboardEvent) => {
	if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
		game.player.moveLeft = false;
	}
	if (e.code === 'ArrowRight' || e.code === 'KeyD') {
		game.player.moveRight = false;
	}
});

// Auto-pause if tab loses focus
window.addEventListener('blur', () => {
	if (game.state === 'playing') {
		game.pause();
	}
});
