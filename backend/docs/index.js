const YAML = require("yamljs");

const commentDoc = YAML.load("./docs/comment.yaml");
const userDoc = YAML.load("./docs/user.yaml");
const postDoc = YAML.load("./docs/post.yaml");
const messageDoc = YAML.load("./docs/message.yaml");

const base = {
  openapi: "3.0.0",
  info: {
    title: "My API",
    version: "1.0.0",
    description: "API documentation",
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
    },
    {
      name: "Messages",
      description: "Message management and conversation operations"
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
    ...postDoc.paths,
    ...messageDoc.paths
  },
  components: {
    ...base.components,
    ...commentDoc.components,
    ...userDoc.components,
    ...postDoc.components,
    ...messageDoc.components
  },
  tags: [
    ...base.tags,
    ...(commentDoc.tags || []),
    ...(userDoc.tags || []),
    ...(postDoc.tags || []),
    ...(messageDoc.tags || [])
  ]
};
module.exports = swaggerDocument;
