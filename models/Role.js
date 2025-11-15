const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  permissions: {
    type: [String],
    required: true,
  },
});

model.exports = mongoose.model("Role", roleSchema);
