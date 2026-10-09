import { useState, useEffect, useCallback } from 'react';
import { DocumentList } from './components/DocumentList.jsx';
import { Editor } from './components/Editor.jsx';
import { BoardList } from './components/BoardList.jsx';
import { BoardView } from './components/BoardView.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { ChatWidget } from './components/ChatWidget.jsx';
import { api, ApiError } from './api.js';

function getStoredName() {
  try {
    return localStorage.getItem('rtde:displayName') || '';
  } catch {
    return '';
  }
}

function parseHash() {
  const h = window.location.hash;
  let m = h.match(/^#\/doc\/([^/?#]+)/);
  if (m) return { type: 'doc', id: m[1] };
  m = h.match(/^#\/board\/([^/?#]+)/);
  if (m) return { type: 'board', id: m[1] };
  if (h === '#/boards') return { type: 'boards-list' };
  return { type: 'documents-list' };
}

export default function App() {
  const [section, setSection] = useState('documents'); // 'documents' | 'boards'
  const [activeDoc, setActiveDoc] = useState(null);
  const [activeBoard, setActiveBoard] = useState(null);
  const [displayName, setDisplayName] = useState(getStoredName());
  const [hashLoadError, setHashLoadError] = useState(null);

  function updateName(value) {
    setDisplayName(value);
    try {
      localStorage.setItem('rtde:displayName', value);
    } catch {
      // localStorage can throw in private-browsing/quota situations — not
      // worth crashing the app over a display name failing to persist.
    }
  }

  const openDoc = useCallback((doc) => {
    setHashLoadError(null);
    setActiveBoard(null);
    setActiveDoc(doc);
    window.location.hash = `#/doc/${doc._id}`;
  }, []);

  const openBoard = useCallback((board) => {
    setHashLoadError(null);
    setActiveDoc(null);
    setActiveBoard(board);
    window.location.hash = `#/board/${board._id}`;
  }, []);

  const goToDocuments = useCallback(() => {
    setSection('documents');
    setActiveDoc(null);
    setActiveBoard(null);
    setHashLoadError(null);
    window.location.hash = '';
  }, []);

  const goToBoards = useCallback(() => {
    setSection('boards');
    setActiveDoc(null);
    setActiveBoard(null);
    setHashLoadError(null);
    window.location.hash = '#/boards';
  }, []);

  // Deep-linking: #/doc/<id> and #/board/<id> both work from a cold load
  // (e.g. someone opening a shared link with nothing else running), and
  // the browser back/forward buttons move between them via hashchange.
  useEffect(() => {
    async function syncFromHash() {
      const parsed = parseHash();

      if (parsed.type === 'doc') {
        setSection('documents');
        setActiveBoard(null);
        setActiveDoc((prev) => (prev && prev._id === parsed.id ? prev : null));
        try {
          const doc = await api.getDocument(parsed.id);
          setActiveDoc(doc);
          setHashLoadError(null);
        } catch (err) {
          setActiveDoc(null);
          setHashLoadError(err instanceof ApiError ? err.message : 'Could not open that document.');
        }
        return;
      }

      if (parsed.type === 'board') {
        setSection('boards');
        setActiveDoc(null);
        setActiveBoard((prev) => (prev && prev._id === parsed.id ? prev : null));
        try {
          const snapshot = await api.getBoard(parsed.id);
          setActiveBoard(snapshot.board);
          setHashLoadError(null);
        } catch (err) {
          setActiveBoard(null);
          setHashLoadError(err instanceof ApiError ? err.message : 'Could not open that board.');
        }
        return;
      }

      if (parsed.type === 'boards-list') {
        setSection('boards');
        setActiveDoc(null);
        setActiveBoard(null);
        return;
      }

      setSection('documents');
      setActiveDoc(null);
      setActiveBoard(null);
    }

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <h1 className="brand">Realtime Workspace</h1>
          <nav className="section-tabs">
            <button className={section === 'documents' ? 'tab active' : 'tab'} onClick={goToDocuments}>
              Documents
            </button>
            <button className={section === 'boards' ? 'tab active' : 'tab'} onClick={goToBoards}>
              Boards
            </button>
          </nav>
        </div>
        <label className="name-field">
          Your name:
          <input
            type="text"
            value={displayName}
            onChange={(e) => updateName(e.target.value)}
            placeholder="Anonymous"
          />
        </label>
      </header>

      {hashLoadError && (
        <div className="error-banner">
          <p>{hashLoadError}</p>
          <button onClick={section === 'boards' ? goToBoards : goToDocuments}>Back to {section}</button>
        </div>
      )}

      <ErrorBoundary key={activeDoc ? `doc-${activeDoc._id}` : activeBoard ? `board-${activeBoard._id}` : section}>
        {activeDoc ? (
          <Editor
            docId={activeDoc._id}
            title={activeDoc.title}
            displayName={displayName}
            onBack={goToDocuments}
            onDeleted={goToDocuments}
            onRenamed={(title) => setActiveDoc((prev) => (prev ? { ...prev, title } : prev))}
          />
        ) : activeBoard ? (
          <BoardView
            boardId={activeBoard._id}
            title={activeBoard.title}
            displayName={displayName}
            onBack={goToBoards}
            onDeleted={goToBoards}
            onRenamed={(title) => setActiveBoard((prev) => (prev ? { ...prev, title } : prev))}
          />
        ) : section === 'boards' ? (
          <BoardList onOpen={openBoard} />
        ) : (
          <DocumentList onOpen={openDoc} />
        )}
      </ErrorBoundary>

      <ChatWidget boardId={activeBoard ? activeBoard._id : null} onGoToBoards={goToBoards} />
    </div>
  );
}
