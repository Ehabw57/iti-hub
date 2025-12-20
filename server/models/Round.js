const mongoose = require("mongoose");

const RoundSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required"],
      index: true,
    },
    number: {
      type: Number,
      required: [true, "Round number is required"],
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "upcoming", "active", "ended", "disabled"],
      default: "draft",
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Compound unique index: number unique per branch
RoundSchema.index({ branchId: 1, number: 1 }, { unique: true });

// Index for querying active/upcoming rounds per branch
RoundSchema.index({ branchId: 1, status: 1 });

module.exports = mongoose.model("Round", RoundSchema);
