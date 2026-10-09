// ot.js — Operational Transform core for plain-text concurrent editing.
//
// An "op" is one of:
//   { type: 'insert', pos: number, text: string }
//   { type: 'delete', pos: number, length: number }
//
// transform(opA, opB) answers: "opA was generated against the same base
// document as opB, but opB got applied first — how must opA change so it
// still does the same logical thing to the new document?"
//
// It returns an ARRAY of ops (0, 1, or 2) because some cases — e.g. someone
// deletes a range that a concurrent op just inserted text into — can't be
// expressed as a single op without either losing the new text or resurrecting
// text the other user meant to delete. Splitting is what keeps both users'
// intent intact.
//
// IMPORTANT: when transform() returns two fragments, both are expressed in
// the SAME coordinate space (the text as it exists right before either
// fragment is applied) — they are not a sequential pair. Callers must apply
// them highest-position-first so applying one doesn't shift the other's
// coordinates out from under it. transformAgainstMany() guarantees the
// array it returns is already sorted that way.
//
// `priority` breaks ties when two inserts land at the exact same position.
// The server assigns 'left' to whichever op it committed first, so ordering
// is deterministic and every client converges on the same final text
// (this is the core correctness property OT is required to guarantee).

function transform(opA, opB, priority = 'left') {
  if (opA.type === 'insert' && opB.type === 'insert') {
    if (opB.pos < opA.pos || (opB.pos === opA.pos && priority === 'right')) {
      return [{ ...opA, pos: opA.pos + opB.text.length }];
    }
    return [{ ...opA }];
  }

  if (opA.type === 'insert' && opB.type === 'delete') {
    if (opA.pos <= opB.pos) return [{ ...opA }];
    if (opA.pos >= opB.pos + opB.length) {
      return [{ ...opA, pos: opA.pos - opB.length }];
    }
    // opA's insertion point was inside text opB just deleted; land it at
    // the start of that (now-gone) range.
    return [{ ...opA, pos: opB.pos }];
  }

  if (opA.type === 'delete' && opB.type === 'insert') {
    if (opB.pos <= opA.pos) {
      return [{ ...opA, pos: opA.pos + opB.text.length }];
    }
    if (opB.pos >= opA.pos + opA.length) {
      return [{ ...opA }];
    }
    // opB inserted new text in the middle of the range opA wants to delete.
    // opA never knew that text existed, so it shouldn't delete it — split
    // the delete into the parts before and after the new text. Returned
    // highest-position-first (see note above).
    const firstLen = opB.pos - opA.pos;
    const secondLen = opA.length - firstLen;
    const ops = [];
    if (secondLen > 0) ops.push({ type: 'delete', pos: opB.pos + opB.text.length, length: secondLen });
    if (firstLen > 0) ops.push({ type: 'delete', pos: opA.pos, length: firstLen });
    return ops;
  }

  if (opA.type === 'delete' && opB.type === 'delete') {
    const aStart = opA.pos;
    const aEnd = opA.pos + opA.length;
    const bStart = opB.pos;
    const bEnd = opB.pos + opB.length;

    if (aEnd <= bStart) return [{ ...opA }];
    if (aStart >= bEnd) return [{ ...opA, pos: opA.pos - opB.length }];

    // Ranges overlap: only the parts of opA's range that opB did NOT
    // already remove still need deleting (otherwise we'd double-delete
    // and corrupt positions for whoever applies this second).
    const leftLen = Math.max(0, Math.min(aEnd, bStart) - aStart);
    const rightLen = Math.max(0, aEnd - Math.max(aStart, bEnd));

    const ops = [];
    if (rightLen > 0) ops.push({ type: 'delete', pos: bStart, length: rightLen });
    if (leftLen > 0) ops.push({ type: 'delete', pos: aStart, length: leftLen });
    return ops;
  }

  throw new Error(`Unhandled transform case: ${opA.type}/${opB.type}`);
}

// Transform a single op against a sequence of ops that were already applied
// (in order). Because transform() can split an op into two, we have to
// carry every resulting fragment through each subsequent step. The result
// is sorted highest-position-first so it can be applied or committed
// directly — see the coordinate-space note on transform() above.
function transformAgainstMany(op, priorOps, priority = 'left') {
  let current = [op];
  for (const priorOp of priorOps) {
    const next = [];
    for (const fragment of current) {
      next.push(...transform(fragment, priorOp, priority));
    }
    current = next;
  }
  return current.sort((a, b) => b.pos - a.pos);
}

function apply(text, op) {
  if (op.type === 'insert') {
    return text.slice(0, op.pos) + op.text + text.slice(op.pos);
  }
  if (op.type === 'delete') {
    return text.slice(0, op.pos) + text.slice(op.pos + op.length);
  }
  throw new Error(`Unknown op type: ${op.type}`);
}

// Applies ops in the given array order. Use this for: (a) a chronological
// op log, where each entry's position already accounts for every earlier
// entry, and (b) the output of transformAgainstMany(), which is
// pre-sorted highest-position-first so sequential application is safe.
function applyOps(text, ops) {
  return ops.reduce((acc, op) => apply(acc, op), text);
}

// Diff two strings (old client text -> new client text) into the smallest
// delete+insert pair that explains the change. Used client-side to turn a
// raw textarea onChange into an op, without shipping a full CRDT/diff lib.
// Handles the common cases well: typing, pasting, cutting, single-selection
// replace. Multi-cursor edits from real word processors are out of scope.
function diffToOps(oldText, newText) {
  if (oldText === newText) return [];

  let prefix = 0;
  const maxPrefix = Math.min(oldText.length, newText.length);
  while (prefix < maxPrefix && oldText[prefix] === newText[prefix]) prefix++;

  let oldEnd = oldText.length;
  let newEnd = newText.length;
  while (oldEnd > prefix && newEnd > prefix && oldText[oldEnd - 1] === newText[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }

  const ops = [];
  if (oldEnd > prefix) {
    ops.push({ type: 'delete', pos: prefix, length: oldEnd - prefix });
  }
  if (newEnd > prefix) {
    ops.push({ type: 'insert', pos: prefix, text: newText.slice(prefix, newEnd) });
  }
  return ops;
}

module.exports = { transform, transformAgainstMany, apply, applyOps, diffToOps };
