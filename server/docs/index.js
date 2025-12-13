const YAML = require("yamljs");

const authDoc = YAML.load("./docs/auth.yaml");
const userDoc = YAML.load("./docs/user.yaml");
const connectionDoc = YAML.load("./docs/connection.yaml");
const postDoc = YAML.load("./docs/post.yaml");
const commentDoc = YAML.load("./docs/comment.yaml");

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
      name: "Authentication",
      description: "User authentication and authorization operations"
    },
    {
      name: "Users",
      description: "User management operations"
    },
    {
      name: "Connections",
      description: "User connection operations (follow, unfollow, block, unblock)"
    },
    {
      name: "Posts",
      description: "Post management and interaction operations"
    },
    {
      name: "Comments",
      description: "Comment management operations on posts"
    }
  ],
  paths: {}
};

const swaggerDocument = {
  ...base,
  paths: {
    ...base.paths,
    ...authDoc.paths,
    ...userDoc.paths,
    ...connectionDoc.paths,
    ...postDoc.paths,
    ...commentDoc.paths
  },
  components: {
    schemas: {
      ...(base.components?.schemas || {}),
      ...(authDoc.components?.schemas || {}),
      ...(userDoc.components?.schemas || {}),
      ...(connectionDoc.components?.schemas || {}),
      ...(postDoc.components?.schemas || {}),
      ...(commentDoc.components?.schemas || {})
    },
    securitySchemes: {
      ...(base.components?.securitySchemes || {}),
      ...(authDoc.components?.securitySchemes || {}),
      ...(userDoc.components?.securitySchemes || {}),
      ...(connectionDoc.components?.securitySchemes || {}),
      ...(postDoc.components?.securitySchemes || {}),
      ...(commentDoc.components?.securitySchemes || {})
    },
    responses: {
      ...(base.components?.responses || {}),
      ...(authDoc.components?.responses || {}),
      ...(userDoc.components?.responses || {}),
      ...(connectionDoc.components?.responses || {}),
      ...(postDoc.components?.responses || {}),
      ...(commentDoc.components?.responses || {})
    }
  },
  tags: [
    ...base.tags,
    ...(authDoc.tags || []),
    ...(userDoc.tags || []),
    ...(connectionDoc.tags || []),
    ...(postDoc.tags || []),
    ...(commentDoc.tags || [])
  ]
};
module.exports = swaggerDocument;
