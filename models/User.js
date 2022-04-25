const mongoose = require('mongoose')


const UserSchema = new mongoose.Schema({
    googleId:{
        type: String,
        required: true  
    },
    verified: {
        type: Boolean,
        default: false
      },

    type:{
        type: String,
        enum: ['systemAdmin','shopOwner','customer']  
    },
    username:{
        type: String,
    },
    email:{
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
      },
})

module.exports = mongoose.model("user",UserSchema)