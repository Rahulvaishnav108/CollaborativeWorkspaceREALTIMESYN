require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectMongo } = require('./db');
const documentsRouter = require('./routes/documents');
const boardsRouter = require('./routes/boards');
const chatRouter = require('./routes/chat');
const { registerSocketHandlers } = require('./socket');

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, mongoConnected: require('mongoose').connection.readyState === 1 });
});
app.use('/api/documents', documentsRouter);
app.use('/api/boards', boardsRouter);
app.use('/api/boards', chatRouter); // mounts POST /api/boards/:id/chat

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Catch-all express error handler: an exception thrown (or passed to
// next(err)) anywhere in a route lands here instead of crashing the process.
app.use((err, req, res, next) => {
  console.error('[express] unhandled route error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_ORIGIN } });
registerSocketHandlers(io);
app.set('io', io); // lets REST routes (e.g. delete) notify live socket rooms

connectMongo()
  .then(() => console.log('[mongo] connected'))
  .catch((err) => {
    console.error('[mongo] initial connection failed, will keep retrying in background:', err.message);
  });

server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});

// Defensive process-level nets. The goal here isn't to pretend errors never
// happen — it's to make sure one bad async handler can't silently kill every
// other user's live editing session. In a production deploy you'd still want
// a process manager (pm2/systemd) restarting on uncaughtException as a
// second line of defense, but logging-and-continuing is the right first
// line for a collaborative app where "everyone gets disconnected" is a much
// worse failure mode than "one error got logged."
process.on('unhandledRejection', (reason) => {
  console.error('[process] unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[process] uncaught exception:', err);
});

function shutdown() {
  console.log('[server] shutting down...');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
