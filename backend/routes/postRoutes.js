const express = require("express");

const{
    getAllPosts,
    getPostById,
    updatePost,
    createPost
} = require("../controllers/postController");

const postRoutes = express.Router();

postRoutes.get("/posts",getAllPosts);
postRoutes.get("/posts/:id",getPostById);
postRoutes.put("/posts/:id",updatePost);
postRoutes.post("/posts", createPost)

module.exports=postRoutes;