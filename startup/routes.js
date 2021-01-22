const express = require("express");
const app = express();

const path = require('path');
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const asyncError = require("../middlewares/async_error");

const indexRouter = require("../routes/index");

module.exports = function () {
  app.use(logger("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(`${__dirname}/../`, "public")));

  app.use("/", indexRouter);
  app.use("/api", indexRouter);


  app.use(asyncError);
};