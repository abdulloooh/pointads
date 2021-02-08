const { User } = require("../models/user"),
    { hash, verify } = require("argon2"),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;


module.exports = function () {
    passport.use(new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
        },
        function (email, password, done) {
            User.findOne({ email }, function (err, user) {
                if (err) { return done(err); }

                if (!user) {
                    return done(null, false, { message: 'Incorrect email or password.' });
                }

                verify(user.password, password)
                    .then(valid => {
                        if (!valid) return done(null, false, { message: 'Incorrect email or password.' });
                        return done(null, user);
                    })
            })
        }
    ));
}