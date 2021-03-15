const nodemailer = require("nodemailer");
const config = require("config");
const jwt = require("jsonwebtoken");

module.exports = function (to, subject, html, from, bcc, replyTo) {
  return new Promise((resolve, reject) => {
    let mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.get("mailFrom"),
        pass: config.get("porw"),
      },
    });

    let mailDetails = {
      from: from ? from : `"DartPointAds" <noreply@dartpointads.com>`,
      to,
      subject,
      html,
      bcc,
      replyTo=from
    };

    mailTransporter.sendMail(mailDetails, function (err, data) {
      if (err) {
        console.log("Email failed to sent");
        reject(false);
      } else {
        console.log("Email sent successfully");
        resolve(true);
      }
    });
  });
};
