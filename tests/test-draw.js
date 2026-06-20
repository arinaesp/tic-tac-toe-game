const TicTacToeGame = require('./game');
const g = new TicTacToeGame();

const moves = [0, 4, 8, 1, 2, 6, 3, 5, 7];
moves.forEach(m => {
  const result = g.makeMove(m);
  console.log(`Move ${m}:`, result.valid, '| winner:', result.winner, '| draw:', result.isDraw);
});