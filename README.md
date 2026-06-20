# Tic Tac Toe

A real-time two-player Tic Tac Toe game played in the browser over WebSockets.

# How to Play

1. Open the game in two browser tabs (or on two devices on the same network).
2. Click "Find Game" in each tab — the server pairs the first two players who connect.
3. X always goes first. Click any empty cell on your turn.
4. The first player to get three in a row wins. If all nine cells fill with no winner, it's a draw.
5. After the game ends, click **Play Again** to re-enter the matchmaking queue.

# Tech Stack

- Node.js — server runtime
- Express — serves the static frontend
- Socket.io — real-time bidirectional WebSocket communication
- Vanilla HTML / CSS / JS — no frontend framework

# Run Locally

```bash
git clone <repo-url>
cd tic-tac-toe
npm install
node server.js
```

Then open [http://localhost:3000](http://localhost:3000) in two browser tabs.

# How It Works

The server maintains all game state. When two players connect and both click Find Game, the server pairs them into a named room and creates a `TicTacToeGame` instance for that pair. Move events travel from client → server via Socket.io; the server validates each move, updates state, and broadcasts the result back to both players in the room. The client only renders what the server tells it — no game logic runs in the browser.

# Development Process

Built collaboratively with [Claude Code](https://claude.ai/code). The game engine (`game.js`) and matchmaking logic (`matchmaking.js`) were written as isolated modules with clear interfaces before being wired into the server, making it straightforward to reason about each layer independently. Two real bugs were caught and fixed during integration testing:

- Stale game-state bug — `makeMove()` accepted moves after a game had already ended (winner or draw). Fixed by tracking terminal state on the game instance and rejecting moves once it's set.
- Re-matchmaking race condition — after a game ended normally, the room was never removed from the active-games map, so `addToQueue`'s duplicate check blocked players from starting a new game after clicking Play Again. Fixed by cleaning up the room immediately after emitting `game-over`.
