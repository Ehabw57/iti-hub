const express = require("express");

const{
    getAllPosts,
    getPostById,
    updatePost
} = require("../controllers/postController");

const postRoutes = express.Router();

router.get("/posts",getAllPosts);
router.get("/posts/:id",getPostById);
router.put("/posts/:id",updatePost);

module.exports=postRoutes;