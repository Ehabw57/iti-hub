const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Round must belong to a branch"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Round name is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// A round name must be unique within its branch
roundSchema.index({ branchId: 1, name: 1 }, { unique: true });

const Round = mongoose.model("Round", roundSchema);

module.exports = Round;