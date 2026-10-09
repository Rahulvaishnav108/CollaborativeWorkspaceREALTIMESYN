import { useState } from 'react';

export function TicketModal({ ticket, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description || '');
  const [assignee, setAssignee] = useState(ticket.assignee || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }
    setSaving(true);
    const res = await onSave({ title: title.trim(), description, assignee: assignee.trim() || null });
    setSaving(false);
    if (res && res.ok === false) {
      setError(res.error || 'Could not save changes');
      return;
    }
    onClose();
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${ticket.title}"?`)) return;
    setSaving(true);
    const res = await onDelete();
    setSaving(false);
    if (res && res.ok === false) {
      setError(res.error || 'Could not delete ticket');
      return;
    }
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Edit ticket</h3>
        {error && <div className="document-card-error" style={{ marginBottom: 8 }}>{error}</div>}
        <label className="modal-field">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>
        <label className="modal-field">
          Description
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="modal-field">
          Assignee
          <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Unassigned" />
        </label>
        <div className="modal-actions">
          <button className="danger" onClick={handleDelete} disabled={saving}>
            Delete
          </button>
          <div style={{ flex: 1 }} />
          <button className="icon-button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
