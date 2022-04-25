const mongoose = require("mongoose");

const Shopchema = new mongoose.Schema({

  shopName: {
    type: String,
    required: true,
  },
  shopEmail: {
    type: String,
    required: true,
  },
  shopImage: {
    type: String,
    required: false,
  },
  status: {
    type: String,

    default: 'available',
    enum: ['available','closed']
  },
  shopQueue: {
    type: String,
    required: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("shop", Shopchema);