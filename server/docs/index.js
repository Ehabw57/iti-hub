const YAML = require("yamljs");
const path = require("path");

const load = (file) =>
  YAML.load(path.join(__dirname, file));

const authDoc = load("auth.yaml");
const userDoc = load("user.yaml");
const connectionDoc = load("connection.yaml");
const postDoc = load("post.yaml");
const commentDoc = load("comment.yaml");
const feedDoc = load("feed.yaml");
const communityDoc = load("community.yaml");
const conversationDoc = load("conversation.yaml");
const notificationDoc = load("notification.yaml");
const searchDoc = load("search.yaml");
const adminDoc = load("admin.yaml");
const aiDoc = load("ai.yaml");


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
    },
    {
      name: "Admin",
      description: "Administrative operations for platform management (requires admin role)"
    },
    {
      name: "AI",
      description: "AI-powered features for content generation and Q&A"
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
    ...searchDoc.paths,
    ...adminDoc.paths,
    ...aiDoc.paths
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
      ...(searchDoc.components?.schemas || {}),
      ...(adminDoc.components?.schemas || {}),
      ...(aiDoc.components?.schemas || {})
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
      ...(searchDoc.components?.securitySchemes || {}),
      ...(adminDoc.components?.securitySchemes || {}),
      ...(aiDoc.components?.securitySchemes || {})
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
      ...(searchDoc.components?.responses || {}),
      ...(adminDoc.components?.responses || {}),
      ...(aiDoc.components?.responses || {})
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
    ...(searchDoc.tags || []),
    ...(adminDoc.tags || []),
    ...(aiDoc.tags || [])
  ]
};
module.exports = swaggerDocument;
