const express = require("express");
const router = express.Router();
const passport = require("passport");
const { hash } = require("argon2");
const sendMail = require("../config/nodemailer");
const User = require("../models/user");
const {
  validate,
  error400,
  encrypt,
  decrypt,
  checkUser,
} = require("../controllers/userController");

router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.send({ success: true, user: req.user.transformUserEntity() });
  }
);

router.post("/register", async (req, res, next) => {
  const { username, email, phone, avatar, password } = req.body;
  const { error } = validate(req.body);
  if (error)
    return res.status(400).send({
      success: false,
      field: error.details[0].path[0],
      msg: error.details[0].message,
    });

  /**
   * If username isn't sent in reg, checking if a user exists
   * might match with another google user who had no username. more like ""==""
   */
  const expectedIncoming = ["username", "email", "phone"];
  const searchArray = [];
  expectedIncoming.map((i) => {
    if (req.body[i]) searchArray.push({ [i]: req.body[i] });
  });

  let db_user = await User.findOne({
    $or: searchArray,
  });

  // USER EXISTS
  if (db_user) return checkUser(res, req.body, db_user);

  if (username === password || phone === password)
    return error400(res, {
      success: false,
      field: "password",
      msg: "use a more secure password",
    });

  const signupToken = Math.floor(100000 + Math.random() * 900000);

  const userPayload = encrypt(
    {
      username,
      email,
      phone,
      password,
      signupToken,
      avatar,
    },
    "0.09h" // 5+ minutes
  );

  await sendMail({
    to: email,
    subject: "DartPointAds Registration",
    html: `
    <p>Hey there,</p>
    <p>Welcome to the DartPointAds tribe,You are just a step away from completing your sign up.</p>
    <p>Here is your signup OTP, it expires in 5 minutes and please do not share with anyone.</p>
    <p>${signupToken}</p>
    <p>With pleasure, <br/>Abdullah 🤗 from DartPointAds.</p>
  `,
  });

  res.send({ success: true, userPayload, expiresIn: 5, unit: "m" });
});

router.post("/create", async (req, res, next) => {
  const { userPayload, otp } = req.body;
  if (!userPayload || !otp)
    return error400(res, {
      success: false,
      field: "userPayload",
      msg: "Invalid request",
    });
  let { success, payload, msg } = decrypt(userPayload);
  if (!success)
    return error400(res, {
      success: false,
      field: "otp",
      msg,
    });

  let { username, email, phone, password, signupToken, avatar } = payload;
  if (signupToken.toString() !== otp.toString())
    return error400(res, {
      success: false,
      field: "otp",
      msg: "wrong token",
    });

  /**
   * If username isn't sent in reg, checking if a user exists
   * might match with another user who had no username. more like ""==""
   */
  const expectedIncoming = ["username", "email", "phone"];
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
  user = new User({ username, email, phone, password: hashedPassword });
  user.avatar = avatar || user.dummyAvatar();
  user = await user.save();
  res.send({
    success: true,
    user: user.transformUserEntity(),
    token: user.generateJwtToken(),
  });
});

module.exports = router;
