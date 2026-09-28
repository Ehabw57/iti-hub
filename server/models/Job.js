const mongoose = require("mongoose");

/**
 * Job - Job board posting (Opportunities page)
 */
const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: 200,
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: 120,
    },
    companyLogo: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
    // Track-relevance tags (e.g. "Full Stack .NET", "AI & ML")
    tags: [{
      type: String,
      trim: true,
    }],
    applyUrl: {
      type: String,
      required: [true, "Apply URL is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // User who posted the job (admin/instructor)
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;