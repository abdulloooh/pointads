const _ = require("lodash");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");
const crypto = require("crypto");

const public_fields = [
  "username",
  "phone_number",
  "email",
  "avatar",
  "wallet",
  "token",
];

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
    username: {
      type: String,
      index: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      index: true,
      lowercase: true,
      minlength: 5,
      maxlength: 255,
      required: "Please fill in an email",
    },
    phone_number: {
      type: String,
      minlength: 11,
      maxlength: 14,
    },
    password: {
      type: String,
      maxlength: 255,
    },
    avatar: String,
    wallet: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.generateJwtToken = function (expiry = "7 days") {
  return jwt.sign({ _id: this._id }, config.get("jwt"), { expiresIn: expiry });
};

userSchema.methods.dummyAvatar = function () {
  return (
    "https://www.gravatar.com/avatar/" +
    crypto.createHash("md5").update(this.email).digest("hex") +
    "?d=robohash"
  );
};

userSchema.methods.transformUserEntity = function () {
  return _.pick(this, public_fields);
};

// userSchema.methods.generatePasswordReset = function () {
//   this.resetPasswordToken = crypto.randomBytes(20).toString("hex");
//   this.resetPasswordExpires = Date.now() + 900000; //expires in 15 minutes
// };

module.exports = mongoose.model("User", userSchema);
