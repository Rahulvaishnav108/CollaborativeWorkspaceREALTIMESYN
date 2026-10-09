const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, default: 'Untitled board' },
    columns: {
      type: [columnSchema],
      default: () => [
        { id: 'todo', name: 'To do', order: 0 },
        { id: 'in-progress', name: 'In progress', order: 1 },
        { id: 'done', name: 'Done', order: 2 },
      ],
    },
    revision: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Board', boardSchema);
