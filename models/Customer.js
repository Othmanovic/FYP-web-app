const mongoose = require('mongoose')


const UserSchema = new mongoose.Schema({

    displayName: {
        type: String,
        required: true
    },
    email: {
        type: String,

    },
    matricNo: {
        type: String,

    },
    icNo: {
        type: String,

    },
    phoneNo: {
        type: Number
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    image: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model("customer", UserSchema)