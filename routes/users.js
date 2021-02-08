const express = require('express');
const router = express.Router();
const passport = require("passport")
const { hash, verify } = require("argon2")
const sendMail = require("../config/nodemailer")
const { User, validateLogin, validateSignup, error400, encrypt, decrypt } = require("../models/user")

router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.post("/register", async (req, res, next) => {
  const { username, email, phone_number, password } = req.body
  const { error } = validateSignup(req.body);
  if (error) return res.status(400).send({
    field: error.details[0].path[0], msg: error.details[0].message
  });

  let db_user = await User.findOne({
    $or: [{ username }, { email }, { phone_number }],
  });

  // USER EXISTS
  if (db_user) return checkUser(res, req.body, db_user)

  console.log("en")
  if (username === password || phone_number === password) return error400(res,
    {
      field: "password",
      msg: "use a more secure password"
    }
  )

  const signupToken = Math.floor(100000 + Math.random() * 900000)

  const userPayload = encrypt(
    {
      username, email, phone_number, password, signupToken
    },
    "0.09h" // 5+ minutes
  )

  sendMail(email, "DartPointAds Registration", `
    <p>Hey ${username},</p>
    <You>Welcome to the DartPointAds tribe,You are just a step away from completing your sign up.</p>
    <p>Here is your signup OTP, it expires in 5 minutes and please do not share with anyone.</p>
    <p>${signupToken}</p>
    <p>With pleasure, <br/>Abdullah from DartPointAds.</p>
  `)

  res.send({ status: "success", userPayload, expiresIn: 5, unit: "m" })

});

router.post("/create", async (req, res, next) => {
  const { userPayload, otp } = req.body
  let payload = decrypt(userPayload)
  if (payload.status && payload.status === "failed")
    return error400(res, {
      field: "otp",
      msg: payload.msg
    })

  const { username, email, phone_number, password, signupToken } = payload
  if (signupToken.toString() !== otp.toString())
    return error400(res, {
      field: "otp",
      msg: "wrong token"
    })

  let db_user = await User.findOne({
    $or: [{ username }, { email }, { phone_number }],
  });

  // USER EXISTS
  if (db_user) return checkUser(res, payload, db_user)


  const hashedPassword = await hash(password)
  user = new User({ username, email, phone_number, password: hashedPassword });
  user.avatar = user.dummyAvatar()
  user = await user.save();
  res.send({ user: user.transformUserEntity(), token: user.generateJwtToken() });
})

router.post("/login", passport.authenticate('local', { session: false }), (req, res) => {
  return res.send(req.user)
})

function checkUser(res, user, db_user) {
  if (user.username.toLowerCase() === db_user.username) return error400(res,
    {
      field: "username",
      msg: "Username  exists"
    }
  )

  if (user.email === db_user.email) return error400(res,
    {
      field: "email",
      msg: "Email  exists"
    }
  )

  if (user.phone_number === db_user.phone_number) return error400(res,
    {
      field: "phone_number",
      msg: "phone_number exists"
    }
  )
}

module.exports = router;
