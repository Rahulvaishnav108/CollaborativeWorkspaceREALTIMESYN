import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '../socket.js';

// Boards don't need the OT machinery documents use — tickets are
// structured records, not free text, so there's nothing to transform.
// This hook is much simpler than useDocumentSocket: join the room, apply
// whatever the server broadcasts, and let the server be the single source
// of truth for ordering after every move.
export function useBoardSocket(boardId, displayName, { onDeleted } = {}) {
  const [board, setBoard] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState('connecting');
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  const cancelledRef = useRef(false);
  const onDeletedRef = useRef(onDeleted);
  onDeletedRef.current = onDeleted;

  const joinAndSync = useCallback(() => {
    setStatus('resyncing');
    socket.emit('join-board', { boardId, name: displayName }, (res) => {
      if (cancelledRef.current) return;
      if (!res || !res.ok) {
        setErrorMessage((res && res.error) || 'Could not join this board.');
        setStatus('error');
        return;
      }
      setBoard(res.board);
      setTickets(res.tickets);
      setErrorMessage(null);
      setStatus('online');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, displayName]);

  useEffect(() => {
    if (!boardId) return undefined;
    cancelledRef.current = false;

    function handleBoardUpdate(update) {
      if (cancelledRef.current) return;
      if (update.type === 'ticket-created') {
        setTickets((prev) => [...prev, update.ticket]);
      } else if (update.type === 'ticket-updated') {
        setTickets((prev) => prev.map((t) => (t._id === update.ticket._id ? update.ticket : t)));
      } else if (update.type === 'ticket-deleted') {
        setTickets((prev) => prev.filter((t) => t._id !== update.ticketId));
      } else if (update.type === 'tickets-reordered') {
        setTickets((prev) => {
          const batchIds = new Set(update.tickets.map((t) => t._id));
          const rest = prev.filter((t) => !batchIds.has(t._id) && t.columnId !== update.columnId);
          return [...rest, ...update.tickets];
        });
      }
    }

    function handlePresence(list) {
      if (!cancelledRef.current) setUsers(list);
    }

    function handleMetaUpdate(updatedBoard) {
      if (!cancelledRef.current) setBoard(updatedBoard);
    }

    function handleDeleted() {
      if (!cancelledRef.current && onDeletedRef.current) onDeletedRef.current();
    }

    function handleConnect() {
      joinAndSync();
    }
    function handleDisconnect() {
      if (!cancelledRef.current) setStatus('offline');
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleDisconnect);
    socket.on('board-update', handleBoardUpdate);
    socket.on('board-presence-update', handlePresence);
    socket.on('board-meta-update', handleMetaUpdate);
    socket.on('board-deleted', handleDeleted);

    if (socket.connected) {
      joinAndSync();
    } else {
      setStatus('offline');
    }

    return () => {
      cancelledRef.current = true;
      socket.emit('leave-board', { boardId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleDisconnect);
      socket.off('board-update', handleBoardUpdate);
      socket.off('board-presence-update', handlePresence);
      socket.off('board-meta-update', handleMetaUpdate);
      socket.off('board-deleted', handleDeleted);
    };
  }, [boardId, joinAndSync]);

  const createTicket = useCallback(
    (fields) =>
      new Promise((resolve) => {
        socket.emit('ticket-create', { boardId, ...fields }, (res) => resolve(res));
      }),
    [boardId]
  );

  const updateTicket = useCallback(
    (ticketId, fields) =>
      new Promise((resolve) => {
        socket.emit('ticket-update', { boardId, ticketId, ...fields }, (res) => resolve(res));
      }),
    [boardId]
  );

  const moveTicket = useCallback(
    (ticketId, toColumnId, orderedIds) =>
      new Promise((resolve) => {
        socket.emit('ticket-move', { boardId, ticketId, toColumnId, orderedIds }, (res) => resolve(res));
      }),
    [boardId]
  );

  const deleteTicket = useCallback(
    (ticketId) =>
      new Promise((resolve) => {
        socket.emit('ticket-delete', { boardId, ticketId }, (res) => resolve(res));
      }),
    [boardId]
  );

  return { board, tickets, status, users, errorMessage, createTicket, updateTicket, moveTicket, deleteTicket };
}
