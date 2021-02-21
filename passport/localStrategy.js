const User = require("../models/user"),
  { verify } = require("argon2");

module.exports = function () {
  const passport = require("passport"),
    LocalStrategy = require("passport-local").Strategy;

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      function (email, password, done) {
        User.findOne({ email }, function (err, user) {
          if (err) {
            return done(err);
          }

          if (!user) {
            return done({ message: "Incorrect email or password." }, false);
          }

          verify(user.password, password).then((valid) => {
            if (!valid)
              return done({ message: "Incorrect email or password." }, false);
            return done(null, user);
          });
        });
      }
    )
  );
};

// http://www.passportjs.org/docs/
// https://medium.com/javascript-in-plain-english/authentication-using-passport-js-in-a-node-js-backend-api-51e9946549cb