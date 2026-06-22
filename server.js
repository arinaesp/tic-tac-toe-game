const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { addToQueue, handleDisconnect, activeGames, socketRooms } = require('./matchmaking');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://your-actual-domain.com'
      : '*',
    methods: ['GET', 'POST'],
  },
});

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  let lastMoveTime = 0;
  const MOVE_COOLDOWN_MS = 300;

  socket.on('find-game', () => {
    addToQueue(socket);
  });

  socket.on('make-move', (cellIndex) => {
    if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex > 8) {
      socket.emit('error', { message: 'Invalid move.' });
      return;
    }

    const now = Date.now();
    if (now - lastMoveTime < MOVE_COOLDOWN_MS) return; // rate limit
    lastMoveTime = now;

    const roomId = socketRooms.get(socket.id);
    if (!roomId) return; // player isn't in an active game

    const { game, players } = activeGames.get(roomId);

    const symbol = players.X.id === socket.id ? 'X' : 'O';
    const result = game.makeMove(cellIndex, symbol);

    if (!result.valid) {
      socket.emit('error', { message: 'Invalid move.' });
      return;
    }

    io.to(roomId).emit('move-made', {
      board: result.board,
      turn: game.getState().turn,
      move: { cellIndex, symbol },
    });

    if (result.winner || result.isDraw) {
      io.to(roomId).emit('game-over', { winner: result.winner ?? null, winningLine: result.winningLine ?? null });
      activeGames.delete(roomId);
      socketRooms.delete(players.X.id);
      socketRooms.delete(players.O.id);
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
