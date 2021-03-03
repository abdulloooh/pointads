const _ = require("lodash");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const config = require("config");
const crypto = require("crypto");
const { URLSearchParams } = require('url');
const fetch = require('node-fetch');
const { reject } = require("lodash");

const sendMail = require("../config/nodemailer");

/**
 * Sender: 11 characters or less
 * to: string[]
 * message: string
 * ref_id
 */

function formatNumber(number) {
    const pattern = /^(234|\+234)/
    const contains234 = pattern.test(number)
    if (contains234) {
        if (number.indexOf("+") === 0) number = number.replace("+", "")
        number = number.replace("234", "0")
    }
    if (number.indexOf("0") !== 0) number = "0" + number
    return number
}

function formatNumbers(numbers) {
    const pattern = /^(234|\+234)/

    numbers = numbers.map((number) => {

        /**
         * CLEAN DATA
         * Trim both sides
         * Trim preceding ' or "
         */
        number = number.trim()
        if (number.indexOf("'") === 0) number = number.substring(1)
        if (number.indexOf("\"") === 0) number = number.substring(1)

        const contains234 = pattern.test(number)
        if (contains234) {
            if (number.indexOf("+") === 0) number = number.replace("+", "")
            number = number.replace("234", "0")
        }
        if (number.indexOf("0") !== 0) number = "0" + number
        return number.substring(0, 11)
    })
        .filter(number => number.length === 11)

    return numbers
}

function sendSMS(
    {
        sender = 'DartPointAds',
        message,
        to,
        type = '0',
        routing = '2',
        ref_id
    }) {

    if (typeof to !== "string") throw new Error()

    const encodedParams = new URLSearchParams({
        sender, to, message, type, routing, ref_id, token: config.get("SMARTSMS_TOKEN")
    });

    // encodedParams.set('token', config.get("SMARTSMS_TOKEN"));
    console.log(encodedParams.toString())

    const url = 'https://smartsmssolutions.com/api/json.php';

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodedParams
    };

    return new Promise((resolve, reject) => {
        fetch(url, options)
            .then(res => res.json())
            .then(json => resolve(json))
            .catch(err => reject(err));
    })
}

async function failEmail({ user, resp }) {
    return await sendMail(
        `${config.get("mailFrom")},abdullahakinwumi@gmail.com`,
        "An Ad failed",
        `
                   <p>
                    An Advert placed just failed, possible cause: ${resp.code === "1002" ? "Error Sending SMS" :
            resp.code === "1003" ? "Insufficient Balance on our SmartSMS account" :
                resp.code === "1005" ? "SmartSMS temporarily down" :
                    resp.code === "1008" ? "Unregistered Sender ID" :
                        resp.comment

        }   
                   </p >
                   <p>Ad initialized by user "${user.username}"</p>
                   <p>Full raw details : ${JSON.stringify(resp)}</p>
            `
    );
}


module.exports = {
    formatNumber,
    formatNumbers,
    sendSMS,
    failEmail
}

// api@smartsmssolotions.com 
// https://smartsmssolutions.com/sms/sendsms 