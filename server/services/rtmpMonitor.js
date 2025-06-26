const EventEmitter = require('events');
const fetch        = require('node-fetch');
const xml2js       = require('xml2js');

class Monitor extends EventEmitter {
  constructor() {
    super();
    this.prev = {}; // Tracks which streams are currently live
    this.url  = process.env.RTMP_STATS_URL;
    console.log(`🔍 RTMP Monitor will poll: ${this.url}`);
    setInterval(() => this.check(), 3000); // Poll every 3 seconds
  }

  async check() {
    try {
      const res = await fetch(this.url, { timeout: 5000 });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const text = await res.text();

      // If we get HTML instead of XML, skip parsing
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.warn('[RTMP Monitor] Skipping HTML response');
        return;
      }

      const parsed = await xml2js.parseStringPromise(text, { explicitArray: true });
      const apps   = parsed?.rtmp?.server?.[0]?.application || [];
      const liveApp = apps.find(app => app.name?.[0] === 'live');

      if (!liveApp) {
        console.warn('[RTMP Monitor] No "live" application found in stats');
        return;
      }

      // Extract all currently streaming keys
      const streams    = liveApp.live?.[0]?.stream || [];
      const activeKeys = streams.map(s => s.name?.[0]).filter(Boolean);

      // Emit 'start' for any new streams
      activeKeys.forEach(key => {
        if (!this.prev[key]) {
          console.log(`🟢 Detected stream start: ${key}`);
          this.emit('start', key);
        }
        this.prev[key] = true;
      });

      // Emit 'stop' for any streams no longer present
      Object.keys(this.prev).forEach(key => {
        if (!activeKeys.includes(key)) {
          console.log(`🔴 Detected stream stop: ${key}`);
          this.emit('stop', key);
          delete this.prev[key];
        }
      });

    } catch (err) {
      console.error('[RTMP Monitor Error]', err.message);
    }
  }
}

module.exports = new Monitor();
