const express = require("express");
const router = express.Router();

const { failEmail } = require("../controllers/adController");
const User = require("../models/user");
const Ad = require("../models/ad");

router.post("/", (req, res) => {
  const { body: deliveries } = req.body;
  console.log("post hook:", JSON.stringify(deliveries));
  if (!deliveries) return res.sendStatus(200);

  /**
   * This API is crazily inconsistent
   * Need to mail this to admin
   * Then it will be manually completed and charged
   *
   * Then, over time we can study the responses and then automate
   */

  deliveries.map(async (content) => {
    const ad = await Ad.findOne({ ref_id: content.ref_id }).populate("user");
    if (ad.status !== "PENDING") return res.sendStatus(200);

    await failEmail({
      user: ad.user,
      resp: {
        schedule_update: true,
        details: content,
      },
    });
  });

  return res.sendStatus(200);
});

router.get("/", (req, res) => {
  const { body: deliveries } = req.body;
  console.log("get hook", JSON.stringify(deliveries));
  // THIS ENDPOINT IS NORMALLY NOT EXPECTED TO BE CALLED
  return res.sendStatus(200);
});

module.exports = router;
