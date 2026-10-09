import { useState } from 'react';
import { useBoardSocket } from '../hooks/useBoardSocket.js';
import { ConnectionBanner } from './ConnectionBanner.jsx';
import { PresenceBar } from './PresenceBar.jsx';
import { TicketCard } from './TicketCard.jsx';
import { TicketModal } from './TicketModal.jsx';
import { api, ApiError } from '../api.js';

function Column({ column, tickets, onDragStart, onDrop, onOpenTicket, onQuickAdd }) {
  const [quickTitle, setQuickTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const columnTickets = tickets.filter((t) => t.columnId === column.id).sort((a, b) => a.order - b.order);

  async function handleQuickAdd(e) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    setAdding(true);
    await onQuickAdd(column.id, title);
    setQuickTitle('');
    setAdding(false);
  }

  return (
    <div
      className="board-column"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const movedId = e.dataTransfer.getData('text/plain');
        onDrop(movedId, column.id, null);
      }}
    >
      <div className="board-column-header">
        <span>{column.name}</span>
        <span className="badge">{columnTickets.length}</span>
      </div>

      <div className="board-column-tickets">
        {columnTickets.map((ticket) => (
          <TicketCard
            key={ticket._id}
            ticket={ticket}
            onDragStart={onDragStart}
            onDropBefore={(movedId, beforeId) => onDrop(movedId, column.id, beforeId)}
            onOpen={onOpenTicket}
          />
        ))}
      </div>

      <form className="quick-add-form" onSubmit={handleQuickAdd}>
        <input
          placeholder="+ Create"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          disabled={adding}
        />
      </form>
    </div>
  );
}

export function BoardView({ boardId, title, displayName, onBack, onDeleted, onRenamed }) {
  const { board, tickets, status, users, errorMessage, createTicket, updateTicket, moveTicket, deleteTicket } =
    useBoardSocket(boardId, displayName, { onDeleted });

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [activeTicket, setActiveTicket] = useState(null);
  const [renameError, setRenameError] = useState(null);

  async function commitTitle() {
    const trimmed = titleDraft.trim();
    setEditingTitle(false);
    if (!trimmed || trimmed === title) {
      setTitleDraft(title);
      return;
    }
    try {
      await api.renameBoard(boardId, trimmed);
      onRenamed && onRenamed(trimmed);
    } catch (err) {
      setTitleDraft(title);
      setRenameError(err instanceof ApiError ? err.message : 'Could not rename board.');
    }
  }

  function handleDragStart() {
    // reserved for future drag-affordance styling
  }

  async function handleDrop(movedId, columnId, beforeId) {
    const columnTickets = tickets.filter((t) => t.columnId === columnId && t._id !== movedId).sort((a, b) => a.order - b.order);
    let orderedIds = columnTickets.map((t) => t._id);
    if (beforeId) {
      const idx = orderedIds.indexOf(beforeId);
      orderedIds.splice(idx === -1 ? orderedIds.length : idx, 0, movedId);
    } else {
      orderedIds.push(movedId);
    }
    await moveTicket(movedId, columnId, orderedIds);
  }

  async function handleQuickAdd(columnId, ticketTitle) {
    await createTicket({ title: ticketTitle, columnId });
  }

  if (status === 'error') {
    return (
      <div className="editor-page">
        <div className="error-banner">
          <p>{errorMessage}</p>
          <button onClick={onBack}>Back to boards</button>
        </div>
      </div>
    );
  }

  return (
    <div className="board-page">
      <div className="editor-toolbar">
        <button className="link-button" onClick={onBack}>
          ← All boards
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
      </div>

      <ConnectionBanner status={status === 'resyncing' ? 'resyncing' : status === 'offline' ? 'offline' : 'online'} pendingCount={0} />

      {renameError && (
        <div className="error-banner">
          <p>{renameError}</p>
          <button onClick={() => setRenameError(null)}>Dismiss</button>
        </div>
      )}

      {board && (
        <div className="board-columns">
          {[...board.columns]
            .sort((a, b) => a.order - b.order)
            .map((column) => (
              <Column
                key={column.id}
                column={column}
                tickets={tickets}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onOpenTicket={setActiveTicket}
                onQuickAdd={handleQuickAdd}
              />
            ))}
        </div>
      )}

      {activeTicket && (
        <TicketModal
          ticket={activeTicket}
          onSave={(fields) => updateTicket(activeTicket._id, fields)}
          onDelete={() => deleteTicket(activeTicket._id)}
          onClose={() => setActiveTicket(null)}
        />
      )}
    </div>
  );
}
