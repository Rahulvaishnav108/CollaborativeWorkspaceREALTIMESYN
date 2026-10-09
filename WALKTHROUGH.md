# Walkthrough: two sample workflows + how to see your data in MongoDB

Two step-by-step scripts you can follow to exercise every widget in the app,
plus a guide to inspecting the raw data MongoDB is storing behind the scenes.

Before starting either sample: make sure the server (`server/npm run dev`)
shows `[server] listening...` and `[mongo] connected`, and the client
(`client/npm run dev`) is running at `http://localhost:5173`. Open two
browser windows side by side (use Chrome/Edge for both — Firefox's privacy
settings blocked the live-sync socket earlier in testing) so you can watch
changes sync live between them.

---

## Sample 1 — Documents (text editor)

Exercises: dashboard stat widgets, search, sort, create, rename, live
co-editing, presence, lock/unlock, version history + restore, share link,
offline/reconnect banner, delete.

1. **Dashboard widgets.** Go to the **Documents** tab. Note the three
   colored stat cards: Total documents, Edited in last 24h, Locked right
   now. These update automatically as you go through the steps below —
   glance back at them periodically.
2. **Create.** Type a title (e.g. "Sprint Notes") into "New document
   title…" and click **New document**. You're dropped straight into the
   editor.
3. **Rename.** Click directly on the document title at the top of the
   editor, change it, then click elsewhere (or press Enter) to save. Go
   back to the dashboard (← All documents) and confirm the new title shows
   on the card.
4. **Search & sort.** Create a second document with a different title.
   Back on the dashboard, type part of one title into "Search documents…"
   and confirm only the matching card shows. Switch the sort dropdown to
   "Title A–Z" and back to "Recently updated."
5. **Live co-editing + presence.** Open the first document, copy its URL
   (or use **Share link** inside the editor once it's added there — see
   step 8), and open that same URL in your second browser window. Type in
   one window; watch the text appear in the other within a moment. Notice
   the colored initial "presence" badge for each open tab next to the
   document title.
6. **Lock / unlock.** In one window, click **Lock**. Confirm the other
   window now shows a read-only banner ("🔒 Locked by ...") and its text box
   is disabled. Click **Unlock** and confirm editing resumes in both.
7. **Version history.** Type a few more sentences (spread across ~15+ small
   edits so a snapshot gets captured — the server snapshots roughly every
   12 revisions). Click **History**, and you should see at least one
   snapshot with a timestamp. Click **Restore** on it and confirm the text
   reverts (in both windows, live).
8. **Share link.** Click **Share link** in the editor toolbar — it copies
   a URL to your clipboard. Paste it into a fresh, third browser tab (or
   send it to someone else on your network) and confirm it opens that
   exact document directly, no need to browse the dashboard first.
9. **Offline behavior (optional but a good demo).** With a document open,
   turn off your wifi (or use your browser devtools to simulate offline).
   Keep typing — notice it still applies to the screen and shows an
   "Offline" banner with a pending-changes count. Turn wifi back on and
   watch it reconcile back to "Live" automatically.
10. **Delete.** Back on the dashboard, click **Delete** on one of your test
    documents and confirm. Watch the "Total documents" widget count drop.

---

## Sample 2 — Boards (kanban) + the AI assistant

Exercises: board creation, quick-add, drag-and-drop, ticket editing,
presence, and every one of the chat assistant's abilities (answering
questions and taking actions).

1. **Create a board.** Go to the **Boards** tab, type a title (e.g. "Launch
   Plan"), click **New board**. You land on a board with three default
   columns: To do, In progress, Done.
2. **Quick-add tickets.** In the "To do" column, use the "+ Create" box to
   add two or three tickets (e.g. "Design landing page", "Write launch
   email", "QA the signup flow").
3. **Edit a ticket.** Click a ticket card to open its editor. Add a
   description and an assignee name, then **Save**. Confirm the card now
   shows the assignee badge.
4. **Drag-and-drop.** Drag one ticket from "To do" into "In progress."
   Drag another to a specific position between two existing cards in the
   same column (not just to the end) to confirm fine-grained reordering
   works.
5. **Live sync + presence.** Copy the board's URL (or click **Share
   link**-equivalent — for boards this is just the address bar URL, since
   `#/board/<id>` is shareable the same way documents are) and open it in a
   second browser window. Drag a card in one window and confirm it moves
   in the other within a moment. Check the presence badges next to the
   board title.
6. **Delete a ticket.** Open a ticket you don't need, click **Delete**,
   confirm.
7. **Rename the board.** Click the board title, change it, confirm it
   saves (check the Boards list to see the new name).
8. **The AI assistant — answering questions.** Click the pink/blue "Ask AI"
   button (bottom right). With the board open, ask:
   - *"What tickets are on this board?"* — it should list them with their
     columns and assignees.
   - *"Give me a summary of this board."* — it should report column names
     and ticket counts per column.
9. **The AI assistant — taking actions.** In the same chat, ask it to act:
   - *"Create a ticket called 'Set up analytics' in the To do column and
     assign it to yourself."* (use a real name) — a new card should appear
     on the board **live**, exactly like you'd created it by hand.
   - *"Move 'Set up analytics' to In progress."* — watch the card jump
     columns on the board itself, live, while you're still chatting.
   - *"Delete the QA ticket."* — confirm it disappears from the board.
   If two tickets have similar titles, ask it to do something ambiguous
   (e.g. two tickets both containing "launch") — it should ask you to
   clarify rather than guessing.

---

## Finding your data in MongoDB

You've already got MongoDB Compass connected to your Atlas cluster. Here's
where everything lives.

1. Open Compass, connect to your `cluster0.u1d50sm...` connection (the one
   you set up earlier).
2. In the left sidebar, look for a database named **`realtime_docs`** (this
   is the name from your `MONGODB_URI` in `server/.env`, after the last
   `/` and before the `?`). If you don't see it yet, click the refresh icon
   next to "Connections" — Mongo only creates the database the first time
   something is actually written to it.
3. Inside `realtime_docs`, you'll find three collections:

   | Collection | What's in it | Key fields |
   |---|---|---|
   | `documents` | One record per text document | `title`, `content` (the live text), `revision`, `locked`, `lockedBy`, `lockedAt`, `history` (array of past snapshots) |
   | `boards` | One record per kanban board | `title`, `columns` (array of `{id, name, order}`), `revision` |
   | `tickets` | One record per card | `boardId` (links to a board's `_id`), `columnId`, `title`, `description`, `assignee`, `order` |

4. Click any collection to browse its documents in Compass's table/JSON
   view. Click a row to expand and see every field, including the full
   `history` array on a document (each entry has its own `content`,
   `revision`, and `savedAt`).
5. **Filtering in Compass:** use the filter bar above the document list.
   Examples:
   - All locked documents: `{ locked: true }`
   - Tickets on a specific board: `{ boardId: ObjectId("PASTE_BOARD_ID_HERE") }`
     (get the board's `_id` by opening the `boards` collection first)
   - A ticket by assignee: `{ assignee: "Sam" }`
6. **If you'd rather use the command line** (`mongosh`, installed
   alongside MongoDB tools, or via Atlas's "Connect via mongosh" option):
   ```
   mongosh "mongodb+srv://<user>:<password>@cluster0.u1d50sm.mongodb.net/realtime_docs"
   db.documents.find().pretty()
   db.boards.find().pretty()
   db.tickets.find({ boardId: ObjectId("...") }).pretty()
   ```
7. A useful sanity check while testing: after creating a document or board
   in the app, refresh the collection in Compass (or re-run `find()` in
   mongosh) — you should see the new record appear within a couple of
   seconds (documents debounce-save ~1.5s after your last keystroke; boards
   and tickets save immediately on each action).
