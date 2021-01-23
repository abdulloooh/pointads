const app = require("express")();

require("./startup/prod")();
require("./startup/error_handler")();
require("./startup/config")();
require("./startup/db")();
require("./startup/routes")();

module.exports = app;