// const express = require("express");
// const { checkAuth } = require("../middlewares/checkAuth");
// const generatePost = require("../controllers/ai/genPostController");

// const router = express.Router();

// router.post("/generate-post", checkAuth, generatePost);

// module.exports = router;
const express = require("express");
const { checkAuth } = require("../middlewares/checkAuth");
const { getPostsFromDB, createPostFromText, generatePost } = require("../controllers/ai/genPostController");

const router = express.Router();

router.get("/posts-suggestions", checkAuth, getPostsFromDB);
router.post("/create-post", checkAuth, createPostFromText);
router.post("/generate-post", checkAuth, generatePost);

module.exports = router;
