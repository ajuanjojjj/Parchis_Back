import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import type { RemoteMessage } from './Messages';

// Custom type for messages
type ClientMessage =
	| { type: 'create'; lobbyId: string; }
	| { type: 'join'; lobbyId: string; }
	| { type: 'lobbyMessage'; lobby: string; message: RemoteMessage; };

// Map: lobbyId → Set of clients
const lobbies: Record<string, Set<WebSocket>> = {};

const server = http.createServer((req, res) => {
	res.writeHead(200);
	res.end('WebSocket Server is running!');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
	// Attach a lobby property manually
	let lobbyId: string | null = null;

	ws.on('message', (raw) => {
		let data: ClientMessage;
		try {
			data = JSON.parse(raw.toString());
		} catch (e) {
			console.error('Invalid message:', raw);
			return;
		}

		// if (client.readyState === WebSocket.OPEN) {
		// 	client.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
		// 	return;
		// }

		if (data.type === 'create') {
			if (lobbyId != null) {
				ws.send(`Player is already in the lobby ${lobbyId}`);
				return;
			}

			lobbyId = data.lobbyId;
			if (lobbies[lobbyId]) {
				ws.send(`Lobby ${lobbyId} already exists`);
				return;
			}

			lobbies[lobbyId] = new Set();
			lobbies[lobbyId].add(ws);
			console.log(`Client created lobby ${lobbyId}`);
			ws.send(JSON.stringify({ type: 'lobbyCreated', lobby: lobbyId }));
		}

		if (data.type === 'join') {
			if (lobbyId != null) {
				ws.send(`Player is already in the lobby ${lobbyId}`);
				return;
			}

			lobbyId = data.lobbyId;
			if (!lobbies[lobbyId]) {
				ws.send(`Lobby ${lobbyId} not found`);
				return;
			}


			lobbies[lobbyId].add(ws);
			console.log(`Client joined lobby ${lobbyId}`);
			ws.send(JSON.stringify({ type: 'lobbyJoined', lobby: lobbyId }));
		}

		if (data.type == 'lobbyMessage') {
			if (lobbyId == null) {
				ws.send(`Player is not in a lobby`);
				return;
			}
			if (!lobbies[lobbyId]) {
				ws.send(`Lobby ${lobbyId} not found`);
				return;
			}

			lobbies[lobbyId].forEach(client => {
				client.send(JSON.stringify(data.message));
			});
		}
	});

	ws.on('close', () => {
		if (lobbyId == null) {
			console.log('Player disconnected from unknown lobby (no lobbyId)');
			return;
		}

		if (lobbies[lobbyId] == null) {
			console.log(`Player disconnected from unknown lobby ${lobbyId}`);
			return;
		}

		lobbies[lobbyId].delete(ws);
		if (lobbies[lobbyId].size === 0) {
			delete lobbies[lobbyId];
			console.log(`Lobby ${lobbyId} deleted (empty)`);
		} else {
			console.log(`Player disconnected from lobby ${lobbyId}`);
		}
	});
});

// Use dynamic port for Render
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
