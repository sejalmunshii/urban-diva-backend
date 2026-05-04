const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  items: [
    {
      productId: String,
      title: String,
      price: Number,
      qty: Number,
      img: String,
    }
  ],
  total: { type: Number },
  status: { type: String, default: "Processing" },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);