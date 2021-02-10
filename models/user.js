const _ = require("lodash");
const Joi = require("@hapi/joi");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");
const crypto = require("crypto");
// Difining algorithm
const algorithm = "aes-256-cbc";

// Defining key
const key = config.get("AES_KEY");

// Defining iv
const iv = config.get("AES_IV");

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

const User = mongoose.model("User", userSchema);

function validate(user) {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30),
    email: Joi.string().email().required(),
    phone_number: Joi.string().min(11).max(14).required(),
    avatar: Joi.string(),
    password: Joi.string().min(3).max(255).required(),
  });

  return schema.validate(user);
}

// function validateLogin(user) {
//   const schema = Joi.object({
//     username: Joi.string().min(3).max(30).required(),
//     password: Joi.string().min(3).max(255).required(),
//   });

//   return schema.validate(user);
// }

function error400(res, data) {
  return res.status(400).send(data);
}

//Use jwt to easily handle expiry
let jwt_encrypt;
function encrypt(payload, expiry) {
  jwt_encrypt = jwt.sign(payload, config.get("jwt"), { expiresIn: expiry });

  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(jwt_encrypt);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
}

function decrypt(encryptedData) {
  let encryptedText = Buffer.from(encryptedData, "hex");

  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  let jwt_decrypt = decrypted.toString();

  try {
    const decoded = jwt.verify(jwt_decrypt, config.get("jwt"));
    return decoded;
  } catch (ex) {
    return {
      status: "failed",
      msg: ex.message === "jwt expired" ? ex.message : "Invalid request",
    };
  }
}

module.exports = {
  validate,
  // validateLogin,
  User,
  error400,
  encrypt,
  decrypt,
};
