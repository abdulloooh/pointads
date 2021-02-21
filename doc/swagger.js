const swaggerAutogen = require('swagger-autogen')()

const outputFile = './doc/swagger_output.json'
const routes = ['./startup/routes.js']

swaggerAutogen(outputFile, routes)