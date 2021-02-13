const express = require("express");
const router = express.Router();
const { filterUsers, error400 } = require("../controllers/userController")

router.post("/place_ad", async (req, res) => {
    console.log("ok")
    const { filter } = req.body
    if (filter && Object.keys(filter).length > 0)
        return res.send(filterUsers(filter))
    else if (!filter) return res.sendStatus(200)
    else return res.sendStatus(400)
})

module.exports = router;