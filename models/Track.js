const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Track name is required'],
    unique: true,
    trim: true,
  }
}, {
  timestamps: true 
});

trackSchema.index({ name: 1 }, { unique: true });

const Track = mongoose.model('Track', trackSchema);
module.exports = Track;
