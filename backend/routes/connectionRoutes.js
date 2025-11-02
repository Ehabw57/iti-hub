const express = require("express");
const router = express.Router();
const { deleteConnection } = require("../controllers/connectionController");

router.delete("/connections/:id", deleteConnection);

module.exports = router;