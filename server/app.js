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

mongoose.set('strictQuery', false); // ✅ Fixes the warning

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB Error:', err.message);
});

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Static file serving for frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// ✅ API Routes
app.use('/api/admin', adminRt);
app.use('/api', studRt);

// ✅ Default root route (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ✅ RTMP monitor events
monitor.on('start', async key => {
  try {
    await Session.findOneAndUpdate({ rtmpKey: key }, { isLive: true });
    recorder.start(key);
    io.emit('session-updated', { rtmpKey: key, isLive: true });
    console.log(`🎥 Stream started: ${key}`);
  } catch (err) {
    console.error('Error starting session:', err.message);
  }
});

monitor.on('stop', async key => {
  try {
    await Session.findOneAndUpdate({ rtmpKey: key }, { isLive: false });
    recorder.stop(key);
    io.emit('session-updated', { rtmpKey: key, isLive: false });
    console.log(`🛑 Stream stopped: ${key}`);
  } catch (err) {
    console.error('Error stopping session:', err.message);
  }
});

// ✅ Server listen
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
