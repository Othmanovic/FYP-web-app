const mongoose = require("mongoose");

const Productschema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  productPrice: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
  },
  status: {
    type: String,
    default: 'public',
    enum: ['public','private']
  },
  shopOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'shop'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("product", Productschema);