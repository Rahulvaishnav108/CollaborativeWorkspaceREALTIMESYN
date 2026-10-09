import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '../api.js';
import { formatRelativeTime } from '../timeFormat.js';

function BoardCard({ board, onOpen, onRenamed, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(board.title);
  const [error, setError] = useState(null);

  async function commitRename() {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed || trimmed === board.title) {
      setDraft(board.title);
      return;
    }
    try {
      await api.renameBoard(board._id, trimmed);
      onRenamed(board._id, trimmed);
    } catch (err) {
      setDraft(board.title);
      setError(err instanceof ApiError ? err.message : 'Rename failed');
    }
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm(`Delete board "${board.title}" and all its tickets? This cannot be undone.`)) return;
    try {
      await api.deleteBoard(board._id);
      onDeleted(board._id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="document-card" onClick={() => !editing && onOpen(board)}>
      <div className="document-card-top">
        {editing ? (
          <input
            className="title-input"
            autoFocus
            value={draft}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.target.blur();
              if (e.key === 'Escape') {
                setDraft(board.title);
                setEditing(false);
              }
            }}
          />
        ) : (
          <span className="document-title">{board.title}</span>
        )}
      </div>
      <div className="document-meta">Updated {formatRelativeTime(board.updatedAt)}</div>
      {error && <div className="document-card-error">{error}</div>}
      <div className="document-card-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDraft(board.title);
            setEditing(true);
          }}
        >
          Rename
        </button>
        <button className="danger" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

export function BoardList({ onOpen }) {
  const [boards, setBoards] = useState(null);
  const [error, setError] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setBoards(null);
    try {
      setBoards(await api.listBoards());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong loading boards.');
      setBoards([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const board = await api.createBoard(newTitle.trim() || 'Untitled board');
      setNewTitle('');
      onOpen(board);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the board.');
    } finally {
      setCreating(false);
    }
  }

  function handleRenamed(id, title) {
    setBoards((prev) => prev && prev.map((b) => (b._id === id ? { ...b, title } : b)));
  }

  function handleDeleted(id) {
    setBoards((prev) => prev && prev.filter((b) => b._id !== id));
  }

  return (
    <div className="document-list-page">
      <h1>Boards</h1>

      <form className="create-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="New board title…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit" disabled={creating}>
          {creating ? 'Creating…' : 'New board'}
        </button>
      </form>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={load}>Retry</button>
        </div>
      )}

      {boards === null && !error && <p>Loading…</p>}
      {boards && boards.length === 0 && !error && <p>No boards yet — create one above.</p>}

      {boards && boards.length > 0 && (
        <div className="document-grid">
          {boards.map((board) => (
            <BoardCard key={board._id} board={board} onOpen={onOpen} onRenamed={handleRenamed} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
