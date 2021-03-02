const _ = require("lodash");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const config = require("config");
const crypto = require("crypto");
const { URLSearchParams } = require('url');
const fetch = require('node-fetch');
const { reject } = require("lodash");

/**
 * Sender: 11 characters or less
 * to: string[]
 * message: string
 * ref_id
 */


function sendSMS(
    {
        sender = 'DartPointAds',
        message,
        to,
        type = '0',
        routing = '2',
        ref_id
    }) {
    to = to.map(each => each.trim()).join(",")

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


module.exports = {
    sendSMS
}

// api@smartsmssolotions.com 
// https://smartsmssolutions.com/sms/sendsms 