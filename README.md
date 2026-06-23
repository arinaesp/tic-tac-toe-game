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

# Security Review

After the initial build, a custom Claude Code subagent (`security-reviewer`, configured in `.claude/agents/`) was used to audit the codebase for security issues before deployment. It flagged five findings; the four actionable ones were fixed:

- **No input validation on `cellIndex`** — the server passed socket input directly into game logic without confirming it was a valid integer. Fixed by adding an explicit type and bounds check before processing any move.
- **No rate limiting on socket events** — a malicious client could flood the server with move events. Fixed with a per-connection cooldown timer.
- **Open CORS policy** — Socket.io defaulted to accepting connections from any origin. Restructured to lock to a specific domain in production.
- **Unsafe DOM updates** — the client used `innerHTML` with server-provided data to render board cells. Replaced with `textContent` to eliminate any XSS risk if that data path ever changes.

This mirrors a common pre-launch practice: pairing automated security review with manual verification before pushing changes live.

# Socket Room Cleanup Fix

Sockets were never explicitly removed from their Socket.IO room after a game ended or after a player disconnected, so stale room memberships accumulated on the server across multiple games.

- Added `socket.leave(roomId)` calls after game-over so both sockets exit the room once a result is emitted (`server.js`).
- Added matching `socket.leave(roomId)` calls in the disconnect handler so both the disconnecting socket and the surviving opponent are removed from the room (`matchmaking.js`).
- Verified with a two-client test script that confirmed each socket could pair into a fresh room after game-over and after an opponent disconnect.
- A security-reviewer subagent reviewed the fix and found no issues; the cleanup ordering (map deletions before leave calls) is safe because it is synchronous with no interleaving window.
