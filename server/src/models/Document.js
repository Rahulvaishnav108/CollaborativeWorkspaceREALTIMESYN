const mongoose = require('mongoose');

const historyEntrySchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    revision: { type: Number, required: true },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, default: 'Untitled document' },
    content: { type: String, default: '' },
    // Monotonically increasing count of ops applied to this document.
    // Clients use this to know whether they're caught up, and the server
    // uses it to decide whether an incoming op needs transforming.
    revision: { type: Number, default: 0 },
    // Whole-document read-only toggle. Deliberately simple (no per-user
    // ownership) since there's no auth system: anyone can lock to "freeze"
    // a document, and anyone can unlock it again.
    locked: { type: Boolean, default: false },
    lockedBy: { type: String, default: null },
    lockedAt: { type: Date, default: null },
    // Periodic snapshots so past versions can be browsed/restored. Capped
    // in documentStore.js — this isn't a full audit log, just enough
    // history to recover from "I didn't mean to change that."
    history: { type: [historyEntrySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
