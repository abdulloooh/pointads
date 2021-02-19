const mongoose = require("mongoose");

const transactionSchema = new mongoosse.Schema(
    {
        tx_ref: {
            type: String,
            required: true
        },
        amount: {
            type: String,
            required: true
        },
        customerID: {
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