const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        tx_ref: {
            type: String,
            required: true
        },
        amount: {
            type: String,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            required: true
        },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model("Transaction", transactionSchema)