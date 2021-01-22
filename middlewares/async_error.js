
// const winston = require("winston");

module.exports = function (err, req, res, next) {
//   winston.error(err.message, err);
  res.status(err.status || 500).send(err.message || "Internal server error");
};