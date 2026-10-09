export function PresenceBar({ users }) {
  if (!users || users.length === 0) return null;
  return (
    <div className="presence-bar">
      {users.map((u) => (
        <span key={u.socketId} className="presence-chip" style={{ backgroundColor: u.color }} title={u.name}>
          {u.name.slice(0, 1).toUpperCase()}
        </span>
      ))}
    </div>
  );
}
