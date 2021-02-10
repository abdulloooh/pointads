const debug = require("debug")("backend:db");
const mongoose = require("mongoose");
const config = require("config");
module.exports = function () {
  mongoose
    .connect(config.get("db"), {
      reconnectTries: 5000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      debug("connected to mongodb successfully...");
      //   require("../cron-job")(); //after database is ready
    });
};
