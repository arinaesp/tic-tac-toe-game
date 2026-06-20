const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

class TicTacToeGame {
  constructor() {
    this.board = Array(9).fill(null);
    this.currentTurn = 'X';
    this.winner = null;
    this.isDraw = false;
    this.winningLine = null;
  }

  makeMove(cellIndex, player) {
    // Reject moves once the game has already ended
    if (this.winner || this.isDraw) {
      return { valid: false, symbol: null, winner: this.winner, isDraw: this.isDraw, board: [...this.board] };
    }

    // Reject moves from the wrong player when the caller supplies one
    if (player !== undefined && player !== this.currentTurn) {
      return { valid: false, symbol: null, winner: null, isDraw: false, board: [...this.board] };
    }

    if (cellIndex < 0 || cellIndex > 8 || this.board[cellIndex] !== null) {
      return { valid: false, symbol: null, winner: null, isDraw: false, board: [...this.board] };
    }

    const symbol = this.currentTurn;
    this.board[cellIndex] = symbol;

    this.winner = this._checkWinner();
    this.isDraw = !this.winner && this.board.every(cell => cell !== null);

    if (!this.winner && !this.isDraw) {
      this.currentTurn = this.currentTurn === 'X' ? 'O' : 'X';
    }

    return { valid: true, symbol, winner: this.winner, isDraw: this.isDraw, board: [...this.board], winningLine: this.winningLine };
  }

  getState() {
    return { board: [...this.board], turn: this.currentTurn };
  }

  _checkWinner() {
    for (const [a, b, c] of WINNING_LINES) {
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        this.winningLine = [a, b, c];
        return this.board[a];
      }
    }
    return null;
  }
}

module.exports = TicTacToeGame;
