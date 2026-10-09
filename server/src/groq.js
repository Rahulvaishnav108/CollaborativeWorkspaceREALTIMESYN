// groq.js — the board's chat assistant, backed by Groq's OpenAI-compatible
// API (https://api.groq.com/openai/v1), running Qwen 3.6 27B.
//
// Unlike Gemini's Interactions API (which tracked conversation state
// server-side via an id), this is a plain stateless chat-completions
// endpoint: every request carries the full message history, and the
// caller (this module's caller, in routes/chat.js) is responsible for
// persisting and resending it. We hand that history back to the client as
// an opaque blob to store and resend next turn — it never needs to
// interpret it, just round-trip it.
//
// The important design choice carried over from the Gemini version: every
// tool the model can call goes through the exact same boardStore functions
// — and the exact same socket broadcast — as a real user action. From
// every other connected client's point of view, the chatbot editing the
// board is indistinguishable from another collaborator editing it live.
const Board = require('./models/Board');
const boardStore = require('./boardStore');

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.6-27b';
const MAX_TOOL_ROUNDS = 5;

function getApiKey() {
  return process.env.GROQ_API_KEY || null;
}

function buildTools() {
  // OpenAI-style tool declarations: { type: 'function', function: {...} }
  const fn = (name, description, parameters) => ({ type: 'function', function: { name, description, parameters } });

  return [
    fn('list_tickets', 'Lists every ticket on the current board, with its column and assignee.', {
      type: 'object',
      properties: {},
      required: [],
    }),
    fn('get_board_summary', 'Summarizes the board: its columns and how many tickets are in each.', {
      type: 'object',
      properties: {},
      required: [],
    }),
    fn('create_ticket', 'Creates a new ticket on the board.', {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short ticket title' },
        description: { type: 'string', description: 'Optional longer description' },
        column: {
          type: 'string',
          description: 'Name of the column to place it in (e.g. "To do"). Defaults to the first column if omitted or not found.',
        },
        assignee: { type: 'string', description: 'Optional name of the person to assign it to' },
      },
      required: ['title'],
    }),
    fn('move_ticket', 'Moves an existing ticket to a different column.', {
      type: 'object',
      properties: {
        ticket: { type: 'string', description: 'The ticket title (or part of it) identifying which ticket to move' },
        column: { type: 'string', description: 'Name of the destination column' },
      },
      required: ['ticket', 'column'],
    }),
    fn('update_ticket', "Edits an existing ticket's title, description, or assignee.", {
      type: 'object',
      properties: {
        ticket: { type: 'string', description: 'The current ticket title (or part of it) identifying which ticket to edit' },
        title: { type: 'string', description: 'New title, if changing it' },
        description: { type: 'string', description: 'New description, if changing it' },
        assignee: { type: 'string', description: 'New assignee, if changing it' },
      },
      required: ['ticket'],
    }),
    fn('delete_ticket', 'Deletes a ticket from the board permanently.', {
      type: 'object',
      properties: {
        ticket: { type: 'string', description: 'The ticket title (or part of it) identifying which ticket to delete' },
      },
      required: ['ticket'],
    }),
  ];
}

function findColumnIdByName(board, nameQuery) {
  if (!nameQuery) return null;
  const q = String(nameQuery).trim().toLowerCase();
  const exact = board.columns.find((c) => c.name.toLowerCase() === q);
  if (exact) return exact.id;
  const partial = board.columns.find((c) => c.name.toLowerCase().includes(q));
  return partial ? partial.id : null;
}

async function executeTool(name, args, ctx) {
  const { boardId, board, io } = ctx;
  const columnNameById = Object.fromEntries(board.columns.map((c) => [c.id, c.name]));

  function broadcast(payload) {
    if (io) io.to(`board:${boardId}`).emit('board-update', payload);
  }

  switch (name) {
    case 'list_tickets': {
      const { tickets } = await boardStore.getBoardSnapshot(boardId);
      return {
        tickets: tickets.map((t) => ({
          id: String(t._id),
          title: t.title,
          column: columnNameById[t.columnId] || t.columnId,
          assignee: t.assignee,
        })),
      };
    }

    case 'get_board_summary': {
      const { tickets } = await boardStore.getBoardSnapshot(boardId);
      const counts = {};
      for (const t of tickets) {
        const cname = columnNameById[t.columnId] || t.columnId;
        counts[cname] = (counts[cname] || 0) + 1;
      }
      return { title: board.title, columns: board.columns.map((c) => c.name), ticketCounts: counts, totalTickets: tickets.length };
    }

    case 'create_ticket': {
      const columnId = findColumnIdByName(board, args.column) || board.columns[0].id;
      const result = await boardStore.createTicket(boardId, {
        title: args.title,
        description: args.description,
        columnId,
        assignee: args.assignee,
      });
      if (!result.ok) return { success: false, error: result.error };
      broadcast({ type: 'ticket-created', ticket: result.ticket, revision: result.revision });
      return { success: true, ticket: { id: String(result.ticket._id), title: result.ticket.title } };
    }

    case 'move_ticket': {
      const resolved = await boardStore.resolveTicket(boardId, { titleQuery: args.ticket });
      if (!resolved.ok) return { success: false, error: resolved.error, matches: resolved.matches };
      const columnId = findColumnIdByName(board, args.column);
      if (!columnId) {
        return { success: false, error: `No column named "${args.column}". Available columns: ${board.columns.map((c) => c.name).join(', ')}` };
      }
      const result = await boardStore.moveTicket(boardId, {
        ticketId: resolved.ticket._id,
        toColumnId: columnId,
        orderedIds: [String(resolved.ticket._id)],
      });
      if (!result.ok) return { success: false, error: result.error };
      broadcast({ type: 'tickets-reordered', columnId: result.columnId, tickets: result.tickets, revision: result.revision });
      return { success: true };
    }

    case 'update_ticket': {
      const resolved = await boardStore.resolveTicket(boardId, { titleQuery: args.ticket });
      if (!resolved.ok) return { success: false, error: resolved.error, matches: resolved.matches };
      const result = await boardStore.updateTicket(resolved.ticket._id, {
        title: args.title,
        description: args.description,
        assignee: args.assignee,
      });
      if (!result.ok) return { success: false, error: result.error };
      broadcast({ type: 'ticket-updated', ticket: result.ticket, revision: result.revision });
      return { success: true };
    }

    case 'delete_ticket': {
      const resolved = await boardStore.resolveTicket(boardId, { titleQuery: args.ticket });
      if (!resolved.ok) return { success: false, error: resolved.error, matches: resolved.matches };
      const result = await boardStore.deleteTicket(resolved.ticket._id);
      if (!result.ok) return { success: false, error: result.error };
      broadcast({ type: 'ticket-deleted', ticketId: result.ticketId, revision: result.revision });
      return { success: true };
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

async function callGroq(messages, tools) {
  const apiKey = getApiKey();
  let res;
  try {
    res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL, messages, tools, tool_choice: 'auto' }),
    });
  } catch (err) {
    throw new Error(`Could not reach Groq: ${err.message}`);
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    // fall through with body === null
  }

  if (!res.ok) {
    const message = (body && body.error && body.error.message) || `Groq API error (HTTP ${res.status})`;
    console.error('[groq] API error response:', JSON.stringify(body));
    throw new Error(message);
  }
  return body;
}

// Runs one user turn to completion, resolving as many chained tool calls
// as the model requests (capped, so a confused model can't loop forever)
// before returning its final natural-language reply, plus the updated
// message history for the caller to persist and resend next turn.
async function runBoardChat({ boardId, message, history, io }) {
  if (!getApiKey()) {
    return { error: 'The chatbot is not configured yet — add GROQ_API_KEY to server/.env and restart the server.' };
  }

  const board = await Board.findById(boardId);
  if (!board) return { error: 'Board not found' };

  const tools = buildTools();
  const ctx = { boardId, board, io };

  const systemMessage = {
    role: 'system',
    content: `You are an assistant embedded in a kanban board called "${board.title}". You can answer questions about its tickets and take actions on it using the provided tools. Be concise and conversational.`,
  };

  const messages = [systemMessage, ...(Array.isArray(history) ? history : []), { role: 'user', content: message }];

  let response;
  try {
    response = await callGroq(messages, tools);
  } catch (err) {
    console.error('[groq] initial call failed:', err.message);
    return { error: 'The chatbot service is unavailable right now. Please try again shortly.' };
  }

  let assistantMessage = response.choices[0].message;
  messages.push(assistantMessage);

  let guard = 0;
  while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && guard < MAX_TOOL_ROUNDS) {
    guard += 1;

    for (const call of assistantMessage.tool_calls) {
      let result;
      try {
        const args = JSON.parse(call.function.arguments || '{}');
        result = await executeTool(call.function.name, args, ctx);
      } catch (err) {
        console.error(`[groq] tool "${call.function.name}" failed:`, err.message);
        result = { success: false, error: 'Tool execution failed unexpectedly' };
      }
      messages.push({ role: 'tool', tool_call_id: call.id, name: call.function.name, content: JSON.stringify(result) });
    }

    try {
      response = await callGroq(messages, tools);
    } catch (err) {
      console.error('[groq] follow-up call failed:', err.message);
      return { error: 'The chatbot service is unavailable right now. Please try again shortly.' };
    }
    assistantMessage = response.choices[0].message;
    messages.push(assistantMessage);
  }

  // Drop the system message before handing history back — it's rebuilt
  // fresh (with the current board title) at the start of every turn.
  const persistedHistory = messages.slice(1);

  return { reply: assistantMessage.content || "I'm not sure how to answer that.", history: persistedHistory };
}

module.exports = { runBoardChat };
