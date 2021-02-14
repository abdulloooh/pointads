const express = require("express");
const router = express.Router();
const Target = require("../models/target")
const { filterUsers, error400 } = require("../controllers/userController")

router.post("/place_ad", async (req, res) => {
    const { filter } = req.body

    if (filter && Object.keys(filter).length > 0) {
        const filteredUsers = await Target.find(filterUsers(filter))
        res.send(filteredUsers)
    }

    else if (!filter) return res.send(Target.find())

    else return res.sendStatus(400)
})

module.exports = router;