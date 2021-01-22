const app = require("express")();

require("./startup/prod")();
// require("./startup/errorHandler")(debug, winston);
require("./startup/config")();
require("./startup/db")();
require("./startup/routes")();

module.exports = app;