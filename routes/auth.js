const express = require("express");
const router = express.Router();
const passport = require("passport");
const config = require("config");

router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  ({ user }, res) => {
    return res.send({
      user: user.transformUserEntity(),
      token: user.generateJwtToken(),
    });
  }
);

// GOOGLE AUTH

router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      config.get("google_scope_profile_url"),
      config.get("google_scope_email_url"),
    ],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  }),
  function ({ user }, res) {
    const token = user.generateJwtToken()
    console.log(token)
    return res.redirect(`${config.get("client")}?token=${token}`)
    // return res.send({
    //   user: user.transformUserEntity(),
    //   token: user.generateJwtToken(),
    // });
  }
);

module.exports = router;

