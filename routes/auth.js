const express = require('express');
const router = express.Router();
const passport = require("passport")
const config = require("config");
// const { User, validateLogin, validateSignup, error400, encrypt, decrypt } = require("../models/user")


router.post("/login", passport.authenticate('local', { session: false }), ({ user }, res) => {
    return res.send({ user: user.transformUserEntity(), token: user.generateJwtToken() })
})


// GOOGLE AUTH

router.get('/google',
    passport.authenticate('google', { scope: [config.get('google_scope_url')] }));

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    function (req, res) {
        res.send(req)
    });


module.exports = router;


/***
 * A link or button can be placed on a web page,
 * allowing one - click sign in with Google.
 * <a href = "/auth/google" > Sign In with Google</a>
 */
