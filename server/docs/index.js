const YAML = require("yamljs");

const authDoc = YAML.load("./docs/auth.yaml");
const userDoc = YAML.load("./docs/user.yaml");
const connectionDoc = YAML.load("./docs/connection.yaml");

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
    ...connectionDoc.paths
  },
  components: {
    schemas: {
      ...(base.components?.schemas || {}),
      ...(authDoc.components?.schemas || {}),
      ...(userDoc.components?.schemas || {}),
      ...(connectionDoc.components?.schemas || {})
    },
    securitySchemes: {
      ...(base.components?.securitySchemes || {}),
      ...(authDoc.components?.securitySchemes || {}),
      ...(userDoc.components?.securitySchemes || {}),
      ...(connectionDoc.components?.securitySchemes || {})
    },
    responses: {
      ...(base.components?.responses || {}),
      ...(authDoc.components?.responses || {}),
      ...(userDoc.components?.responses || {}),
      ...(connectionDoc.components?.responses || {})
    }
  },
  tags: [
    ...base.tags,
    ...(authDoc.tags || []),
    ...(userDoc.tags || []),
    ...(connectionDoc.tags || [])
  ]
};
module.exports = swaggerDocument;
