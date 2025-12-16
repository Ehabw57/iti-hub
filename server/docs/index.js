const YAML = require("yamljs");

const authDoc = YAML.load("./docs/auth.yaml");
const userDoc = YAML.load("./docs/user.yaml");
const connectionDoc = YAML.load("./docs/connection.yaml");
const postDoc = YAML.load("./docs/post.yaml");
const commentDoc = YAML.load("./docs/comment.yaml");
const feedDoc = YAML.load("./docs/feed.yaml");
const communityDoc = YAML.load("./docs/community.yaml");
const conversationDoc = YAML.load("./docs/conversation.yaml");
const notificationDoc = YAML.load("./docs/notification.yaml");
const searchDoc = YAML.load("./docs/search.yaml");

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
    },
    {
      name: "Feed",
      description: "Feed retrieval operations (Home, Following, Trending, Community)"
    },
    {
      name: "Communities",
      description: "Community operations and community-specific content"
    },
    {
      name: "Conversations",
      description: "Messaging and conversation operations (individual and group chats)"
    },
    {
      name: "Notifications",
      description: "Notification management and real-time updates with smart grouping"
    },
    {
      name: "Search",
      description: "Search for users, posts, and communities with filtering and pagination"
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
    ...commentDoc.paths,
    ...feedDoc.paths,
    ...communityDoc.paths,
    ...conversationDoc.paths,
    ...notificationDoc.paths,
    ...searchDoc.paths
  },
  components: {
    schemas: {
      ...(base.components?.schemas || {}),
      ...(authDoc.components?.schemas || {}),
      ...(userDoc.components?.schemas || {}),
      ...(connectionDoc.components?.schemas || {}),
      ...(postDoc.components?.schemas || {}),
      ...(commentDoc.components?.schemas || {}),
      ...(feedDoc.components?.schemas || {}),
      ...(communityDoc.components?.schemas || {}),
      ...(conversationDoc.components?.schemas || {}),
      ...(notificationDoc.components?.schemas || {}),
      ...(searchDoc.components?.schemas || {})
    },
    securitySchemes: {
      ...(base.components?.securitySchemes || {}),
      ...(authDoc.components?.securitySchemes || {}),
      ...(userDoc.components?.securitySchemes || {}),
      ...(connectionDoc.components?.securitySchemes || {}),
      ...(postDoc.components?.securitySchemes || {}),
      ...(commentDoc.components?.securitySchemes || {}),
      ...(feedDoc.components?.securitySchemes || {}),
      ...(communityDoc.components?.securitySchemes || {}),
      ...(conversationDoc.components?.securitySchemes || {}),
      ...(notificationDoc.components?.securitySchemes || {}),
      ...(searchDoc.components?.securitySchemes || {})
    },
    responses: {
      ...(base.components?.responses || {}),
      ...(authDoc.components?.responses || {}),
      ...(userDoc.components?.responses || {}),
      ...(connectionDoc.components?.responses || {}),
      ...(postDoc.components?.responses || {}),
      ...(commentDoc.components?.responses || {}),
      ...(feedDoc.components?.responses || {}),
      ...(communityDoc.components?.responses || {}),
      ...(conversationDoc.components?.responses || {}),
      ...(notificationDoc.components?.responses || {}),
      ...(searchDoc.components?.responses || {})
    }
  },
  tags: [
    ...base.tags,
    ...(authDoc.tags || []),
    ...(userDoc.tags || []),
    ...(connectionDoc.tags || []),
    ...(postDoc.tags || []),
    ...(commentDoc.tags || []),
    ...(feedDoc.tags || []),
    ...(communityDoc.tags || []),
    ...(conversationDoc.tags || []),
    ...(notificationDoc.tags || []),
    ...(searchDoc.tags || [])
  ]
};
module.exports = swaggerDocument;
