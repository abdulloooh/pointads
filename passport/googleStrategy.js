const config = require("config");
const passport = require("passport");
const User = require("../models/user");

module.exports = function () {
  const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.get("GOOGLE_CLIENT_ID"),
        clientSecret: config.get("GOOGLE_CLIENT_SECRET"),
        callbackURL: `/api/auth/google/callback`,
      },
      function (accessToken, refreshToken, profile, done) {
        if (!profile.id || !(profile.emails && profile.emails[0].value)) {
          return done(null, false);
        }

        User.findOne({
          $or: [{ googleId: profile.id }, { email: profile.emails[0].value }],
        }).then((user) => {
          if (user) {
            if (
              user.googleId !== profile.id &&
              user.email === profile.emails[0].value
            ) {
              return done(
                {
                  status: 400,
                  details: {
                    field: "email",
                    msg: "Account exists, please log in with email-password option."
                  }
                },
                false
              );
            }
            return done(null, user);
          } else {
            new User({
              googleId: profile.id,
              email: profile.emails[0].value,
              username: profile.displayName,
              avatar: profile.photos[0].value,
            })
              .save()
              .then((newUser) => {
                return done(null, newUser);
              });
          }
        });
      }
    )
  );
};


// http://www.passportjs.org/docs/google/
// https://developers.google.com/identity/protocols/oauth2/scopes#google-sign-in
// https://dev.to/phyllis_yym/beginner-s-guide-to-google-oauth-with-passport-js-2gh4?signin=true