const _ = require("lodash");
const mongoose = require("mongoose");

const targetSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        level: {
            type: String,
            trim: true,
        },
        gender: {
            type: String,
            trim: true,
        },
        religion: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
            index: true
        },
        residence: {
            type: String,
            trim: true,
            index: true
        },
        department: {
            type: String,
            trim: true,
            index: true
        },
        email: {
            type: String,
            trim: true,
            unique: true,
            lowercase: true,
            minlength: 5,
        },
        phone_number: {
            type: String,
            minlength: 10,
            maxlength: 14,
        },
    },
    {
        timestamps: true,
    }
);


module.exports = mongoose.model("Target", targetSchema);
