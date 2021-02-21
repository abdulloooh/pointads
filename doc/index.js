const swaggerUi = require("swagger-ui-express")
const swaggerFile = require('./swagger_output.json')

module.exports = function (app) {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile))
}