require('dotenv').config();
const express  = require('express');
const http     = require('http');
const mongoose = require('mongoose');
const cors     = require('cors');
const socketio = require('socket.io');
const adminRt  = require('./routes/admin');
const studRt   = require('./routes/student');
const monitor  = require('./services/rtmpMonitor');
const recorder = require('./services/ffmpegRecorder');
const Session  = require('./models/Session');

mongoose.connect(process.env.MONGO_URI);

const app    = express();
const server = http.createServer(app);
const io     = socketio(server, { path:'/ws' });

app.use(cors());
app.use(express.json());
app.use('/api/admin', adminRt);
app.use('/api', studRt);
app.use(express.static('public'));

monitor.on('start', async key => {
  await Session.findOneAndUpdate({ rtmpKey:key }, { isLive:true });
  recorder.start(key);
  io.emit('session-updated', { rtmpKey:key, isLive:true });
});
monitor.on('stop', async key => {
  await Session.findOneAndUpdate({ rtmpKey:key }, { isLive:false });
  recorder.stop(key);
  io.emit('session-updated', { rtmpKey:key, isLive:false });
});

server.listen(process.env.PORT||3000, () =>
  console.log('App running on port', process.env.PORT||3000)
);
