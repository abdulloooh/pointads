const swaggerUi = require("swagger-ui-express")
const swaggerDocument = require('./swagger.json')
// const swaggerJSDoc = require("swagger-jsdoc")
// const components = require("./components")

module.exports = function (app) {
    /**
     * Can auto generate the doc straight whiich is far from accuracy from my pov
     * Can also document it manually but in a single swagger_output file
     * ... for example and serve it
     * This will probably get crazily long and not easily maintainable
     */
    // app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile))

    // But I will use swagger-jsdoc so I can do inline documentation
    // const swaggerDefinition = {
    //     openapi: '3.0.0',
    //     info: {
    //         title: 'DartPointAds API Documentation',
    //         version: '1.0.0',
    //         contact: {
    //             name: "Contact: Abdullah",
    //             url: "https://github.com/abdulloooh"
    //         },
    //     },
    //     servers: [
    //         {
    //             url: "http://localhost:4000",
    //             description: "Development server"
    //         },
    //         {
    //             url: "https://dartpa.herokuapp.com",
    //             description: "Production server"
    //         }
    //     ],
    //     basePath: "/api",
    //     components,
    //     security: [{
    //         bearerAuth: []
    //     }]
    // };

    // const options = {
    //     swaggerDefinition,
    //     apis: ['./routes/*.js'],
    // };

    // const swaggerSpec = swaggerJSDoc(options);

    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
}


// https://davibaltar.medium.com/documenta%C3%A7%C3%A3o-autom%C3%A1tica-de-apis-em-node-js-eb03041c643b
// https://dev.to/kabartolo/how-to-document-an-express-api-with-swagger-ui-and-jsdoc-50do
// https://github.com/Surnet/swagger-jsdoc/issues/141
// https://swagger.io/docs/specification/authentication/#securitySchemes
// https://swagger.io/docs/specification/basic-structure/