import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '../socket.js';
import { diffToOps, applyOps, transformOpsAgainstMany } from '../ot.js';

function makeOpId() {
  return (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Everything this hook needs to do is driven by one idea: the local text on
// screen is allowed to be ahead of the server (that's the "optimistic UI"
// part — the user's own keystrokes always apply immediately, online or
// off), while `revisionRef`/`pendingOpsRef` track what the server has and
// hasn't confirmed yet, so we know what to reconcile when it catches up.
export function useDocumentSocket(docId, displayName, { onDeleted } = {}) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('connecting'); // connecting|online|offline|resyncing|conflict|error
  const [users, setUsers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [conflict, setConflict] = useState(null); // { serverContent, serverRevision } | null
  const [lockState, setLockState] = useState({ locked: false, lockedBy: null, lockedAt: null });
  const [history, setHistory] = useState([]);

  const contentRef = useRef('');
  const revisionRef = useRef(0);
  const pendingOpsRef = useRef([]); // [{ opId, op, baseRevision }] in send order
  const cancelledRef = useRef(false);
  const onDeletedRef = useRef(onDeleted);
  onDeletedRef.current = onDeleted;

  const setContentBoth = useCallback((text) => {
    contentRef.current = text;
    setContent(text);
  }, []);

  const updatePendingCount = useCallback(() => {
    setPendingCount(pendingOpsRef.current.length);
  }, []);

  // Full rejoin — pulls the authoritative copy from the server. Used on
  // initial connect, on reconnect, and as the safety net when an edit gets
  // rejected for a reason the user couldn't have predicted client-side
  // (e.g. someone else locked the document a second before we typed).
  const joinAndSync = useCallback(
    (opts = {}) => {
      setStatus((prev) => (prev === 'conflict' ? prev : 'resyncing'));
      socket.emit('join-document', { docId, name: displayName }, (res) => {
        if (cancelledRef.current) return;
        if (!res || !res.ok) {
          setErrorMessage((res && res.error) || 'Could not join this document.');
          setStatus('error');
          return;
        }

        if (pendingOpsRef.current.length === 0 || opts.force) {
          setContentBoth(res.content);
          revisionRef.current = res.revision;
          if (opts.force) pendingOpsRef.current = [];
        }
        setLockState({ locked: res.locked, lockedBy: res.lockedBy, lockedAt: res.lockedAt });
        setHistory(res.history || []);
        setErrorMessage(null);
        setStatus('online');
        updatePendingCount();
        flushPending();
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docId, displayName]
  );

  function flushPending() {
    for (const entry of pendingOpsRef.current) {
      sendOp(entry);
    }
  }

  function sendOp(entry) {
    if (!socket.connected) return; // stays queued; flushed on next connect
    socket.emit(
      'op',
      { docId, baseRevision: entry.baseRevision, op: entry.op, opId: entry.opId },
      (res) => {
        if (cancelledRef.current || !res) return;

        if (!res.ok) {
          if (res.reason === 'stale') {
            setStatus('conflict');
            setConflict({ serverContent: res.content, serverRevision: res.revision });
          } else if (res.reason === 'locked') {
            pendingOpsRef.current = pendingOpsRef.current.filter((e) => e.opId !== entry.opId);
            updatePendingCount();
            joinAndSync({ force: true }); // discard the disallowed local edit, resync
          }
          return;
        }

        pendingOpsRef.current = pendingOpsRef.current.filter((e) => e.opId !== res.opId);
        updatePendingCount();
        revisionRef.current = Math.max(revisionRef.current, res.revision);
        setStatus((prev) => (prev === 'resyncing' || prev === 'offline' ? 'online' : prev));
      }
    );
  }

  useEffect(() => {
    if (!docId) return undefined;
    cancelledRef.current = false;

    function handleOpBroadcast({ ops, revision }) {
      if (cancelledRef.current || !ops || ops.length === 0) return;
      const pendingOnly = pendingOpsRef.current.map((e) => e.op);
      const adjusted = transformOpsAgainstMany(ops, pendingOnly);
      setContentBoth(applyOps(contentRef.current, adjusted));
      revisionRef.current = Math.max(revisionRef.current, revision);
    }

    function handlePresence(list) {
      if (!cancelledRef.current) setUsers(list);
    }

    function handleLockUpdate(state) {
      if (!cancelledRef.current) setLockState(state);
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
    function handleConnectError() {
      if (!cancelledRef.current) setStatus('offline');
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('op-broadcast', handleOpBroadcast);
    socket.on('presence-update', handlePresence);
    socket.on('lock-update', handleLockUpdate);
    socket.on('document-deleted', handleDeleted);

    if (socket.connected) {
      joinAndSync();
    } else {
      setStatus('offline');
    }

    return () => {
      cancelledRef.current = true;
      socket.emit('leave-document', { docId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('op-broadcast', handleOpBroadcast);
      socket.off('presence-update', handlePresence);
      socket.off('lock-update', handleLockUpdate);
      socket.off('document-deleted', handleDeleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, joinAndSync]);

  const submitEdit = useCallback(
    (newText) => {
      if (status === 'connecting' || status === 'error' || status === 'conflict' || lockState.locked) return;

      const ops = diffToOps(contentRef.current, newText);
      if (ops.length === 0) return;

      setContentBoth(newText); // optimistic: applies to the screen instantly

      for (const op of ops) {
        const entry = { opId: makeOpId(), op, baseRevision: revisionRef.current };
        pendingOpsRef.current.push(entry);
        sendOp(entry);
      }
      updatePendingCount();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docId, status, lockState.locked, setContentBoth, updatePendingCount]
  );

  const resolveConflict = useCallback(
    (choice) => {
      if (!conflict) return;
      if (choice === 'discard-local') {
        pendingOpsRef.current = [];
        updatePendingCount();
        setContentBoth(conflict.serverContent);
        revisionRef.current = conflict.serverRevision;
        setStatus('online');
        setConflict(null);
      } else {
        // 'keep-local' — dismiss the banner, leave local text and the
        // pending queue exactly as they are so the user can copy their
        // work out manually. We deliberately don't attempt an automatic
        // merge here: the server-retained history needed to do that
        // safely is already gone, and guessing would risk silently
        // corrupting either side's edits.
        setStatus('offline');
        setConflict(null);
      }
    },
    [conflict, setContentBoth, updatePendingCount]
  );

  const setLocked = useCallback(
    (locked) => {
      socket.emit(locked ? 'lock-document' : 'unlock-document', { docId, name: displayName }, (res) => {
        if (res && res.ok) setLockState({ locked: res.locked, lockedBy: res.lockedBy, lockedAt: res.lockedAt });
      });
    },
    [docId, displayName]
  );

  const restoreVersion = useCallback(
    (revision) => {
      socket.emit('restore-version', { docId, revision }, () => {
        // The resulting content change arrives through the normal
        // op-broadcast handler (the server broadcasts it to the whole
        // room, including us), so there's nothing else to do here.
      });
    },
    [docId]
  );

  return {
    content,
    status,
    users,
    pendingCount,
    errorMessage,
    conflict,
    locked: lockState.locked,
    lockedBy: lockState.lockedBy,
    lockedAt: lockState.lockedAt,
    history,
    submitEdit,
    resolveConflict,
    setLocked,
    restoreVersion,
  };
}
