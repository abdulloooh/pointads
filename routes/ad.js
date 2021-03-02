const express = require("express");
const router = express.Router();
const Target = require("../models/target")
const { filterUsers, error400 } = require("../controllers/userController")
const { sendSMS } = require("../controllers/smsController")


router.post("/place_ad", async (req, res) => {
    const { filter } = req.body

    if (filter && Object.keys(filter).length > 0) {
        const filteredUsers = await Target.find(filterUsers(filter))
        res.send(filteredUsers)
    }

    else if (!filter) return res.send(Target.find())

    else return res.sendStatus(400)
})

router.post("/send", async (req, res) => {

    const { message, to } = req.body

    /**
     * VALIDATIONS
     * 
     * Check if 'phone numbers' is a string array and fix all to string
     * Check message body
     */
    if (!to || to.length < 1) return error400(res, {
        status: "failed",
        field: "phone_number",
        msg: "Kidly supply recipient phone number"
    })

    const resp = await sendSMS({
        ref_id: `${req.user._id}==${Date.now()}`,
        message,
        to
    })
    res.send(resp)
})

module.exports = router;