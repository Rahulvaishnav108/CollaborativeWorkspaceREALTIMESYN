const express = require('express');
const mongoose = require('mongoose');
const Document = require('../models/Document');
const { unloadRoom } = require('../documentStore');

const router = express.Router();

// If Mongo is down, fail fast with a clear 503 instead of hanging the
// request or letting a driver-level exception bubble into a 500 with no
// useful message.
router.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is not connected right now. Please retry shortly.' });
  }
  next();
});

router.get('/', async (req, res) => {
  try {
    const docs = await Document.find({}, 'title updatedAt revision locked lockedBy').sort({ updatedAt: -1 }).limit(100);
    res.json(docs);
  } catch (err) {
    console.error('[routes] list documents failed:', err.message);
    res.status(500).json({ error: 'Failed to load documents' });
  }
});

router.post('/', async (req, res) => {
  try {
    const title = ((req.body && req.body.title) || '').trim() || 'Untitled document';
    const doc = await Document.create({ title, content: '', revision: 0 });
    res.status(201).json(doc);
  } catch (err) {
    console.error('[routes] create document failed:', err.message);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    console.error('[routes] get document failed:', err.message);
    res.status(400).json({ error: 'Invalid document id' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const title = (req.body && req.body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Title cannot be empty' });
    const doc = await Document.findByIdAndUpdate(req.params.id, { title }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    console.error('[routes] rename document failed:', err.message);
    res.status(400).json({ error: 'Invalid document id' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    unloadRoom(req.params.id);
    const io = req.app.get('io');
    if (io) io.to(req.params.id).emit('document-deleted');

    res.status(204).end();
  } catch (err) {
    console.error('[routes] delete document failed:', err.message);
    res.status(400).json({ error: 'Invalid document id' });
  }
});

module.exports = router;
