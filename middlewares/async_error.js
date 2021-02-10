module.exports = function (err, req, res, next) {
  res.status(err.status || 500).send(err.message || "Internal server error");
};
