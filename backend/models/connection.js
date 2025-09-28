const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',     // بيربطه بالـ users collection
    required: true
  },
  connected_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',     // برضه بيربطه بالـ users collection
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'], // القيم المسموح بيها
    default: 'pending'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// هنا بقى اللي مهم
connectionSchema.index(
  { user_id: 1, connected_user_id: 1 }, 
  { unique: true }
);

module.exports = mongoose.model('Connection', connectionSchema);
