const path = require('path');
const cors = require("cors");
const config = require("config");
const passport = require('passport')
const passport_local = require("../passport/local")

module.exports = function (app) {
  const corsOptions = {
    origin: [
      config.get("origin"),
    ],
    credentials: true,
  };

  app.set("views", path.join(`${__dirname}/../`, "views"));
  app.set("view engine", "jade");
  app.use(cors(corsOptions));
  app.use(passport.initialize());
  passport_local()

  if (!config.get("jwt")) {
    throw new Error("FATAL ERROR: jwtPrivateToken key not found");
  }
  if (!config.get("db")) {
    throw new Error("FATAL ERROR: db not configured");
  }
};