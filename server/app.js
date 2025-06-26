require('dotenv').config();
const express  = require('express');
const http     = require('http');
const mongoose = require('mongoose');
const cors     = require('cors');
const socketio = require('socket.io');
const path     = require('path');

const adminRt  = require('./routes/admin');
const studRt   = require('./routes/student');
const monitor  = require('./services/rtmpMonitor');
const recorder = require('./services/ffmpegRecorder');
const Session  = require('./models/Session');

const app    = express();
const server = http.createServer(app);
const io     = socketio(server, { path: '/ws' });

// Suppress Mongoose strictQuery deprecation warning
mongoose.set('strictQuery', false);

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
});

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve your frontend from the public folder (one level up from server/)
app.use(express.static(path.resolve(__dirname, '../public')));

// ✅ API routes
app.use('/api/admin', adminRt);
app.use('/api', studRt);

// ✅ Fallback for root to serve index.html if you have one
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// --- RTMP Monitor Events ---
// When a stream goes live on your Replit RTMP server:
monitor.on('start', async key => {
  console.log(`🎥 Detected stream start: ${key}`);
  try {
    await Session.updateOne({ rtmpKey: key }, { isLive: true });
    recorder.start(key);
    io.emit('session-updated', { rtmpKey: key, isLive: true });
  } catch (err) {
    console.error('Error in start handler:', err.message);
  }
});

// When a stream stops on your Replit RTMP server:
monitor.on('stop', async key => {
  console.log(`🛑 Detected stream stop: ${key}`);
  try {
    await Session.updateOne({ rtmpKey: key }, { isLive: false });
    recorder.stop(key);
    io.emit('session-updated', { rtmpKey: key, isLive: false });
  } catch (err) {
    console.error('Error in stop handler:', err.message);
  }
});

// ✅ Start the HTTP + Socket.io server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
  console.log(`🔗 Using RTMP at ${process.env.RTMP_SERVER_URL}`);
  console.log(`🔗 HLS base URL ${process.env.HLS_BASE_URL}`);
  console.log(`🔗 RTMP stats URL ${process.env.RTMP_STATS_URL}`);
});
