const config = require("config");
const passport = require("passport");
const User = require("../models/user");

module.exports = function () {
  const JwtStrategy = require("passport-jwt").Strategy,
    ExtractJwt = require("passport-jwt").ExtractJwt;

  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.get("jwt"),
  };

  passport.use(
    new JwtStrategy(opts, function (jwt_payload, done) {
      User.findById(jwt_payload._id, function (err, user) {
        if (err) {
          return done(err, false);
        }
        if (user && !user.restricted) {
          console.log("Authenticated via JWT: ", user.username);
          return done(null, user);
        } else {
          return done(null, false);
        }
      });
    })
  );
};

// http://www.passportjs.org/packages/passport-jwt/
