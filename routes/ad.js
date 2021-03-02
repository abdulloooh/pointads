const express = require("express");
const router = express.Router();
const _ = require("lodash")
const Target = require("../models/target")
const { filterUsers, error400 } = require("../controllers/userController")
const { formatNumbers, sendSMS } = require("../controllers/smsController")


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

    // return res.send(_.map(filtered, "phone"))
    let to = formatNumbers(_.map(filtered, 'phone'))
    return res.send(to)

    to = to.join(",")


    const resp = await sendSMS({
        ref_id: `${req.user._id}==${Date.now()}`,
        message,
        to
    })
    res.send(resp)
})

module.exports = router;