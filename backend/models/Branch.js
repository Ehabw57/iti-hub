const mongoose = require("mongoose");
const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, 
    trim: true,   
  },
}, { timestamps: true });


const Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;
