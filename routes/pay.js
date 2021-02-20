const express = require("express");
const router = express.Router();
const config = require("config")
const passport = require("passport");
const axios = require("axios")
const transaction = require("../models/transaction")
const { error400 } = require("../controllers/userController");
const user = require("../models/user");

router.post("/fw", passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        const { amount } = req.body

        if (isNaN(amount) || amount < 10)
            return error400(res, {
                status: "failed",
                field: "amount",
                msg: "Deposit minimum of #10",
            });

        let fw_payload = {
            tx_ref: `${req.user._id}NGN${Date.now()}`,
            amount: `${amount}`,
            redirect_url: `${config.get("client")}`,
            payment_options: "card",
            currency: "NGN",
            customer: {
                id: req.user._id,
                email: req.user.email,
                name: req.user.username,
            }
        }

        const { data: resp } = await axios.post(
            "https://api.flutterwave.com/v3/payments",
            fw_payload,
            {
                headers: {
                    Authorization: `Bearer ${config.get("FW_SECRET_KEY")}`,
                    "Content-Type": "application/json",
                }
            })

        if (resp.status === "success") {
            new transaction({
                tx_ref: fw_payload.tx_ref,
                amount: fw_payload.amount,
                user: fw_payload.customer.id,
                status: "PENDING"
            }).save(() => {
                return res.send({
                    status: "success",
                    payment_link: resp.data.link
                })
            })
        }

        else {
            return res.status(500).send(
                {
                    status: "failed",
                    field: "amount",
                    message: "Payment server unavailable"
                })
        }
    })

router.post("/fw_webhook", async (req, res) => {

    const { body } = req

    if (!req.headers['verif-hash']) res.end()
    if (req.headers['verif-hash'] !== config.get('FW_HASH')) res.end()

    const trx = await transaction.find({ tx_ref: body.txRef })
    if (!trx || trx.status !== "PENDING") res.sendStatus(200)

    if (body.status === "successful") {

        await transaction.updateOne(
            { email: body['customer[email]'] },
            {
                $set: { status: "COMPLETED" }
            })

        await user.updateOne(
            { email: body['customer[email]'] },
            {
                $inc: { wallet: Number(body.amount) }
            }
        )

        return res.sendStatus(200)
    }

    await transaction.updateOne(
        { email: body['customer[email]'] },
        {
            $set: { status: "FAILED" }
        })
    res.sendStatus(200)
})