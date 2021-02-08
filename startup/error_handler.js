require("express-async-errors")
const debug = require("debug")("backend:error")


module.exports = function () {
  process.quit = () => {
    setTimeout(() => {
      process.exit(1);
    }, 300);
  };

  process.on("uncaughtException", (ex) => {
    debug(ex);
    process.quit();
  });

  process.on("unhandledRejection", (ex) => {
    throw ex;
  });
};
