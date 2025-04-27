import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

// Custom type for messages
type ClientMessage =
	| { type: 'join'; lobby: string; }
	| { type: 'message'; user: string; text: string; };

// Map: lobbyId → Set of clients
const lobbies: Record<string, Set<WebSocket>> = {};

const server = http.createServer((req, res) => {
	res.writeHead(200);
	res.end('WebSocket Server is running!');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
	// Attach a lobby property manually
	(ws as any).lobby = null;

	ws.on('message', (raw) => {
		let data: ClientMessage;
		try {
			data = JSON.parse(raw.toString());
		} catch (e) {
			console.error('Invalid message:', raw);
			return;
		}

		if (data.type === 'join') {
			const lobbyId = data.lobby;
			if (!lobbies[lobbyId]) lobbies[lobbyId] = new Set();
			lobbies[lobbyId].add(ws);
			(ws as any).lobby = lobbyId;
			console.log(`Client joined lobby ${lobbyId}`);
		}

		if (data.type === 'message' && (ws as any).lobby) {
			lobbies[(ws as any).lobby].forEach(client => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ user: data.user, text: data.text }));
				}
			});
		}
	});

	ws.on('close', () => {
		const lobby = (ws as any).lobby;
		if (lobby && lobbies[lobby]) {
			lobbies[lobby].delete(ws);
			if (lobbies[lobby].size === 0) {
				delete lobbies[lobby];
				console.log(`Lobby ${lobby} deleted (empty)`);
			}
		}
	});
});

// Use dynamic port for Render
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
