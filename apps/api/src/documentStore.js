// documentStore.js — in-memory authoritative state for documents that are
// currently being edited, backed by debounced writes to MongoDB.
//
// Why not just read/write Mongo on every keystroke? Two reasons: (1) OT
// needs a fast, consistent in-memory op log to transform against — hitting
// the DB for every op would make conflict resolution slow and racy across
// concurrent requests; (2) it batches writes, so ten edits a second become
// one Mongo write, not ten.
const Document = require('./models/Document');
const { transformAgainstMany, applyOps, diffToOps } = require('./ot');

const OP_LOG_LIMIT = 500; // per-document cap on retained history
const SAVE_DEBOUNCE_MS = 1500;
const SNAPSHOT_REVISION_GAP = 12; // take a new history snapshot every N committed ops
const SNAPSHOT_LIMIT = 15; // keep at most this many snapshots per document

// docId -> { content, revision, opLog, dirty, saveTimer, locked, lockedBy,
//            lockedAt, history, lastSnapshotRevision }
const rooms = new Map();

async function loadRoom(docId) {
  if (rooms.has(docId)) return rooms.get(docId);

  const doc = await Document.findById(docId);
  if (!doc) return null;

  const room = {
    content: doc.content,
    revision: doc.revision,
    opLog: [],
    dirty: false,
    saveTimer: null,
    locked: doc.locked,
    lockedBy: doc.lockedBy,
    lockedAt: doc.lockedAt,
    history: (doc.history || []).map((h) => ({ content: h.content, revision: h.revision, savedAt: h.savedAt })),
    lastSnapshotRevision: doc.history && doc.history.length ? doc.history[doc.history.length - 1].revision : doc.revision,
  };
  rooms.set(docId, room);
  return room;
}

function maybeSnapshot(room) {
  if (room.revision - room.lastSnapshotRevision < SNAPSHOT_REVISION_GAP) return;
  room.history.push({ content: room.content, revision: room.revision, savedAt: new Date() });
  if (room.history.length > SNAPSHOT_LIMIT) {
    room.history.splice(0, room.history.length - SNAPSHOT_LIMIT);
  }
  room.lastSnapshotRevision = room.revision;
}

function scheduleSave(docId, room) {
  room.dirty = true;
  if (room.saveTimer) return;
  room.saveTimer = setTimeout(async () => {
    room.saveTimer = null;
    if (!room.dirty) return;
    room.dirty = false;
    maybeSnapshot(room);
    try {
      await Document.findByIdAndUpdate(docId, {
        content: room.content,
        revision: room.revision,
        history: room.history,
      });
    } catch (err) {
      console.error(`[documentStore] failed to persist ${docId}:`, err.message);
      room.dirty = true; // leave it dirty so the next edit (or a future
      // periodic sweep) retries the save instead of silently losing writes
    }
  }, SAVE_DEBOUNCE_MS);
}

// Applies a client op against the authoritative in-memory copy.
//
// baseRevision is the revision the client believed the document was at
// when it generated the op. If the server has moved on since then, the
// op is transformed against every op committed in between before being
// applied — this is the actual conflict-resolution step.
//
// Returns one of:
//   { ok: true, ops: [...], revision }      — applied (possibly transformed)
//   { ok: false, reason: 'stale', content, revision } — client fell too far
//   behind for an incremental catch-up (its base revision is older than
//   anything left in the retained log); caller should force a full resync
//   rather than risk transforming against an incomplete history.
//   { ok: false, reason: 'locked' } — document is read-only right now.
function applyClientOp(docId, room, { baseRevision, op }) {
  if (room.locked) {
    return { ok: false, reason: 'locked' };
  }

  const behindCount = room.revision - baseRevision;

  if (behindCount < 0 || behindCount > room.opLog.length) {
    return { ok: false, reason: 'stale', content: room.content, revision: room.revision };
  }

  const opsSinceBase = behindCount === 0 ? [] : room.opLog.slice(-behindCount).map((e) => e.op);
  const transformed = transformAgainstMany(op, opsSinceBase);

  room.content = applyOps(room.content, transformed);
  for (const frag of transformed) {
    room.revision += 1;
    room.opLog.push({ revision: room.revision, op: frag });
  }
  if (room.opLog.length > OP_LOG_LIMIT) {
    room.opLog.splice(0, room.opLog.length - OP_LOG_LIMIT);
  }

  scheduleSave(docId, room);
  return { ok: true, ops: transformed, revision: room.revision };
}

// Used for server-initiated content changes (restoring a history snapshot)
// rather than a client-generated op. Since this always runs against the
// current in-memory state synchronously, there's never anything to
// transform against — we just diff old -> new content and apply/log each
// resulting fragment like a normal op, so it flows through the exact same
// broadcast path every other edit does.
function setContent(docId, room, targetContent) {
  const ops = diffToOps(room.content, targetContent);
  if (ops.length === 0) return { ok: true, ops: [], revision: room.revision };

  const allApplied = [];
  for (const op of ops) {
    const result = applyClientOp(docId, room, { baseRevision: room.revision, op });
    if (!result.ok) return result; // e.g. locked
    allApplied.push(...result.ops);
  }
  return { ok: true, ops: allApplied, revision: room.revision };
}

function setLock(docId, room, locked, byName) {
  room.locked = locked;
  room.lockedBy = locked ? (byName || 'Someone').slice(0, 40) : null;
  room.lockedAt = locked ? new Date() : null;
  // Lock state changes are rare and important enough to persist right away
  // rather than waiting on the debounce used for content edits.
  Document.findByIdAndUpdate(docId, {
    locked: room.locked,
    lockedBy: room.lockedBy,
    lockedAt: room.lockedAt,
  }).catch((err) => console.error(`[documentStore] failed to persist lock state for ${docId}:`, err.message));

  return { locked: room.locked, lockedBy: room.lockedBy, lockedAt: room.lockedAt };
}

function unloadRoom(docId) {
  const room = rooms.get(docId);
  if (!room) return;
  if (room.saveTimer) clearTimeout(room.saveTimer);
  rooms.delete(docId);
}

module.exports = { loadRoom, applyClientOp, setContent, setLock, unloadRoom, rooms };
