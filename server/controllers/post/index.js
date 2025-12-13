const createPostController = require('./createPostController');
const getPostController = require('./getPostController');
const updatePostController = require('./updatePostController');
const deletePostController = require('./deletePostController');
const likePostController = require('./likePostController');
const savePostController = require('./savePostController');
const repostController = require('./repostController');
const getUserPostsController = require('./getUserPostsController');
const getSavedPostsController = require('./getSavedPostsController');

module.exports = {
  createPost: createPostController,
  getPost: getPostController,
  updatePost: updatePostController,
  deletePost: deletePostController,
  likePost: likePostController.likePost,
  unlikePost: likePostController.unlikePost,
  savePost: savePostController.savePost,
  unsavePost: savePostController.unsavePost,
  repost: repostController,
  getUserPosts: getUserPostsController,
  getSavedPosts: getSavedPostsController
};
