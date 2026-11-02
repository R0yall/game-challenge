import { defineConfig } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const scoreFile = fileURLToPath(new URL('./src/data/highscore.json', import.meta.url));

export default defineConfig({
	plugins: [{
		name: 'local-high-score',
		configureServer(server) {
			server.watcher.unwatch(scoreFile);
			server.middlewares.use('/__highscore', (req, res) => {
				// Only accept writes from the machine running Vite.
				const address = req.socket.remoteAddress;
				if (req.method !== 'POST' || req.headers['content-type'] !== 'application/json' || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address || '')) {
					res.writeHead(403).end();
					return;
				}
				let body = '';
				req.on('data', chunk => {
					body += chunk;
					if (body.length > 4096) req.destroy();
				});
				req.on('end', () => {
					try {
						const candidate = JSON.parse(body);
						if (typeof candidate.name !== 'string' || !candidate.name.trim() || candidate.name.length > 24 || !Number.isSafeInteger(candidate.score) || candidate.score < 1) throw new Error('Invalid score');
						if (typeof candidate.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(candidate.id)) throw new Error('Invalid ID');
						const current = JSON.parse(readFileSync(scoreFile, 'utf8'));
						const scores = Array.isArray(current.scores) ? current.scores : current.score > 0 ? [{ id: 'legacy-shared', name: current.name || 'Unknown', score: current.score }] : [];
						if (!scores.some((entry: { id: string }) => entry.id === candidate.id)) scores.push({ id: candidate.id, name: candidate.name.trim(), score: candidate.score });
						scores.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
						const result = { scores: scores.slice(0, 20) };
						writeFileSync(scoreFile, JSON.stringify(result, null, 2) + '\n');
						res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(result));
					} catch {
						res.writeHead(400).end();
					}
				});
			});
		} 
	}],
	server: {
		port: 5173,
		host: true
	}
});
