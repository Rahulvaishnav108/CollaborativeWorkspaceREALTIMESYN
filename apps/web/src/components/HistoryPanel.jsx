import { formatRelativeTime } from '../timeFormat.js';

export function HistoryPanel({ history, onRestore, onClose }) {
  const entries = [...history].reverse(); // most recent first

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>Version history</h3>
        <button className="link-button" onClick={onClose}>
          Close
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="history-empty">
          No earlier snapshots yet — one is captured automatically every so often as you edit.
        </p>
      ) : (
        <ul className="history-list">
          {entries.map((entry) => (
            <li key={entry.revision} className="history-item">
              <div>
                <div className="history-time">{formatRelativeTime(entry.savedAt)}</div>
                <div className="history-preview">{entry.content.slice(0, 60) || '(empty)'}</div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Restore this version? Your current text will be updated to match it.')) {
                    onRestore(entry.revision);
                  }
                }}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
