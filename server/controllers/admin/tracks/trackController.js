const Track = require("../../../models/Track");
const Round = require("../../../models/Round");
const asyncHandler = require("../../../utils/asyncHandler");

/**
 * POST /admin/rounds/:roundId/tracks
 * Create a track instance for a round
 */
const createTrack = asyncHandler(async (req, res) => {
  const { roundId } = req.params;
  const { name, description } = req.body;

  const round = await Round.findById(roundId);
  if (!round) {
    return res.status(404).json({
      success: false,
      message: "Round not found",
    });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Track name is required",
    });
  }

  // Check uniqueness within round (case-insensitive)
  const existingTrack = await Track.findOne({
    roundId,
    name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
  });

  if (existingTrack) {
    return res.status(409).json({
      success: false,
      message: "Track with this name already exists in this round",
    });
  }

  const track = await Track.create({
    roundId,
    branchId: round.branchId,
    name: name.trim(),
    description: description?.trim() || null,
  });

  res.status(201).json({
    success: true,
    message: "Track created successfully",
    data: track,
  });
});

/**
 * PATCH /admin/tracks/:trackId
 * Update track name and description
 */
const updateTrack = asyncHandler(async (req, res) => {
  const { trackId } = req.params;
  const { name, description } = req.body;

  const track = await Track.findById(trackId);
  if (!track) {
    return res.status(404).json({
      success: false,
      message: "Track not found",
    });
  }

  if (name && name.trim()) {
    // Check uniqueness within round (case-insensitive)
    const duplicate = await Track.findOne({
      _id: { $ne: trackId },
      roundId: track.roundId,
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Another track with this name already exists in this round",
      });
    }

    track.name = name.trim();
  }

  if (description !== undefined) {
    track.description = description?.trim() || null;
  }

  await track.save();

  res.status(200).json({
    success: true,
    message: "Track updated successfully",
    data: track,
  });
});

/**
 * POST /admin/tracks/:trackId/disable
 * Disable a track
 */
const disableTrack = asyncHandler(async (req, res) => {
  const { trackId } = req.params;

  const track = await Track.findById(trackId);
  if (!track) {
    return res.status(404).json({
      success: false,
      message: "Track not found",
    });
  }

  if (track.isDisabled) {
    return res.status(409).json({
      success: false,
      message: "Track is already disabled",
    });
  }

  track.isDisabled = true;
  await track.save();

  res.status(200).json({
    success: true,
    message: "Track disabled successfully",
    data: track,
  });
});

/**
 * GET /admin/tracks?roundId=<id>
 * List all tracks for a round (includes disabled) - admin only
 */
const listRoundTracksAdmin = asyncHandler(async (req, res) => {
  const { roundId } = req.query;

  if (!roundId) {
    return res.status(400).json({
      success: false,
      message: "roundId query parameter is required",
    });
  }

  const round = await Round.findById(roundId);
  if (!round) {
    return res.status(404).json({
      success: false,
      message: "Round not found",
    });
  }

  const tracks = await Track.find({ roundId }).sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: tracks,
  });
});

module.exports = {
  createTrack,
  updateTrack,
  disableTrack,
  listRoundTracksAdmin,
};
