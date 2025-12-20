const Tag = require("../../../models/Tag");
const asyncHandler = require("../../../utils/asyncHandler");

/**
 * POST /admin/tags
 * Create a new tag
 */
const createTag = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Tag name is required",
    });
  }

  const normalizedName = name.trim().toLowerCase();

  const existingTag = await Tag.findOne({ name: normalizedName });
  if (existingTag) {
    return res.status(409).json({
      success: false,
      message: "Tag with this name already exists",
    });
  }

  const tag = await Tag.create({
    name: normalizedName,
    description: description?.trim() || null,
  });

  res.status(201).json({
    success: true,
    message: "Tag created successfully",
    data: tag,
  });
});

/**
 * PATCH /admin/tags/:tagId
 * Update tag name and description
 */
const updateTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;
  const { name, description } = req.body;

  const tag = await Tag.findById(tagId);
  if (!tag) {
    return res.status(404).json({
      success: false,
      message: "Tag not found",
    });
  }

  if (name && name.trim()) {
    const normalizedName = name.trim().toLowerCase();
    const duplicate = await Tag.findOne({
      _id: { $ne: tagId },
      name: normalizedName,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Another tag with this name already exists",
      });
    }

    tag.name = normalizedName;
  }

  if (description !== undefined) {
    tag.description = description?.trim() || null;
  }

  await tag.save();

  res.status(200).json({
    success: true,
    message: "Tag updated successfully",
    data: tag,
  });
});

/**
 * POST /admin/tags/:tagId/disable
 * Disable a tag (not selectable/readable/assignable in new/updated entities)
 */
const disableTag = asyncHandler(async (req, res) => {
  const { tagId } = req.params;

  const tag = await Tag.findById(tagId);
  if (!tag) {
    return res.status(404).json({
      success: false,
      message: "Tag not found",
    });
  }

  if (tag.isDisabled) {
    return res.status(409).json({
      success: false,
      message: "Tag is already disabled",
    });
  }

  tag.isDisabled = true;
  await tag.save();

  res.status(200).json({
    success: true,
    message: "Tag disabled successfully",
    data: tag,
  });
});

/**
 * GET /admin/tags
 * List all tags (including disabled) for admin
 */
const listTags = asyncHandler(async (req, res) => {
  const tags = await Tag.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: tags,
  });
});

module.exports = {
  createTag,
  updateTag,
  disableTag,
  listTags,
};
