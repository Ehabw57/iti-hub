const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',   
    required: true
  },
  connected_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',     
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'], 
    default: 'pending'
    
  }
  },
  { timestamps: true }
);

connectionSchema.index(
  { user_id: 1, connected_user_id: 1 }, 
  { unique: true }
);

module.exports = mongoose.model('connection', connectionSchema);
