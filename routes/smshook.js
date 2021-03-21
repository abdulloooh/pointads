const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  console.log(JSON.stringify(req.body));
});

module.exports = router;
