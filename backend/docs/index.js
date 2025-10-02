const YAML = require("yamljs");

const commentDoc = YAML.load("./docs/comment.yaml");
const userDoc = YAML.load("./docs/user.yaml");
const postDoc = YAML.load("./docs/post.yaml");

const base = {
  openapi: "3.0.3",
  info: {
    title: "ITI Hub API",
    version: "1.0.0",
    description: "Comprehensive API documentation for ITI Hub platform",
  },
  servers: [
    { url: `http://localhost:3030` }
  ],
  tags: [
    {
      name: "Users",
      description: "User management operations"
    },
    {
      name: "Comments",
      description: "Comment management and nested replies operations"
    },
    {
      name: "Posts",
      description: "Post management operations with media attachments"
    }
  ],
  paths: {}
};

const swaggerDocument = {
  ...base,
  paths: {
    ...base.paths,
    ...commentDoc.paths,
    ...userDoc.paths,
    ...postDoc.paths
  },
  components: {
    ...base.components,
    ...commentDoc.components,
    ...userDoc.components,
    ...postDoc.components
  },
  tags: [
    ...base.tags,
    ...(commentDoc.tags || []),
    ...(userDoc.tags || []),
    ...(postDoc.tags || [])
  ]
};
module.exports = swaggerDocument;
