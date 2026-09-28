const mongoose = require("mongoose");

/**
 * CommunityGroup - platform-wide specialization group (cross-branch)
 * Open to students from all branches nationwide.
 */
const communityGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      unique: true,
      trim: true,
      maxlength: 120,
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    coverImage: {
      type: String,
      default: null,
    },
    memberIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // Admin/instructor who created the group
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const CommunityGroup = mongoose.model("CommunityGroup", communityGroupSchema);

module.exports = CommunityGroup;