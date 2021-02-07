const Joi = require("@hapi/joi");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    minlength: 3,
    maxlength: 50,
    index: true,
    lowercase: true,
    required: "Please fill in a username",
    trim: true
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    index: true,
    lowercase: true,
    required: "Please fill in an email"
  },
  password: {
    type: String,
    minlength: 7,
    maxlength: 255,
    required: "Please fill in a password"
  },
  avatar: String,
  wallet: {
    type: Number,
    "default": 0
  }
},
  {
    timestamps: true
  }
);

userSchema.methods.generateJwtToken = function () {
  return jwt.sign(
    { _id: this._id, username: this.username },
    config.get("jwt"),
    { expiresIn: "5 days" }
  );
};

userSchema.methods.dummyAvatar = function () {
  return "https://www.gravatar.com/avatar/" + crypto.createHash("md5")
    .update(this.email)
    .digest("hex") + "?d=robohash"
}

// userSchema.methods.generatePasswordReset = function () {
//   this.resetPasswordToken = crypto.randomBytes(20).toString("hex");
//   this.resetPasswordExpires = Date.now() + 900000; //expires in 15 minutes
// };


const User = mongoose.model("User", userSchema);

function validateSignup(user) {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(3).max(255).required(),
  });

  return schema.validate(user);
}

function validateLogin(user) {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(3).max(255).required(),
  });

  return schema.validate(user);
}



module.exports = {
  validateSignup,
  validateLogin,
  User,
};