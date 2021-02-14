const _ = require("lodash");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const config = require("config");
const crypto = require("crypto");
// Difining algorithm
const algorithm = "aes-256-cbc";


// Defining key
const key = config.get("AES_KEY");

// Defining iv
const iv = config.get("AES_IV");


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
function encrypt(payload, expiry) {
    let jwt_encrypt = jwt.sign(payload, config.get("jwt"), { expiresIn: expiry });

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

function checkUser(res, user, db_user) {
    if (user.username && user.username.toLowerCase() === db_user.username)
        return error400(res, {
            field: "username",
            msg: `Username exists${db_user.googleId ? ", please log in with google option" : ""
                }`,
        });

    if (user.email === db_user.email)
        return error400(res, {
            field: "email",
            msg: `Email exists${db_user.googleId ? ", please log in with google option" : ""
                }`,
        });

    if (user.phone_number === db_user.phone_number)
        return error400(res, {
            field: "phone_number",
            msg: `Phone number exists${db_user.googleId ? ", please log in with google option" : ""
                }`,
        });
}

function filterUsers(filterData) {
    let filterQuery = {}
    const keys = Object.keys(filterData)
    keys.map(key => {
        filterQuery[key] = { $in: filterData[key] }
    })
    return filterQuery
}

module.exports = {
    validate,
    // validateLogin,
    error400,
    encrypt,
    decrypt,
    checkUser,
    filterUsers

};