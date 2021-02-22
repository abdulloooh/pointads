module.exports = function (err, req, res, next) {
  console.log(err)
  res
    .status(err.status || 500)
    .send(err.status === 400 ? //intentionally thrown error mssgs
      err.details :
      "Server temporarily unavailable, please try again later");
};
