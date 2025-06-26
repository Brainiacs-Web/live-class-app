const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  title:       String,
  mentorName:  String,
  rtmpKey:     { type: String, unique: true },
  scheduledAt: Date,
  isLive:      { type: Boolean, default: false },
  recording:   String
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);
