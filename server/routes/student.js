const express = require('express');
const Session = require('../models/Session');
const router  = express.Router();

// Upcoming or live sessions
router.get('/sessions', async (req, res) => {
  const now = new Date();
  const list = await Session.find({ scheduledAt: { $gte: now }})
    .sort('scheduledAt');
  res.json(list);
});

// Check if a given RTMP key is live
router.get('/session/:key/status', async (req, res) => {
  const s = await Session.findOne({ rtmpKey: req.params.key });
  res.json({ isLive: !!s && s.isLive });
});

module.exports = router;
