const path = require('path');
const cors = require("cors");
const config = require("config");
const passport = require('passport')

module.exports = function (app) {
  app.set("views", path.join(`${__dirname}/../`, "views"));
  app.set("view engine", "jade");

  const corsOptions = {
    origin: [
      config.get("origin"),
    ],
    credentials: true,
  };

  app.use(cors(corsOptions));
  // app.use(passport.initialize());

  if (!config.get("jwt")) {
    throw new Error("FATAL ERROR: jwtPrivateToken key not found");
  }
  if (!config.get("db")) {
    throw new Error("FATAL ERROR: db not configured");
  }
};