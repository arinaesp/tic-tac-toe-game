const socket = io();

const statusEl      = document.getElementById('status');
const spinnerEl     = document.getElementById('spinner');
const findGameBtn   = document.getElementById('find-game-btn');
const playAgainBtn  = document.getElementById('play-again-btn');
const cells         = Array.from(document.querySelectorAll('.cell'));

let mySymbol  = null;
let myRoomId  = null;
let myTurn    = false;

// ── Helpers ──────────────────────────────────────────────────────────────────────────────

function setStatus(text) {
  statusEl.textContent = text;
}

function setTurnColor(turn) {
  statusEl.classList.remove('turn-x', 'turn-o');
  if (turn === 'X') statusEl.classList.add('turn-x');
  if (turn === 'O') statusEl.classList.add('turn-o');
}

function clearTurnColor() {
  statusEl.classList.remove('turn-x', 'turn-o', 'opponent-turn');
}

function showSpinner() {
  spinnerEl.classList.add('visible');
}

function hideSpinner() {
  spinnerEl.classList.remove('visible');
}

function clearBoard() {
  cells.forEach(cell => {
    cell.innerHTML = '';
    cell.className = 'cell';
    cell.disabled = true;
  });
}

function renderBoard(board) {
  board.forEach((symbol, i) => {
    if (symbol) {
      const span = document.createElement('span');
      span.textContent = symbol;
      cells[i].innerHTML = '';
      cells[i].appendChild(span);
      cells[i].classList.add(symbol);
      cells[i].disabled = true;
    }
  });
}

function setTurnState(currentTurn) {
  myTurn = currentTurn === mySymbol;
  cells.forEach(cell => {
    if (!cell.innerHTML) {
      cell.disabled = !myTurn;
    }
  });
  setTurnColor(currentTurn);
  statusEl.classList.toggle('opponent-turn', !myTurn);
}

function showPlayAgain() {
  playAgainBtn.disabled = false;
  playAgainBtn.style.display = '';
}

// ── UI Events ─────────────────────────────────────────────────────────────────────────────

findGameBtn.addEventListener('click', () => {
  findGameBtn.disabled = true;
  showSpinner();
  setStatus('Searching for opponent...');
  socket.emit('find-game');
});

playAgainBtn.addEventListener('click', () => {
  playAgainBtn.disabled = true;
  playAgainBtn.style.display = 'none';
  clearBoard();
  clearTurnColor();
  showSpinner();
  setStatus('Searching for opponent...');
  socket.emit('find-game');
});

cells.forEach(cell => {
  cell.addEventListener('click', () => {
    if (!myTurn || cell.innerHTML) return;
    const index = parseInt(cell.dataset.index, 10);
    socket.emit('make-move', index);
  });
});

// ── Socket Events ─────────────────────────────────────────────────────────────────────────────

socket.on('waiting', () => {
  hideSpinner();
  setStatus('Waiting for another player...');
});

socket.on('game-start', ({ symbol, roomId, board, turn }) => {
  mySymbol = symbol;
  myRoomId = roomId;
  findGameBtn.disabled = true;   // stays disabled — Play Again is used from here
  playAgainBtn.disabled = false;
  playAgainBtn.style.display = 'none';
  hideSpinner();
  clearBoard();
  setTurnState(turn);
  setStatus(turn === mySymbol ? 'Your turn' : `Opponent's turn`);
});

socket.on('move-made', ({ board, turn, move }) => {
  const cell = cells[move.cellIndex];
  const span = document.createElement('span');
  span.textContent = move.symbol;
  cell.innerHTML = '';
  cell.appendChild(span);
  cell.classList.add(move.symbol);
  cell.disabled = true;
  setTurnState(turn);
  setStatus(turn === mySymbol ? 'Your turn' : `Opponent's turn`);
});

socket.on('game-over', ({ winner, winningLine }) => {
  cells.forEach(cell => { cell.disabled = true; });

  if (winningLine) {
    winningLine.forEach(i => cells[i].classList.add('winning'));
  }

  clearTurnColor();

  if (!winner) {
    setStatus("It's a draw!");
  } else if (winner === mySymbol) {
    setStatus('You win!');
  } else {
    setStatus('You lose.');
  }

  showPlayAgain();
});

socket.on('opponent-left', () => {
  cells.forEach(cell => { cell.disabled = true; });
  clearTurnColor();
  setStatus('Opponent disconnected.');
  showPlayAgain();
});

socket.on('error', ({ message }) => {
  console.warn('Server error:', message);
});

socket.on('move-rejected', ({ reason }) => {
  if (reason === 'too-fast') {
    setStatus('Too fast — wait a moment and try again.');
    setTimeout(() => {
      setStatus(myTurn ? 'Your turn' : "Opponent's turn");
    }, 1000);
  }
});

socket.on('connect_error', (err) => {
  hideSpinner();
  findGameBtn.disabled = false;
  if (err.message === 'connection_limit_exceeded') {
    setStatus('Too many connections from this device. Close other tabs and try again.');
  } else {
    setStatus('Could not connect to the server. Please try again.');
  }
});

socket.on('queue-full', () => {
  hideSpinner();
  findGameBtn.disabled = false;
  setStatus('Server is full — please try again in a moment.');
});
