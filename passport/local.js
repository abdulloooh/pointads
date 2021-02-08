// const { User } = require("../models/user"),
//   { hash, verify } = require("argon2"),
//   passport = require('passport'),
//   LocalStrategy = require('passport-local').Strategy;


// module.exports = function () {
//   passport.use(new LocalStrategy(
//     function (username, password, done) {
//       User.findOne({ username: username }, function (err, user) {
//         if (err) { return done(err); }

//         if (!user) {
//           return done(null, false, { message: 'Incorrect username or password.' });
//         }

//         const validPassword = await verify(user.password, password);
//         if (!validPassword(password)) {
//           return done(null, false, { message: 'Incorrect username or password.' });
//         }

//         return done(null, user);
//       });
//     }
//   ));
// }