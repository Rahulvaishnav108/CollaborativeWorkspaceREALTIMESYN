// socket.js — real-time transport layer. Every handler is wrapped so a bad
// payload or a DB hiccup turns into a logged error + an error ack to that
// one client, never an uncaught exception that could take the process (and
// every other user's session) down with it.
const { loadRoom, applyClientOp, setContent, setLock } = require('./documentStore');
const boardStore = require('./boardStore');

const COLORS = ['#e63946', '#2a9d8f', '#457b9d', '#f4a261', '#8338ec', '#ff006e', '#3a86ff'];
let colorIndex = 0;
function nextColor() {
  const c = COLORS[colorIndex % COLORS.length];
  colorIndex += 1;
  return c;
}

// docId -> Map(socketId -> { name, color, socketId })
const presence = new Map();
// boardId -> Map(socketId -> { name, color, socketId }) — kept separate
// from document presence since a board room id and a document room id are
// unrelated Mongo ids that happen to share the "room name" namespace.
const boardPresence = new Map();

function broadcastPresence(io, docId) {
  const users = presence.get(docId);
  io.to(docId).emit('presence-update', users ? Array.from(users.values()) : []);
}

function broadcastBoardPresence(io, boardId) {
  const users = boardPresence.get(boardId);
  io.to(`board:${boardId}`).emit('board-presence-update', users ? Array.from(users.values()) : []);
}

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    let currentDocId = null;
    let currentBoardId = null;

    socket.on('join-document', async ({ docId, name } = {}, ack) => {
      try {
        if (!docId) throw new Error('docId is required');
        const room = await loadRoom(docId);
        if (!room) {
          if (typeof ack === 'function') ack({ ok: false, error: 'Document not found' });
          return;
        }

        currentDocId = docId;
        socket.join(docId);

        if (!presence.has(docId)) presence.set(docId, new Map());
        presence.get(docId).set(socket.id, {
          name: (name || 'Anonymous').slice(0, 40),
          color: nextColor(),
          socketId: socket.id,
        });
        broadcastPresence(io, docId);

        if (typeof ack === 'function') {
          ack({
            ok: true,
            content: room.content,
            revision: room.revision,
            locked: room.locked,
            lockedBy: room.lockedBy,
            lockedAt: room.lockedAt,
            history: room.history,
          });
        }
      } catch (err) {
        console.error('[socket] join-document failed:', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'Server error joining document' });
      }
    });

    socket.on('op', async ({ docId, baseRevision, op, opId } = {}, ack) => {
      try {
        if (!docId || !op) throw new Error('docId and op are required');
        const room = await loadRoom(docId);
        if (!room) {
          if (typeof ack === 'function') ack({ ok: false, reason: 'not-found', opId });
          return;
        }

        const result = applyClientOp(docId, room, { baseRevision, op });

        if (!result.ok) {
          if (typeof ack === 'function') {
            ack({ ok: false, reason: result.reason, content: result.content, revision: result.revision, opId });
          }
          return;
        }

        if (typeof ack === 'function') {
          ack({ ok: true, opId, ops: result.ops, revision: result.revision });
        }
        socket.to(docId).emit('op-broadcast', {
          ops: result.ops,
          revision: result.revision,
          fromSocketId: socket.id,
        });
      } catch (err) {
        console.error('[socket] op handling failed:', err.message);
        if (typeof ack === 'function') ack({ ok: false, reason: 'server-error', opId });
      }
    });

    socket.on('lock-document', async ({ docId, name } = {}, ack) => {
      try {
        if (!docId) throw new Error('docId is required');
        const room = await loadRoom(docId);
        if (!room) {
          if (typeof ack === 'function') ack({ ok: false, error: 'Document not found' });
          return;
        }
        const state = setLock(docId, room, true, name);
        io.to(docId).emit('lock-update', state);
        if (typeof ack === 'function') ack({ ok: true, ...state });
      } catch (err) {
        console.error('[socket] lock-document failed:', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'Could not lock document' });
      }
    });

    socket.on('unlock-document', async ({ docId } = {}, ack) => {
      try {
        if (!docId) throw new Error('docId is required');
        const room = await loadRoom(docId);
        if (!room) {
          if (typeof ack === 'function') ack({ ok: false, error: 'Document not found' });
          return;
        }
        const state = setLock(docId, room, false, null);
        io.to(docId).emit('lock-update', state);
        if (typeof ack === 'function') ack({ ok: true, ...state });
      } catch (err) {
        console.error('[socket] unlock-document failed:', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'Could not unlock document' });
      }
    });

    // Restoring a history snapshot reuses the exact same op-broadcast path
    // as a live edit: we diff the current content against the snapshot and
    // apply/broadcast the resulting ops, so every connected client (including
    // whoever clicked "Restore") updates through the normal OT pipeline
    // instead of a special-cased full-content overwrite.
    socket.on('restore-version', async ({ docId, revision } = {}, ack) => {
      try {
        if (!docId || revision === undefined) throw new Error('docId and revision are required');
        const room = await loadRoom(docId);
        if (!room) {
          if (typeof ack === 'function') ack({ ok: false, error: 'Document not found' });
          return;
        }
        const snapshot = room.history.find((h) => h.revision === revision);
        if (!snapshot) {
          if (typeof ack === 'function') ack({ ok: false, error: 'That version is no longer available' });
          return;
        }

        const result = setContent(docId, room, snapshot.content);
        if (!result.ok) {
          if (typeof ack === 'function') ack({ ok: false, error: result.reason === 'locked' ? 'Document is locked' : 'Could not restore' });
          return;
        }

        io.to(docId).emit('op-broadcast', { ops: result.ops, revision: result.revision, fromSocketId: 'server-restore' });
        if (typeof ack === 'function') ack({ ok: true, revision: result.revision });
      } catch (err) {
        console.error('[socket] restore-version failed:', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'Could not restore that version' });
      }
    });

    socket.on('cursor', ({ docId, position } = {}) => {
      try {
        if (!docId) return;
        const users = presence.get(docId);
        if (users && users.has(socket.id)) {
          users.get(socket.id).cursor = position;
        }
        socket.to(docId).emit('cursor-update', { socketId: socket.id, position });
      } catch (err) {
        console.error('[socket] cursor handling failed:', err.message);
      }
    });

    function leaveCurrentDoc() {
      if (!currentDocId) return;
      const users = presence.get(currentDocId);
      if (users) {
        users.delete(socket.id);
        if (users.size === 0) presence.delete(currentDocId);
      }
      broadcastPresence(io, currentDocId);
      currentDocId = null;
    }

    // ---------------- Board / kanban events ----------------

    socket.on('join-board', async ({ boardId, name } = {}, ack) => {
      try {
        if (!boardId) throw new Error('boardId is required');
        const snapshot = await boardStore.getBoardSnapshot(boardId);
        if (!snapshot) {
          if (typeof ack === 'function') ack({ ok: false, error: 'Board not found' });
          return;
        }

        currentBoardId = boardId;
        socket.join(`board:${boardId}`);

        if (!boardPresence.has(boardId)) boardPresence.set(boardId, new Map());
        boardPresence.get(boardId).set(socket.id, {
          name: (name || 'Anonymous').slice(0, 40),
          color: nextColor(),
          socketId: socket.id,
        });
        broadcastBoardPresence(io, boardId);

        if (typeof ack === 'function') {
          ack({ ok: true, board: snapshot.board, tickets: snapshot.tickets });
        }
      } catch (err) {
        console.error('[socket] join-board failed:', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'Server error joining board' });
      }
    });

    socket.on('ticket-create', async ({ boardId, title, description, columnId, assignee } = {}, ack) => {
      try {
        if (!boardId) throw new Error('boardId is required');
        const result = await boardStore.createTicket(boardId, { title, description, columnId, assignee });
        if (!result.ok) {
          if (typeof ack === 'function') ack(result);
          return;
        }
        io.to(`board:${boardId}`).emit('board-update', { type: 'ticket-created', ticket: result.ticket, revision: result.revision });
        if (typeof ack === 'function') ack({ ok: true, ticket: result.ticket, revision: result.revision });
      } catch (err) {
        console.error('[socket] ticket-create failed:', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'Could not create ticket' });
      }
    });

    socket.on('ticket-update', async ({ boardId, ticketId, ...fields } = {}, ack) => {
      try {
        if (!ticketId) throw new Error('ticketId is required');
        const result = await boardStore.updateTicket(ticketId, fields);
        if (!result.ok) {
          if (typeof ack === 'function') ack(result);
          return;
        }
        io.to(`board:${boardId}`).emit('board-update', { type: 'ticket-updated', ticket: result.ticket, revision: result.revision });
        if (typeof ack === 'function') ack({ ok: true, ticket: result.ticket, revision: result.revision });
      } catch (err) {
        console.error('[socket] ticket-update failed:', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'Could not update ticket' });
      }
    });

    socket.on('ticket-move', async ({ boardId, ticketId, toColumnId, orderedIds } = {}, ack) => {
      try {
        if (!boardId || !ticketId || !toColumnId) throw new Error('boardId, ticketId and toColumnId are required');
        const result = await boardStore.moveTicket(boardId, { ticketId, toColumnId, orderedIds });
        if (!result.ok) {
          if (typeof ack === 'function') ack(result);
          return;
        }
        io.to(`board:${boardId}`).emit('board-update', {
          type: 'tickets-reordered',
          columnId: result.columnId,
          tickets: result.tickets,
          revision: result.revision,
        });
        if (typeof ack === 'function') ack({ ok: true, revision: result.revision });
      } catch (err) {
        console.error('[socket] ticket-move failed:', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'Could not move ticket' });
      }
    });

    socket.on('ticket-delete', async ({ boardId, ticketId } = {}, ack) => {
      try {
        if (!ticketId) throw new Error('ticketId is required');
        const result = await boardStore.deleteTicket(ticketId);
        if (!result.ok) {
          if (typeof ack === 'function') ack(result);
          return;
        }
        io.to(`board:${boardId}`).emit('board-update', { type: 'ticket-deleted', ticketId: result.ticketId, revision: result.revision });
        if (typeof ack === 'function') ack({ ok: true, revision: result.revision });
      } catch (err) {
        console.error('[socket] ticket-delete failed:', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'Could not delete ticket' });
      }
    });

    function leaveCurrentBoard() {
      if (!currentBoardId) return;
      const users = boardPresence.get(currentBoardId);
      if (users) {
        users.delete(socket.id);
        if (users.size === 0) boardPresence.delete(currentBoardId);
      }
      broadcastBoardPresence(io, currentBoardId);
      currentBoardId = null;
    }

    socket.on('leave-board', leaveCurrentBoard);

    socket.on('leave-document', leaveCurrentDoc);
    socket.on('disconnect', () => {
      leaveCurrentDoc();
      leaveCurrentBoard();
    });
    socket.on('error', (err) => {
      console.error('[socket] transport error:', err && err.message);
    });
  });
}

module.exports = { registerSocketHandlers };
