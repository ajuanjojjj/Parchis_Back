export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

export interface MoveMessage {
	// messageId: number;
	type: "move";
	playerId: number;
	pieceId: number;
	newPosition: number;
	animate: boolean;
}
export interface DiceRequestMessage {
	// messageId: number;
	type: "diceRequest";
	playerId: number;
	requesteeId: number;
}
export interface DiceResultMessage {
	// messageId: number;
	type: "diceResult";
	playerId: number;
	result: [DiceValue, DiceValue];
}
export interface LobbyPlayersMessage {
	// messageId: number;
	type: "lobbyPlayers";
	playerId: number;
	players: Array<{
		id: number;
		name: string;
		type: "player" | "bot";
		hostedAt: number;
		pieces: Array<{
			id: number;
			position: number;
		}>;
	}>;
}
export type RemoteMessage = MoveMessage | DiceRequestMessage | DiceResultMessage;