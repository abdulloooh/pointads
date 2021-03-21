const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  console.log("post hook:", JSON.stringify(req.body));

  return res.sendStatus(200);
});

router.get("/", (req, res) => {
  console.log("get hook", JSON.stringify(req.body));

  return res.sendStatus(200);
});

module.exports = router;
