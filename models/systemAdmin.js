const mongoose = require('mongoose')


const UserSchema = new mongoose.Schema({
    
    displayName:{
        type: String,
        required: true  
    },
    email:{
        type: String,
        required: true  
    },
    image:{
        type: String,
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model("Admin",UserSchema)