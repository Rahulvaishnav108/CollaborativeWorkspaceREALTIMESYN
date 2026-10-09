export function TicketCard({ ticket, onDragStart, onDropBefore, onOpen }) {
  return (
    <div
      className="ticket-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', ticket._id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(ticket._id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const movedId = e.dataTransfer.getData('text/plain');
        onDropBefore(movedId, ticket._id);
      }}
      onClick={() => onOpen(ticket)}
    >
      <div className="ticket-title">{ticket.title}</div>
      {ticket.description && <div className="ticket-description">{ticket.description.slice(0, 80)}</div>}
      {ticket.assignee && <span className="ticket-assignee">{ticket.assignee}</span>}
    </div>
  );
}
