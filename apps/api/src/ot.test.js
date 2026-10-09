// Plain node assertions — no test framework needed for a handful of
// property checks on the transform logic. Run with `npm test`.
const assert = require('assert');
const { transform, transformAgainstMany, apply, applyOps, diffToOps } = require('./ot');

// For two edits that don't actually compete for the same character
// position, the order they're committed in shouldn't change the final
// text — that's the real guarantee OT has to provide, since the server
// may receive either op first depending on network timing.
function assertOrderIndependent(base, opA, opB, label) {
  const aThenB = applyOps(applyOps(base, [opA]), transformAgainstMany(opB, [opA]));
  const bThenA = applyOps(applyOps(base, [opB]), transformAgainstMany(opA, [opB]));
  assert.strictEqual(aThenB, bThenA, `${label}: order changed the result ("${aThenB}" vs "${bThenA}")`);
  return aThenB;
}

// Two users insert at different points concurrently — order must not matter.
{
  const base = 'hello world';
  const opA = { type: 'insert', pos: 5, text: ',' };
  const opB = { type: 'insert', pos: 11, text: '!' };
  const result = assertOrderIndependent(base, opA, opB, 'insert/insert, different spots');
  assert.strictEqual(result, 'hello, world!');
}

// Same position insert: real usage is single-direction (the server always
// transforms the late-arriving op against whatever it already committed),
// so we test that direction explicitly and check it's deterministic.
{
  const base = 'ab';
  const alreadyCommitted = { type: 'insert', pos: 1, text: 'Y' }; // server applied this first -> "aYb"
  const lateArrival = { type: 'insert', pos: 1, text: 'X' };
  const afterCommit = apply(base, alreadyCommitted);
  const transformed = transformAgainstMany(lateArrival, [alreadyCommitted]);
  const final = applyOps(afterCommit, transformed);
  assert.strictEqual(final, 'aXYb', 'tie-break must be deterministic given a fixed commit order');
}

// One user deletes a range while another inserts text inside that range —
// the insert must survive regardless of which op the server sees first.
{
  const base = 'The quick brown fox';
  const opDelete = { type: 'delete', pos: 4, length: 15 }; // removes "quick brown fox"
  const opInsert = { type: 'insert', pos: 10, text: 'ish ' }; // "quick brownish fox"
  const result = assertOrderIndependent(base, opDelete, opInsert, 'delete swallowing a concurrent insert');
  assert.ok(result.includes('ish'), 'inserted text must not be silently eaten by an unrelated delete');
}

// Two overlapping deletes must not double-remove characters or corrupt positions.
{
  const base = 'abcdefgh';
  const opA = { type: 'delete', pos: 2, length: 4 }; // removes "cdef"
  const opB = { type: 'delete', pos: 4, length: 4 }; // removes "efgh"
  const result = assertOrderIndependent(base, opA, opB, 'overlapping deletes');
  assert.strictEqual(result, 'ab');
}

// diffToOps should produce ops that reconstruct the new text when applied —
// this is what turns a raw textarea onChange into something transformable.
{
  const oldText = 'hello world';
  const newText = 'hello brave world';
  assert.strictEqual(applyOps(oldText, diffToOps(oldText, newText)), newText);
}
{
  const oldText = 'hello brave world';
  const newText = 'hello world';
  assert.strictEqual(applyOps(oldText, diffToOps(oldText, newText)), newText);
}

console.log('All OT transform tests passed.');
