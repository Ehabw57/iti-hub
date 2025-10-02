const YAML = require("yamljs");

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
  paths: {}
};

const swaggerDocument = {
  ...base,
  paths: {
    ...base.paths,
    ...commentDoc.paths
  },
  components: {
    ...base.components,
    ...commentDoc.components
  },
};
module.exports = swaggerDocument;
