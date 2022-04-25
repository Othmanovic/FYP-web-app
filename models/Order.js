const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  
  status: {
    type: String,
    default: 'pending',
    enum: ['pending','accepted', 'rejected','completed']
  },
  numPages: {
    type: String,
    equired: true
  },
  quantity: {
    type: String,
    equired: true
  },
  filename: {
    type: String,
    equired: true
  },
  matricNo: {
    type: String,
    equired: true
  },
  totalPrice: {
    type: String,
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'customer'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product'
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

module.exports = mongoose.model("order", OrderSchema);