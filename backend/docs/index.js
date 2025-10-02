const YAML = require("yamljs");

const commentDoc = YAML.load("./docs/comment.yaml");
const userDoc = YAML.load("./docs/user.yaml");

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
  paths: {}
};

const swaggerDocument = {
  ...base,
  paths: {
    ...base.paths,
    ...commentDoc.paths,
    ...userDoc.paths
  },
  components: {
    ...base.components,
    ...commentDoc.components,
    ...userDoc.components
  },
};
module.exports = swaggerDocument;
