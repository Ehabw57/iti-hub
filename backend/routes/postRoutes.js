const express = require("express");

const{
    getAllPosts,
    getPostById,
    updatePost,
    createPost,
    deletePost
} = require("../controllers/postController");

const postRoutes = express.Router();

postRoutes.get("/posts",getAllPosts);
postRoutes.get("/posts/:id",getPostById);
postRoutes.put("/posts/:id",updatePost);
postRoutes.post("/posts", createPost)
postRoutes.delete("/posts/:id", deletePost)

module.exports=postRoutes;