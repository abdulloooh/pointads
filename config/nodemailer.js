const nodemailer = require('nodemailer');
const config = require("config")
const jwt = require("jsonwebtoken")

module.exports = function (to, subject, html,) {
    let mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.get("mailFrom"),
            pass: jwt.verify(config.get("porw"), config.get("jwt")).porw
        }
    });

    let mailDetails = {
        from: `"DartPointAds" <noreply@dartpointads.com>`,
        to,
        subject,
        html
    };

    mailTransporter.sendMail(mailDetails, function (err, data) {
        if (err) {
            throw new Error(err)
        } else {
            console.log('Email sent successfully');
        }
    });
}