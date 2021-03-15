const express = require("express");
const router = express.Router();
const _ = require("lodash");
const config = require("config");

const Target = require("../models/target");
const Sms = require("../models/sms");

const {
  filterUsers,
  error400,
  increaseWallet,
  decreaseWallet,
} = require("../controllers/userController");

const {
  formatNumbers,
  sendSMS,
  failEmail,
  validateMessage,
} = require("../controllers/smsController");

const sendMail = require("../config/nodemailer");
let rate = +config.get(RATE);

router.post("/filter", async (req, res) => {
  const { filter } = req.body;

  let filtered;

  if (filter && Object.keys(filter).length > 0)
    filtered = await Target.find(filterUsers(filter));
  else if (!filter) filtered = await Target.find();

  if (!filtered || filtered.length < 1)
    return error400(res, {
      success: false,
      msg: "Details with specified filter not found",
    });

  res.send({
    qty: formatNumbers(_.map(filtered, "phone")).length,
  });
});

router.post("/check_sender", (req, res) => {
  const { sender } = req.body;
  let validSenders = config.get("VALID_SENDERS");
  if (!Array.isArray(validSenders)) validSenders = JSON.parse(validSenders);

  if (!sender || validSenders.indexOf(sender) < 0)
    return error400(res, {
      success: false,
      field: "sender",
      msg:
        "Unregistered sender, please use default sender or request to register this sender ID",
    });
  else
    return res.status(200).send({
      success: true,
      sender,
    });
});

router.post("/register_sender", (req,res)=>{
  const {sender} = req.body
  let validSenders = config.get("VALID_SENDERS");
  if (!Array.isArray(validSenders)) validSenders = JSON.parse(validSenders);

  if (!sender || validSenders.indexOf(sender) !== -1)
    return error400(res, {
      success: false,
      field: "sender",
      msg:
        "Sender already registered",
    });
    
  else{
    await sendMail(
      `${config.get("mailFrom")},abdullahakinwumi@gmail.com`,
      "Request to register senderID",
      `
      <p>Hey, ${req.user.username} from DartPointAds just requested to register 
        this userID, ${sender}, kindly attend to it ASAP
      </p>
      `
    );

    await sendMail(
      `${req.user.email}`,
      "Request to register senderID",
      `
      <p>Hi ${req.user.username}, </p
      <p>
        Abdullah here from DartPointAds, you requested for the registration of
        this senderID, ${sender}.
      </p>
      <p>
      We are attending to it ASAP and you will be reached out to via this email
      once it is completed, keep an eye out on our emails.
      </p>
      <p>
        If you did not request for this, simple reply this email with 'CANCEL ID REG'.
      </p>
      <p>Best regards, <br/> Abdullah from DartPointAds.
      </p>
      `
    );
  }
})

router.post("/sendsms", async (req, res) => {
  const { sender, message, filter } = req.body;
  if (!message)
    return error400(res, {
      success: false,
      filed: "message",
      msg: "Message is empty",
    });

  let filtered;

  if (filter && Object.keys(filter).length > 0)
    filtered = await Target.find(filterUsers(filter));
  else if (!filter) filtered = await Target.find();

  if (!filtered || filtered.length < 1)
    return error400(res, {
      success: false,
      msg: "Details with specified filter not found",
    });

  let to = formatNumbers(_.map(filtered, "phone"));
  // to = ["2349012345678", "2348012345678"];

  try {
    //validate message
    const isValid = validateMessage(message);
    if (isValid.err)
      return error400(res, {
        success: false,
        field: "messaage",
        msg: isValid.err.msg,
        message,
      });

    rate = rate * +isValid.pages;

    const ref_id = `${req.user._id}zzz${Date.now()}`;
    const wallet_before = req.user.wallet;
    const expected_qty = to.length;
    const expected_cost = expected_qty * rate;

    //CHECK WALLET BAL
    if (req.user.wallet < expected_cost)
      return error400(res, {
        msg: `Insufficient amount, minimum of #${expected_cost} is needed but you have #${Math.floor(
          req.user.wallet
        )} left, kindly deposit minimum of #${Math.ceil(
          expected_cost - req.user.wallet
        )} to complete this transaction`,
      });

    const charge_user = await decreaseWallet(res, req.user._id, expected_cost);
    if (charge_user.problem)
      return error400(res, {
        success: false,
        field: "wallet",
        msg: "Insufficient amount",
      });

    const start = await new Sms({
      ref_id,
      expected_qty,
      expected_cost,
      user: req.user._id,
    }).save();

    if (!start || !charge_user.success || charge_user.problem)
      return res.status(500).send({
        success: false,
        msg: "Server Error, Please try again later",
      });

    const resp = await sendSMS({ sender, ref_id, message, to: to.join(",") });

    const respLen = (r) => {
      if (!r) return 0;
      return r.split(",").length;
    };

    if (resp.code === "1000") {
      if (resp.successful) {
        const totalFailed = respLen(resp.failed) + respLen(resp.invalid);
        const refund = totalFailed * rate;
        if (refund > 0) await increaseWallet(req.user._id, refund);

        const charged_cost = expected_cost - refund;

        await Sms.findByIdAndUpdate(start._id, {
          sent_qty: expected_qty - totalFailed,
          charged_cost,
          status: "COMPLETED",
          meta: JSON.stringify(resp),
        });

        await sendMail(
          req.user.email,
          "Ads sent successfully",
          `
                    <p>Hi ${req.user.username},</p>
                    <p>Your targeted ads have been sent successfully</p>
                    <p>
                    You have been able to reach out to ${respLen(
                      resp.successful
                    )} specific ${
            respLen(resp.successful) === 1 ? "person" : "people"
          }
                    with just #${charged_cost}.
                    </p>
                    <p>Kindly visit your dashboard to check the full breakdown. </p>
                    <p>Have a wonderful time ${req.user.username}.</p>
                    <p>With pleasure, <br/>Abdullah from DartPointAds.</p>
                `
        );

        return res.send({
          success: true,
          successful: respLen(resp.successful),
          failed: totalFailed,
          expected_cost,
          charged_cost,
          wallet_before,
          wallet_after: wallet_before - charged_cost,
          msg_id: start._id,
        });
      } else {
        //
      }
    } else {
      const totalSuccessful = respLen(resp.successful);
      const refund = (expected_qty - totalSuccessful) * rate;
      if (refund > 0) await increaseWallet(req.user._id, refund);

      await Sms.findByIdAndUpdate(start._id, {
        success: false,
        meta: JSON.stringify(resp),
      });

      await failEmail({ user: req.user, resp });

      return res.status(500).send({
        success: false,
        msg: "Unavailable, please try again later",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      success: false,
      msg: "Unavailable, please try again later",
    });
  }
});

module.exports = router;
