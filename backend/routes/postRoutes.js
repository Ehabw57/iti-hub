const express = require("express");

const{
    getAllPosts,
    getPostById,
    updatePost
} = require("../controllers/postController");

const router = express.Router();

router.get("api/posts",getAllPosts);
router.get("api/posts/:id",getPostById);
router.put("api/posts/:id",updatePost);

module.exports=router;