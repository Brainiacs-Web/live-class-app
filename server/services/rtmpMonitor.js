const EventEmitter = require('events');
const fetch = require('node-fetch');
const xml2js = require('xml2js');

class Monitor extends EventEmitter {
  constructor() {
    super();
    this.prev = {};
    setInterval(() => this.check(), 3000);
  }

  async check() {
    try {
      const res = await fetch(process.env.RTMP_STATS_URL);
      const text = await res.text();
      const js = await xml2js.parseStringPromise(text);
      const streams = (js.rtmp.server[0].application[0].live?.[0]?.stream || [])
        .map(s => s.name[0]);

      streams.forEach(name => {
        if (!this.prev[name]) {
          this.emit('start', name);
        }
        this.prev[name] = true;
      });

      Object.keys(this.prev).forEach(name => {
        if (!streams.includes(name)) {
          this.emit('stop', name);
          delete this.prev[name];
        }
      });
    } catch (e) {
      console.error('RTMP Stats Error:', e.message);
    }
  }
}

module.exports = new Monitor();
