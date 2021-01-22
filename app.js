const app = require("express")();

// require("@knuckleswtf/scribe-express")(app);
require("./startup/prod")();
// require("./startup/errorHandler")(debug, winston);
// require("./startup/config")(app, path);
require("./startup/db")();
require("./startup/routes")();

module.exports = app;