const express = require('express');
const Session = require('../models/Session');
const router  = express.Router();

// GET upcoming or recently started sessions
router.get('/sessions', async (req, res) => {
  try {
    const now = new Date();
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const list = await Session.find({
      scheduledAt: { $gte: tenMinsAgo }
    }).sort('scheduledAt');

    res.json(list);
  } catch (err) {
    console.error('Error fetching sessions:', err.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET live status of a session by RTMP key
router.get('/session/:key/status', async (req, res) => {
  try {
    const session = await Session.findOne({ rtmpKey: req.params.key });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ isLive: session.isLive });
  } catch (err) {
    console.error('Error checking session status:', err.message);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

module.exports = router;
