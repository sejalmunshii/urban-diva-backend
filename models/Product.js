const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String },
  price: { type: Number, required: true },
  category: { type: String },
  img: { type: String },
  badge: { type: String },
  stock: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);