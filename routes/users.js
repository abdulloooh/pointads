const express = require('express');
const router = express.Router();
const { User, validateLogin, validateSignup, error400, encrypt, decrypt } = require("../models/user")
const { hash, verify } = require("argon2")
const sendMail = require("../config/nodemailer")

router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.post("/register", async (req, res, next) => {
  const { username, email, phone_number, password } = req.body
  const { error } = validateSignup(req.body);
  if (error) return res.status(400).send({
    field: error.details[0].path[0], msg: error.details[0].message
  });

  let user = await User.findOne({
    $or: [{ username }, { email }, { phone_number }],
  });

  // NEW USER

  if (!user) {

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

  }

  //BUT IF USER ALREADY EXISTS

  else {
    if (user.username === username) return error400(res,
      {
        field: "username",
        msg: "Username  exists"
      }
    )

    if (user.email === email) return error400(res,
      {
        field: "email",
        msg: "Email  exists"
      }
    )

    if (user.phone_number === phone_number) return error400(res,
      {
        field: "phone_number",
        msg: "phone_number exists"
      }
    )
  }

});

router.post("/create", async (req, res, next) => {
  const { userPayload, otp } = req.body
  let payload = decrypt(userPayload)
  if (payload.status && payload.status === "failed")
    return error400(res, {
      field: "otp",
      msg: payload.msg
    })

  return res.send({ payload, otp })
  // const hashedPassword = hash(password)

})
// user = new User(req.body, _.pick(["username", "email", "password"])); //create new user
// await user.save();
// const token = user.generateJwtToken();
// res.send(_.pick(user, ["username"]));

module.exports = router;
