const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    // Branch classification:
    //  - core      : permanent main branches (HQ, Alexandria, Mansoura, ...)
    //  - extension : partner/extension centers that rotate per round
    type: {
      type: String,
      enum: ["core", "extension"],
      default: "core",
    },
    logo: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;
