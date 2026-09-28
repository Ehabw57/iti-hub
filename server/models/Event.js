const mongoose = require("mongoose");

/**
 * Event - cross-branch event/hackathon
 */
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
    bannerImage: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    endDate: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    // Participating branches
    branchIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    }],
    registerUrl: {
      type: String,
      default: null,
    },
    // Users who registered through the platform
    registeredIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // User who created the event (admin/instructor)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;