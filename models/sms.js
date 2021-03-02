const mongoose = require("mongoose");

const smsSchema = new mongoose.Schema(
    {
        ref_id: {
            type: String,
            required: true
        },
        expected_cost: Number,
        expected_qty: String,
        sent_qty: String,
        charged_cost: Number,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            default: "PENDING",
            required: true
        },
        meta: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model("sms", smsSchema)