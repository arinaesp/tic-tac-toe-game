const { addToQueue, handleDisconnect, activeGames, socketRooms } = require('./matchmaking');

// A fake socket that mimics what Socket.io gives us, but just logs instead of networking
function createMockSocket(id) {
  return {
    id,
    join(room) {
      console.log(`  [${id}] joined room: ${room}`);
    },
    emit(event, payload) {
      console.log(`  [${id}] received '${event}':`, payload || '');
    },
  };
}

console.log('--- Test 1: first player waits ---');
const alice = createMockSocket('alice');
addToQueue(alice);

console.log('\n--- Test 2: second player triggers a match ---');
const bob = createMockSocket('bob');
addToQueue(bob);

console.log('\n--- Check internal state after match ---');
console.log('Active games count:', activeGames.size);
console.log('Alice room:', socketRooms.get('alice'));
console.log('Bob room:', socketRooms.get('bob'));
console.log('Alice and Bob in same room:', socketRooms.get('alice') === socketRooms.get('bob'));

console.log('\n--- Test 3: disconnect mid-game notifies opponent ---');
handleDisconnect(alice);
console.log('Active games count after disconnect:', activeGames.size, '(expected: 0)');
console.log('Alice room after disconnect:', socketRooms.get('alice'), '(expected: undefined)');
console.log('Bob room after disconnect:', socketRooms.get('bob'), '(expected: undefined)');

console.log('\n--- Test 4: third player waits alone after room cleanup ---');
const carol = createMockSocket('carol');
addToQueue(carol);
