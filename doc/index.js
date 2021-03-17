const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
// const swaggerJSDoc = require("swagger-jsdoc")
// const components = require("./components")

module.exports = function (app) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

// https://davibaltar.medium.com/documenta%C3%A7%C3%A3o-autom%C3%A1tica-de-apis-em-node-js-eb03041c643b
// https://dev.to/kabartolo/how-to-document-an-express-api-with-swagger-ui-and-jsdoc-50do
// https://github.com/Surnet/swagger-jsdoc/issues/141
// https://swagger.io/docs/specification/authentication/#securitySchemes
// https://swagger.io/docs/specification/basic-structure/
