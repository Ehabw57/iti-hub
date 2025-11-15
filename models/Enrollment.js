const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",     
    required: true,
  },
  track_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Track",     
    required: true,
  },
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",    
    required: true,
  },
  enrolled_at: {
    type: Date,
    default: Date.now,
  },
});


enrollmentSchema.index(
  { user_id: 1, track_id: 1, branch_id: 1 },
  { unique: true }
);

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

module.exports = Enrollment;
