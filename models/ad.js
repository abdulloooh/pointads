const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    ref_id: {
      type: String,
      required: true,
    },
    expected_cost: Number,
    expected_qty: Number,
    sent_qty: Number,
    charged_cost: Number,
    wallet_before: Number,
    wallet_after: Number,
    refund: { type: Number, default: 0 },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      default: "PENDING",
      required: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
    kind: {
      type: String,
      required: true,
      enum: ["SMS", "EMAIL"],
    },
    message: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ad", adSchema);
