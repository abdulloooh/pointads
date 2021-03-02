const express = require("express");
const router = express.Router();
const _ = require("lodash")
const config = require("config")

const Target = require("../models/target")
const Sms = require("../models/sms")

const {
    filterUsers,
    error400,
    increaseWallet,
    decreaseWallet
} = require("../controllers/userController")

const { formatNumbers, sendSMS, failEmail } = require("../controllers/smsController");

const sendMail = require("../config/nodemailer");
const rate = 2.50 //2naira 5 kobo

router.post("/filter", async (req, res) => {
    const { filter } = req.body

    if (filter && Object.keys(filter).length > 0) {
        const filteredUsers = await Target.find(filterUsers(filter))
        res.send({ qty: filteredUsers.length })
    }

    else if (!filter) return res.send({ qty: (await Target.find()).length })

    else return res.sendStatus(400)
})

router.post("/sendsms", async (req, res) => {

    const { message, filter } = req.body
    let filtered;

    if (filter && Object.keys(filter).length > 0)
        filtered = await Target.find(filterUsers(filter))

    else if (!filter) filtered = await Target.find()

    if (!filtered || filtered.length < 1) return error400(res, {
        status: "failed",
        msg: "Details with specified filter not found"
    })

    let to = formatNumbers(_.map(filtered, 'phone'))

    try {
        const ref_id = `${req.user._id}zzz${Date.now()}`
        const wallet_before = req.user.wallet
        const expected_qty = to.length
        const expected_cost = expected_qty * rate

        const charge_user = await decreaseWallet(req.user._id, expected_cost)

        const start =
            await new Sms({
                ref_id,
                expected_qty,
                expected_cost,
                user: req.user._id
            }).save()

        if (!start || !charge_user) return res.status(500).send("Server Error, Please try again later")

        const resp = await sendSMS({ ref_id, message, to: to.join(",") })

        const respLen = (r) => {
            if (!r) return 0
            return r.split(",").length
        }

        if (resp.code === "1000") {
            if (resp.successful) {

                const totalFailed = respLen(resp.failed) + respLen(resp.invalid)
                const refund = failed * rate
                if (refund > 0) await increaseWallet(req.user._id, refund)

                const charged_cost = expected_cost - refund

                await Sms.findByIdAndUpdate(start._id, {
                    sent_qty: expected_qty - totalFailed,
                    charged_cost: charged_cost,
                    status: "COMPLETED",
                    meta: JSON.stringify(resp)
                })

                await sendMail(
                    req.user.email,
                    "Ads sent successfully",
                    `
                    <p>Hi ${req.user.username} 🤩</p>
                    <p>You targeted adverts have been sent successfully 🕺🕺🕺</p>
                    <p>
                    You have been able to reach out to ${res.successful.length} specific people
                    with just ${charged_cost} 😉
                    </p>
                    <p>Kindly visit your dashboard to check the full breakdown 👍</p>
                    <p>Have a wonderful time ${req.user.username}.</p>
                    <p>With pleasure 🌹, <br/>Abdullah 🤗 from DartPointAds.</p>
                `
                );


                return res.send({
                    status: "success",
                    successful: respLen(resp.successful),
                    failed: totalFailed,
                    expected_cost,
                    charged_cost,
                    wallet_before,
                    wallet_after: wallet_before - charged_cost,
                    msg_id: start._id
                })
            }
            else {
                //
            }
        }
        else {

            const totalSuccessful = respLen(resp.successful)
            const refund = (expected_qty - totalSuccessful) * rate
            if (refund > 0) await increaseWallet(req.user._id, refund)

            await Sms.findByIdAndUpdate(start._id, {
                status: "FAILED",
                meta: JSON.stringify(resp)
            })

            await failEmail({ user: req.user, resp })

            return res.status(500).send({
                status: "failed",
                msg: "Unavailable, please try again later"
            })
        }

    }
    catch (err) {
        return res.status(500).send("Server Error")
    }
})

module.exports = router;