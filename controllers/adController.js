const _ = require("lodash");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const config = require("config");
const crypto = require("crypto");
const { URLSearchParams } = require("url");
const fetch = require("node-fetch");
const { reject } = require("lodash");

const sendMail = require("../config/nodemailer");

/**
 * Sender: 11 characters or less
 * to: string[]
 * message: string
 * ref_id
 */

function formatNumber(number) {
  const pattern = /^(234|\+234)/;
  const contains234 = pattern.test(number);
  if (contains234) {
    if (number.indexOf("+") === 0) number = number.replace("+", "");
    number = number.replace("234", "0");
  }
  if (number.indexOf("0") !== 0) number = "0" + number;
  return number;
}

function formatNumbers(numbers) {
  const pattern = /^(234|\+234)/;

  numbers = numbers
    .map((number) => {
      if (!number) return "";
      /**
       * CLEAN DATA
       * Trim both sides
       * Trim preceding ' or "
       */
      number = number.trim();
      if (number.indexOf("'") === 0) number = number.substring(1);
      if (number.indexOf('"') === 0) number = number.substring(1);

      const contains234 = pattern.test(number);
      if (contains234) {
        if (number.indexOf("+") === 0) number = number.replace("+", "");
        number = number.replace("234", "0");
      }
      if (number.indexOf("0") !== 0) number = "0" + number;
      return number.substring(0, 11);
    })
    .filter((number) => number.length === 11);

  return numbers;
}

function deepClean(email) {
  if (!email) return "";
  email = email.trim();

  if (email.indexOf("'") === 0 || email.indexOf('"') === 0) {
    email = email.substring(1);
    email = deepClean(email);
  }

  if (
    email.charAt(email.length - 1) === '"' ||
    email.charAt(email.length - 1) === "'"
  ) {
    email = email.substring(0, email.length - 1);
    email = deepClean(email);
  }
  return email;
}

const emailPattern = /^[a-z]+([-\w]+)?(\.)?([-\w]+)?\w+@(\w(-)?){4,}\.{1}([a-z]{2,3}(\.[a-z]{2,3})?)$/i;

function isValidEmail(email) {
  email = deepClean(email);
  return emailPattern.test(email);
}

/**
 * CLEAN DATA,
 * Trim both sides,
 * Trim preceding ' or "
 */
function formatEMails(emails) {
  emails = emails
    .map((email) => deepClean(email))
    .filter((email) => emailPattern.test(email));
  return emails;
}

function validateMessage(msg) {
  console.log(msg);
  const allowedChars = /[^\w\s\v\n*()@#&+-/?!,.;:"'%=$]/gi;
  const unmerge = msg.match(allowedChars);
  let uniqueUnmerged = [];
  if (unmerge)
    unmerge.map((char) => {
      if (uniqueUnmerged.indexOf(char) === -1) uniqueUnmerged.push(char);
    });
  return {
    pages: msg.length <= 160 ? 1 : Math.ceil(msg.length / 153),
    err:
      msg.length > 459 || uniqueUnmerged.length > 0
        ? {
            msg:
              msg.length > 459
                ? "3 pages maximum"
                : `${uniqueUnmerged.join(" ")} ${
                    uniqueUnmerged.length === 1 ? "is" : "are"
                  } not allowed in message content`,
          }
        : "",
  };
}

function sendSMS({
  sender = "New Message",
  message,
  to,
  type = "0",
  routing = "2",
  ref_id,
}) {
  if (typeof to !== "string") throw new Error();

  const encodedParams = new URLSearchParams({
    to,
    sender,
    message,
    type,
    routing,
    ref_id,
    token: config.get("SMARTSMS_TOKEN"),
  });

  if (sender) encodedParams.set("sender", sender);
  // console.log(encodedParams.toString());

  const url = "https://smartsmssolutions.com/api/json.php";

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encodedParams,
  };

  return new Promise((resolve, reject) => {
    fetch(url, options)
      .then((res) => res.json())
      .then((json) => resolve(json))
      .catch((err) => reject(err));
  });
}

async function sendBroadcastEmails({ from, to, message, subject }) {
  return await sendMail({
    to: `${config.get("mailFrom")}`,
    subject,
    html: message,
    from,
    bcc: to.join(","),
    replyTo: from,
  });
}

async function failEmail({ user, resp }) {
  const html =
    resp && resp.code
      ? ` <div>
            <p>
              An Advert placed just failed, possible cause: $
              {resp.code === "1002"
                ? "Error Sending SMS"
                : resp.code === "1003"
                ? "Insufficient Balance on our SmartSMS account"
                : resp.code === "1005"
                ? "SmartSMS temporarily down"
                : resp.code === "1008"
                ? "Unregistered Sender ID"
                : resp.comment}
            </p>
            <p>Ad initialized by user "${user.username}"</p>
            <p>Full raw details : ${JSON.stringify(resp)}</p>{" "}
          </div>
        `
      : resp && resp.scheduled
      ? `<div>
            <p>An Advert placed just got scheduled.</p>
            <p>Ad initialized by user "${user.username}"</p>
            <p>Full raw details : ${JSON.stringify(resp.details)}</p>
          </div> 
        `
      : ` <div>
            <p>An Advert placed just failed.</p>
            <p>Ad initialized by user "${user.username}"</p>
            <p>Full raw details : ${JSON.stringify(resp)}</p>
          </div>
      `;

  return await sendMail({
    to: `${config.get("mailFrom")},abdullahakinwumi@gmail.com`,
    subject: "An Ad needs attention",
    html,
  });
}

module.exports = {
  formatNumber,
  formatNumbers,
  isValidEmail,
  formatEMails,
  sendSMS,
  sendBroadcastEmails,
  failEmail,
  validateMessage,
};

// api@smartsmssolotions.com
// https://smartsmssolutions.com/sms/sendsms
