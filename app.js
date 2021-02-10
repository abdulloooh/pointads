const app = require("express")();

require("./startup/prod")(app);
require("./startup/error_handler")();
require("./startup/config")(app);
require("./startup/db")();
require("./startup/routes")(app);

module.exports = app;
