module.exports = function (err, req, res, next) {
  console.log(err);
  res.status(err.status || 500).send(
    /^[4]\d{2}$/.test(err.status) //intentionally thrown error mssgs
      ? err.details
      : {
          success: false,
          msg: "Server temporarily unavailable, please try again later",
        }
  );
};
