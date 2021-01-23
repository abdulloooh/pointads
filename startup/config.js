const app = require("express")();
const path = require('path');
const cors = require("cors");
const config = require("config");

module.exports = function () {
  app.set("views", path.join(`${__dirname}/../`, "views"));
  app.set("view engine", "jade");

  const corsOptions = {
    // exposedHeaders: "x_auth_token",
    origin: [
      config.get("origin"),
    ],
    credentials: true,
  };

  app.use(cors(corsOptions));

  if (!config.get("jwt")) {
    throw new Error("FATAL ERROR: jwtPrivateToken key not found");
  }
  if (!config.get("db")) {
    throw new Error("FATAL ERROR: db not configured");
  }
};