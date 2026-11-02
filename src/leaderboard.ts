import shared from './data/highscore.json';

export interface ScoreEntry { id: string; name: string; score: number }
const storageKey = 'viberunner_leaderboard';
let sharedScores = shared.scores as ScoreEntry[];
let localScores: ScoreEntry[] = [];
try {
	const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
	if (Array.isArray(saved)) localScores = saved.filter(entry => typeof entry.id === 'string' && typeof entry.name === 'string' && Number.isSafeInteger(entry.score) && entry.score > 0);
	const oldScore = Number(localStorage.getItem('viberunner_highscore'));
	const oldName = localStorage.getItem('viberunner_highscore_name') || 'Unknown';
	if (oldScore > 0 && !localScores.some(entry => entry.name === oldName && entry.score === oldScore) && !sharedScores.some(entry => entry.name === oldName && entry.score === oldScore)) {
		localScores.push({ id: 'legacy-browser', name: oldName, score: oldScore });
	}
} catch { /* Browser storage is optional. */ }

export function getLeaderboard(): ScoreEntry[] {
	const unique = new Map<string, ScoreEntry>();
	for (const entry of [...sharedScores, ...localScores]) unique.set(entry.id, entry);
	return [...unique.values()].sort((a, b) => b.score - a.score).slice(0, 20);
}

export async function recordScore(name: string, score: number): Promise<boolean> {
	const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	const entry = { id, name, score };
	localScores = [...localScores, entry].sort((a, b) => b.score - a.score).slice(0, 20);
	try { localStorage.setItem(storageKey, JSON.stringify(localScores)); } catch { /* Keep scores in memory. */ }
	if (!import.meta.env.DEV) return true;
	try {
		const response = await fetch('/__highscore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
		if (!response.ok) return false;
		const result = await response.json();
		sharedScores = result.scores;
		return true;
	} catch { return false; }
}
