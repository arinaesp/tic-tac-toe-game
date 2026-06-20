const TicTacToeGame = require('./game');

const g = new TicTacToeGame();
const moves = [0, 3, 1, 4, 2]; // X takes 0,1,2 (top row), O takes 3,4

let lastResult;
moves.forEach(m => {
  lastResult = g.makeMove(m);
});

console.log('Winner:', lastResult.winner, '(expected: X)');
console.log('Winning line:', lastResult.winningLine, '(expected: [0, 1, 2])');
console.log('Board:', lastResult.board);
