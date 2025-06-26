const express = require('express');
const Session = require('../models/Session');
const router  = express.Router();

// Create a session
router.post('/session', async (req, res) => {
  const s = await Session.create(req.body);
  res.status(201).json(s);
});

// List all sessions
router.get('/sessions', async (req, res) => {
  const list = await Session.find().sort('scheduledAt');
  res.json(list);
});

module.exports = router;
