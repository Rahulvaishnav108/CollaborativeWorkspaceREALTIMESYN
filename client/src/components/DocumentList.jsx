import { useEffect, useState, useCallback, useMemo } from 'react';
import { api, ApiError } from '../api.js';
import { formatRelativeTime } from '../timeFormat.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function DocumentCard({ doc, onOpen, onRenamed, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(doc.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function commitRename() {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed || trimmed === doc.title) {
      setDraft(doc.title);
      return;
    }
    try {
      await api.renameDocument(doc._id, trimmed);
      onRenamed(doc._id, trimmed);
    } catch (err) {
      setDraft(doc.title);
      setError(err instanceof ApiError ? err.message : 'Rename failed');
    }
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteDocument(doc._id);
      onDeleted(doc._id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
      setBusy(false);
    }
  }

  function handleCopyLink(e) {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#/doc/${doc._id}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }

  return (
    <div className={`document-card${busy ? ' busy' : ''}`} onClick={() => !editing && onOpen(doc)}>
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
                setDraft(doc.title);
                setEditing(false);
              }
            }}
          />
        ) : (
          <span className="document-title">{doc.title}</span>
        )}
        {doc.locked && <span className="badge badge-locked">🔒 Locked</span>}
      </div>

      <div className="document-meta">Updated {formatRelativeTime(doc.updatedAt)}</div>
      {error && <div className="document-card-error">{error}</div>}

      <div className="document-card-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDraft(doc.title);
            setEditing(true);
          }}
        >
          Rename
        </button>
        <button onClick={handleCopyLink}>Copy link</button>
        <button className="danger" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

export function DocumentList({ onOpen }) {
  const [docs, setDocs] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'title'

  const load = useCallback(async () => {
    setError(null);
    setDocs(null);
    try {
      const list = await api.listDocuments();
      setDocs(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong loading documents.');
      setDocs([]);
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
      const doc = await api.createDocument(newTitle.trim() || 'Untitled document');
      setNewTitle('');
      onOpen(doc);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the document.');
    } finally {
      setCreating(false);
    }
  }

  function handleRenamed(id, title) {
    setDocs((prev) => prev && prev.map((d) => (d._id === id ? { ...d, title } : d)));
  }

  function handleDeleted(id) {
    setDocs((prev) => prev && prev.filter((d) => d._id !== id));
  }

  const stats = useMemo(() => {
    if (!docs) return { total: 0, recent: 0, locked: 0 };
    const now = Date.now();
    return {
      total: docs.length,
      recent: docs.filter((d) => now - new Date(d.updatedAt).getTime() < DAY_MS).length,
      locked: docs.filter((d) => d.locked).length,
    };
  }, [docs]);

  const visibleDocs = useMemo(() => {
    if (!docs) return [];
    let list = docs;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) => d.title.toLowerCase().includes(q));
    }
    if (sortBy === 'title') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list = [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    return list;
  }, [docs, search, sortBy]);

  return (
    <div className="document-list-page">
      <h1>Documents</h1>

      {docs && docs.length > 0 && (
        <div className="stats-row">
          <div className="stat-card stat-blue">
            <div className="stat-icon">📄</div>
            <div className="stat-body">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total documents</div>
            </div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon">⚡</div>
            <div className="stat-body">
              <div className="stat-value">{stats.recent}</div>
              <div className="stat-label">Edited in last 24h</div>
            </div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-icon">🔒</div>
            <div className="stat-body">
              <div className="stat-value">{stats.locked}</div>
              <div className="stat-label">Locked right now</div>
            </div>
          </div>
        </div>
      )}

      <form className="create-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="New document title…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit" disabled={creating}>
          {creating ? 'Creating…' : 'New document'}
        </button>
      </form>

      {docs && docs.length > 0 && (
        <div className="toolbar-row">
          <input
            className="search-input"
            type="text"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Recently updated</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={load}>Retry</button>
        </div>
      )}

      {docs === null && !error && <p>Loading…</p>}

      {docs && docs.length === 0 && !error && <p>No documents yet — create one above.</p>}

      {docs && docs.length > 0 && visibleDocs.length === 0 && <p>No documents match "{search}".</p>}

      {visibleDocs.length > 0 && (
        <div className="document-grid">
          {visibleDocs.map((doc) => (
            <DocumentCard key={doc._id} doc={doc} onOpen={onOpen} onRenamed={handleRenamed} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
