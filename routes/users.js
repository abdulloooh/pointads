const express = require("express");
const router = express.Router();
const passport = require("passport");
const { hash } = require("argon2");
const sendMail = require("../config/nodemailer");
const {
  User,
  validate,
  error400,
  encrypt,
  decrypt,
} = require("../models/user");

router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.send({ user: req.user.transformUserEntity() });
  }
);

router.post("/register", async (req, res, next) => {
  const { username, email, phone_number, avatar, password } = req.body;
  const { error } = validate(req.body);
  if (error)
    return res.status(400).send({
      field: error.details[0].path[0],
      msg: error.details[0].message,
    });

  /**
   * If username isn't sent in reg, checking if a user exists
   * might match with another user who had no username. more like ""==""
   */
  const expectedIncoming = ["username", "email", "phone_number"];
  const searchArray = [];
  expectedIncoming.map((i) => {
    if (req.body[i]) searchArray.push({ [i]: req.body[i] });
  });

  let db_user = await User.findOne({
    $or: searchArray,
  });

  // USER EXISTS
  if (db_user) return checkUser(res, req.body, db_user);

  if (username === password || phone_number === password)
    return error400(res, {
      field: "password",
      msg: "use a more secure password",
    });

  const signupToken = Math.floor(100000 + Math.random() * 900000);

  const userPayload = encrypt(
    {
      username,
      email,
      phone_number,
      password,
      signupToken,
      avatar,
    },
    "0.09h" // 5+ minutes
  );

  sendMail(
    email,
    "DartPointAds Registration",
    `
    <p>Hey there,</p>
    <You>Welcome to the DartPointAds tribe,You are just a step away from completing your sign up.</p>
    <p>Here is your signup OTP, it expires in 5 minutes and please do not share with anyone.</p>
    <p>${signupToken}</p>
    <p>With pleasure, <br/>Abdullah from DartPointAds.</p>
  `
  );

  res.send({ status: "success", userPayload, expiresIn: 5, unit: "m" });
});

router.post("/create", async (req, res, next) => {
  const { userPayload, otp } = req.body;
  let payload = decrypt(userPayload);
  if (payload.status && payload.status === "failed")
    return error400(res, {
      field: "otp",
      msg: payload.msg,
    });

  const {
    username,
    email,
    phone_number,
    password,
    signupToken,
    avatar,
  } = payload;
  if (signupToken.toString() !== otp.toString())
    return error400(res, {
      field: "otp",
      msg: "wrong token",
    });

  /**
   * If username isn't sent in reg, checking if a user exists
   * might match with another user who had no username. more like ""==""
   */
  const expectedIncoming = ["username", "email", "phone_number"];
  const searchArray = [];
  expectedIncoming.map((i) => {
    if (payload[i]) searchArray.push({ [i]: payload[i] });
  });

  let db_user = await User.findOne({
    $or: searchArray,
  });

  // USER EXISTS
  if (db_user) return checkUser(res, payload, db_user);

  const hashedPassword = await hash(password);
  user = new User({ username, email, phone_number, password: hashedPassword });
  user.avatar = avatar || user.dummyAvatar();
  user = await user.save();
  res.send({
    user: user.transformUserEntity(),
    token: user.generateJwtToken(),
  });
});

function checkUser(res, user, db_user) {
  if (user.username && user.username.toLowerCase() === db_user.username)
    return error400(res, {
      field: "username",
      msg: `Username exists${
        db_user.googleId ? ", please log in with google option" : ""
      }`,
    });

  if (user.email === db_user.email)
    return error400(res, {
      field: "email",
      msg: `Email exists${
        db_user.googleId ? ", please log in with google option" : ""
      }`,
    });

  if (user.phone_number === db_user.phone_number)
    return error400(res, {
      field: "phone_number",
      msg: `Phone number exists${
        db_user.googleId ? ", please log in with google option" : ""
      }`,
    });
}

module.exports = router;

// http://www.passportjs.org/docs/google/
