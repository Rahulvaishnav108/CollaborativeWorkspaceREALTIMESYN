export function transform(opA, opB, priority = 'left') {
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
    return [{ ...opA, pos: opB.pos }];
  }

  if (opA.type === 'delete' && opB.type === 'insert') {
    if (opB.pos <= opA.pos) {
      return [{ ...opA, pos: opA.pos + opB.text.length }];
    }
    if (opB.pos >= opA.pos + opA.length) {
      return [{ ...opA }];
    }
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

    const leftLen = Math.max(0, Math.min(aEnd, bStart) - aStart);
    const rightLen = Math.max(0, aEnd - Math.max(aStart, bEnd));

    const ops = [];
    if (rightLen > 0) ops.push({ type: 'delete', pos: bStart, length: rightLen });
    if (leftLen > 0) ops.push({ type: 'delete', pos: aStart, length: leftLen });
    return ops;
  }

  throw new Error(`Unhandled transform case: ${opA.type}/${opB.type}`);
}

export function transformAgainstMany(op, priorOps, priority = 'left') {
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

export function apply(text, op) {
  if (op.type === 'insert') {
    return text.slice(0, op.pos) + op.text + text.slice(op.pos);
  }
  if (op.type === 'delete') {
    return text.slice(0, op.pos) + text.slice(op.pos + op.length);
  }
  throw new Error(`Unknown op type: ${op.type}`);
}

export function applyOps(text, ops) {
  return ops.reduce((acc, op) => apply(acc, op), text);
}

export function diffToOps(oldText, newText) {
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

// Transform a batch of ops (e.g. a server broadcast, which may contain a
// split pair) against a sequence of already-applied ops, then re-sort the
// combined result highest-position-first so it can be applied safely as a
// single pass. See the coordinate-space note in transform() above.
export function transformOpsAgainstMany(ops, priorOps, priority = 'left') {
  const out = [];
  for (const op of ops) {
    out.push(...transformAgainstMany(op, priorOps, priority));
  }
  return out.sort((a, b) => b.pos - a.pos);
}
