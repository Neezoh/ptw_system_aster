const test = require('node:test');
const assert = require('node:assert/strict');

const beforeHandles = process._getActiveHandles().filter((handle) => {
  return handle && handle.constructor && handle.constructor.name === 'Server';
}).length;

require('../server');

const afterHandles = process._getActiveHandles().filter((handle) => {
  return handle && handle.constructor && handle.constructor.name === 'Server';
}).length;

test('server only binds when run directly', () => {
  assert.equal(afterHandles, beforeHandles, 'Importing the module should not start the HTTP server');
});
