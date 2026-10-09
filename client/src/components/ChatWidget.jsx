import { useState, useEffect, useRef } from 'react';
import { api, ApiError } from '../api.js';

// The assistant button is always visible app-wide (so it's discoverable no
// matter what page you're on), but its actions are scoped to whichever
// board you currently have open — the tools it calls (create/move/edit
// ticket) need a specific board to act on. Those actions run through the
// exact same server-side code path as a human dragging a card, so everyone
// else looking at that board sees the change appear live, same as any
// other collaborator's edit.
export function ChatWidget({ boardId, onGoToBoards }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const historyRef = useRef([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    historyRef.current = [];
  }, [boardId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !boardId) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setSending(true);

    try {
      const res = await api.sendChatMessage(boardId, text, historyRef.current);
      historyRef.current = res.history || [];
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply }]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong reaching the assistant.';
      setMessages((prev) => [...prev, { role: 'error', text: message }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <span>Board assistant</span>
            <button className="link-button" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          {!boardId ? (
            <div className="chat-no-board">
              <p>The assistant works inside a board — it can answer questions about tickets and create, move, or
              edit them for you.</p>
              <p>Open a board to start chatting.</p>
              {onGoToBoards && (
                <button
                  onClick={() => {
                    onGoToBoards();
                    setOpen(false);
                  }}
                >
                  Go to Boards
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="chat-messages" ref={scrollRef}>
                {messages.length === 0 && (
                  <div className="chat-empty">
                    Ask me things like "what's in progress?" or "create a ticket to fix the login bug and assign it
                    to Sam."
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`chat-bubble chat-${m.role}`}>
                    {m.text}
                  </div>
                ))}
                {sending && <div className="chat-bubble chat-assistant chat-thinking">Thinking…</div>}
              </div>

              <form className="chat-input-row" onSubmit={handleSend}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask or tell the assistant to do something…"
                  disabled={sending}
                />
                <button type="submit" disabled={sending || !input.trim()}>
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button className={open ? 'chat-fab' : 'chat-fab chat-fab-pulse'} onClick={() => setOpen((v) => !v)}>
        {open ? (
          '✕'
        ) : (
          <>
            <span className="chat-fab-icon">💬</span>
            <span className="chat-fab-label">Ask AI</span>
          </>
        )}
      </button>
    </div>
  );
}
