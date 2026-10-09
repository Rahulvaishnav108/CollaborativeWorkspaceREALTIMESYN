import { useState } from 'react';
import { useDocumentSocket } from '../hooks/useDocumentSocket.js';
import { ConnectionBanner } from './ConnectionBanner.jsx';
import { PresenceBar } from './PresenceBar.jsx';
import { HistoryPanel } from './HistoryPanel.jsx';
import { api, ApiError } from '../api.js';
import { formatRelativeTime } from '../timeFormat.js';

export function Editor({ docId, title, displayName, onBack, onDeleted, onRenamed }) {
  const {
    content,
    status,
    users,
    pendingCount,
    errorMessage,
    conflict,
    locked,
    lockedBy,
    lockedAt,
    history,
    submitEdit,
    resolveConflict,
    setLocked,
    restoreVersion,
  } = useDocumentSocket(docId, displayName, { onDeleted });

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [showHistory, setShowHistory] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [renameError, setRenameError] = useState(null);

  const disabled = status === 'connecting' || status === 'error' || status === 'conflict' || locked;

  async function commitTitle() {
    const trimmed = titleDraft.trim();
    setEditingTitle(false);
    if (!trimmed || trimmed === title) {
      setTitleDraft(title);
      return;
    }
    try {
      await api.renameDocument(docId, trimmed);
      onRenamed && onRenamed(trimmed);
      setRenameError(null);
    } catch (err) {
      setTitleDraft(title);
      setRenameError(err instanceof ApiError ? err.message : 'Could not rename document.');
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.deleteDocument(docId);
      onBack();
    } catch (err) {
      setRenameError(err instanceof ApiError ? err.message : 'Could not delete document.');
    }
  }

  function copyShareLink() {
    const url = `${window.location.origin}${window.location.pathname}#/doc/${docId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch(() => setRenameError('Could not copy link — copy it from the address bar instead.'));
  }

  return (
    <div className="editor-page">
      <div className="editor-toolbar">
        <button className="link-button" onClick={onBack}>
          ← All documents
        </button>

        {editingTitle ? (
          <input
            className="title-input"
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.target.blur();
              if (e.key === 'Escape') {
                setTitleDraft(title);
                setEditingTitle(false);
              }
            }}
          />
        ) : (
          <h2 className="editable-title" onClick={() => setEditingTitle(true)} title="Click to rename">
            {title}
          </h2>
        )}

        <PresenceBar users={users} />

        <div className="toolbar-actions">
          <button className="icon-button" onClick={() => setShowHistory((v) => !v)}>
            History{history.length > 0 ? ` (${history.length})` : ''}
          </button>
          <button className="icon-button" onClick={copyShareLink}>
            {linkCopied ? 'Link copied!' : 'Share link'}
          </button>
          {locked ? (
            <button className="icon-button" onClick={() => setLocked(false)}>
              Unlock
            </button>
          ) : (
            <button className="icon-button" onClick={() => setLocked(true)}>
              Lock
            </button>
          )}
          <button className="icon-button danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <ConnectionBanner status={status} pendingCount={pendingCount} />

      {locked && (
        <div className="lock-banner">
          🔒 Locked by {lockedBy} {lockedAt ? formatRelativeTime(lockedAt) : ''} — read-only until unlocked.
        </div>
      )}

      {renameError && (
        <div className="error-banner">
          <p>{renameError}</p>
          <button onClick={() => setRenameError(null)}>Dismiss</button>
        </div>
      )}

      {status === 'error' && (
        <div className="error-banner">
          <p>{errorMessage}</p>
          <button onClick={onBack}>Back to documents</button>
        </div>
      )}

      {conflict && (
        <div className="conflict-banner">
          <p>
            This document changed on the server while you were disconnected, and it changed too much for your
            offline edits to be merged automatically.
          </p>
          <div className="conflict-actions">
            <button onClick={() => resolveConflict('discard-local')}>Discard my offline edits &amp; load latest</button>
            <button onClick={() => resolveConflict('keep-local')}>Keep my local text (stay offline, copy it out manually)</button>
          </div>
        </div>
      )}

      <div className="editor-body">
        <textarea
          className="editor-textarea"
          value={content}
          disabled={disabled}
          onChange={(e) => submitEdit(e.target.value)}
          placeholder={disabled ? '' : 'Start typing…'}
          spellCheck={false}
        />
        {showHistory && (
          <HistoryPanel history={history} onRestore={restoreVersion} onClose={() => setShowHistory(false)} />
        )}
      </div>
    </div>
  );
}
