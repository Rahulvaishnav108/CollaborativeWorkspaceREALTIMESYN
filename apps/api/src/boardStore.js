// boardStore.js — unlike documentStore.js, boards don't need an in-memory
// OT engine: tickets are structured records (title/column/assignee), not
// free text, so there's nothing to character-diff or transform. Concurrent
// moves are resolved with a much simpler strategy: the server is always the
// source of truth, every mutation bumps the board's revision counter, and
// the result is broadcast to everyone in the room. Two people dragging the
// same card at once just means "whoever's write landed second wins" — no
// data is lost (the card and its content still exist), only its position
// might visually settle to the second mover's choice, which is an
// acceptable, honest tradeoff for structured board state.
const Board = require('./models/Board');
const Ticket = require('./models/Ticket');

const ORDER_GAP = 1000;

async function bumpRevision(boardId) {
  const board = await Board.findByIdAndUpdate(boardId, { $inc: { revision: 1 } }, { new: true, fields: 'revision' });
  return board ? board.revision : null;
}

async function getBoardSnapshot(boardId) {
  const board = await Board.findById(boardId);
  if (!board) return null;
  const tickets = await Ticket.find({ boardId }).sort({ order: 1 });
  return { board, tickets };
}

async function createTicket(boardId, { title, description, columnId, assignee }) {
  const board = await Board.findById(boardId);
  if (!board) return { ok: false, error: 'Board not found' };

  const targetColumn = board.columns.find((c) => c.id === columnId) || board.columns[0];
  if (!targetColumn) return { ok: false, error: 'Board has no columns' };

  const last = await Ticket.find({ boardId, columnId: targetColumn.id }).sort({ order: -1 }).limit(1);
  const order = last.length ? last[0].order + ORDER_GAP : 0;

  const ticket = await Ticket.create({
    boardId,
    columnId: targetColumn.id,
    title: (title || 'Untitled ticket').slice(0, 200),
    description: (description || '').slice(0, 4000),
    assignee: assignee || null,
    order,
  });
  const revision = await bumpRevision(boardId);
  return { ok: true, ticket, revision };
}

async function updateTicket(ticketId, fields) {
  const allowed = {};
  if (fields.title !== undefined) allowed.title = String(fields.title).slice(0, 200);
  if (fields.description !== undefined) allowed.description = String(fields.description).slice(0, 4000);
  if (fields.assignee !== undefined) allowed.assignee = fields.assignee || null;

  const ticket = await Ticket.findByIdAndUpdate(ticketId, allowed, { new: true });
  if (!ticket) return { ok: false, error: 'Ticket not found' };
  const revision = await bumpRevision(ticket.boardId);
  return { ok: true, ticket, revision };
}

// Moves a ticket into (or within) a column. `orderedIds` is the full,
// final ordering of ticket ids for that column after the drop, including
// the moved ticket — recomputing the whole column's order in one go avoids
// fractional-index math and any float-precision drift over time.
async function moveTicket(boardId, { ticketId, toColumnId, orderedIds }) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) return { ok: false, error: 'Ticket not found' };

  ticket.columnId = toColumnId;
  await ticket.save();

  const ids = Array.isArray(orderedIds) && orderedIds.length ? orderedIds : [ticketId];
  await Promise.all(ids.map((id, index) => Ticket.findByIdAndUpdate(id, { order: index * ORDER_GAP })));

  const revision = await bumpRevision(boardId);
  const tickets = await Ticket.find({ _id: { $in: ids } });
  return { ok: true, tickets, columnId: toColumnId, revision };
}

async function deleteTicket(ticketId) {
  const ticket = await Ticket.findByIdAndDelete(ticketId);
  if (!ticket) return { ok: false, error: 'Ticket not found' };
  const revision = await bumpRevision(ticket.boardId);
  return { ok: true, ticketId, revision };
}

// Used by both the chatbot ("move the login bug to Done") and could be
// reused by a future search box — resolves a ticket by exact id first,
// falling back to a case-insensitive title match within the board so
// callers that only know a human-readable name still work.
async function resolveTicket(boardId, { ticketId, titleQuery }) {
  if (ticketId) {
    const byId = await Ticket.findOne({ _id: ticketId, boardId });
    if (byId) return { ok: true, ticket: byId };
  }
  if (titleQuery) {
    const matches = await Ticket.find({
      boardId,
      title: { $regex: titleQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
    });
    if (matches.length === 1) return { ok: true, ticket: matches[0] };
    if (matches.length > 1) {
      return { ok: false, error: 'Multiple tickets match', matches: matches.map((t) => ({ id: t._id, title: t.title })) };
    }
  }
  return { ok: false, error: 'No matching ticket found' };
}

module.exports = { getBoardSnapshot, createTicket, updateTicket, moveTicket, deleteTicket, resolveTicket, bumpRevision };
