const express = require('express');
const mongoose = require('mongoose');
const { runBoardChat } = require('../groq');

const router = express.Router();

router.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is not connected right now. Please retry shortly.' });
  }
  next();
});

router.post('/:id/chat', async (req, res) => {
  try {
    const message = ((req.body && req.body.message) || '').trim();
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const history = Array.isArray(req.body && req.body.history) ? req.body.history : [];

    const io = req.app.get('io');
    const result = await runBoardChat({ boardId: req.params.id, message, history, io });

    if (result.error) return res.status(502).json({ error: result.error });
    res.json({ reply: result.reply, history: result.history });
  } catch (err) {
    console.error('[routes] chat failed:', err.message);
    res.status(500).json({ error: 'Chat request failed unexpectedly' });
  }
});

module.exports = router;
