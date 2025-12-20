const Track = require("../../models/Track");
const Round = require("../../models/Round");
const asyncHandler = require("../../utils/asyncHandler");

/**
 * GET /tracks?roundId=<id>
 * Public: returns enabled tracks for the given round
 */
const getTracksByRound = asyncHandler(async (req, res) => {
  const { roundId } = req.query;

  if (!roundId) {
    return res.status(400).json({
      success: false,
      message: "roundId query parameter is required",
    });
  }

  // Validate round exists and is not disabled
  const round = await Round.findById(roundId);
  if (!round) {
    return res.status(404).json({
      success: false,
      message: "Round not found",
    });
  }

  if (round.status === "disabled") {
    return res.status(404).json({
      success: false,
      message: "Round not found",
    });
  }

  // Return only enabled tracks
  const tracks = await Track.find({
    roundId,
    isDisabled: false,
  }).sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: tracks,
  });
});

module.exports = {
  getTracksByRound,
};
