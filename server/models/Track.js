const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Track name is required'],
    trim: true,
  },
  // Round this track belongs to (null for legacy tracks created before the hierarchy)
  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round',
    default: null,
    index: true,
  },
  // Denormalized branch reference for faster queries
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
    index: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: '',
  },
  // Track category — shared taxonomy for the branches view, track workspace,
  // category filtering, and community specialization alignment.
  // Values must match the categories in scripts/data/itiData.js (ITI_TRACK_CATALOG)
  // and drive the design-system "thread" tokens (cat-*) platform-wide.
  category: {
    type: String,
    enum: [
      'Digital Arts',
      'Information Systems',
      'Infrastructure & Networks',
      'Others',
      'Software Development',
      'Web Development',
    ],
    default: 'Others',
    index: true,
  },
  instructorIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Branch admin responsible for this track
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true
});

// Same track name may exist across branches/rounds (e.g. "Full Stack .NET"),
// so uniqueness is no longer global on name.
trackSchema.index({ name: 1 }, { name: 'track_name_lookup' });
trackSchema.index({ roundId: 1, branchId: 1, name: 1 }, { name: 'track_round_branch_name' });

const Track = mongoose.model('Track', trackSchema);
module.exports = Track;
