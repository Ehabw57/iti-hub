const mongoose = require("mongoose");

const TagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
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

// Index for enabled tags lookup
TagSchema.index({ isDisabled: 1, name: 1 });

module.exports = mongoose.model("Tag", TagSchema);
