const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    columnId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assignee: { type: String, default: null },
    // Position within its column — lower sorts first. Kept as a plain
    // float-ish integer with gaps (see boardStore.js) so reordering within
    // a column doesn't require rewriting every other card's order.
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
