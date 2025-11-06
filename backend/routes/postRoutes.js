const express = require("express");

const{
    getAllPosts,
    getPostById,
    updatePost,
    createPost,
    deletePost,
    toggleLikePost,
    getPostLikes,
} = require("../controllers/postController");

const postRoutes = express.Router();

postRoutes.get("/posts",getAllPosts);
postRoutes.get("/posts/:id",getPostById);
postRoutes.put("/posts/:id",updatePost);
postRoutes.post("/posts", createPost)
postRoutes.delete("/posts/:id", deletePost)

postRoutes.post("/posts/:id/like", toggleLikePost);
postRoutes.get("/posts/:id/likes", getPostLikes);

module.exports=postRoutes;