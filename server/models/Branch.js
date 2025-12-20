const mongoose = require("mongoose");

const BranchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Branch name is required"],
      unique: true,
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

// Index for enabled branches lookup
BranchSchema.index({ isDisabled: 1, name: 1 });

module.exports = mongoose.model("Branch", BranchSchema);
