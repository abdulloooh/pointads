const express = require("express");
const router = express.Router();
const _ = require("lodash");
const config = require("config");

const Target = require("../models/target");
const Ad = require("../models/ad");

const {
  filterUsers,
  error400,
  increaseWallet,
  decreaseWallet,
} = require("../controllers/userController");

const {
  isValidEmail,
  formatNumbers,
  formatEMails,
  sendSMS,
  failEmail,
  validateMessage,
  sendBroadcastEmails,
} = require("../controllers/adController");

const sendMail = require("../config/nodemailer");

let validSenders = config.get("VALID_SENDERS");
if (!Array.isArray(validSenders)) validSenders = JSON.parse(validSenders);

router.post("/filterphone", async (req, res) => {
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
    success: true,
    qty: formatNumbers(_.map(filtered, "phone")).length,
  });
});

router.post("/filteremail", async (req, res) => {
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
    success: true,
    qty: formatEMails(_.map(filtered, "email")).length,
  });
});

router.post("/check_sender", (req, res) => {
  const { sender } = req.body;

  if (!sender || validSenders.indexOf(sender) < 0)
    return error400(res, {
      success: false,
      field: "sender",
      msg:
        "Unregistered sender, please allow default sender for your ads or request to register this sender ID",
    });
  else
    return res.status(200).send({
      success: true,
      msg: "senderID valid and registered",
      sender,
    });
});

router.post("/register_sender", async (req, res) => {
  const { sender } = req.body;

  if (!sender || sender.length > 11)
    return error400(res, {
      success: false,
      field: "sender",
      msg: "Maximum of 11 characters allowed by service provider for senderID",
    });

  if (validSenders.indexOf(sender) !== -1)
    return error400(res, {
      success: false,
      field: "sender",
      msg: "Sender already registered",
    });
  else {
    await sendMail({
      to: `${config.get("mailFrom")}`,
      subject: "Request to register senderID",
      html: `
      <p>Hey Admin, ${req.user.username} from DartPointAds with email ${req.user.email} just requested to register 
        this senderID <strong>${sender}</strong>, kindly attend to it ASAP
      </p>
      `,
    });

    await sendMail({
      to: `${req.user.email}`,
      subject: "Request to register senderID",
      html: `
      <p>Hi ${req.user.username}, </p
      <p>
        Abdullah here from DartPointAds, you requested for the registration of
        this senderID <strong>${sender}</strong>.
      </p>
      <p>
      We are attending to it ASAP and you will be reached out to via this email
      once it is completed, keep an eye out on our emails.
      </p>
      <p>
        If you did not request for this, simply reply this email with 'CANCEL ID REG' or ignore.
      </p>
      <p>Best regards, <br/> Abdullah from DartPointAds.
      </p>
      `,
    });

    return res.send({
      success: true,
      msg: "Sender queued for registration",
      sender,
    });
  }
});

router.post("/sendsms", async (req, res) => {
  let rate = +config.get("SMS_RATE");

  const { sender, message, filter } = req.body;
  if (!message)
    return error400(res, {
      success: false,
      field: "message",
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

  try {
    //validate message
    const isValid = validateMessage(message);
    if (isValid.err)
      return error400(res, {
        success: false,
        field: "message",
        msg: isValid.err.msg,
      });

    rate = rate * +isValid.pages;

    const ref_id = `${req.user._id}zzz${Date.now()}`;
    const wallet_before = req.user.wallet;
    const expected_qty = to.length;
    const expected_cost = expected_qty * rate;

    //CHECK WALLET BAL
    if (req.user.wallet < expected_cost)
      return error400(res, {
        success: false,
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

    const start = await new Ad({
      ref_id,
      expected_qty,
      expected_cost,
      user: req.user._id,
      kind: "SMS",
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

        await Ad.findByIdAndUpdate(start._id, {
          sent_qty: expected_qty - totalFailed,
          charged_cost,
          wallet_before,
          wallet_after: wallet_before - charged_cost,
          status: "COMPLETED",
          meta: JSON.stringify(resp),
        });

        await sendMail({
          to: req.user.email,
          subject: "Ads sent successfully",
          html: `
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
                `,
        });

        return res.send({
          success: true,
          scheduled: false,
          successful: respLen(resp.successful),
          failed: totalFailed,
          expected_cost,
          charged_cost,
          wallet_before,
          wallet_after: wallet_before - charged_cost,
          refund,
          msg_id: start._id,
        });
      } else {
        console.log("main resp", JSON.stringify(resp));
        await failEmail({
          user: req.user,
          resp: { scheduled: true, details: resp },
        });
        return res.send({
          success: true,
          scheduled: true,
          msg_id: start._id,
        });
      }
    } else {
      const totalSuccessful = respLen(resp.successful);
      const refund = (expected_qty - totalSuccessful) * rate;
      if (refund > 0) await increaseWallet(req.user._id, refund);

      const charged_cost = expected_cost - refund;
      await Ad.findByIdAndUpdate(start._id, {
        sent_qty: totalSuccessful,
        charged_cost,
        refund,
        wallet_before,
        wallet_after: wallet_before - charged_cost,
        status: "COMPLETED",
        meta: JSON.stringify(resp),
      });

      await failEmail({ user: req.user, resp });

      return res.send({
        success: true,
        scheduled: false,
        successful: totalSuccessful,
        failed: expected_qty - totalSuccessful,
        expected_cost,
        refund,
        charged_cost,
        wallet_before,
        wallet_after: wallet_before - charged_cost,
        msg_id: start._id,
      });
    }
  } catch (err) {
    console.log(err);
    await failEmail({ user: req.user, resp: { ...err, ...start } });
    return res.status(500).send({
      success: false,
      msg: "Unavailable, please try again later",
    });
  }
});

router.post("/sendemail", async (req, res) => {
  let rate = +config.get("EMAIL_RATE");
  let { subject, message, filter } = req.body;
  if (!message || !subject)
    return error400(res, {
      success: false,
      field: "message",
      msg: "Empty Message or Subject",
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

  //2000 addr allowed in a single email, so 1999 plus company mail = 2k
  let to = formatEMails(_.map(filtered, "email")).slice(0, 1999);

  const ref_id = `${req.user._id}zzz${Date.now()}`;
  const wallet_before = req.user.wallet;
  const expected_qty = to.length;
  const expected_cost = expected_qty * rate;

  try {
    //   //CHECK WALLET BAL
    if (req.user.wallet < expected_cost)
      return error400(res, {
        success: false,
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
        msg: "Insufficient amount",
      });

    var start = await new Ad({
      ref_id,
      expected_qty,
      expected_cost,
      user: req.user._id,
      kind: "EMAIL",
    }).save();

    if (!start || !charge_user.success || charge_user.problem)
      return res.status(500).send({
        success: false,
        msg: "Server Error, Please try again later",
      });

    const from = req.user.email;

    message =
      message +
      `<br/><br/><hr/><address> This message is brought to you from ${from} via <a href="${config.get(
        "client"
      )}">Dart Point Ads</a>, the easiest way to reach out to thousands of people. <br/><br/> 
      To report email abuse, scam or be excluded from future email adverts,
      please send "CANCEL" to dartpointads@gmail.com. </address>
    `;

    const resp = await sendBroadcastEmails({ from, to, message, subject });
    console.log(resp);

    if (!resp) throw new Error();

    await Ad.findByIdAndUpdate(start._id, {
      sent_qty: expected_qty,
      charged_cost: expected_cost,
      wallet_before,
      wallet_after: wallet_before - expected_cost,
      status: "COMPLETED",
      meta: JSON.stringify({ resp, from, to, message, subject }),
    });

    await sendMail({
      to: req.user.email,
      subject: "Ads sent successfully",
      html: `
                <p>Hi ${req.user.username},</p>
                <p>Your targeted ads have been sent successfully</p>
                <p>
                You have been able to reach out to ${to.length} specific 
                  ${to.length === 1 ? "person" : "people"}
                with just #${expected_cost}.
                </p>
                <p>Kindly visit your dashboard to check the full breakdown. </p>
                <p>Have a wonderful time ${req.user.username}.</p>
                <p>With pleasure, <br/>Abdullah from DartPointAds.</p>
            `,
    });

    return res.send({
      success: true,
      successful: to.length,
      failed: 0,
      expected_cost,
      charged_cost: expected_cost,
      wallet_before,
      wallet_after: wallet_before - expected_cost,
      msg_id: start._id,
    });
  } catch (err) {
    console.error({ err });

    await Ad.findByIdAndUpdate(start._id, {
      status: "FAILED",
    });

    await failEmail({ user: req.user, resp: { ...err, ...start } });

    return res.status(500).send({
      success: false,
      msg: "Unavailable, please try again later",
    });
  }
  // });
});

module.exports = router;
