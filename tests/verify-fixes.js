const TicTacToeGame = require('./game');

console.log('--- Test: no moves allowed after win ---');
const g4 = new TicTacToeGame();
[0, 3, 1, 4, 2].forEach(m => g4.makeMove(m)); // X wins top row on move index 2
console.log('After win, board:', g4.getState().board);
const afterWin = g4.makeMove(5);
console.log('Move after win:', afterWin.valid, '(expected: false)');

console.log('\n--- Test: wrong-player move rejected ---');
const g3 = new TicTacToeGame();
const wrongTurn = g3.makeMove(0, 'O'); // X should go first, but we claim to be O
console.log('O tries to move first:', wrongTurn.valid, '(expected: false)');
const rightTurn = g3.makeMove(0, 'X');
console.log('X tries to move first:', rightTurn.valid, '(expected: true)');
