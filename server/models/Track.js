const mongoose = require("mongoose");

const TrackSchema = new mongoose.Schema(
  {
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      required: [true, "Round is required"],
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Track name is required"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    isDisabled: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Compound unique index: name unique within round (case-insensitive via collation)
TrackSchema.index(
  { roundId: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// Index for querying enabled tracks in a round
TrackSchema.index({ roundId: 1, isDisabled: 1 });

module.exports = mongoose.model("Track", TrackSchema);
