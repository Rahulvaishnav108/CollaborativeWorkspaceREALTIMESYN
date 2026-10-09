// Thin REST wrapper with timeouts + typed errors, so callers can show a
// real "retry" UI instead of a stack trace when the server or DB is down.
const BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 8000);

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Check that it is running and try again.', 0);
    }
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  } finally {
    clearTimeout(timeout);
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // no/invalid JSON body — fall through with body === null
  }

  if (!response.ok) {
    throw new ApiError((body && body.error) || `Request failed (${response.status})`, response.status);
  }
  return body;
}

export const api = {
  listDocuments: () => request('/api/documents'),
  createDocument: (title) => request('/api/documents', { method: 'POST', body: JSON.stringify({ title }) }),
  getDocument: (id) => request(`/api/documents/${id}`),
  renameDocument: (id, title) => request(`/api/documents/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  deleteDocument: (id) => request(`/api/documents/${id}`, { method: 'DELETE' }),

  listBoards: () => request('/api/boards'),
  createBoard: (title) => request('/api/boards', { method: 'POST', body: JSON.stringify({ title }) }),
  getBoard: (id) => request(`/api/boards/${id}`),
  renameBoard: (id, title) => request(`/api/boards/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  updateBoardColumns: (id, columns) => request(`/api/boards/${id}`, { method: 'PATCH', body: JSON.stringify({ columns }) }),
  deleteBoard: (id) => request(`/api/boards/${id}`, { method: 'DELETE' }),

  sendChatMessage: (boardId, message, history) =>
    request(`/api/boards/${boardId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, history }),
      timeoutMs: 30000,
    }),
};

export { ApiError };
