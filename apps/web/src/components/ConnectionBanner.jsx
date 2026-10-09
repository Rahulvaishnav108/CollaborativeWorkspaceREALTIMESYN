const LABELS = {
  connecting: { text: 'Connecting…', tone: 'neutral' },
  online: { text: 'Live', tone: 'good' },
  offline: { text: 'Offline — edits are saved locally and will sync when you reconnect', tone: 'warn' },
  resyncing: { text: 'Reconnected — syncing…', tone: 'neutral' },
  conflict: { text: 'Sync conflict — action needed', tone: 'bad' },
  error: { text: 'Could not connect to the document', tone: 'bad' },
};

export function ConnectionBanner({ status, pendingCount }) {
  const info = LABELS[status] || LABELS.connecting;
  return (
    <div className={`connection-banner tone-${info.tone}`}>
      <span className={`status-dot dot-${info.tone}`} />
      <span>{info.text}</span>
      {pendingCount > 0 && status !== 'conflict' && (
        <span className="pending-count">{pendingCount} change{pendingCount === 1 ? '' : 's'} not yet confirmed</span>
      )}
    </div>
  );
}
