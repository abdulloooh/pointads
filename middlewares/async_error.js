module.exports = function (err, req, res, next) {
  console.log(err)
  res
    .status(err.status || 500)
    .send("Server temporarily unavailable, please try again later");
};
