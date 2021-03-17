const express = require("express");
const router = express.Router();
const config = require("config");
const passport = require("passport");
const axios = require("axios");
const transaction = require("../models/transaction");
const { error400 } = require("../controllers/userController");
const user = require("../models/user");

router.post(
  "/fw",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { amount } = req.body;

    if (isNaN(amount) || amount < 100)
      return error400(res, {
        success: false,
        field: "amount",
        msg: "Deposit minimum of #100",
      });

    let fw_payload = {
      tx_ref: `${req.user._id}==NGN${Date.now()}`,
      amount: `${amount}`,
      redirect_url: `${config.get("client")}`,
      payment_options: "card",
      currency: "NGN",
      customer: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.username,
      },
    };

    const { data: resp } = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      fw_payload,
      {
        headers: {
          Authorization: `Bearer ${config.get("FW_SECRET_KEY")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (resp.status === "success") {
      new transaction({
        tx_ref: fw_payload.tx_ref,
        amount: fw_payload.amount,
        user: fw_payload.customer.id,
        status: "PENDING",
        type: "DEPOSIT",
      }).save(() => {
        return res.send({
          success: true,
          payment_link: resp.data.link,
        });
      });
    } else {
      return res.status(500).send({
        success: false,
        field: "amount",
        msg: "Payment server unavailable",
      });
    }
  }
);

router.post("/fw_webhook", async (req, res) => {
  console.log(JSON.stringify(req.body));

  if (
    !req.headers["verif-hash"] ||
    (req.headers["verif-hash"] &&
      req.headers["verif-hash"] !== config.get("FW_HASH"))
  ) {
    console.log("attacker");
    return res.end();
  }

  if (req.body.event === "charge.completed") {
    const { data } = req.body;
    const reference = data.tx_ref;
    const customerID = reference.split("==")[0];
    const amount = data.amount;

    const trx = await transaction.findOne({ tx_ref: reference });
    if (!trx || trx.status !== "PENDING") return res.sendStatus(200);

    if (trx && data.status === "successful") {
      await user.findByIdAndUpdate(customerID, {
        $inc: { wallet: Number(amount) },
        status: "COMPLETED",
        meta: JSON.stringify(data),
      });
      console.log("wallet updated successfully");
    } else {
      await transaction.findByIdAndUpdate(trx._id, {
        status: "FAILED",
        meta: JSON.stringify(data),
      });
      console.log("wallet update failed");
    }
    return res.sendStatus(200);
  }

  console.log("abnormal situation with wallet update");
  return res.end();
});

module.exports = router;
