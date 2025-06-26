const { spawn } = require('child_process');
const path      = require('path');
const fs        = require('fs');

const recordings = {};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`🗂️  Created recordings directory: ${dir}`);
  }
}

module.exports = {
  start: (key) => {
    const outDir = process.env.RECORDINGS_PATH;
    ensureDir(outDir);

    const filename = `${key}_${Date.now()}.webm`;
    const out = path.join(outDir, filename);

    const args = [
      '-y', // overwrite if exists
      '-i', `${process.env.RTMP_SERVER_URL}/${key}`,
      '-c:v', 'libvpx-vp9',
      '-b:v', '150k',
      '-cpu-used', '4',
      '-row-mt', '1',
      '-auto-alt-ref', '1',
      '-lag-in-frames', '25',
      '-tile-columns', '4',
      '-c:a', 'libopus',
      '-b:a', '64k',
      out
    ];

    console.log(`🎬 Starting FFmpeg recording for key=${key} → ${out}`);
    const ff = spawn('ffmpeg', args, { stdio: ['pipe','inherit','inherit'] });

    recordings[key] = ff;

    ff.on('exit', (code, signal) => {
      console.log(`🎥 FFmpeg process for ${key} exited with code=${code} signal=${signal}`);
      delete recordings[key];
    });

    ff.on('error', (err) => {
      console.error(`⚠️ FFmpeg error for ${key}:`, err.message);
    });
  },

  stop: (key) => {
    const ff = recordings[key];
    if (!ff) {
      console.warn(`⚠️ No FFmpeg process found for key=${key}`);
      return;
    }
    console.log(`⏹️ Stopping FFmpeg recording for key=${key}`);
    // Sending 'q' to stdin gracefully stops FFmpeg
    ff.stdin.write('q');
  }
};
