const EventEmitter = require('events');
const fetch = require('node-fetch');
const xml2js = require('xml2js');

class Monitor extends EventEmitter {
  constructor() {
    super();
    this.prev = {}; // Tracks live sessions by stream key
    setInterval(() => this.check(), 3000); // Poll every 3s
  }

  async check() {
    try {
      const res = await fetch(process.env.RTMP_STATS_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const xml = await res.text();
      const parsed = await xml2js.parseStringPromise(xml, { explicitArray: true });

      const apps = parsed?.rtmp?.server?.[0]?.application || [];
      const liveApp = apps.find(app => app.name?.[0] === 'live');

      const streams = liveApp?.live?.[0]?.stream || [];
      const activeKeys = streams.map(s => s.name?.[0]).filter(Boolean);

      // 🟢 Stream started
      activeKeys.forEach(name => {
        if (!this.prev[name]) {
          this.emit('start', name);
        }
        this.prev[name] = true;
      });

      // 🔴 Stream stopped
      Object.keys(this.prev).forEach(name => {
        if (!activeKeys.includes(name)) {
          this.emit('stop', name);
          delete this.prev[name];
        }
      });

    } catch (err) {
      console.error('[RTMP Monitor Error]', err.message);
    }
  }
}

module.exports = new Monitor();
