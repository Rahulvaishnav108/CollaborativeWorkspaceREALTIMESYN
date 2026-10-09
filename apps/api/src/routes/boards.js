const express = require('express');
const mongoose = require('mongoose');
const Board = require('../models/Board');
const Ticket = require('../models/Ticket');
const { getBoardSnapshot } = require('../boardStore');

const router = express.Router();

router.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is not connected right now. Please retry shortly.' });
  }
  next();
});

router.get('/', async (req, res) => {
  try {
    const boards = await Board.find({}, 'title updatedAt revision').sort({ updatedAt: -1 }).limit(100);
    res.json(boards);
  } catch (err) {
    console.error('[routes] list boards failed:', err.message);
    res.status(500).json({ error: 'Failed to load boards' });
  }
});

router.post('/', async (req, res) => {
  try {
    const title = ((req.body && req.body.title) || '').trim() || 'Untitled board';
    const board = await Board.create({ title });
    res.status(201).json(board);
  } catch (err) {
    console.error('[routes] create board failed:', err.message);
    res.status(500).json({ error: 'Failed to create board' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const snapshot = await getBoardSnapshot(req.params.id);
    if (!snapshot) return res.status(404).json({ error: 'Board not found' });
    res.json(snapshot);
  } catch (err) {
    console.error('[routes] get board failed:', err.message);
    res.status(400).json({ error: 'Invalid board id' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body && typeof req.body.title === 'string' && req.body.title.trim()) {
      updates.title = req.body.title.trim();
    }
    if (req.body && Array.isArray(req.body.columns)) {
      updates.columns = req.body.columns.map((c, i) => ({
        id: c.id || `col-${Date.now()}-${i}`,
        name: (c.name || 'Column').slice(0, 60),
        order: i,
      }));
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    const board = await Board.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const io = req.app.get('io');
    if (io) io.to(req.params.id).emit('board-meta-update', board);

    res.json(board);
  } catch (err) {
    console.error('[routes] update board failed:', err.message);
    res.status(400).json({ error: 'Invalid board id' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const board = await Board.findByIdAndDelete(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    await Ticket.deleteMany({ boardId: req.params.id });

    const io = req.app.get('io');
    if (io) io.to(req.params.id).emit('board-deleted');

    res.status(204).end();
  } catch (err) {
    console.error('[routes] delete board failed:', err.message);
    res.status(400).json({ error: 'Invalid board id' });
  }
});

module.exports = router;
