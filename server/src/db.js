const dns = require('dns');
const mongoose = require('mongoose');

// Node resolves DNS itself rather than going through the OS resolver, and on
// some home routers/networks that trips up the SRV lookup `mongodb+srv://`
// needs (symptom: `nslookup -type=SRV ...` works fine, but the app still
// throws `querySrv ECONNREFUSED`). Pointing Node's resolver at a public DNS
// server sidesteps that without touching any system network settings.
dns.setServers(['8.8.8.8', '8.8.4.4']);

let connecting = null;

// Wrapped in a function (rather than connecting at import time) so the
// caller (index.js) can decide how to react if it fails — e.g. keep the
// HTTP server up and serve a 503 on DB-dependent routes instead of crashing
// the whole process on boot.
async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connecting) return connecting;

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/realtime_docs';

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected — will retry in background');
  });

  connecting = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  return connecting;
}

module.exports = { connectMongo };
