const { spawn } = require('child_process');
const path = require('path');
const recordings = {};

module.exports = {
  start: (key) => {
    const out = path.join(
      process.env.RECORDINGS_PATH,
      `${key}_${Date.now()}.webm`
    );
    const args = [
      '-i', `${process.env.RTMP_SERVER_URL}/${key}`,
      '-c:v','libvpx-vp9','-b:v','150k','-cpu-used','4','-row-mt','1',
      '-auto-alt-ref','1','-lag-in-frames','25','-tile-columns','4',
      '-c:a','libopus','-b:a','64k',
      out
    ];
    const ff = spawn('ffmpeg', args);
    recordings[key] = ff;
  },
  stop: (key) => {
    const ff = recordings[key];
    if (ff) ff.stdin.write('q');
    delete recordings[key];
  }
};
