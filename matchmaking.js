const TicTacToeGame = require('./game');

const queue = [];
const activeGames = new Map(); // roomId -> { game, players: { X: socket, O: socket } }
const socketRooms = new Map(); // socketId -> roomId

let roomCounter = 0;

function addToQueue(socket) {
  // Prevent duplicate queue entries and re-queuing while already in a game
  if (queue.includes(socket) || socketRooms.has(socket.id)) return;

  if (queue.length > 0) {
    // Pair the waiting player with the new arrival
    const opponent = queue.shift();

    roomCounter++;
    const roomId = `room_${roomCounter}`;
    const game = new TicTacToeGame();

    // Assign X and O randomly
    const [playerX, playerO] = Math.random() < 0.5
      ? [opponent, socket]
      : [socket, opponent];

    playerX.join(roomId);
    playerO.join(roomId);

    activeGames.set(roomId, {
      game,
      players: { X: playerX, O: playerO },
    });
    socketRooms.set(playerX.id, roomId);
    socketRooms.set(playerO.id, roomId);

    playerX.emit('game-start', { symbol: 'X', roomId, board: game.getState().board, turn: 'X' });
    playerO.emit('game-start', { symbol: 'O', roomId, board: game.getState().board, turn: 'X' });

    console.log(`Game started in ${roomId}: ${playerX.id} (X) vs ${playerO.id} (O)`);
  } else {
    // Nobody waiting — add this socket to the queue
    queue.push(socket);
    socket.emit('waiting');
  }
}

function removeFromQueue(socket) {
  const index = queue.indexOf(socket);
  if (index !== -1) {
    queue.splice(index, 1);
  }
}

function handleDisconnect(socket) {
  // Remove from queue if still waiting
  removeFromQueue(socket);

  const roomId = socketRooms.get(socket.id);
  if (!roomId) return;

  const entry = activeGames.get(roomId);
  if (entry) {
    // Notify the opponent that the other player left
    const { players } = entry;
    const opponent = players.X.id === socket.id ? players.O : players.X;
    opponent.emit('opponent-left');

    // Clean up room state
    activeGames.delete(roomId);
    socketRooms.delete(players.X.id);
    socketRooms.delete(players.O.id);
    socket.leave(roomId);
    opponent.leave(roomId);
  }
}

module.exports = { addToQueue, removeFromQueue, handleDisconnect, activeGames, socketRooms };
